'use strict';

/* ============================================================
   <App Name> — quiz logic (generic template)
   Topic hub loads topics.json; each topic's questions come from
   <Topic>/questions.json via fetch. Replace <app> in the storage
   keys below with a unique prefix for this app.
   ============================================================ */

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/* ============================================================
   Progress persistence (localStorage)

   Key '<app>-progress-v1' — in-progress quiz per topic:
   Per topic: { index, bankLen, answered: [{ sel, ok }, ...] }
   - index:     next question to answer (0-based)
   - bankLen:   question count when saved (discard if bank changed)
   - answered:  selected option indices + correctness per question

   Key '<app>-attempts-v1' — completed quiz runs per topic:
   Per topic: array of the last MAX_ATTEMPTS runs, oldest first:
   { correct, total, pct, at } — pct = rounded correct/total %,
   at = completion time (ISO string).
   ============================================================ */

const STORAGE_KEY = '<app>-progress-v1';

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {}; // localStorage unavailable or corrupt — start fresh
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
  } catch {
    // storage full or blocked — persistence is best-effort
  }
}

function persistProgress() {
  if (!state.topic) return;
  state.progress[state.topic.id] = {
    index: state.results.length,
    bankLen: state.questions.length,
    answered: state.results.map((r) => ({
      sel: [...r.selected].sort((a, b) => a - b),
      ok: r.isCorrect,
    })),
  };
  saveProgress();
}

function restoreProgress(topic) {
  const saved = state.progress[topic.id];
  if (!saved || saved.bankLen !== state.questions.length) {
    // Nothing saved, or the question bank changed size — start fresh.
    delete state.progress[topic.id];
    saveProgress();
    return;
  }
  const total = state.questions.length;
  const answered = Array.isArray(saved.answered) ? saved.answered : [];
  state.results = [];
  for (let i = 0; i < answered.length && i < total; i++) {
    const entry = answered[i];
    if (!entry) continue;
    state.results.push({
      question: state.questions[i],
      selected: Array.isArray(entry.sel) ? entry.sel : [],
      isCorrect: !!entry.ok,
    });
  }
  state.index = state.results.length;
}

/* ---------- Attempt history (completed quiz runs) ---------- */

const ATTEMPTS_KEY = '<app>-attempts-v1';
const MAX_ATTEMPTS = 10;

function loadAttempts() {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {}; // localStorage unavailable or corrupt — start fresh
  }
}

function saveAttempts() {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(state.attempts));
  } catch {
    // storage full or blocked — persistence is best-effort
  }
}

/* Record a completed run (all questions answered). Keeps only the most
   recent MAX_ATTEMPTS runs per topic, oldest first. */
function recordAttempt() {
  if (!state.topic || state.results.length === 0) return;
  if (state.results.length !== state.questions.length) return; // incomplete run
  const total = state.questions.length;
  const correct = state.results.filter((r) => r.isCorrect).length;
  const entry = {
    correct,
    total,
    pct: Math.round((correct / total) * 100),
    at: new Date().toISOString(),
  };
  const list = state.attempts[state.topic.id] || [];
  list.push(entry);
  if (list.length > MAX_ATTEMPTS) list.splice(0, list.length - MAX_ATTEMPTS);
  state.attempts[state.topic.id] = list;
  state.lastAttemptAt = entry.at; // lets the results screen mark this run
  saveAttempts();
}

const state = {
  topics: [],
  cache: new Map(),   // topic id -> questions array
  topic: null,        // current topic object
  questions: [],
  index: 0,
  selected: [],       // indices of currently selected options
  results: [],        // per-question results
  progress: loadProgress(), // topic id -> saved quiz progress
  attempts: loadAttempts(), // topic id -> last MAX_ATTEMPTS completed runs
  lastAttemptAt: null,      // ISO time of the run recorded this session
  submitted: false,         // current question was answered (review mode when index < results.length)
  attemptRecorded: false,   // this run's score was already persisted
};

