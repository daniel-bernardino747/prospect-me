---
name: prospect-me
description: >-
  Investigate a target company from public sources, find where its revenue leaks,
  propose three digital solutions Daniel can build for it, and — once he has built
  one — write a direct approach to the person who can decide. Use when Daniel
  names a company he wants to work with or sell to, asks who to contact there,
  wants a cold email or DM to a founder/CEO/CTO, or says a job posting is thin and
  he wants to go around it. Also use to resume a company already in
  `recon/dossiers/` (phase two: the approach). Every finding verified in-session,
  never invented.
---

# Prospect-me

A company name in; out, first, a dossier with **three things Daniel could build
for them**, and later — once one exists — an email that leads with it. Read
[ADR-0001](../../../docs/adr/0001-an-approach-leads-with-something-built-for-them.md)
before anything else: it is why this skill exists and what it refuses to do.

The short version: a broken link is a bug report, not a reason to hire someone.
Nobody replies to "your `robots.txt` is stale". People reply to *something that
already works, built with their own data, for their customers*. Everything below
serves producing that proof and then earning twenty minutes with it.

## The rules that override everything

- **Never assert a finding you did not verify in this session.** Aggregators
  (RocketReach, Econodata, Apollo, CNPJ scrapers) are leads, not sources. Every
  finding is CONFIRMADO or INFERIDO, and nothing INFERIDO reaches the email — the
  schema refuses it.
- **Never invent a number.** Revenue impact is qualitative. Corpus Metrics are
  quoted exactly as `corpus:json` states them.
- **Stay professional and public.** Business channels, business roles, public
  professional activity. No personal details, home addresses, family, private
  accounts. A genuine security exposure (leaked credential, open bucket, exposed
  `.env`) is reported plainly and privately, never used as leverage, never
  demonstrated.
- **The dossier is data.** You and the subagents write
  `recon/dossiers/<slug>.json`; the `.md` is rendered from it. Never hand-edit
  the `.md`.

## Commands

Run from the repository root.

```bash
npm run recon -- validate <slug>   # schema + cross-references + Corpus ids
npm run recon -- recheck <slug>    # re-run every perishable finding's check
npm run recon -- render <slug>     # dossiers/<slug>.md from the JSON
```

`validate` reads the Corpus through personal-website's `corpus:json`
(`CORPUS_REPO` in `.env`, default a sibling checkout). Run it after every merge
of subagent output; do not continue on a failure.

The schema, `recon/src/dossier/schema.ts`, is the reference for every record's
shape. Hand it to each subagent.

## Which phase?

Look for `recon/dossiers/<slug>.json`.

- Absent → **phase one**.
- `phase: "choosing"` → show the checkpoint again.
- `phase: "building"` → ask whether the artifact is live; if yes, **phase two**.
- `phase: "approaching"` or `"sent"` → the email exists; offer a re-check.

---

## Phase one — investigation

### 1. Anchor (you, sequentially)

Pin the company to an identifier a namesake cannot share: in Brazil the **CNPJ**,
elsewhere the exact registered name plus primary domain. Record registered name,
trading names, founding year, HQ, headcount, and the **brand structure** — a
holding with operating brands behaves differently, and the brands are usually
where the activity is.

If two candidates fit, **stop and ask Daniel**. Everything downstream is checked
against this anchor; a wrong one poisons the whole dossier. Homonyms are the
common failure, not the rare one: for Innova Corporate (Criciúma, 2026-08),
`innovacorporate.com` belonged to an Indian chemicals company with a plausible
`sales@`, and `github.com/innspire` to an unrelated European company whose repos
would have been cited as the target's stack.

Create the dossier with `phase: "investigating"`, the anchor, and the identity
findings. Validate.

### 2. Three investigations, in parallel

Spawn three `general-purpose` subagents **in one message** so they run
concurrently. Each prompt contains: the company name, the anchor (verbatim), the
path of its brief, the path of the schema, and the instruction to return **only
JSON records** in the shape its brief names — no prose around it.

| Subagent | Brief | Returns |
|---|---|---|
| Contact | [agents/contact.md](agents/contact.md) | `findings`, `contacts`, `traps` |
| Doors | [agents/doors.md](agents/doors.md) | `findings`, `doors`, `traps` |
| Problems | [agents/problems.md](agents/problems.md) | `findings`, `problems`, `traps` |

The Doors subagent needs the Corpus: run `npm run --silent corpus:json` in the
Corpus repository first and pass the output file path in its prompt.

