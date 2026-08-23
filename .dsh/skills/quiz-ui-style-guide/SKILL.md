---
name: quiz-ui-style-guide
description: Use this Skill when writing, restyling, or reviewing the CSS and HTML of a static quiz web app that follows the topic-quiz-static-template. It documents the exact CSS custom properties (design tokens), component class names, and the HTML structure of the current template. Never edit the template references or the live page; copy these details verbatim into new projects.
---

# Quiz UI Style Guide

Use this Skill whenever you must apply or reproduce the look and structure of
the **topic-quiz-static-template** quiz app: the CSS design tokens, the
component classes, and the HTML skeleton. The current template files under
`topic-quiz-static-template/references/` and the live `index.html` / `style.css`
are authoritative and must NOT be edited. Copy the details below verbatim into
new projects.

## Design tokens (CSS variables)

All colors, typography, spacing, radius, elevation and motion are defined as
CSS custom properties on `:root` in `style.css`. Never hardcode raw values;
always reference the variables.

### Color

| Variable                  | Value     | Usage |
| ------------------------- | --------- | ----- |
| `--background`            | `#ffffff` | Page / card / button background |
| `--foreground`            | `#09090b` | Main text |
| `--primary`               | `#18181b` | Primary buttons, progress fill, selected option |
| `--primary-hover`         | `#27272a` | Primary button hover |
| `--muted`                 | `#f4f4f5` | Muted backgrounds, badge, option hover |
| `--muted-foreground`      | `#71717a` | Secondary text |
| `--border`                | `#e4e4e7` | Card / option borders |
| `--destructive`           | `#ef4444` | Wrong answers, errors |
| `--ring`                  | `#a1a1aa` | Focus rings, hover border |
| `--success`               | `#16a34a` | Correct answers |
| `--success-bg`            | `#f0fdf4` | Correct option / feedback background |
| `--success-border`        | `#bbf7d0` | Correct feedback border |
| `--destructive-bg`        | `#fef2f2` | Wrong option / feedback background |
| `--destructive-border`    | `#fecaca` | Wrong feedback border |

### Typography

| Variable             | Value                                                                                             | Usage |
| -------------------- | ------------------------------------------------------------------------------------------------- | ----- |
| `--font-sans`        | `"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Microsoft JhengHei", "PingFang TC", sans-serif` | Body font |
| `--font-mono`        | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`                                        | Score, percentages, code |
| `--text-h1` / `-lh`  | `36px` / `40px` | App title |
| `--text-h2` / `-lh`  | `30px` / `36px` | Section titles |
| `--text-h3` / `-lh`  | `24px` / `32px` | Topic names, question text |
| `--text-p` / `-lh`   | `16px` / `28px` | Body text |
| `--text-small` / `-lh` | `14px` / `20px` | Secondary text |

### Spacing (4px base)

| Variable | Value | | Variable | Value |
| -------- | ----- |-| -------- | ----- |
| `--space-1` | `4px` | | `--space-5` | `24px` |
| `--space-2` | `8px` | | `--space-6` | `32px` |
| `--space-3` | `12px` | | `--space-7` | `48px` |
| `--space-4` | `16px` | | | |

### Radius, elevation, motion

| Variable | Value | Usage |
| -------- | ----- | ----- |
| `--radius` | `0.5rem` | Cards, buttons |
| `--radius-sm` | `calc(0.5rem - 4px)` | Options, small items |
| `--radius-full` | `9999px` | Badges, markers, progress track |
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Cards, topic cards |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)` | Hover state |
| `--motion-default` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | All transitions |

## HTML format (structure)

The page is a single `index.html` with one `.container`, a `.app-header`, and
four `<main>` views toggled with the `hidden` attribute. Copy this skeleton:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="favicon.svg" />
  <title><App Name></title>
  <link rel="stylesheet" href="style.css?v=2" />
  <link rel="stylesheet" href="vendor/github-markdown.min.css" />
  <link rel="stylesheet" href="vendor/prism.min.css" />
  <script src="vendor/marked.min.js"></script>
  <script src="vendor/prism.min.js" data-manual></script>
  <script src="vendor/prism-<lang>.min.js"></script>
