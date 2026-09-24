# An approach leads with something built for them

The `recon` skill that lived in `personal-website` produced verified dossiers and weak approaches. Its scans were built to find what was *broken* — a mailbox that no longer receives, a `/contato` returning 500, a `robots.txt` serving the app shell — and when no hiring challenge matched the Corpus, a broken thing was all it had to lead with. Those findings were true and defensible, and they were also a bug report: nobody makes room for a hire because a stranger noticed their sitemap. The approaches that worked (Innova, Kikos) worked because Daniel could say *the system you are screening for is already running*. Proof, not diagnosis.

So `prospect-me` is built around producing proof when the company has not handed Daniel a spec to match. Its pipeline is:

1. **Anchor** — the identity anchor (CNPJ, or registered name plus primary domain) is pinned first and sequentially, because every later surface is checked against it. Daniel confirms when it is ambiguous.
2. **Three investigations in parallel**, each receiving the anchor:
   - **Contact** — reachable channels and the decider, with their register (business or technical).
   - **Doors** — an entry point that is only one of two things: an open-source repository where a pull request fixes a problem that reaches their product or customers, or a hiring challenge or role whose scope matches an Accomplishment carrying a Metric. Channel and hygiene findings (broken links, SEO, performance, stale files) are never a door.
   - **Problems** — where revenue leaks along their *customer's* journey: being found, being chosen, converting, being kept. Each problem carries evidence and, where one exists, the competitor that does it better. Operational cost counts only where the customer feels it. A hygiene finding may appear only as the *cause* of such a leak.
3. **Solutions** — always exactly three, even when a door exists, because a door and a built artifact together are a stronger case than either. Each must be demonstrable using only their public data, tied to an evidenced problem, distinct from the other two, estimated at sixteen hours or less, and ranked by impact over effort. A precedent in the Corpus raises a solution's rank; its absence does not disqualify it.
4. **Critic** — an adversarial pass that reads the three as the identified decider would, scores each on real pain, specificity to this company, plausibility in sixteen hours, and distance from the obvious, and rejects hygiene dressed as a solution. A failed solution is sent back once with the critique attached; if it fails again it reaches Daniel marked weak.
5. **Checkpoint** — Daniel chooses which one to build, seeing each critique beside it. The choice becomes a build brief.

The artifact is built outside the tool. The approach is written only afterwards, in a second phase that first re-checks every perishable finding the email cites. **The email is never written before the proof exists.**

## The dossier is data

As with the résumé's Selection in `personal-website` (its ADR-0004), agents emit structured records and code renders the readable file. A finding carries its claim, CONFIRMADO or INFERIDO, its evidence, source URL, observation time, the link that ties it to the anchor, and — when perishable — an executable re-check. Every subagent returns records in this schema, and the orchestrator validates before merging; a homonym is refused by the schema's required `anchorLink`, not by an agent's judgement.

That turns two rules the old skill stated in prose into checks. *Nothing INFERIDO reaches the email*: the approach cites findings by id and validation refuses an INFERIDO one. *Findings expire*: phase two runs every re-check and refuses to proceed if a cited finding no longer holds, rather than leaving a checklist Daniel may or may not run.

## Labs

Artifacts live in one application, `labs/`, served at `labs.teamdbsolutions.com/<slug>` as its own Railway service. One application rather than one per artifact so that the rules below are enforced once, by a shared layout, and cannot be forgotten by a single artifact:

- A visible banner: an independent prototype by Daniel Bernardino, built from the company's public data, not affiliated with it.
- `noindex`, and no link from the portfolio. Nothing surfaces in a search for the company's name.
- An `expiresAt` per artifact, about sixty days out; after it, the route answers that the prototype has ended.
- Their name and public data may be used. Their brand may not be imitated as if official — no logo in brand position, no visual clone — and no artifact collects data from their real customers. Public data is gathered once, cached, and within `robots.txt`; there is no recurring crawler.

Only `labs/` is ever sent to a builder. `recon/`, which holds dossiers with third-party contact details, never leaves this machine; the repository is public, and its dossiers are gitignored — they exist only on this machine.

## The approach

It stays under about two hundred words, asks for twenty minutes, and carries a single link in the body — the artifact's. Which card opens depends on the decider: a business decider sees the artifact first and the door, if any, as a supporting line; a technical decider with a door sees the door first and the artifact as evidence of product thinking; a technical decider without one sees the artifact framed technically. The two solutions not built are not mentioned; they are material for the conversation the email is asking for.

## Consequences

Each approach now costs Daniel up to a weekend of building, which is the point — the approach is worth sending because it cost something — and also a limit on volume that the old skill did not have. The sixteen-hour ceiling exists to keep that cost bounded; a solution that needs more can appear in the dossier as a next step, not among the three.

The Corpus stays in `personal-website` and is read through its `corpus:json` contract (see that repository's ADR-0011). Recon uses every Accomplishment that carries a Metric and is not a draft — not only Featured ones — because the email goes to one person, not to the web.

The four dossiers written by the old skill are kept under `recon/legacy/` as reference and are not converted. Their perishable findings have expired; a company approached again goes through phase one from the start.
