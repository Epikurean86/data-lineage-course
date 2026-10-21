// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fill = s => String(s ?? "").replaceAll("{{TRAVEL}}", TRAVEL_DB).replaceAll("{{Q1}}", Q1_SQL).replaceAll("{{W7_GRAPH}}", typeof W7_GRAPH !== "undefined" ? W7_GRAPH : "");
const DAY = 864e5;
function order(n, seed) {            // stable shuffle so the right option is not always in the same place
  let h = 2166136261; for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const STEPS = [
  ["pretest", "Pre-test", "Guess before you read. Wrong guesses make the reading stick better.", true],
  ["read", "Read", "The assigned sections, with a purpose for each.", false],
  ["notes", "Study notes", "Read after the sources. Then close them and move on to recall.", false],
  ["recall", "Close-the-book recall", "Write each answer from memory first, then reveal and rate yourself.", true],
  ["practice", "Practice", "Work the problem on paper or in code before opening the solution.", true],
  ["quiz", "Quiz", "Answer from memory. Includes review questions from earlier weeks.", true],
  ["cards", "Flashcards", "Add this week’s cards to your deck and review them a little each day.", true]
];
const STEP_COLORS = ["var(--mark)", "var(--accent)", "color-mix(in srgb, var(--accent) 55%, var(--surface))", "color-mix(in srgb, var(--mark) 60%, var(--surface))", "var(--ink)", "color-mix(in srgb, var(--ink) 45%, var(--surface))", "var(--line)"];
const ALL_CARDS = W.flatMap(w => w.cards.map(c => ({ ...c, wk: w.id, num: w.num })));

// ---------- state ----------
const LS_KEY = "dl-course-v1";
let S = blank();
function blank() { return { v: 1, updatedAt: 0, steps: {}, reads: {}, reveal: {}, rate: {}, quiz: {}, cards: {}, decks: {} }; }
let T = { updatedAt: 0, text: {} };        // free-text answers kept in a separate document
let store = { db: null, uid: null, mode: "local" };
function lsGet() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; } }
function lsSet() { try { localStorage.setItem(LS_KEY, JSON.stringify({ S, T })); } catch {} }
(function loadLocal() { const d = lsGet(); if (d && d.S) { S = { ...blank(), ...d.S }; T = d.T || T; } })();

let saveTimer = null, dirtyS = false, dirtyT = false;
function touch(which = "S") {
  const now = Date.now();
  if (which === "T") { T.updatedAt = now; dirtyT = true; } else { S.updatedAt = now; dirtyS = true; }
  lsSet();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 1200);
}
async function flush() {
  if (!store.db || !store.uid) return;
  const base = "data/users/" + store.uid;
  try {
    if (dirtyS) { dirtyS = false; await store.db.doc(base + "/progress").set(JSON.parse(JSON.stringify(S))); }
    if (dirtyT) { dirtyT = false; await store.db.doc(base + "/answers").set(JSON.parse(JSON.stringify(T))); }
    setStatus("account");
  } catch (e) { setStatus("local", e && e.code); }
}
function setStatus(mode) {
  store.mode = mode;
  const el = $("#status");
  if (el) el.textContent = mode === "account" ? "Progress saves to your account." : "Progress saves in this browser only.";
}
async function connectDb() {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;
    store.db = db; store.uid = uid;
    const base = "data/users/" + uid;
    const [ps, as] = await Promise.all([db.doc(base + "/progress").get(), db.doc(base + "/answers").get()]);
    let changed = false;
    if (ps.exists && (ps.data().updatedAt || 0) > (S.updatedAt || 0)) { S = { ...blank(), ...ps.data() }; changed = true; }
    else if (S.updatedAt) dirtyS = true;
    if (as.exists && (as.data().updatedAt || 0) > (T.updatedAt || 0)) { T = { updatedAt: 0, text: {}, ...as.data() }; changed = true; }
    else if (T.updatedAt) dirtyT = true;
    lsSet();
    setStatus("account");
    if (dirtyS || dirtyT) flush();
    if (changed) render();
  } catch (e) { setStatus("local"); }
}

