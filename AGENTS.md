# AGENTS.md

## Scope

- This file applies to all work under `backend/`.
- It extends the repository root `AGENTS.md`.
- Update this file when the backend framework, database, and deployment model are finalized.

## Backend Goals

- Build APIs and services that support trip planning, itinerary management, community features, and user accounts.
- Keep business logic separate from transport, persistence, and infrastructure concerns.
- Design backend work so the data model can evolve without tightly coupling every feature to controller-level code.

## Backend Rules

- Structure code by domain or module once the service is scaffolded; avoid a flat folder of unrelated handlers.
- Keep request validation at the boundary and keep business rules in service-layer code.
- Use explicit data contracts for API input and output; do not leak persistence models directly to clients.
- Prefer additive, backward-compatible API changes unless the task explicitly includes a breaking change.
- Centralize configuration and secrets handling; never hardcode credentials, tokens, or environment-specific URLs.
- Make error handling predictable with consistent status codes and machine-readable error responses.

## Data And Integrations

- Introduce migrations or schema change records together with database changes once persistence is in place.
- Keep third-party integrations behind clear adapter or service boundaries.
- Log enough detail to debug failures, but avoid exposing secrets or sensitive user data.

## Backend Verification

- Run the smallest relevant backend checks after changes, such as unit tests, integration tests, or compile validation once scripts exist.
- When changing API behavior, summarize the affected endpoints, payload shape, or contract assumptions in the final handoff.
- If the backend package is not scaffolded yet, state that verification is limited to file review.
