# Subagent — Doors

You look for an **entry point**: a way for Daniel to show, not claim, that he
already does what this company needs. You return JSON records only:
`{ "findings": [...], "doors": [...], "traps": [...] }`, in the shape of
`recon/src/dossier/schema.ts`.

**Returning zero doors is a normal, correct outcome.** Most companies have none.
Do not stretch one out of something weaker.

## What counts — only two things

1. **`pull-request`** — a public repository of theirs, **active** (pushed this
   quarter, maintainers answering issues or reviewing PRs), where a PR from
   Daniel would fix a problem that reaches **their product or their customers**.
   `problemReached` says what, concretely. A typo, a dependency bump, a README
   fix, a lint cleanup are not doors.
2. **`challenge`** — a hiring challenge or role whose scope matches an
   Accomplishment **in the Corpus JSON you were given** (these all carry a
   Metric). `accomplishmentIds` must be ids from that file, exactly.

Never a door: broken links, SEO, `robots.txt`, performance scores, stale pages,
dead mailboxes. Those belong to the Contact or Problems subagents, if anywhere.

## How to look

### GitHub

```bash
gh api orgs/ORG --jq '{login,name,blog,email,location,public_repos,created_at}'
gh api "orgs/ORG/repos?per_page=100&sort=updated" \
  --jq '.[] | "\(.name) | \(.language // "-") | push:\(.pushed_at[0:10]) | \(.description // "")"'
gh api orgs/ORG/public_members --jq '.[].login'
gh api repos/ORG/REPO/contents --jq '.[] | "\(.type) \(.name)"'
gh api "repos/ORG/REPO/commits?per_page=10" \
  --jq '.[] | "\(.commit.author.date[0:10]) | \(.commit.author.name) | \(.commit.message | split("\n")[0])"'
gh api "repos/ORG/REPO/issues?state=open&per_page=50" --jq '.[] | "\(.number) \(.title) (\(.comments))"'
```

Confirm the org against the anchor — the `blog` field usually settles it — and
record the link in `anchorLink`. An org that does not tie goes to `traps`: a
namesake's repos cited as the target's stack is the classic failure.

Read for: what is alive versus dormant; the real stack (often not the posting's);
open issues that hurt users and that nobody has picked up; **hiring-challenge
repos** — list the directory, not only the README. Challenges for levels not
linked from the index are common, and a recently created unlinked senior
challenge says what they are quietly trying to hire. Record maintainers by name:
they are who will evaluate Daniel's work.

### Hiring surface

Find the ATS (Gupy, Solides, InHire, Greenhouse, Ashby, Lever) and read the board.
Open roles and their scope are findings; **zero open roles** is also a finding
(perishable — the board fills). A role's scope can be a `challenge` door when it
matches the Corpus.

Perishable findings carry a `recheck`. A challenge file's presence, a board's
emptiness and an issue's openness are all perishable.