// ---------- progress ----------
function stepDone(w, k) { return !!S.steps[w.id + ":" + k]; }
function weekPct(w) { return STEPS.filter(([k]) => stepDone(w, k)).length / STEPS.length; }
function autoSteps(w) {
  const set = (k, v) => { const key = w.id + ":" + k; if (v && !S.steps[key]) { S.steps[key] = true; return true; } return false; };
  let ch = false;
  ch = set("read", w.reading.every((_, i) => S.reads[w.id + ":" + i])) || ch;
  ch = set("recall", w.recall.every(r => S.rate[r.id])) || ch;
  ch = set("practice", w.practice.every(p => S.reveal[p.id])) || ch;
  const qz = S.quiz[w.id];
  ch = set("quiz", !!(qz && qz.attempts > 0)) || ch;
  ch = set("cards", !!S.decks[w.id]) || ch;
  ch = set("pretest", w.pretest.every((_, i) => (T.text[w.id + ":pre" + i] || "").trim())) || ch;
  return ch;
}

// ---------- spaced repetition ----------
function dueCards(now = Date.now()) {
  const active = ALL_CARDS.filter(c => S.decks[c.wk]);
  const due = active.filter(c => S.cards[c.id] && S.cards[c.id].due <= now).sort((a, b) => S.cards[a.id].due - S.cards[b.id].due);
  const fresh = active.filter(c => !S.cards[c.id]);
  return { due, fresh, active };
}
function schedule(id, grade) {
  const now = Date.now();
  const c = { ease: 2.5, ivl: 0, reps: 0, lapses: 0, ...(S.cards[id] || {}) };
  if (grade === "again") { c.reps = 0; c.lapses++; c.ease = Math.max(1.3, c.ease - 0.2); c.ivl = 0; c.due = now + 10 * 60e3; }
  else {
    if (grade === "hard") { c.ivl = c.reps === 0 ? 1 : Math.max(1, Math.round(c.ivl * 1.2)); c.ease = Math.max(1.3, c.ease - 0.15); }
    if (grade === "good") { c.ivl = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.ivl * c.ease); }
    if (grade === "easy") { c.ivl = c.reps === 0 ? 3 : Math.round(Math.max(c.ivl, 1) * c.ease * 1.3); c.ease += 0.15; }
    c.reps++; c.due = now + c.ivl * DAY - 3600e3;
  }
  S.cards[id] = c;
  touch();
}
function preview(id, grade) {
  const c = { ease: 2.5, ivl: 0, reps: 0, ...(S.cards[id] || {}) };
  if (grade === "again") return "10 min";
  let ivl = grade === "hard" ? (c.reps === 0 ? 1 : Math.max(1, Math.round(c.ivl * 1.2)))
    : grade === "good" ? (c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.ivl * c.ease))
    : (c.reps === 0 ? 3 : Math.round(Math.max(c.ivl, 1) * c.ease * 1.3));
  return ivl + (ivl === 1 ? " day" : " days");
}

// ---------- routing ----------
let view = "today";
function route() {
  const h = (location.hash || "").slice(1);
  view = (h === "review" || h === "method" || h === "today" || W.some(w => w.id === h)) ? h : "today";
}
function go(v) { view = v; try { history.replaceState(null, "", "#" + v); } catch {} render(); window.scrollTo({ top: 0 }); }