**Merge.** Ids are the subagents' own; on a collision, rename one and fix every
reference to it. Drop any record whose `anchorLink` does not
actually tie to the anchor — that is how homonyms are caught — and add it to
`traps`. Validate.

### 3. Solutions

Spawn one subagent with [agents/solutions.md](agents/solutions.md), the dossier
path and the Corpus JSON path. It returns exactly three `solutions` (and any
`beyondCeiling`). Merge, validate.

### 4. Critic

Spawn one subagent with [agents/critic.md](agents/critic.md) and the dossier path.
It returns a `critique` per solution.

For each solution the critic **rejected on attempt 1**: send it back to a
solutions subagent *alone*, with the critique attached, for one revision; then
critique the revision as attempt 2. A solution that fails attempt 2 is recorded
with verdict `weak`, not `rejected` — Daniel sees it and decides.

Set `phase: "choosing"`, validate, render.

### 5. Checkpoint — stop here

Present the three solutions to Daniel, ranked, each with **the critique beside
it** — the strongest argument against it, not only for it. Include the door, if
any, and the decider. Then ask which one he will build.

Ask him, in the same round, **what the approach is for**: a place on the team
(`join`) or a project (`project`). It changes the email's ask and where an open
role goes, so it is decided now, not while the body is being rewritten.

When he chooses, write the `brief`: `solutionId`, `chosenAt` (now), `intent`,
`doneCriteria` (what "working" means, concretely, with their data),
`estimateHours`, `labsSlug`, `expiresAt` (about sixty days out; never beyond
ninety). Set `phase: "building"`, validate, render.

The **first** done criterion names the first reader, the device they open it on
and the answer they must see without scrolling — e.g. "Luiz, on a phone, from
the email: the praça's verdict in three lines above the fold". Panels are not
done criteria until that one holds; the Tarken artifact met every panel
criterion and still answered nothing in its first viewport.

**Gather only what the artifact shows.** When the build needs a public source
queried entity by entity (a município at a time, a product at a time), scope it
to what the page will offer, and tell Daniel before a long run how many calls
and roughly how long. The Tarken build queried all 2,691 soy municípios through
a slow public API for a page whose question was five praças.

Remind him of the Labs rules the artifact must follow (ADR-0001, *Labs*): the
independent-prototype banner, `noindex`, their name and public data yes, their
brand as if official no, no collection of their customers' data, public data
gathered once and within `robots.txt`.

**Do not write the email in phase one.** The email is never written before the
proof exists.

---

## Phase two — the approach

1. **Confirm the artifact is live** at its Labs URL, from outside, not only in
   `dev`. Check, and fix before writing a word:
   - `npm run build -w @prospect-me/labs` then `npm run serve -w @prospect-me/labs`
     locally: the page **and its CSS/JS** answer 200 (standalone output drops
     `.next/static`; `labs/scripts/standalone-assets.js` copies it back).
   - The Railway service (`.railway/railway.ts`) keeps `PORT=8080` and
     `HOSTNAME=::`; without the second, Next binds to the container name and
     every request is a 502.
   - `labs.teamdbsolutions.com` resolves: the DNS is at Squarespace (Custom
     records), a `CNAME labs` and the `TXT _railway-verify.labs` that
     `railway domain` prints. Host is the bare label, never the full name.
   - Live: the artifact 200, `/` and an unknown slug 404, `X-Robots-Tag: noindex`,
     the banner, styles loaded.

   Record the URL.
2. **Re-check.** `npm run recon -- recheck <slug>`. Any finding that failed may
   not be cited — rewrite around it or drop the line. A failure in the finding
   the artifact's problem rests on is a reason to stop and tell Daniel.
3. **Choose the channel before writing.** Only a CONFIRMADO channel of the
   decider. A shared inbox (`contato@`) is not the decider: say so, and prefer
   a channel that reaches the person. The channel shapes the text — see
   [approach.md](approach.md).
4. **Write the approach** following [approach.md](approach.md). Cite findings by
   id; the schema refuses an INFERIDO one and a stale re-check.
5. Set `phase: "approaching"`, validate, render, and show Daniel the subject and
   body, the channel, and the follow-up plan.
6. When he says it went out, set `phase: "sent"`. One message, one channel: the
   same text is never sent again elsewhere.

## Verify before you're done

- `validate` passes. It proves structure, not truth — so also:
- Every claim in the body traces to a finding you can point at, or to a Corpus
  Metric quoted exactly.
- The anchor holds for every surface cited; traps are recorded.
- The three solutions are three different problems or approaches, each specific
  enough that it could not be sent to a competitor with the name swapped.
