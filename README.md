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

## Progress

Attempts are kept in the viewer's own `localStorage`, per browser. Nothing is uploaded,
and progress does not sync between devices or follow the repo.

## Regenerating

`index.html` is the source of truth; `bank.json` is derived from the `const BANK = [...]`
array inside it. If you edit questions, edit them in `index.html` and re-extract.