// ---------- chrome ----------
function dagSvg() {
  const n = W.length, w = 400, h = 34, pad = 14, step = (w - pad * 2) / (n - 1);
  let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Course progress across ${n} weeks">`;
  s += `<line x1="${pad}" y1="17" x2="${w - pad}" y2="17" stroke="var(--line)" stroke-width="2"/>`;
  W.forEach((wk, i) => {
    const x = pad + i * step, p = weekPct(wk), cur = view === wk.id;
    const r = 9, circ = 2 * Math.PI * r;
    s += `<g style="cursor:pointer" data-go="${wk.id}"><title>Week ${wk.num}: ${esc(wk.title)} (${Math.round(p * 100)}%)</title>`;
    s += `<circle cx="${x}" cy="17" r="${r}" fill="${p === 1 ? "var(--accent)" : "var(--surface)"}" stroke="${cur ? "var(--ink)" : "var(--line)"}" stroke-width="${cur ? 2 : 1.5}"/>`;
    if (p > 0 && p < 1) s += `<circle cx="${x}" cy="17" r="${r}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="${circ * p} ${circ}" transform="rotate(-90 ${x} 17)"/>`;
    s += `<text x="${x}" y="21" text-anchor="middle" font-family="var(--f-mono)" font-size="10" fill="${p === 1 ? "var(--accent-ink)" : "var(--muted)"}">${wk.num}</text></g>`;
  });
  return s + "</svg>";
}
function chrome() {
  const { due, fresh } = dueCards();
  const nDue = due.length + Math.min(fresh.length, 20);
  $("#dag").innerHTML = dagSvg();
  $("#tabs").innerHTML = [["today", "Today"], [currentWeek().id, "Weeks"], ["review", "Review"], ["method", "Method"]].map(([v, l], i) => {
    const cur = i === 1 ? W.some(w => w.id === view) : view === v;
    return `<button class="tab" data-go="${v}" ${cur ? 'aria-current="page"' : ""}>${l}${v === "review" && nDue ? `<span class="n tabular">${nDue}</span>` : ""}</button>`;
  }).join("");
  const wkBtns = W.map(w => `<button class="wk" data-go="${w.id}" ${view === w.id ? 'aria-current="page"' : ""}><span class="num">W${w.num}</span><span class="t">${esc(w.title)}</span><span class="bar"><i style="width:${Math.round(weekPct(w) * 100)}%"></i></span></button>`).join("");
  $("#rail").innerHTML = `<h4>Weeks</h4>${wkBtns}<div class="status" id="status"></div>`;
  setStatus(store.mode);
  $("#mweeks").innerHTML = W.some(w => w.id === view) ? W.map(w => `<button class="chip" data-go="${w.id}" ${view === w.id ? 'aria-current="page"' : ""}>W${w.num} · ${Math.round(weekPct(w) * 100)}%</button>`).join("") : "";
}
function currentWeek() { return W.find(w => weekPct(w) < 1) || W[W.length - 1]; }

// ---------- views ----------
function render() {
  W.forEach(w => { if (autoSteps(w)) touch(); });
  chrome();
  const m = $("#main");
  if (view === "today") m.innerHTML = vToday();
  else if (view === "review") m.innerHTML = vReview();
  else if (view === "method") m.innerHTML = vMethod();
  else m.innerHTML = vWeek(W.find(w => w.id === view));
}