</head>
<body>
  <div class="container">
    <header class="app-header">
      <img class="logo" src="favicon.svg" alt="<App Name>" width="44" height="44" />
      <div class="app-header-text">
        <h1><App Name></h1>
        <p class="subtitle"><App subtitle></p>
      </div>
    </header>

    <main>
      <!-- Topic hub -->
      <section id="hub-view">
        <p class="hub-hint">Pick a topic to start practicing.</p>
        <div class="topic-grid" id="topic-grid"></div>
      </section>

      <!-- Quiz view -->
      <section id="quiz-view" hidden>
        <div class="quiz-nav">
          <button class="btn btn-ghost" id="back-btn">← All Topics</button>
          <button class="btn btn-ghost" id="reset-btn">↺ Restart Quiz</button>
        </div>
        <div class="progress-track" role="progressbar" aria-label="Quiz progress">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
        <p class="progress-text" id="progress-text"></p>

        <article class="card">
          <div class="card-head">
            <span class="badge" id="type-badge"></span>
            <span class="question-num" id="question-num"></span>
          </div>
          <div class="question-text" id="question-text"></div>
          <div class="options" id="options"></div>
          <div class="feedback" id="feedback" hidden>
            <p class="feedback-title" id="feedback-title"></p>
            <div class="explanation" id="explanation" hidden>
              <span class="explanation-label">Explanation</span>
              <div id="explanation-text"></div>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-ghost" id="prev-btn" disabled>← Previous Question</button>
            <button class="btn btn-primary" id="submit-btn" disabled>Submit Answer</button>
          </div>
        </article>
      </section>

      <!-- Result view -->
      <section id="result-view" hidden>
        <article class="card result-card">
          <p class="result-topic" id="result-topic"></p>
          <h2 class="result-title">Quiz Complete</h2>
          <div class="score" id="score"></div>
          <p class="result-msg" id="result-msg"></p>
          <div class="actions center">
            <button class="btn btn-primary" id="restart-btn">Restart Quiz</button>
            <button class="btn btn-outline" id="home-btn">All Topics</button>
          </div>
        </article>
        <article class="card history-card" id="history-card" hidden>
          <h3 class="history-title">Score History</h3>
          <p class="history-hint">Last 10 attempts for this topic, newest first</p>
          <ul class="history-list" id="history-list"></ul>
        </article>
        <div class="review" id="review" hidden></div>
      </section>

      <!-- Load error -->
      <section class="card error-card" id="error-view" hidden>
        <h2 class="result-title">Failed to Load Questions</h2>
        <p class="result-msg" id="error-msg"></p>
        <div class="actions center">
          <button class="btn btn-primary" id="retry-btn">Retry</button>
        </div>
      </section>
    </main>
  </div>

  <script src="script.js?v=2"></script>
