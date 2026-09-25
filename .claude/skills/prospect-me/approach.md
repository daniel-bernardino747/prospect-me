# Writing the approach (phase two)

One email. Not variants — pick the angle and commit; offer two alternate
subjects only. The artifact exists, the re-check has run, and the email is the
invitation to see it.

## Which card opens

Decided by the decider's register (the schema enforces it):

- **Business decider** → **the artifact opens.** "I built <X> for your
  customers, with your catalog: <link>." They grasp it by clicking. A door, if
  there is one, becomes a supporting line.
- **Technical decider with a door** → **the door opens** (the PR, or "the system
  your challenge describes is already in production"), and the artifact comes in
  the middle as evidence of product thinking.
- **Technical decider without a door** → the artifact opens, framed
  technically: how it was built, in how long, on what.

## Structure

The body answers four questions, in this order. A body that describes the page
("I built this, here is how it works, I want to join") has skipped the two in
the middle, and those are the ones the decider replies to.

1. **Their problem, in their own words.** Start from what they have said or
   what their customer lives — a line of their own published thinking, or the
   finding behind the problem. Not "your site has no quote path" but "a buyer
   ready to price 200 units has to wait for a callback; <competitor> answers in
   seconds". Never open with a request, never with who Daniel is.
2. **What the artifact answers**, with the link. One sentence on what it shows
   and from which data; not a tour of its features.
3. **What that is worth to them** — to their business, their customer or their
   sales team — and one result from the artifact that proves it is real. This is
   the paragraph the Tarken drafts lacked twice.
4. **The ask, set by the brief's `intent`.**
   - `join`: the open role, when there is one, is the reason for writing and
     sits in the body; the ask is a conversation about where Daniel would add to
     the team.
   - `project`: a door becomes a supporting line; the ask is twenty minutes on
     what the artifact would become in their product.

   Either way ask small: one reply. Never an interview, never an attached
   résumé — that turns the exchange back into screening.

Also:

- **Evidence, exact numbers from the Corpus**, three at most — fewer when the
  word limit is better spent on point 3. Quote Metrics exactly as `corpus:json`
  has them; translate to Portuguese without changing the figure.
- **Name the absence of a posting when there is none**, and go anyway — only
  if the empty board is a fresh, re-checked finding.
- **Nothing that reads as a critique of the product of someone you ask to hire
  you.** A finding about their site's gaps belongs in a `project` pitch, not in
  a `join` one.
- **One link in the body**: the artifact's. A PR link, if any, goes in the P.S.
- **The other two solutions stay out.** They are what the conversation is for.

## Channel

- Write for the channel chosen in phase two. On LinkedIn, also give a connection
  note under 300 characters for when they are not connected; it carries the link
  and one line of why.
- A shared inbox is not the decider. Never send it the same text as a fallback.
- **Follow-up plan**, shown with the draft: after about five working days
  without a reply, one or two lines on the same channel with something new — a
  result for a praça, product or place they mentioned publicly — never "did you
  see it?". A second channel only with a different message for a different
  purpose (the role's own application form; a technical note to a technical
  co-founder).

Under about two hundred words in the body (hard limit 220). Every sentence
either proves something or asks for the meeting.

Write in the language the recipient works in — Brazilian Portuguese for a
Brazilian company.

## Recording it

Fill `approach` in the dossier: `contactId`, `channelFindingId` (a CONFIRMADO
finding establishing the channel), `opensWith`, `doorId` if one is used,
`subject`, `alternateSubjects` (two), `body`, `artifactUrl`,
`citedFindingIds` (every finding a sentence of the body rests on),
`citedAccomplishmentIds`, `writtenAt`.

If `validate` refuses it — an INFERIDO citation, a stale re-check, the wrong
opener, a missing link, too many words — fix the email, not the dossier.
