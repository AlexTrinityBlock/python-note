---
name: topic-quiz-static-template
description: Use this Skill when creating a new static topic-based quiz bank web app, or when adding topics or questions to one. The app is pure HTML/CSS/JS/JSON with no build step, organized as a topic list plus one question bank per topic. This Skill is generic: it must work for any subject and any programming language — never assume a specific subject or language.
---

# Topic Quiz Static Template

Use this Skill whenever you must create or extend a **static topic-based quiz
bank web app**: a no-backend, no-build page where each topic is both a note
area and a self-testing question bank.

## Key principles

- **Generic by design.** No subject, no programming language is implied. All
  concrete content (topic names, example code, exam references) must be
  supplied by the user or derived from the user's material. When you need a
  concrete example, use placeholders.
- **Everything is English.** All instructions, comments, commit messages and
  generated text are written in English.
- **Load templates on demand.** Do not paste template content inline. Read the
  relevant file from `references/` only when the task needs it:
  - `references/structure.txt` — file tree to scaffold
  - `references/topics.json.txt` — topic list format
  - `references/questions.json.txt` — question bank format
  - `references/question-note.txt` — plain-text note card format
  - `references/index.html` — HTML app page (hub / quiz / result / error views)
  - `references/script.js` — quiz logic (loading, answering, results, history)

## File structure (summary)

```
├── index.html            # Entry page (topic hub + quiz)
├── style.css             # Styles (provided or authored; see references/index.html)
├── script.js             # Logic (see references/script.js)
├── topics.json           # Topic list shown on the entry page
├── vendor/               # Vendored libraries referenced by index.html
│   ├── marked.min.js             # Markdown parser (marked v4)
│   ├── prism.min.js              # Prism core (syntax highlighting)
│   ├── prism-<lang>.min.js       # Grammar for the target language
│   ├── github-markdown.min.css   # GitHub markdown styles
│   └── prism.min.css             # Prism theme
├── <TopicID>/questions.json      # Question bank for one topic
└── <TopicID>/reference/          # Local study docs used as source material
```

Full tree with placeholders: `references/structure.txt`.

## Formats (load the templates for details)

### topics.json
Array of topic objects `{ "id", "name", "description" }`. `id` is the topic
directory name and must be a safe URL/path segment.

### questions.json
Array of question objects:

- `type`: `"single"` or `"multiple"`
- `question`: Markdown; fenced code blocks allowed (generic language tag)
- `options`: array of option texts (Markdown inline allowed)
- `answer`: array of 0-based indices of the correct options
- `explanation`: Markdown; must teach the whole module, with code when applicable

Newlines inside JSON strings are written as `\n`.

## Question writing rules

- **Short concept and code questions** that are discriminating: readers who do
  not understand the concept should be confused and fail.
- **Code questions** must include a code example wrapped in Markdown fences —
  except knowledge single-choice and knowledge multiple-choice questions,
  which need no code but must explain every option, including why each wrong
  option is wrong.
- **Scatter the correct answers.** Never place the correct option in the same
  position for every question. The correct position of the next question must
  differ from the previous one; for multiple-choice, the set of correct
  positions must not overlap the adjacent question's set. Avoid detectable
  patterns (A-B-C-D cycling, A-B-A-B alternation, repeated adjacent pairs,
  evenly spaced progressions, long monotonic runs) and keep the overall
  distribution of positions roughly balanced.
- **Whenever options are reordered**, update the `answer` indices AND every
  option-letter reference in the `explanation` so they match the new
  positions.
- **Explanations must be complete.** Present the whole knowledge module with a
  full example first, then derive the output step by step in structured
  Markdown (e.g., a state-change table followed by a numbered walkthrough) so
  learners can observe every detail.
- **Progressive code sets** (optional): a strict sequence of single-choice
  questions where each question builds on the code of the previous one. They
  must appear in order and must never be shuffled — later questions reveal
  earlier answers.

## Source material and staleness

- Reference material lives locally in `<TopicID>/reference/` and may be
  outdated. Before writing questions, search the web to confirm the
  information is still current, and prefer authoritative sources (official
  documentation, specifications, standards).
- Do not invent facts; every explanation must be verifiable.

## Serving the app

The app is static and must be served over HTTP (browsers block `fetch()` of
local JSON files). Start any static file server from the project root, e.g.:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000`.

## Adding a topic (workflow)

1. Scaffold `<TopicID>/questions.json` from `references/questions.json.txt`.
2. Collect source material into `<TopicID>/reference/` (gitignored study docs).
3. Add `{ "id", "name", "description" }` to `topics.json`.
4. Write or extend questions per the rules above; load
   `references/questions.json.txt` for the exact shape.
5. If the app needs styling or behavior changes, load `references/index.html`
   and `references/script.js` and edit the copies in the project (never edit
   the templates themselves).
