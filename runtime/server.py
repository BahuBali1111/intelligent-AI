"""Private, self-hosted Qwen runtime for Intelligent AI.

Run behind a trusted private network or HTTPS reverse proxy.
Never expose this service publicly without authentication and TLS.
"""
from __future__ import annotations

import os
import secrets
import time
import uuid
from typing import Any

import torch
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoModelForMultimodalLM, AutoProcessor

MODEL_ID = os.getenv("IA_MODEL_ID", "Qwen/Qwen3.5-9B")
MODEL_PATH = os.getenv("IA_MODEL_PATH", MODEL_ID)
API_KEY = os.getenv("IA_API_KEY", "")
MAX_OUTPUT_TOKENS = int(os.getenv("IA_MAX_OUTPUT_TOKENS", "512"))
ALLOWED_ORIGINS = [
    item.strip()
    for item in os.getenv("IA_ALLOWED_ORIGINS", "http://localhost:8000").split(",")
    if item.strip()
]

if not API_KEY:
    raise RuntimeError("Set IA_API_KEY before starting the private model runtime.")
if not torch.cuda.is_available():
    raise RuntimeError("CUDA GPU not detected. This runtime is configured for GPU inference.")

app = FastAPI(title="Intelligent AI private model runtime", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

processor = None
model = None


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(system|user|assistant)$")
    content: Any


class ChatRequest(BaseModel):
    model: str = "intelligent-ai-qwen"
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    max_tokens: int = Field(default=512, ge=1, le=2048)
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)


def require_auth(authorization: str | None = Header(default=None)) -> None:
    expected = f"Bearer {API_KEY}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.on_event("startup")
def load_model() -> None:
    global processor, model
    processor = AutoProcessor.from_pretrained(MODEL_PATH, trust_remote_code=False)
    model = AutoModelForMultimodalLM.from_pretrained(
        MODEL_PATH,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True,
    )
    model.eval()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok" if model is not None else "loading", "model": MODEL_ID}


@app.post("/v1/chat/completions")
def chat_completions(
    request: ChatRequest,
    _: None = Depends(require_auth),
) -> dict[str, Any]:
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model is not ready.")

    messages = []
    for item in request.messages:
        content = item.content
        if isinstance(content, str):
            content = [{"type": "text", "text": content}]
        elif isinstance(content, list):
            # The first bridge version accepts text parts only.
            text_parts = [
                part.get("text", "")
                for part in content
                if isinstance(part, dict) and part.get("type") == "text"
            ]
            content = [{"type": "text", "text": "\n".join(text_parts)}]
        else:
            raise HTTPException(status_code=400, detail="Message content must be text.")

        messages.append({"role": item.role, "content": content})

    prompt = processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
        enable_thinking=False,
    ).to("cuda:0")

    output_limit = min(request.max_tokens, MAX_OUTPUT_TOKENS)
    started = time.time()
    with torch.inference_mode():
        generated = model.generate(
            **prompt,
            max_new_tokens=output_limit,
            do_sample=request.temperature > 0,
            temperature=max(request.temperature, 0.01),
        )

    new_tokens = generated[0][prompt["input_ids"].shape[-1]:]
    answer = processor.decode(new_tokens, skip_special_tokens=True).strip()
    return {
        "id": "chatcmpl-" + uuid.uuid4().hex,
        "object": "chat.completion",
        "created": int(time.time()),
        "model": request.model,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": answer},
            "finish_reason": "length" if len(new_tokens) >= output_limit else "stop",
        }],
        "usage": {
            "prompt_tokens": int(prompt["input_ids"].shape[-1]),
            "completion_tokens": int(len(new_tokens)),
            "total_tokens": int(prompt["input_ids"].shape[-1] + len(new_tokens)),
        },
        "runtime_seconds": round(time.time() - started, 3),
    }
