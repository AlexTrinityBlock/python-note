# Python Note

> A personal Python study notebook with built-in quiz practice

A pure front-end (HTML + CSS + JavaScript + JSON) Python study notebook with
built-in quiz practice. **Python Note** turns each topic into both a note area
and a question bank for self-testing. No backend or package installation
required.

- Entry page lists question banks by topic (OOP, PEP 8, PEP 20, PEP 257, Typing…)
- Each topic has its own `questions.json` with single-choice and multiple-choice questions
- Submitting an answer shows instant feedback (correct/wrong, highlighted options and an
  explanation); you advance to the next question manually via the Next Question button, and
  the Previous Question button lets you jump back to review questions you already answered
  (answer, feedback and explanation are restored)
- Progress and score history persist in `localStorage` (in-progress answers per topic,
  plus the last 10 completed runs per topic with their correct-answer rates); each topic
  card on the hub shows those runs as a compact block bar chart so you can see your
  score trend at a glance

## How to run

From the project root, open a terminal and run:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open this URL in your browser:

```
http://127.0.0.1:8000
```

> Serve the files over HTTP: opening `index.html` directly may fail to load the
> questions, because browsers block `fetch()` of local JSON files (CORS).
> `--bind 127.0.0.1` restricts the server to localhost; if your Python version
> does not support `--bind`, simply run `python -m http.server 8000`.

## Deploying to GitHub Pages

The app is pure static files (HTML/CSS/JS/JSON) with **no build step**, and
every asset path is **relative** (`style.css`, `vendor/…`, `topics.json`,
`<Topic>/questions.json`), so it works out of the box under a GitHub Pages
project subpath — no code changes needed.

### Option A — Deploy from the branch root (recommended)

1. Push the repository to GitHub (the remote is already set to
   `git@github.com:AlexTrinityBlock/python-note.git`):

   ```bash
   git add -A
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Build and deployment**, set **Source** to
   **"Deploy from a branch"**.
3. Set **Branch** to `main` and **folder** to `/` (root), then **Save**.
4. The site goes live at `https://AlexTrinityBlock.github.io/python-note/`.
   The first build takes a couple of minutes; every push after that redeploys
   automatically. HTTPS is enforced by GitHub.

### Option B — GitHub Actions workflow

Same result, but deployment is driven by a workflow file. Switch the Pages
source to **"GitHub Actions"** and add `.github/workflows/pages.yml` (see the
example at the end of this section). Choose this when you later add a build
step (e.g. bundling, Markdown → HTML generation) and need to publish the
*output* of a build rather than the repository as-is.

### Option C — Serve from the `/docs` folder

Identical to Option A except the folder is `/docs` instead of `/`. Only
meaningful if you want the published files separated from the sources inside
the same branch; unnecessary for this project.

### Comparison

| Option | Setup effort | Automation | When to use |
| --- | --- | --- | --- |
| **A. Branch root** | ~1 minute, click-only | Auto redeploy on push | **Recommended** — pure static app, no build step |
| B. GitHub Actions | Add one YAML file | Full control; can run a build first | If a build step is added later |
| C. `/docs` folder | Move files + click | Auto redeploy on push | If published files must live in a subfolder |

> **URL note:** project pages are served at `https://<user>.github.io/<repo>/`
> (here `…/python-note/`). If the repository were renamed to
> `AlexTrinityBlock.github.io`, the site would move to the user-site root
> `https://AlexTrinityBlock.github.io/`.

### Example: `.github/workflows/pages.yml` (Option B)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## File structure

```
├── index.html      # Entry page (topic hub + quiz)
├── style.css       # Styles
├── script.js       # Logic
├── topics.json     # Topic list shown on the entry page
├── vendor/
│   ├── marked.min.js           # Markdown parser (marked v4)
│   ├── prism.min.js            # Prism core (syntax highlighting)
│   ├── prism-python.min.js     # Python grammar for Prism
│   ├── github-markdown.min.css # GitHub markdown styles
│   └── prism.min.css           # Prism theme
├── OOP/questions.json      # Question bank: object-oriented programming
├── PEP8/questions.json     # Question bank: code style
├── PEP20/questions.json    # Question bank: The Zen of Python
├── PEP257/questions.json   # Question bank: docstrings
├── Typing/questions.json   # Question bank: typing & type hints (PEP 484, PEP 613, PEP 695)
└── ...             # add more topic directories as needed
```

## Adding a topic

1. Create a directory named after the topic, e.g. `PEP517/`
2. Put a `questions.json` inside it (see format below)
3. Add an entry to `topics.json`:

```json
{
  "id": "PEP517",
  "name": "Packaging — PEP 517",
  "description": "Build system interface for Python packages."
}
```

## Question format

Each `questions.json` is an array of question objects. Every object contains
the question text, options, the answer (an array of option indices), and an
optional explanation. The `question` and `explanation` fields support
**Markdown** (rendered locally with [marked](https://github.com/markedjs/marked)).
Fenced code blocks are highlighted with Prism (Python grammar bundled); wrap
code identifiers in backticks so underscores are not parsed as emphasis.
Newlines in JSON strings must be written as `\n`:

```json
[
  {
    "type": "single",
    "question": "What is the main purpose of the `__init__` method in a class?",
    "options": ["To create the object", "To initialize a newly created instance", "To destroy the object", "To copy the object"],
    "answer": [1],
    "explanation": "`__init__` is called automatically after the object is created to initialize instance attributes."
  },
  {
    "type": "single",
    "question": "What does the following code print?\n\n```python\nprint(2 ** 3)\n```",
    "options": ["6", "8", "9", "5"],
    "answer": [1],
    "explanation": "`2 ** 3` is 2 raised to the power of 3, which is `8`."
  },
  {
    "type": "multiple",
    "question": "Which of the following are built-in Python data types?",
    "options": ["list", "array", "dict", "tuple"],
    "answer": [0, 2, 3],
    "explanation": "`list`, `dict`, and `tuple` are built-in types."
  }
]
```

- `type`: `"single"` or `"multiple"`
- `answer`: array of indices of the correct options (0-based)
- `question` / `explanation`: Markdown supported (backtick code spans recommended for code identifiers)
