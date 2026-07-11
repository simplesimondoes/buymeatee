# 3. Context and Scope

The system in scope for this phase is the **BuyMeATee marketing website**.

```mermaid
flowchart LR
    V[Anonymous visitor]
    C[Creator prospect]
    S[Supporter prospect]
    SE[Search engines]

    subgraph System["BuyMeATee marketing website (Next.js on Vercel)"]
        MW[Marketing pages + blog]
        EA[Early-access submission boundary]
    end

    EXT[Early-access submission service\n(provider not yet selected)]
    PAY[Future: payment provider\n(not selected)]
    ID[Future: identity & payout provider\n(not selected)]

    V --> MW
    C --> MW
    S --> MW
    C --> EA
    S --> EA
    SE --> MW
    EA --> EXT
    System -.future.-> PAY
    System -.future.-> ID
```

## Actors

- **Anonymous visitor** — reads marketing pages and blog; the SEO audience.
- **Creator prospect** — evaluates "start your page"; registers early-access interest.
- **Supporter prospect** — evaluates supporting; registers early-access interest.
- **Search engines** — crawl server-rendered pages, sitemap, robots, structured data.

## External systems

- **Early-access submission service** — receives form submissions via `EARLY_ACCESS_API_URL`; provider not yet chosen (Formspree/Loops/ConvertKit/Supabase are candidates). Behind a service boundary ([ADR-004](09-adrs.md)).
- **Vercel** — hosting, previews, production deployment, environment variables.
- **Future: payment provider, identity & payout provider** — out of scope; selection requires the architecture-change workflow.

## Out of scope

Everything listed under non-goals in [chapter 1](01-introduction-and-goals.md).
