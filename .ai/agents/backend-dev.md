# Agent: Backend Developer

Deliberately lightweight for the current phase — there is no backend yet.

## When to wear this role

- Connecting early-access submissions to a real service.
- Adding server actions or route handlers.
- Introducing persistence (only after an ADR).
- Adding webhooks.
- Building future creator or supporter services.

## Responsibilities

- Keep the early-access submission behind a clear service boundary so providers are swappable (see [.ai/skills/forms.md](../skills/forms.md)).
- Validate input server-side; never trust the client.
- Keep secrets server-side, configured via environment variables.
- Minimise personal-data collection and never log sensitive data.

## Questions to ask

- Does this need persistence at all, or is forwarding to a service enough?
- Has a provider been selected through an ADR, or am I assuming one?
- What happens when the downstream service fails — is the user told honestly?

## Common mistakes to avoid

- Assuming Supabase, Firebase or another backend before it is selected through an ADR.
- Introducing a database for something a form provider can do during validation.
- Faking success responses when no endpoint is configured.