</body>
</html>
```

## Component classes

### Layout
- `.container` — max-width `680px`, centered, `padding: var(--space-7) var(--space-5) var(--space-6)`.
- `.app-header` — flex row, `gap: var(--space-4)`, `margin-bottom: var(--space-6)`; wraps on small screens.
- `.logo` — 44×44, `border-radius: var(--radius)`, `box-shadow: var(--shadow-sm)`.
- `.app-header h1` — `var(--text-h1)`, weight 600, `letter-spacing: -0.02em`.
- `.subtitle` — `var(--text-small)`, `color: var(--muted-foreground)`.

### Topic hub
- `.topic-grid` — `display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-4)`.
- `.topic-card` — column flex, padding `var(--space-5)`, border `var(--border)`, `radius: var(--radius)`, `shadow-sm`; hover: `border-color: var(--ring)`, `shadow-md`; active: `transform: scale(0.99)`; focus-visible: double ring.
- `.topic-name` — `var(--text-h3)`, weight 600; arrow `.topic-arrow` slides `translateX(3px)` on card hover.
- `.topic-desc` — `var(--text-small)`, muted foreground.
- `.topic-count` / `.topic-resume` — 12px; resume is a `var(--radius-full)` pill on `var(--muted)`.
- `.topic-chart` / `.topic-bar` / `.topic-block` — block bar chart: 5×3px blocks, `var(--success)`; `.topic-bar.bad` uses `var(--destructive)`.

### Progress
- `.quiz-nav` — flex row with back/reset ghost buttons; the standalone ghost's negative margin lives here: `margin: 0 0 var(--space-4) calc(-1 * var(--space-3))`.
- `.progress-track` — 6px track on `var(--muted)`, `radius-full`, hidden overflow.
- `.progress-fill` — width animated via `--motion-default`, background `var(--primary)`.
- `.progress-text` — `var(--text-small)`, muted foreground.

### Card
- `.card` — `background: var(--background)`, 1px `var(--border)` border, `radius: var(--radius)`, `shadow-sm`, padding `var(--space-5)`, `margin-top: var(--space-4)`.
- `.card-head` — space-between row, `margin-bottom: var(--space-4)`.
- `.badge` — pill on `var(--muted)`, 12px, weight 500, muted foreground.
- `.question-num` — `var(--text-small)`, muted foreground.
- `.question-text` — `var(--text-h3)`, weight 600, `letter-spacing: -0.01em`, `margin-bottom: var(--space-5)`.

### Options
- `.options` — column flex, `gap: var(--space-2)`.
- `.option` — full-width flex row, padding `var(--space-3) var(--space-4)`, border `var(--border)`, `radius-sm`; hover: `var(--muted)` background; disabled: `cursor: default`; `.selected`: `border-color: var(--primary)`, background `var(--muted)`.
- `.option-marker` — 18×18 circle (`radius-full`); `.options.multiple .option-marker` becomes a 4px square; selected / correct / incorrect fill with white check mark; `.option.dimmed` → `opacity: 0.55`.
- `.option.correct` — `border-color`/`background`: `--success`/`--success-bg`.
- `.option.incorrect` — `border-color`/`background`: `--destructive`/`--destructive-bg`.

### Feedback
- `.feedback` — bordered box, `radius-sm`, `animation: fade-up var(--motion-default)`; `.correct-fb` uses success colors, `.wrong-fb` destructive.
- `.explanation` — `var(--text-small)`; `.explanation-label` is an uppercase 12px muted caption with `letter-spacing: 0.04em`.

### Buttons
- `.btn` — inline-flex, padding `9px var(--space-4)`, `radius: var(--radius)`, `text-small`, weight 500; active: `scale(0.98)`; disabled: `opacity: 0.5`, `cursor: not-allowed`.
- `.btn-primary` — `background: var(--primary)`, text `#fafafa`; hover `var(--primary-hover)`.
- `.btn-outline` — `background: var(--background)`, 1px `var(--border)`; hover `var(--muted)`.
- `.btn-ghost` — transparent, muted foreground, padding `6px var(--space-3)`, negative left margin `calc(-1 * var(--space-3))` (only when standalone); `.actions .btn-ghost` resets `margin: 0`.
- `.actions` — flex row, `gap: var(--space-3)`, `margin-top: var(--space-5)`; `.actions.center` justifies center.

### Result
- `.result-card` — centered, padding `var(--space-6)`.
- `.result-topic` — `var(--text-small)`, muted.
- `.result-title` — `var(--text-h2)`, weight 600, `-0.02em`.
- `.score` — `var(--font-mono)`, 48px/56px, weight 600; `<small>` uses `var(--text-h3)` muted.
- `.history-list` — column flex of `.history-item`; `.current` on `var(--muted)`; `.history-pct.ok`/`.no` green/red mono.

### Review
- `.review-item` — bordered card, `radius: var(--radius)`, `shadow-sm`, padding `var(--space-4)`.
- `.review-status` — 20×20 circle, white glyph, `--success` for ok / `--destructive` for no.
- `.review-option.is-correct` / `.is-wrong` — colored `--success` / `--destructive`, weight 500.

### Error
- `.error-card` — centered card reusing `.result-title` / `.result-msg`.

## Key style rules

- **Never hardcode colors or sizes**; use the tokens above.
- Inline code spans rendered outside `.markdown-body` (options, feedback title, review options) get: `var(--font-mono)`, `0.875em`, padding `0.08em 0.32em`, 4px radius, `--muted` background, `--border` border.
- Markdown code blocks `.markdown-body pre` scroll horizontally (`overflow-x: auto`).
- Focus ring pattern everywhere: `box-shadow: 0 0 0 2px var(--background), 0 0 0 4px var(--ring)`.
- Responsive: below 560px, `.container` padding becomes `var(--space-5) var(--space-4)`, h1 drops to `--text-h2`, `.card` padding `var(--space-4)`, `.score` 40px/48px; `.app-header` and `.actions` wrap; `.option` uses `overflow-wrap: anywhere`.
