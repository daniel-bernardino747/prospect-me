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

1. **Open with the proof.** The first two lines decide whether the rest is read.
   Never open with a request, never with who Daniel is.
2. **Say which problem it solves in their customer's terms**, using the finding
   behind it. Not "your site has no quote path" but "a buyer ready to price 200
   units has to wait for a callback; <competitor> answers in seconds".
3. **Evidence, exact numbers from the Corpus**, three at most. Quote Metrics
   exactly as `corpus:json` has them; translate to Portuguese without changing
   the figure.
4. **Name the absence of a posting when there is none**, and go anyway — only
   if the empty board is a fresh, re-checked finding.
5. **Ask small.** Twenty minutes, one reply. Never an interview, never an
   attached résumé — that turns the exchange back into screening.
6. **One link in the body**: the artifact's. A PR link, if any, goes in the P.S.
7. **The other two solutions stay out.** They are what the twenty minutes are
   for.

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
