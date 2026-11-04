# Model Runtime — No Paid API Policy

## Owner's decision
Intelligent AI is to be built with our own application code. Do not integrate paid AI APIs, paid model subscriptions, billing accounts or services that can unexpectedly charge money.

## Important technical distinction
We can write our own chat interface, orchestration, intent routing, memory controls, tools, retrieval, permissions and agent workflow. These components are application software. Natural-language generation at a strong level also needs trained model weights and compute; writing JavaScript/Python application code alone does not create a ChatGPT-class trained model.

## Allowed direction
1. Build a modular internal model-runtime interface with no vendor dependency.
2. Develop and test the application engine independently of any external model.
3. Investigate free/open-source model weights and local/self-hosted runtimes. Check model licenses and hardware requirements before adopting.
4. Prefer running on hardware already available to the owner, where feasible.
5. If a local model cannot run yet, use a clearly labelled mock adapter for development. Never represent mock responses as real intelligence.
6. Do not fall back to a paid provider automatically.

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
