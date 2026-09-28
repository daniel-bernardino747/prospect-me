# Labs also serves portfolio showcases

ADR-0001 built Labs for one kind of artifact: a prototype for one company, private, unlisted, gone after about sixty days. Daniel also wants demos that belong to no company — built to show range across niches in his portfolio, linked from it, found by search, and never taken down. Every rule ADR-0001 gives a prospect is the opposite of what a showcase needs.

A second application was considered and refused: it would be another Railway service to keep alive for pages that share everything else with Labs — the stack, the build, the banner-on-every-page discipline. So Labs serves two kinds, and **the path carries the kind**:

- **Prospect** — `/<slug>`, exactly as ADR-0001 says: a company, an `expiresAt`, the "protótipo independente" banner, `noindex`, never listed or linked.
- **Showcase** — `/demo/<slug>`: no company, no `expiresAt`, a "demo conceitual" banner, indexed, in the sitemap, linked from the portfolio. Its registry entry carries a `summary`, which is its search description.

The path, not a flag read per request, decides indexing, because the `noindex` header is set in `next.config.ts` and its pattern must be a constant: everything outside `/demo/` (and `robots.txt` and the sitemap) carries it. A prospect cannot be indexed by a registry mistake — `/demo/<slug>` resolves showcases only, and `/<slug>` prospects only.

## What a showcase may not do

The portfolio's rule against fabrication (`personal-website` ADR-0003) holds on the page itself: a showcase is labelled a concept, never presented as work for a client, and invents no clients, testimonials, users, or results. Its data is public and cited, as on a prospect; where a demo needs data no public source gives, it says the data is illustrative, on the page. A showcase does not imitate a real company's brand.

## Consequences

Each showcase has its own `PRODUCT.md` and `DESIGN.md` beside its code, since `labs/PRODUCT.md` describes the prospect's reader — a decider opening an e-mail — and a showcase has a different one. A showcase that stops working is fixed or removed from the registry; it does not expire into an "encerrado" page.
