# OST 520 Question Bank

Self-contained, 575-question practice bank for OST 520 Unit Exam 1. It combines
adaptive daily sets, browser-local performance diagnosis, weak-concept retesting,
worked rationales, confidence tracking, and lossless backup/restore. Previously a
Claude Artifact, it is now a plain static site that any browser can reach by URL.

The site is organised as a library: **Question Bank &rarr; class &rarr; unit**. OST 520 is
the only class so far, and Unit 1 the only unit holding questions.

**Live site:** https://chungchung-o-o.github.io/ost520-question-bank/

## Files

| File | What it is |
|------|------------|
| `index.html` | The whole app — questions, grading, rationales, progress tracking. No build step, no server, no dependencies. Opening the file directly also works. |
| `bank.json` | The 575 questions as structured data, extracted from `index.html`. Read this instead of scraping the HTML. |
| `add-faculty-problem-sets.js` | Idempotent ingest of the faculty practice sets. Also records, in comments, which faculty items were deliberately skipped and why. |
| `add-weakness-questions.js` | Idempotent ingest of the 24 targeted `WK-*` weak-area questions. |
| `add-transcript-remediation.js` | Idempotent ingest of the 18 transcript-grounded `TR-*` remediation questions. |

## The library

Every question carries a `course` and a `unit`, and the site shelves them accordingly.

| Level | Values today |
|-------|--------------|
| Class | `OST520` |
| Unit | `UE1` (575 questions). `UE2` and `UE3` are declared in `COURSES` and render as empty shelves until questions carry those unit tags. |

To open a new unit, tag questions with that `unit` value; the shelf stops being
empty on its own. To add a class, append to the `COURSES` array in `index.html`
and give its questions the matching `course` value.

Inside a unit, **Which questions** filters by provenance:

| View | Shows |
|------|-------|
| Everything | All 575 |
| Faculty practice | The 50 questions taken from the course's own problem sets |
| Bank questions | The 525 written for this site |

The chosen class, unit, and view are remembered in `localStorage` under
`ost520.bank.v2.scope`, so a reload returns you where you were. The view narrows what
you practise; it never changes the backup fingerprint or which ids a backup validates
against, both of which always span the whole bank.

## Contents

575 questions, all Unit Exam 1:

| Topic | Questions | Coverage | `src` |
|-------|-----------|----------|-------|
| Genetics | 365 | Pedigrees, inheritance, DNA/chromosomes, regulation, population genetics, refresher prerequisites | `G` |
| Biochemistry | 151 | Metabolism, glycolysis, sugar entry, carbohydrate digestion, PDH/TCA/ETC, redox | `B` |
| Epi & Biostats | 59 | Study design, screening, bias, association, calculations | `E` |

550 are multiple choice (`"type": "mcq"`), 25 are worked problems (`"type": "worked"`).

### Faculty practice questions

The 50 `FP-*` questions come from the practice sets the course itself hands out. They
were not in a separate folder: each one is printed at the **end of a lecture PDF** under
`_inputs`, which is why they are easy to miss.

| Source | Ingested |
|--------|----------|
| `(007) L - Vitamins - Wilkins.pdf` pp.17-26, "Wilkins Problem Set" | 14 |
| `(015) L - Population Genetics - Wilkins.pdf` pp.12-20, two sets | 23 |
| `(006) L - Mendelian Modes of Inheritance - Wilkins.pdf` pp.11-19 | 3 |
| `(014) L - Factors Modulating Inheritance - Wilkins.pdf` pp.18-20 | 1 |
| Refresher 6, Carbohydrate tutorial | 3 |
| Collaborative Application Session 1 (Aug 26 2026) | 6 |

43 of the 50 carry the faculty's own published answer key (`"keyed": true`); the rest were
answered from the lecture text and are worth a second look. Every one records where it came
from in `sourceRef`.

