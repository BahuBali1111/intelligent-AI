# Model Runtime — No Paid API Policy

## Owner's decision
Intelligent AI is to be built with our own application code. Paid AI APIs, paid model subscriptions, billing accounts or services that can unexpectedly charge money remain disabled unless the owner separately authorizes them. Optional provider free tiers may be connected manually by the owner with their own key; never add a payment method or silently upgrade a plan.

## Important technical distinction
We can write our own chat interface, orchestration, intent routing, memory controls, tools, retrieval, permissions and agent workflow. These components are application software. Natural-language generation at a strong level also needs trained model weights and compute; writing JavaScript/Python application code alone does not create a ChatGPT-class trained model.

## Allowed direction
1. Build a modular internal model-runtime interface with no vendor dependency.
2. Allow owner-configured free-tier adapters for Google Gemini API, Groq and OpenRouter, subject to each provider's changing quotas and terms. Keep provider keys in page memory only in this static prototype; production should use a secure backend vault.
3. Provide provider-specific model selection, retries, quota diagnostics and clear labels. Never promise unlimited free usage or evade quotas with duplicate accounts/keys.
4. Develop and test the application engine independently of any external model.
5. Investigate free/open-source model weights and local/self-hosted runtimes. Check model licenses and hardware requirements before adopting.
6. Prefer running on hardware already available to the owner, where feasible.
7. If a local model cannot run yet, use a clearly labelled mock adapter for development. Never represent mock responses as real intelligence.
8. Do not fall back to a paid provider automatically.

## Prohibited without a new explicit owner decision
- Paid model APIs or subscriptions.
- Paid hosting, databases, search APIs or other metered services.
- Adding payment methods or billing credentials.
- Sending private conversations to an external model provider.

## Security requirements
- Keep any future local runtime behind a server-side interface; never expose privileged credentials in browser code.
- Validate messages, set resource limits, and isolate tools.
- Keep user approval for sensitive actions, repository writes and deployments.
- Clearly display whether the runtime is local, unavailable, or a development mock.

## Current status
This document is the implementation policy. The current GitHub Pages application is still a static frontend demo; no real model runtime is connected.