const els = {
  hubView: document.getElementById('hub-view'),
  quizView: document.getElementById('quiz-view'),
  resultView: document.getElementById('result-view'),
  errorView: document.getElementById('error-view'),
  topicGrid: document.getElementById('topic-grid'),
  backBtn: document.getElementById('back-btn'),
  resetBtn: document.getElementById('reset-btn'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  typeBadge: document.getElementById('type-badge'),
  questionNum: document.getElementById('question-num'),
  questionText: document.getElementById('question-text'),
  options: document.getElementById('options'),
  feedback: document.getElementById('feedback'),
  feedbackTitle: document.getElementById('feedback-title'),
  explanation: document.getElementById('explanation'),
  explanationText: document.getElementById('explanation-text'),
  submitBtn: document.getElementById('submit-btn'),
  prevBtn: document.getElementById('prev-btn'),
  score: document.getElementById('score'),
  resultMsg: document.getElementById('result-msg'),
  resultTopic: document.getElementById('result-topic'),
  historyCard: document.getElementById('history-card'),
  historyList: document.getElementById('history-list'),
  restartBtn: document.getElementById('restart-btn'),
  review: document.getElementById('review'),
  homeBtn: document.getElementById('home-btn'),
  errorMsg: document.getElementById('error-msg'),
  retryBtn: document.getElementById('retry-btn'),
};

const currentQuestion = () => state.questions[state.index];

/* ---------- Markdown rendering (marked + Prism, vendored locally) ---------- */

function setMarkdown(container, md) {
  const body = document.createElement('div');
  body.className = 'markdown-body'; // scopes github-markdown.css styles
  body.innerHTML = window.marked.parse(md);
  container.innerHTML = '';
  container.appendChild(body);

  /* Prism is loaded with `data-manual`, so it does not scan the document on
     its own. We highlight synchronously (async:false): Prism's async mode
     would offload the work to a Web Worker spawned from the Prism *core*
     bundle, which does not contain the separately-loaded grammar for the
     target language, so fenced code blocks would silently come back with
     zero token spans. */
  if (window.Prism) {
    window.Prism.highlightAllUnder(body, false);
  }
}

/* Render inline Markdown (code spans, emphasis) into an HTML string.
   Used for options, feedback and review lines, which are not wrapped in a
   .markdown-body container. Falls back to escaped text if marked is missing. */
function inlineMarkdown(text) {
  if (window.marked) {
    try {
      return window.marked.parseInline(text);
    } catch {
      // fall through to escaped text below
    }
  }
  return escapeHtml(text);
}

/* Append a plain-text prefix (e.g. "A. ") followed by inline-rendered
   Markdown to a container. The prefix and body share one wrapper <span> so
   the result stays a single inline item even inside a flex container. */
function appendOptionText(container, prefix, text) {
  const wrapper = document.createElement('span');
  wrapper.appendChild(document.createTextNode(prefix));
  const md = document.createElement('span');
  md.innerHTML = inlineMarkdown(text);
  wrapper.appendChild(md);
  container.appendChild(wrapper);
}

/* ---------- View switching ---------- */

function showView(view) {
  els.hubView.hidden = view !== 'hub';
  els.quizView.hidden = view !== 'quiz';
  els.resultView.hidden = view !== 'result';
  els.errorView.hidden = view !== 'error';
}

/* ---------- Loading ---------- */

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} — could not fetch ${url}`);
  }
  return res.json();
}

async function loadTopics() {
  const data = await fetchJson('topics.json');
  const list = Array.isArray(data) ? data : data.topics;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('topics.json does not contain any topics');
  }
  return list;
}

async function loadQuestions(topic) {
  if (state.cache.has(topic.id)) return state.cache.get(topic.id);
  const data = await fetchJson(`${topic.id}/questions.json`);
  const list = Array.isArray(data) ? data : data.questions;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`${topic.id}/questions.json does not contain any questions`);
  }
  state.cache.set(topic.id, list);
  return list;
}

async function init() {
  try {
    state.topics = await loadTopics();
    renderHub();
  } catch (err) {
    showError(err);
  }
}

function showError(err) {
  showView('error');
  els.errorMsg.textContent =
    `${err.message} Make sure you open the page through an HTTP server ` +
    '(e.g., any static file server serving the project root) ' +
    'instead of opening the file directly.';
}

/* ---------- Topic hub ---------- */

async function renderHub() {
  showView('hub');
  state.topic = null;
  state.questions = [];
  state.results = [];
  els.topicGrid.innerHTML = '';

  for (const topic of state.topics) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'topic-card';
    card.dataset.id = topic.id;

    const nameRow = document.createElement('span');
    nameRow.className = 'topic-name';
    nameRow.innerHTML =
      `<span>${escapeHtml(topic.name)}</span>` +
      `<span class="topic-arrow" aria-hidden="true">→</span>`;
    card.appendChild(nameRow);

    if (topic.description) {
      const desc = document.createElement('span');
      desc.className = 'topic-desc';
      desc.textContent = topic.description;
      card.appendChild(desc);
    }

    const count = document.createElement('span');
    count.className = 'topic-count';
    count.textContent = 'Loading…';
    card.appendChild(count);

    card.addEventListener('click', () => startQuiz(topic));
    els.topicGrid.appendChild(card);

    // Fill in the question count asynchronously
    loadQuestions(topic)
      .then((qs) => {
        count.textContent = `${qs.length} questions`;

        const saved = state.progress[topic.id];
        if (saved && saved.bankLen === qs.length && saved.index > 0) {
          const badge = document.createElement('span');
          badge.className = 'topic-resume';
          if (saved.index >= qs.length) {
            badge.textContent = 'Completed — view results';
          } else {
            badge.textContent = `Resume at question ${saved.index + 1}`;
          }
          card.appendChild(badge);
        }

        const attempts = state.attempts[topic.id];
        if (attempts && attempts.length) {
          renderTopicChart(card, attempts);
        }
      })
      .catch(() => {
        count.textContent = 'Unavailable';
      });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* ---------- Topic score chart (block bar chart) ---------- */

/* Renders the last attempts of a topic as a compact bar chart of small
   blocks inside the hub card: each attempt is one bar (oldest → newest,
   left → right), and each bar is a column of up to 10 blocks whose count
   reflects the score percentage. Green ≥ 70%, red < 70%. */
function renderTopicChart(card, attempts) {
  if (!attempts || attempts.length === 0) return; // nothing to chart
  const chart = document.createElement('div');
  chart.className = 'topic-chart';
  chart.setAttribute('role', 'img');
  chart.setAttribute(
    'aria-label',
    `Score history: ${attempts.map((a) => `${a.pct}%`).join(', ')}`
  );

  attempts.forEach((entry) => {
    const bar = document.createElement('div');
    bar.className = `topic-bar${entry.pct >= 70 ? '' : ' bad'}`;
    bar.title =
      `${entry.pct}% (${entry.correct}/${entry.total}) · ` +
      formatAttemptTime(entry.at);

    const blocks = Math.max(1, Math.round(entry.pct / 10)); // 1–10 blocks
    for (let i = 0; i < blocks; i++) {
      const block = document.createElement('span');
      block.className = 'topic-block';
      bar.appendChild(block);
    }
    chart.appendChild(bar);
  });

  card.appendChild(chart);
}

/* ---------- Quiz ---------- */

async function startQuiz(topic) {
  try {
    state.topic = topic;
    state.questions = await loadQuestions(topic);
    state.index = 0;
    state.results = [];
    state.attemptRecorded = false;
    restoreProgress(topic);
    if (state.results.length >= state.questions.length) {
      // All questions already answered — jump straight to the results screen.
      showResults();
      return;
    }
    showView('quiz');
    renderQuestion();
  } catch (err) {
    showError(err);
  }
}

function renderQuestion() {
  const q = currentQuestion();
  const total = state.questions.length;
  // Questions before the frontier (index < results.length) were already
  // answered — render them in review mode instead of starting fresh.
  const answered = state.index < state.results.length;

  state.selected = answered ? state.results[state.index].selected.slice() : [];
  state.submitted = answered;

  els.progressFill.style.width = `${((state.index + 1) / total) * 100}%`;
  els.progressText.textContent = `Question ${state.index + 1} of ${total}`;
  els.typeBadge.textContent = q.type === 'multiple' ? 'Multiple Choice' : 'Single Choice';
  els.questionNum.textContent = `Question ${state.index + 1}`;
  setMarkdown(els.questionText, q.question);

  renderOptions();
  els.feedback.hidden = !answered;
  if (answered) renderFeedback();

  els.submitBtn.hidden = false;
  els.submitBtn.disabled = !answered;
  els.submitBtn.textContent = answered
    ? state.index === state.questions.length - 1
      ? 'View Results'
      : 'Next Question'
    : 'Submit Answer';
  els.options.classList.toggle('multiple', q.type === 'multiple');
  updatePrevBtn();
}

function renderOptions() {
  const q = currentQuestion();
  els.options.innerHTML = '';

  q.options.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    btn.dataset.index = i;

    const marker = document.createElement('span');
    marker.className = 'option-marker';
    marker.textContent = q.type === 'multiple' ? '✓' : '';
    btn.appendChild(marker);

    const label = document.createElement('span');
    label.className = 'option-label';
    appendOptionText(label, `${LETTERS[i]}. `, text);
    btn.appendChild(label);

    if (state.submitted) {
      btn.disabled = true;
      applyResultClass(btn, i, q);
    } else if (state.selected.includes(i)) {
      btn.classList.add('selected');
      marker.textContent = q.type === 'multiple' ? '✓' : '●';
    }

    btn.addEventListener('click', () => onOptionClick(i));
    els.options.appendChild(btn);
  });
}

function applyResultClass(btn, i, q) {
  const marker = btn.querySelector('.option-marker');
  const isCorrectAnswer = q.answer.includes(i);
  const wasSelected = state.selected.includes(i);

  if (isCorrectAnswer) {
    btn.classList.add('correct');
    marker.textContent = '✓';
  } else if (wasSelected) {
    btn.classList.add('incorrect');
    marker.textContent = '✕';
  } else {
    btn.classList.add('dimmed');
  }
}

function onOptionClick(i) {
  if (state.submitted) return;

  const q = currentQuestion();
  if (q.type === 'single') {
    state.selected = [i];
  } else {
    const pos = state.selected.indexOf(i);
    if (pos === -1) state.selected.push(i);
    else state.selected.splice(pos, 1);
  }

  renderOptions();
  els.submitBtn.disabled = state.selected.length === 0;
}

/* ---------- Submitting an answer (shows feedback, manual next) ---------- */

function submitAnswer() {
  const q = currentQuestion();
  const isCorrect =
    q.answer.length === state.selected.length &&
    q.answer.every((a) => state.selected.includes(a));

  state.submitted = true;
  state.results.push({
    question: q,
    selected: [...state.selected].sort((a, b) => a - b),
    isCorrect,
  });
  persistProgress();

  renderOptions();
  renderFeedback();

  /* The same button now advances manually — no auto-jump */
  els.submitBtn.textContent =
    state.index === state.questions.length - 1 ? 'View Results' : 'Next Question';
  els.submitBtn.disabled = false;
}

function nextStep() {
  if (!state.submitted) return;
  if (state.index === state.questions.length - 1) {
    // Last question answered — persist this run's score exactly once, even
    // if the user walked back through previous questions and returns here.
    if (!state.attemptRecorded) {
      recordAttempt();
      state.attemptRecorded = true;
    }
    showResults();
  } else {
    state.index += 1;
    persistProgress();
    renderQuestion(); // renders review mode if this question was answered
  }
}

/* ---------- Reviewing previous questions ---------- */

function updatePrevBtn() {
  els.prevBtn.disabled = state.index <= 0;
}

function goPrevious() {
  if (state.index <= 0) return;
  state.index -= 1;
  renderQuestion(); // review mode: the previous question is already answered
}

function renderFeedback() {
  const q = currentQuestion();
  const last = state.results[state.index];
  const answerText = q.answer
    .map((i) => `${LETTERS[i]}: ${q.options[i]}`)
    .join(', ');

  els.feedback.hidden = false;
  els.feedback.className = `feedback ${last.isCorrect ? 'correct-fb' : 'wrong-fb'}`;
  if (last.isCorrect) {
    els.feedbackTitle.textContent = 'Correct!';
  } else {
    els.feedbackTitle.innerHTML =
      'Incorrect — the correct answer is ' + inlineMarkdown(answerText);
  }
  els.explanation.hidden = !q.explanation;
  if (q.explanation) {
    setMarkdown(els.explanationText, q.explanation);
  }
}

/* ---------- Results ---------- */

function showResults() {
  const total = state.questions.length;
  const correctCount = state.results.filter((r) => r.isCorrect).length;
  const pct = Math.round((correctCount / total) * 100);

  showView('result');

  els.resultTopic.textContent = `${state.topic.name}`;
  els.score.innerHTML = `${correctCount}<small> / ${total} questions</small>`;
  els.resultMsg.textContent = resultMessage(pct);

  renderHistory();
  renderReview();
}

function renderHistory() {
  const entries = (state.attempts[state.topic.id] || []).slice();
  els.historyList.innerHTML = '';
  if (entries.length === 0) {
    els.historyCard.hidden = true;
    return;
  }
  els.historyCard.hidden = false;

  entries.reverse().forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    const isCurrent = entry.at === state.lastAttemptAt;
    if (isCurrent) li.classList.add('current');

    const pct = document.createElement('span');
    pct.className = `history-pct ${entry.pct >= 70 ? 'ok' : 'no'}`;
    pct.textContent = `${entry.pct}%`;

    const meta = document.createElement('span');
    meta.className = 'history-meta';
    meta.textContent =
      `${entry.correct}/${entry.total} · ${formatAttemptTime(entry.at)}` +
      (isCurrent ? ' · this attempt' : '');

    li.appendChild(pct);
    li.appendChild(meta);
    els.historyList.appendChild(li);
  });
}

function formatAttemptTime(iso) {
  try {
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function resultMessage(pct) {
  if (pct >= 90) return `Score ${pct}% — excellent! You have mastered this topic.`;
  if (pct >= 70) return `Score ${pct}% — you reached the passing threshold (70%). Review the questions you missed.`;
  if (pct >= 50) return `Score ${pct}% — below the passing threshold. Keep practicing.`;
  return `Score ${pct}% — review the fundamentals and try again.`;
}

/* ---------- Answer review ---------- */

function renderReview() {
  els.review.innerHTML = '';

  state.results.forEach((r, idx) => {
    const item = document.createElement('article');
    item.className = 'review-item';

    const head = document.createElement('div');
    head.className = 'review-head';

    const status = document.createElement('span');
    status.className = `review-status ${r.isCorrect ? 'ok' : 'no'}`;
    status.textContent = r.isCorrect ? '✓' : '✕';
    head.appendChild(status);

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = r.question.type === 'multiple' ? 'Multiple' : 'Single';
    head.appendChild(badge);

    const num = document.createElement('span');
    num.className = 'question-num';
    num.textContent = `Question ${idx + 1}`;
    head.appendChild(num);

    item.appendChild(head);

    const qText = document.createElement('div');
    qText.className = 'review-question';
    setMarkdown(qText, r.question.question);
    item.appendChild(qText);

    const opts = document.createElement('div');
    opts.className = 'review-options';
    r.question.options.forEach((text, i) => {
      const row = document.createElement('div');
      row.className = 'review-option';
      const isCorrect = r.question.answer.includes(i);
      const wasSelected = r.selected.includes(i);
      appendOptionText(row, `${LETTERS[i]}. `, text);
      if (isCorrect) row.classList.add('is-correct');
      else if (wasSelected) row.classList.add('is-wrong');
      opts.appendChild(row);
    });
    item.appendChild(opts);

    if (r.question.explanation) {
      const ans = document.createElement('div');
      ans.className = 'review-answer';
      const label = document.createElement('span');
      label.className = 'review-answer-label';
      label.textContent = 'Explanation:';
      ans.appendChild(label);
      const md = document.createElement('div');
      md.className = 'review-answer-md';
      ans.appendChild(md);
      setMarkdown(md, r.question.explanation);
      item.appendChild(ans);
    }

    els.review.appendChild(item);
  });
}

/* ---------- Navigation ---------- */

function restart() {
  // Clear saved progress for this topic — a fresh attempt starts over.
  if (state.topic) {
    delete state.progress[state.topic.id];
    saveProgress();
  }
  state.index = 0;
  state.results = [];
  state.attemptRecorded = false;
  showView('quiz');
  renderQuestion();
}

function goHome() {
  renderHub();
}

/* ---------- Event binding ---------- */

els.submitBtn.addEventListener('click', () => {
  if (state.submitted) nextStep();
  else submitAnswer();
});
els.prevBtn.addEventListener('click', goPrevious);
els.backBtn.addEventListener('click', goHome);
/* Reset restarts the current round from question 1 and clears the saved
   in-progress answers for this topic; completed-run history is kept. */
els.resetBtn.addEventListener('click', () => {
  if (window.confirm('Reset this quiz? All answers for the current round will be cleared and you will start from question 1.')) {
    restart();
  }
});
els.restartBtn.addEventListener('click', restart);
els.homeBtn.addEventListener('click', goHome);
els.retryBtn.addEventListener('click', init);

/* Keyboard shortcuts: 1-9 selects an option, Enter submits / advances */
document.addEventListener('keydown', (e) => {
  if (els.quizView.hidden) return;
  /* If focus is on a button, let the button handle Enter itself */
  if (e.target.closest && e.target.closest('button')) return;

  const num = parseInt(e.key, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 9 && !state.submitted) {
    const i = num - 1;
    if (i < currentQuestion().options.length) onOptionClick(i);
  }

  if (e.key === 'Enter') {
    if (!state.submitted && !els.submitBtn.disabled) {
      submitAnswer();
    } else if (state.submitted) {
      nextStep();
    }
  }
});

/* ---------- Start ---------- */

init();