function vToday() {
  const w = currentWeek();
  const next = STEPS.find(([k]) => !stepDone(w, k));
  const { due, fresh, active } = dueCards();
  const learned = active.filter(c => S.cards[c.id] && S.cards[c.id].reps > 0).length;
  const doneWeeks = W.filter(x => weekPct(x) === 1).length;
  const mins = w.plan.reduce((a, p) => a + p[1], 0);
  return `
  <div class="eyebrow">Today</div>
  <h1>${next ? `Week ${w.num}: ${esc(next[1].toLowerCase())} next` : `Week ${w.num} is complete`}</h1>
  <p class="lede">${esc(w.focus)}</p>
  <div class="row" style="margin-top:16px">
    <button class="btn primary" data-go="${w.id}">Open week ${w.num}</button>
    <button class="btn mark" data-go="review">Review ${due.length + Math.min(fresh.length, 20)} card${due.length + Math.min(fresh.length, 20) === 1 ? "" : "s"}</button>
  </div>
  <div class="stats">
    <div class="stat"><b>${doneWeeks}/${W.length}</b><span>weeks complete</span></div>
    <div class="stat"><b>${Math.round(weekPct(w) * 100)}%</b><span>of week ${w.num} done</span></div>
    <div class="stat"><b>${due.length}</b><span>cards due now</span></div>
    <div class="stat"><b>${learned}/${ALL_CARDS.length}</b><span>cards learned</span></div>
  </div>
  <div class="cards2">
    <div class="panel"><h3>This week’s plan (${Math.round(mins / 6) / 10} h)</h3>${w.plan.map(p => `<p class="tabular">${esc(p[0])}${p[1] ? ` · ${p[1]} min` : ""}</p>`).join("")}</div>
    <div class="panel"><h3>How to spread 5 hours</h3><p>Two longer sessions (reading, then recall and practice) of about 90 minutes.</p><p>One 45–60 minute session for the quiz.</p><p>Ten minutes of flashcards on four or five days. Short, spaced sessions beat one long one.</p></div>
    <div class="panel"><h3>Your sources</h3><p>Two PDFs in your Datalineage folder: Buneman, Khanna &amp; Tan (k51.pdf) and Cheney, Chiticariu &amp; Tan.</p><p>Extra material: the <a href="https://claude.ai/artifact/NpqJy5QGwzxV82UasnuKtP" target="_blank" rel="noopener">reading list</a>, linked from each week.</p></div>
  </div>`;
}

function stepShell(w, idx, body, extraHead = "") {
  const [k, label, why, isRecall] = STEPS[idx];
  const done = stepDone(w, k);
  return `<section class="step ${done ? "done" : ""}" id="step-${k}">
    <div class="step-h"><span class="step-n">${done ? "✓" : idx + 1}</span><h2>${label}</h2>${isRecall ? '<span class="recall-tag">Active recall</span>' : ""}${extraHead}
      <button class="donebtn" data-act="step" data-w="${w.id}" data-k="${k}">${done ? "Done" : "Mark done"}</button>
      <p class="why">${why}</p></div>
    <div class="step-b">${body}</div></section>`;
}

