# OST 520 Question Bank

Self-contained practice question bank for OST 520, Unit Exam 1. Previously a Claude
Artifact; now a plain static site so any agent or browser can reach it by URL.

**Live site:** https://chungchung-o-o.github.io/ost520-question-bank/

## Files

| File | What it is |
|------|------------|
| `index.html` | The whole app — questions, grading, rationales, progress tracking. No build step, no server, no dependencies. Opening the file directly also works. |
| `bank.json` | The 483 questions as structured data, extracted from `index.html`. Read this instead of scraping the HTML. |

## Contents

483 questions, all Unit Exam 1:

| Topic | Questions | `src` |
|-------|-----------|-------|
| Genetics | 312 | `G` |
| Biochemistry | 112 | `B` |
| Epi & Biostats | 59 | `E` |

460 are multiple choice (`"type": "mcq"`), 23 are worked problems (`"type": "worked"`).
They map onto 33 lecture objectives (`L001`–`L033`) and 259 named concepts.

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

Options are shuffled at runtime in the app, so `answer` refers to the order in this
file, not to what a given viewer sees on screen.

## Progress, privacy, and recovery

Attempts are kept in the viewer's own `localStorage`, per browser, under
`ost520.bank.v2`. Nothing is uploaded, and progress does not sync between devices or
follow the repo. The site migrates the earlier aggregate-only record format in place,
without inventing past attempt details. Before a migration or restore it retains the
previous value under `ost520.bank.v2.recovery`.

Use **Download full backup** to save a complete JSON snapshot (progress, active session,
theme, schema version, bank fingerprint, and exam metadata). **Import backup** validates
the schema, question IDs, and exact bank fingerprint, previews the replacement, and needs
an explicit confirmation. It refuses backups from a different bank. The existing text/CSV
style results export remains for quick sharing.

Progress from the former Claude artifact cannot move automatically because the artifact and
GitHub Pages use different browser origins. The home screen therefore includes **Transfer
results from the old Claude artifact**, which validates and restores the legacy eight-column
results export. Legacy text restores scored per-question aggregates and reason tags, but not
an unfinished session or theme because the old export never contained those fields.

The **Diagnosis** screen and **Copy analysis for Claude/Codex** describe wrong and
correct-but-guessed questions, concepts, source documents, reason tags, and fresh retest
availability. That analysis export intentionally excludes correct answers and rationales.

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
presence of recovery, import, resume, and analysis safeguards.

## Regenerating

`index.html` is the source of truth; `bank.json` is derived from the `const BANK = [...]`
array inside it. If you edit questions, edit them in `index.html` and re-extract, then run
`node tests.js` before publishing.