Two categories were deliberately **not** ingested, and `add-faculty-problem-sets.js` lists
both in comments: items that cannot be posed without their figure (identifying vitamins,
amino acids, or nucleotides from drawn structures; reading an unlabelled pedigree), and
items already covered by an equivalent bank question. On the first category, note that the
Vitamins problem set states outright that structures will not be asked on quizzes or exams.

Population genetics was the largest hole this closed: before the ingest, exactly two
questions in the bank covered lecture 015.

The 24 `WK-*` questions are fresh alternates added from Austin's 2026-08-27
performance analysis. They target redox carriers, sugar-entry disorders, ETC entry,
pedigree notation and inheritance logic, genetic-code directionality, chromatin packing,
telomeres, replication-fork proteins, and triploidy. Their source material is the three
course input groups under `26 Fall/OST 520/_inputs`: Week 1, Week 2, and the prerequisite
refresher materials. `add-weakness-questions.js` is idempotent and keeps this reviewed set
synchronized between `bank.json` and the embedded bank.
They map onto 33 lecture objectives (`L001`–`L033`) and 259 named concepts.

The 18 `TR-*` questions are a separate, transcript-grounded remediation batch for
recurring L001–L006 and RR1/RR2 weak clusters. Each retains its lecture and timestamp range in
`sourceRef`, so its key can be checked against the timestamped course transcript.
They are ordinary, non-faculty `UE1` bank questions, start unseen, and are added by
the idempotent `add-transcript-remediation.js` script without rewriting earlier items.

## `bank.json` schema

Each element is one question:

```json
{
  "id": "B1",
  "n": 1,
  "topic": "Biochemistry",
  "src": "B",
  "stem": "A patient's cells are producing large amounts of NADPH...",
  "options": ["Catabolic, oxidative", "Anabolic, reductive", "..."],
  "answer": 1,
  "rationale": "NADPH is the reducing power of <strong>anabolic</strong> pathways...",
  "type": "mcq",
  "context": "",
  "unit": "UE1",
  "course": "OST520",
  "concepts": ["anabolism-vs-catabolism"],
  "covers": ["L001"]
}
```

| Field | Notes |
|-------|-------|
| `id` | Stable identifier, topic letter + number (`B1`, `G204`, `E17`). |
| `n` | Position within its topic. |
| `answer` | Zero-based index into `options`. `null` for worked problems. |
| `options` | Empty array `[]` for worked problems — those are answered from the rationale. |
| `rationale` | Contains inline HTML (`<strong>`, entities like `₂`). Strip tags if you need plain text. |
| `context` | Shared vignette or data table, present on 28 questions. Empty string otherwise. |
| `concepts` | Kebab-case concept slugs, for grouping misses by idea rather than by question. |
| `covers` | Lecture objective IDs the question tests. |
| `course`, `unit` | Which library shelf the question sits on. |
| `source` | `faculty-practice` on the 50 `FP-*` questions and `transcript-remediation` on the 18 `TR-*` questions; absent on the other site-authored questions. |
| `sourceRef` | On faculty questions: document and original question number. On `TR-*`: lecture plus supporting transcript timestamp range. |
| `keyed` | On faculty questions: whether the faculty published an answer key for it. |

Options are shuffled at runtime in the app, so `answer` refers to the order in this
file, not to what a given viewer sees on screen.

## Progress, privacy, and recovery

Attempts are kept in the viewer's own `localStorage`, per browser, under
`ost520.bank.v2`. Nothing is uploaded, and progress does not sync between devices or
follow the repo. The site migrates older aggregate-only record formats in place, without
inventing past attempt details. Before a migration or restore it retains the previous
value under `ost520.bank.v2.recovery`.

New attempts receive an append-only, per-question timeline record with an ISO timestamp,
local timezone offset, outcome, selected option (for MCQs), confidence, reason tags,
session identity, and fresh-transfer flag. Existing `attempts` and `correct` aggregates
remain authoritative for older activity; the timeline begins only after migration.