function vWeek(w) {
  const total = w.plan.reduce((a, p) => a + p[1], 0);
  const budget = `<div class="budget"><div class="budget-bar">${w.plan.map((p, i) => `<span style="width:${(p[1] / total) * 100}%;background:${STEP_COLORS[i % STEP_COLORS.length]}"></span>`).join("")}</div>
    <div class="budget-legend tabular">${w.plan.map((p, i) => `<span><i style="background:${STEP_COLORS[i % STEP_COLORS.length]}"></i>${esc(p[0])}${p[1] ? ` · ${p[1]} min` : " · extra"}</span>`).join("")}</div></div>`;

  const pre = `<div class="items">${w.pretest.map((q, i) => `<div class="item"><p class="q">${esc(q)}</p><textarea id="t-${w.id}-pre${i}" data-text="${w.id}:pre${i}" placeholder="Your best guess, in a sentence or two">${esc(T.text[w.id + ":pre" + i] || "")}</textarea></div>`).join("")}</div>`;

  const read = `<ul class="reads">${w.reading.map((r, i) => `<li><input type="checkbox" id="rd-${w.id}-${i}" data-act="read" data-key="${w.id}:${i}" ${S.reads[w.id + ":" + i] ? "checked" : ""}>
    <label for="rd-${w.id}-${i}"><div class="w">${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.what)}</a>` : esc(r.what)}</div><div class="where">${esc(r.where)}</div><div class="note">${esc(r.note)}</div></label>
    <span class="m">${r.mins ? r.mins + " min" : "extra"}</span></li>`).join("")}</ul>`;

  const notesOpen = !S.reveal[w.id + ":notesClosed"];
  const notes = `<div class="${notesOpen ? "" : "collapsed"}"><div class="notes">${fill(w.notes)}</div>
    <div class="closebook">${notesOpen ? `<button class="btn mark" data-act="closebook" data-w="${w.id}">Close the notes and start recall</button><span>Hides the notes so you answer from memory.</span>` : `<button class="btn" data-act="openbook" data-w="${w.id}">Show the notes again</button><span>Notes are hidden while you recall.</span>`}</div></div>`;

  const recall = `<div class="items">${w.recall.map(r => {
    const shown = S.reveal[r.id], rt = S.rate[r.id];
    return `<div class="item ${rt ? "rated-" + rt : ""}"><p class="q">${esc(r.q)}</p>
      <textarea id="t-${r.id}" data-text="${r.id}" placeholder="Write it from memory first">${esc(T.text[r.id] || "")}</textarea>
      ${shown ? `<div class="answer">${esc(r.a)}</div>
        <div class="row"><span class="rate">How did you do?</span>${[["got", "Got it"], ["partial", "Partly"], ["miss", "Missed it"]].map(([v, l]) => `<button class="btn ${rt === v ? "sel" : ""}" data-act="rate" data-id="${r.id}" data-v="${v}">${l}</button>`).join("")}</div>`
        : `<div class="row"><button class="btn primary" data-act="reveal" data-id="${r.id}">Reveal model answer</button></div>`}</div>`;
  }).join("")}</div>`;

  const practice = `<div class="items">${w.practice.map(p => `<div class="item task"><p class="q">${esc(p.title)}</p><div class="body">${fill(p.task)}</div>
    <textarea id="t-${p.id}" data-text="${p.id}" placeholder="Your working, answer or notes">${esc(T.text[p.id] || "")}</textarea>
    ${S.reveal[p.id] ? `<div class="answer">${fill(p.solution)}</div>` : `<div class="row"><button class="btn" data-act="reveal" data-id="${p.id}">Show solution</button></div>`}</div>`).join("")}</div>`;

  const quiz = vQuiz(w);

  const nCards = w.cards.length;
  const known = w.cards.filter(c => S.cards[c.id] && S.cards[c.id].reps > 0).length;
  const cards = S.decks[w.id]
    ? `<p>All ${nCards} cards from this week are in your deck. ${known} reviewed at least once.</p><div class="row"><button class="btn mark" data-go="review">Go to review</button><button class="btn" data-act="cram" data-w="${w.id}">Practise this week’s cards now</button></div>`
    : `<p>${nCards} cards cover this week’s key definitions and results. Add them to your deck after you have finished the notes.</p><div class="row"><button class="btn primary" data-act="deck" data-w="${w.id}">Add ${nCards} cards to my deck</button></div>`;

  return `<div class="eyebrow">Week ${w.num} of ${W.length}</div><h1>${esc(w.title)}</h1><p class="lede">${esc(w.focus)}</p>
    <p class="goal">${esc(w.goal)}</p>${budget}
    ${stepShell(w, 0, pre)}${stepShell(w, 1, read)}${stepShell(w, 2, notes)}${stepShell(w, 3, recall)}${stepShell(w, 4, practice)}${stepShell(w, 5, quiz)}${stepShell(w, 6, cards)}
    <div class="row" style="margin-top:24px">${w.num > 1 ? `<button class="btn" data-go="w${w.num - 1}">← Week ${w.num - 1}</button>` : ""}${w.num < W.length ? `<button class="btn" data-go="w${w.num + 1}">Week ${w.num + 1} →</button>` : ""}</div>`;
}

function vQuiz(w) {
  const qz = S.quiz[w.id] || { answers: {}, attempts: 0, best: null };
  const a = qz.answers || {};
  const answered = w.quiz.filter(q => a[q.id] !== undefined).length;
  const correct = w.quiz.filter(q => q.type === "mc" ? a[q.id] === q.answer : a[q.id] === "got").length;
  const finished = answered === w.quiz.length;
  const head = `<div class="score"><b>${correct}/${w.quiz.length}</b><span>${finished ? "Finished." : `${answered} of ${w.quiz.length} answered.`}${qz.best != null ? ` Best: ${qz.best}/${w.quiz.length}.` : ""} Attempts: ${qz.attempts}.</span>${finished || answered ? `<button class="btn" data-act="retake" data-w="${w.id}">Retake</button>` : ""}</div>`;
  return head + `<div class="items">${w.quiz.map((q, i) => {
    const ans = a[q.id];
    if (q.type === "mc") {
      const locked = ans !== undefined;
      return `<div class="item"><p class="q">${i + 1}. ${esc(q.q)}</p><div class="opts">${order(q.options.length, q.id + ":" + qz.attempts).map(j => { const o = q.options[j];
        const cls = locked ? (j === q.answer ? "right" : j === ans ? "wrong" : "") : "";
        return `<button class="opt ${cls}" ${locked ? "disabled" : ""} data-act="mc" data-w="${w.id}" data-q="${q.id}" data-j="${j}">${esc(o)}</button>`;
      }).join("")}</div>${locked ? `<p class="why">${ans === q.answer ? "Correct. " : "Not quite. "}${esc(q.why)}</p>` : ""}</div>`;
    }
    const shown = S.reveal["qz:" + q.id];
    return `<div class="item"><p class="q">${i + 1}. ${esc(q.q)}</p><textarea id="t-${q.id}" data-text="${q.id}" placeholder="Answer from memory">${esc(T.text[q.id] || "")}</textarea>
      ${shown ? `<div class="answer">${esc(q.a)}</div><div class="row"><span class="rate">Mark yourself:</span>${[["got", "Correct"], ["miss", "Not correct"]].map(([v, l]) => `<button class="btn ${ans === v ? "sel" : ""}" data-act="sa" data-w="${w.id}" data-q="${q.id}" data-v="${v}">${l}</button>`).join("")}</div>`
        : `<div class="row"><button class="btn" data-act="reveal" data-id="qz:${q.id}">Check against model answer</button></div>`}</div>`;
  }).join("")}</div>`;
}

let session = null; // {queue:[ids], shown:false, cram:bool, done:n}
function startSession(cramWeek) {
  if (cramWeek) session = { queue: W.find(w => w.id === cramWeek).cards.map(c => c.id), shown: false, cram: true, done: 0 };
  else { const { due, fresh } = dueCards(); session = { queue: [...due.map(c => c.id), ...fresh.slice(0, 20).map(c => c.id)], shown: false, cram: false, done: 0 }; }
}
function vReview() {
  const { due, fresh, active } = dueCards();
  const learned = active.filter(c => S.cards[c.id] && S.cards[c.id].reps > 0).length;
  if (!session || (!session.cram && session.queue.length === 0 && session.done === 0)) startSession();
  const decks = W.map(w => `<button class="chip" data-act="${S.decks[w.id] ? "cram" : "deck"}" data-w="${w.id}">${S.decks[w.id] ? `Practise W${w.num}` : `Add W${w.num} cards`}</button>`).join("");
  let card = "";
  if (!active.length && !session.cram) card = `<div class="empty">Your deck is empty. Add a week’s cards from its Flashcards step, or below.</div>`;
  else if (!session.queue.length) card = `<div class="empty">${session.done ? `Done: ${session.done} card${session.done === 1 ? "" : "s"} reviewed. ` : ""}Nothing else is due right now. Come back tomorrow; short daily reviews work best.</div>`;
  else {
    const c = ALL_CARDS.find(x => x.id === session.queue[0]);
    const st = S.cards[c.id];
    card = `<div class="flash"><div class="meta"><span>Week ${c.num}${session.cram ? " · practice (not scheduled)" : st ? "" : " · new"}</span><span class="tabular">${session.queue.length} left</span></div>
      <div class="front">${esc(c.f)}</div>
      ${session.shown ? `<div class="back">${esc(c.b)}</div>
        ${session.cram ? `<div class="row"><button class="btn" data-act="cramnext" data-v="again">Show again later</button><button class="btn primary" data-act="cramnext" data-v="ok">Next</button></div>`
          : `<div class="grades">${[["again", "Again"], ["hard", "Hard"], ["good", "Good"], ["easy", "Easy"]].map(([g, l]) => `<button class="grade ${g}" data-act="grade" data-v="${g}">${l}<small>${preview(c.id, g)}</small></button>`).join("")}</div>`}`
        : `<p class="rate">Say or write the answer before you flip.</p><div class="row"><button class="btn primary" data-act="flip">Show answer</button></div>`}</div>`;
  }
  return `<div class="review"><div class="eyebrow">Spaced repetition</div><h1>Review</h1>
    <p class="lede">Cards come back just before you would forget them. Rate honestly: “Again” brings a card back in ten minutes, “Easy” pushes it out furthest.</p>
    <div class="stats"><div class="stat"><b>${due.length}</b><span>due now</span></div><div class="stat"><b>${fresh.length}</b><span>new in deck</span></div><div class="stat"><b>${learned}</b><span>learned</span></div><div class="stat"><b>${ALL_CARDS.length}</b><span>in the course</span></div></div>
    ${card}
    <h3 style="margin:22px 0 4px;font-size:15px">Decks by week</h3><div class="decks">${decks}</div>
    ${session.cram ? `<div class="row"><button class="btn" data-act="endcram">Back to scheduled review</button></div>` : ""}</div>`;
}

function vMethod() {
  return `<div class="eyebrow">How this course works</div><h1>Built for active recall</h1>
  <div class="method">
  <p>Re-reading feels productive but fades fast. Pulling information out of memory, especially with effort and spaced out over days, is what makes it last. Every week uses the same seven steps, each with a job.</p>
  <h3>1. Pre-test</h3><p>Three questions before you read. You will often be wrong. Trying first primes you to notice the answers while reading.</p>
  <h3>2–3. Read, then study notes</h3><p>Read the assigned sections of the source papers or docs, then the course notes, which connect the theory to data engineering. Do not highlight much. Instead, at the end of each section, look away and summarise it in one sentence.</p>
  <h3>4. Close-the-book recall</h3><p>Hide the notes with the button, then write each answer from memory before revealing the model answer. Rate yourself honestly. “Partly” and “Missed” are useful signals, not failures.</p>
  <h3>5. Practice</h3><p>Hand-computed provenance, SQL and labs. Do the work before opening the solution. Struggling a bit is part of how it works.</p>
  <h3>6. Quiz</h3><p>Multiple-choice and short-answer questions answered from memory. Each quiz mixes in questions from earlier weeks (interleaving). Retake a quiz a few days later rather than straight away.</p>
  <h3>7. Flashcards with spaced repetition</h3><p>Add a week’s cards to your deck. The Review tab schedules each card based on your ratings: new and hard cards come back soon, easy ones after days or weeks. Ten minutes on most days keeps every earlier week alive while you learn the next.</p>
  <h3>Time</h3><p>Each week is planned for about five hours: roughly 90–120 minutes of reading, an hour of notes and recall, an hour of practice, and the rest on the quiz and short daily reviews.</p>
  <h3>Saving</h3><p>Your answers, ratings, quiz scores and card schedule save automatically. When you are signed in they save to your account, so they follow you between devices; otherwise they stay in this browser.</p>
  <h3>Sources</h3><p>The two PDFs in your project’s Datalineage folder: Buneman, Khanna &amp; Tan, “Data Provenance: Some Basic Issues” (k51.pdf), and Cheney, Chiticariu &amp; Tan, “Provenance in Databases: Why, How, and Where”. Additional sources are linked inside each week and collected in the <a href="https://claude.ai/artifact/NpqJy5QGwzxV82UasnuKtP" target="_blank" rel="noopener">reading list</a>.</p>
  </div>`;
}

// ---------- events ----------
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (g) { go(g.dataset.go); return; }
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const d = b.dataset, act = d.act;
  if (act === "read") return; // handled by change
  if (act === "step") { const k = d.w + ":" + d.k; S.steps[k] = !S.steps[k]; touch(); }
  else if (act === "reveal") { S.reveal[d.id] = true; touch(); }
  else if (act === "rate") { S.rate[d.id] = d.v; touch(); }
  else if (act === "closebook") { S.reveal[d.w + ":notesClosed"] = true; S.steps[d.w + ":notes"] = true; touch(); render(); $("#step-recall")?.scrollIntoView({ block: "start" }); return; }
  else if (act === "openbook") { S.reveal[d.w + ":notesClosed"] = false; touch(); }
  else if (act === "mc" || act === "sa") {
    const qz = S.quiz[d.w] = S.quiz[d.w] || { answers: {}, attempts: 0, best: null };
    qz.answers[d.q] = act === "mc" ? Number(d.j) : d.v;
    const w = W.find(x => x.id === d.w);
    if (w.quiz.every(q => qz.answers[q.id] !== undefined) && !qz.counted) {
      const sc = w.quiz.filter(q => q.type === "mc" ? qz.answers[q.id] === q.answer : qz.answers[q.id] === "got").length;
      qz.attempts++; qz.counted = true; qz.best = Math.max(qz.best ?? 0, sc);
    }
    touch();
  }
  else if (act === "retake") { const qz = S.quiz[d.w]; qz.answers = {}; qz.counted = false; W.find(x => x.id === d.w).quiz.forEach(q => { delete S.reveal["qz:" + q.id]; }); touch(); }
  else if (act === "deck") { S.decks[d.w] = true; touch(); if (view === "review") session = null; }
  else if (act === "cram") { startSession(d.w); if (view !== "review") { go("review"); return; } }
  else if (act === "endcram") { session = null; }
  else if (act === "flip") { session.shown = true; }
  else if (act === "grade") { const id = session.queue.shift(); schedule(id, d.v); if (d.v === "again") session.queue.push(id); session.done++; session.shown = false; }
  else if (act === "cramnext") { const id = session.queue.shift(); if (d.v === "again") session.queue.push(id); session.done++; session.shown = false; }
  render();
});
document.addEventListener("change", e => {
  const t = e.target;
  if (t.dataset && t.dataset.act === "read") { S.reads[t.dataset.key] = t.checked; touch(); render(); }
});
document.addEventListener("input", e => {
  const t = e.target;
  if (t.dataset && t.dataset.text) { T.text[t.dataset.text] = t.value; touch("T"); }
});
document.addEventListener("focusout", e => {
  const t = e.target;
  if (t.dataset && t.dataset.text && t.dataset.text.includes(":pre")) {
    const w = W.find(x => t.dataset.text.startsWith(x.id + ":"));
    if (w && autoSteps(w)) { touch(); chrome(); const sec = $("#step-pretest"); if (sec) { sec.classList.add("done"); sec.querySelector(".step-n").textContent = "✓"; sec.querySelector(".donebtn").textContent = "Done"; } }
  }
});
document.addEventListener("keydown", e => {
  if (view !== "review" || !session || !session.queue.length || /TEXTAREA|INPUT/.test(document.activeElement?.tagName)) return;
  if (!session.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); session.shown = true; render(); }
  else if (session.shown && !session.cram && ["1", "2", "3", "4"].includes(e.key)) { const g = ["again", "hard", "good", "easy"][Number(e.key) - 1]; const id = session.queue.shift(); schedule(id, g); if (g === "again") session.queue.push(id); session.done++; session.shown = false; render(); }
});
window.addEventListener("hashchange", () => { route(); render(); });
window.addEventListener("pagehide", flush);

route();
render();
connectDb();