For MCQs, confidence is **Knew it**, **Narrowed to two**, or **Guessed**. Correct answers
in either uncertain category enter the review queue alongside current wrong answers.

Use **Download full backup** to save a complete JSON snapshot (progress, active session,
theme, reports, reviewed concepts, backup metadata, schema version, bank fingerprint, and
exam metadata). Confirm **I saved the backup** only after the download completes: that is
what updates the visible last-backup date. A reminder appears after seven days. **Import backup** validates
the schema, question IDs, and bank version, previews the replacement, and needs an explicit
confirmation. Known additive releases remain compatible so older progress backups survive
new questions; unrelated banks are refused. The existing text/CSV
style results export remains for quick sharing.

Progress from the former Claude artifact cannot move automatically because the artifact and
GitHub Pages use different browser origins. The home screen therefore includes **Transfer
results from the old Claude artifact**, which validates and restores the legacy eight-column
results export. Legacy text restores scored per-question aggregates and reason tags, but not
an unfinished session or theme because the old export never contained those fields.

For an offline conversion, run `node convert-legacy-export.js INPUT.txt OUTPUT.json`, then
import the generated JSON backup from the home screen. The converter validates every
question ID and never writes personal performance data into the repository.

The **Diagnosis** screen and **Copy analysis for Claude/Codex** describe wrong and
correct-but-guessed questions, concepts, source documents, reason tags, and fresh retest
availability. That analysis export intentionally excludes correct answers and rationales.

Diagnosis also exposes the exact items behind a weak concept, their relevant explanation,
review-miss and fresh-test actions, and a local **Mark reviewed** timestamp. It reports
future-only daily, first-attempt, repeat, retention, and mastery signals without implying
that legacy aggregate data has a hidden timeline. You can flag a question as ambiguous,
answer-cued, unclear, unsupported by course material, or contradicted by its explanation;
reports are local, non-destructive, visible in Diagnosis, and included in backups.

**Today’s adaptive 40** aims for 15 unseen questions, 10 current misses, 10 fresh
questions covering weak concepts, and 5 older mastered questions. If a bucket is short it
fills from eligible taught material, never duplicates an ID, and persists the resulting
order for an identical resume.

Current wrong, correct-but-guessed, historical misses, and fresh-transfer results are
separate signals. Legacy records have no attempt timeline, and the UI labels that
limitation rather than pretending one exists.

## Architecture and tests

This remains one dependency-free static site. `index.html` is the source of truth;
`bank.json` must stay byte-for-data equivalent to its embedded `BANK` array. Question
order is canonical in the bank, while sessions use a persisted deterministic weighted
interleaver so they resume in the exact same order.

Run the offline regression checks with:

```sh
node tests.js
```

They verify bank integrity and synchronization, legacy-migration compatibility, review
queues, deterministic topic interleaving, worked-question scoring semantics, and the
presence of recovery, import, resume, and analysis safeguards. They also lock the answer
indices for the manually rebalanced questions and for all 48 multiple-choice faculty
questions, so distractor edits cannot silently change a keyed answer.

The library is covered behaviourally, not just by string matching: the suite boots the page
with a saved scope and asserts that the faculty view shows exactly the 50 faculty questions,
the bank view exactly the other 525, an empty or unknown unit falls back to the library, and
the backup fingerprint is identical in every view.

## Regenerating

`index.html` is the source of truth; `bank.json` is derived from the `let BANK = [...]`
array inside it. `BANK` is declared with `let` because it is reassigned to the current
library view; `ALL_QUESTIONS` holds the unfiltered array. If you edit questions, edit them in `index.html` and re-extract, then run
`node tests.js` before publishing.

`rebalance-choices.js` contains reviewed, ID-based option replacements for questions whose
correct choice was disproportionately explanatory. Running it updates both bank copies
while preserving question IDs, concepts, rationales, and answer indices.
