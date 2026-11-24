/* Budget Clair : interface. Les calculs sont dans core.js. */
'use strict';
(() => {
const core = window.BudgetCore;
const {money, percent, ENVELOPES, ENVELOPE, CATEGORIES, CATEGORY, LEISURE} = core;
const KEY = 'budget-clair-v2', KEY_V1 = 'budget-clair-profiles-v1', KEY_V0 = 'budget-clair-v1';
const $ = id => document.getElementById(id);
const app = $('app'), dialog = $('dialog'), toastBox = $('toast'), tooltip = $('tooltip');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Éléments ---------- */
function fill(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}
function h(tag, props, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else if (key === 'style') for (const [name, item] of Object.entries(value)) node.style.setProperty(name, item);
    else if (key in node && !key.startsWith('aria') && key !== 'list' && key !== 'form') node[key] = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  return fill(node, children);
}
const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-6h4v6', list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3', shield: 'M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3zM9 12l2.2 2.2L15.2 10',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2', gear: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5', plus: 'M12 5v14M5 12h14',
  coffee: 'M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9zM17 10h1.5a2.75 2.75 0 0 1 0 5.5H17M8 2.5v3M12.5 2.5v3', bag: 'M6 8h12l1.2 12.5H4.8L6 8zM9 10.5V7a3 3 0 0 1 6 0v3.5',
  ticket: 'M3 8a1.5 1.5 0 0 1 1.5-1.5h15A1.5 1.5 0 0 1 21 8v2a2 2 0 0 0 0 4v2a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16v-2a2 2 0 0 0 0-4V8zM14 7v2M14 11.5v1M14 15v2',
  cart: 'M2.5 4H5l2.4 11.2h10.3L20.5 7.5H6M9 20h.01M17 20h.01', car: 'M4 17v-4.5L6 7h12l2 5.5V17M4 12.5h16M3 17h18M6.5 17v2M17.5 17v2', heart: 'M12 20.5S3.5 15.6 3.5 9.4A4.6 4.6 0 0 1 12 6.9a4.6 4.6 0 0 1 8.5 2.5c0 6.2-8.5 11.1-8.5 11.1z',
  bolt: 'M13 2.5 5 13.5h6L10.5 21.5 19 10h-6.5L13 2.5z', flag: 'M5 21.5V3.5M5 4.5h13l-2.8 4.5 2.8 4.5H5', spark: 'M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3z',
  left: 'M14.5 5.5 8 12l6.5 6.5', right: 'M9.5 5.5 16 12l-6.5 6.5', close: 'M6 6l12 12M18 6 6 18', pen: 'M4 20l1-4.5L16.5 4l3.5 3.5L8.5 19 4 20zM14 6.5l3.5 3.5', trash: 'M4 7h16M9.5 7V4h5v3M6.5 7l1 13.5h9l1-13.5M10.5 11v5.5M13.5 11v5.5',
  stop: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM9 9h6v6H9z', check: 'M12 3.2a8.8 8.8 0 1 1 0 17.6 8.8 8.8 0 0 1 0-17.6zM8.2 12.2l2.7 2.7 5-5.4', alert: 'M12 4 2.8 20h18.4L12 4zM12 10v4.5M12 17.3v.01', info: 'M12 3.2a8.8 8.8 0 1 1 0 17.6 8.8 8.8 0 0 1 0-17.6zM12 11v5.2M12 7.8v.01',
  no: 'M12 3.2a8.8 8.8 0 1 1 0 17.6 8.8 8.8 0 0 1 0-17.6zM8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4', sun: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4', moon: 'M20 14.2A8.3 8.3 0 0 1 9.8 4 8.3 8.3 0 1 0 20 14.2z', wallet: 'M4 7.5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6.5A2 2 0 0 1 5.5 4.5H17v3M16.5 13.5h.01', down: 'M12 4v12M7 11.5l5 5 5-5M4.5 20.5h15', up: 'M12 17V5M7 9.5l5-5 5 5M4.5 20.5h15'
};
const SVG = 'http://www.w3.org/2000/svg';
function icon(name) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'i');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
}
function star() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'star');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('aria-hidden', 'true');
  for (const turn of [0, 45]) {
    const rect = document.createElementNS(SVG, 'rect');
    for (const [key, value] of Object.entries({x: 7, y: 7, width: 26, height: 26, fill: 'currentColor', transform: `rotate(${turn} 20 20)`})) rect.setAttribute(key, value);
    svg.append(rect);
  }
  const circle = document.createElementNS(SVG, 'circle');
  for (const [key, value] of Object.entries({cx: 20, cy: 20, r: 7})) circle.setAttribute(key, value);
  svg.append(circle);
  return svg;
}
const ENV_ICON = {fixed: 'repeat', essentials: 'cart', leisure: 'spark', unexpected: 'bolt', safety: 'shield', projects: 'flag'};
const color = key => `var(--${key === 'safety' || key === 'projects' ? 'savings' : key})`;
const badge = (name, env) => h('span', {class: 'badge', style: {'--c': color(env)}}, icon(name));
const brand = () => h('div', {class: 'brand'}, star(), h('span', null, 'Budget Clair'));
const btn = (label, onclick, cls = '', ico) => h('button', {type: 'button', class: 'btn ' + cls, onclick}, ico && icon(ico), label);
const iconBtn = (name, label, onclick, extra) => h('button', {type: 'button', class: 'icon-btn', 'aria-label': label, title: label, onclick, ...extra}, icon(name));

/* ---------- Dates ---------- */
const now = () => {
  const date = new Date();
  return date.getFullYear() + '-' + core.pad(date.getMonth() + 1) + '-' + core.pad(date.getDate());
};
const fmtMonth = new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric', timeZone: 'UTC'});
const fmtShort = new Intl.DateTimeFormat('fr-FR', {month: 'short', timeZone: 'UTC'});
const fmtDay = new Intl.DateTimeFormat('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'});
const utc = text => new Date((text.length === 7 ? text + '-01' : text) + 'T00:00:00Z');
const monthName = value => fmtMonth.format(utc(value));
const monthShort = value => fmtShort.format(utc(value));
const dayName = value => fmtDay.format(utc(value));
const plural = (count, word) => count + ' ' + word + (count > 1 ? 's' : '');

/* ---------- Données ---------- */
let state = core.emptyState(), oldBudgets = null, storageOk = true, notice = '';
function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    storageOk = false;
    return;
  }
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.profiles)) throw new Error('format');
      state = core.cleanState(parsed);
      return;
    } catch {
      try { localStorage.setItem(KEY + '-secours', raw); } catch { /* stockage plein */ }
      notice = 'Les données enregistrées étaient illisibles. Une copie est gardée dans ce navigateur. Tu peux importer une sauvegarde.';
      state = core.emptyState();
      return;
    }
  }
  try {
    const old = JSON.parse(localStorage.getItem(KEY_V1));
    if (Array.isArray(old?.profiles) && old.profiles.length) {
      state = core.migrateV1(old);
      save();
      return;
    }
  } catch { /* ancienne version illisible : on repart de zéro sans l'effacer */ }
  try {
    const budgets = JSON.parse(localStorage.getItem(KEY_V0));
    if (budgets && Object.keys(budgets).some(core.isMonth)) oldBudgets = budgets;
  } catch { /* idem */ }
}
function save() {
  if (demo) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    if (storageOk) toast('Enregistrement impossible dans ce navigateur. Exporte tes données depuis Réglages.');
    storageOk = false;
  }
}
let demo = null, stale = false;
function reload() {
  const active = state.active;
  stale = false;
  load();
  if (state.profiles.some(item => item.id === active)) state.active = active;
}
const profile = () => demo ?? state.profiles.find(item => item.id === state.active) ?? null;

function demoProfile() {
  const p = core.createProfile('Exemple'), month = now().slice(0, 7), day = now().slice(8);
  const date = (d, m = month) => m + '-' + core.pad(m === month ? Math.min(d, Number(day)) : d);
  p.salaries[core.addMonths(month, -3)] = {net: 210000, gross: null, ratio: 75};
  const start = core.addMonths(month, -3);
  for (const [label, amount, d] of [['Loyer', 72000, 5], ['Électricité', 6500, 8], ['Téléphone et box', 4200, 12], ['Assurance', 5800, 10], ['Pass transport', 4400, 1]]) core.addCharge(p, start, {label, amount, day: d});
  const add = (category, label, amount, d, m = month) => p.expenses.push({id: core.newId(), date: date(d, m), category, label, amount});
  for (let i = 3; i > 0; i--) {
    const m = core.addMonths(month, -i);
    add('groceries', 'Courses du mois', 21000 + i * 1700, 12, m); add('cafe', 'Cafés et restos', 6200 + i * 900, 18, m);
    add('online', 'Commande en ligne', 5400 + i * 500, 20, m);
    if (i === 2) add('unexpected', 'Réparation vélo', 8500, 15, m);
    p.deposits.push({id: core.newId(), date: date(6, m), pot: 'safety', amount: 21000});
  }
  add('groceries', 'Supermarché', 6840, 3); add('groceries', 'Marché', 2450, 9); add('transport', 'Essence', 4500, 7); add('cafe', 'Café en terrasse', 480, 4);
  add('cafe', 'Restaurant', 2650, 8); add('cafe', 'Café', 320, 11); add('online', 'Chaussures', 5990, 6); add('outings', 'Cinéma', 1200, 10);
  p.safety.initial = 40000;
  p.projects.push({id: 'demo-voyage', name: 'Voyage d’été', target: 120000, deadline: core.addMonths(month, 8)});
  p.deposits.push({id: core.newId(), date: date(2), pot: 'safety', amount: 21000}, {id: core.newId(), date: date(6, core.addMonths(month, -1)), pot: 'demo-voyage', amount: 21000});
  return p;
}

/* ---------- Affichage ---------- */
let view = 'home', month = now().slice(0, 7), filter = 'all', historyCount = 6, freshId = null, gate = false;
const last = new Map();
const compute = (m = month) => core.compute(profile(), m, now());

function meter(key, value, over) {
  const bar = h('i');
  const target = Math.max(0, Math.min(100, value || 0));
  bar.style.width = (last.get(key) ?? 0) + '%';
  last.set(key, target);
  requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = target + '%'; }));
  return h('div', {class: 'meter', 'aria-hidden': 'true'}, bar);
}
function countUp(key, value) {
  const node = h('span', null, money(value));
  const from = last.get(key) ?? 0;
  last.set(key, value);
  if (reduced.matches || from === value || document.hidden) return node;
  const start = performance.now();
  node.textContent = money(Math.round(from / 100) * 100);
  const step = time => {
    const t = Math.min(1, Math.max(0, (time - start) / 750)), eased = 1 - (1 - t) ** 4;
    node.textContent = money(t === 1 ? value : Math.round((from + (value - from) * eased) / 100) * 100);
    if (t < 1 && node.isConnected) requestAnimationFrame(step);
    else node.textContent = money(value);
  };
  requestAnimationFrame(step);
  return node;
}

const NAV = [['home', 'Accueil', 'home'], ['expenses', 'Dépenses', 'list'], ['charges', 'Charges fixes', 'repeat'], ['savings', 'Épargne', 'shield'], ['history', 'Historique', 'chart'], ['settings', 'Réglages', 'gear']];
const VIEWS = {home: homeView, expenses: expensesView, charges: chargesView, savings: savingsView, history: historyView, settings: settingsView};

function applyTheme() {
  if (state.theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = state.theme;
}
const isDark = () => state.theme === 'dark' || (state.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);

let wasGate = true;
function render() {
  hideTip();
  applyTheme();
  const p = profile();
  if (!p || gate) {
    wasGate = true;
    app.replaceChildren(gateView());
    return;
  }
  const navButton = ([key, label, ico]) => h('button', {type: 'button', 'aria-current': view === key ? 'page' : null, onclick: () => go(key)}, icon(ico), label);
  const current = now().slice(0, 7);
  const content = VIEWS[view]();
  content.classList.add('view');
  if (wasGate) content.classList.add('enter');
  wasGate = false;
  app.replaceChildren(h('div', {class: 'layout'},
    h('aside', {class: 'side'}, brand(),
      h('nav', {class: 'nav', 'aria-label': 'Sections'}, NAV.map(navButton)),
      h('div', {class: 'side-foot'}, btn('Ajouter une dépense', () => expenseDialog(), 'primary', 'plus'), btn('Je peux l’acheter ?', () => buyDialog(), '', 'bag'))),
    h('div', {class: 'page'},
      h('header', {class: 'top'}, brand(),
        h('div', {class: 'month'},
          iconBtn('left', 'Mois précédent', () => setMonth(core.addMonths(month, -1)), {disabled: month <= '2000-01'}),
          h('strong', {'aria-live': 'polite'}, monthName(month)),
          iconBtn('right', 'Mois suivant', () => setMonth(core.addMonths(month, 1)), {disabled: month >= '2099-12'}),
          month !== current && h('button', {type: 'button', class: 'link small', onclick: () => setMonth(current)}, 'Ce mois')),
        h('div', {class: 'top-actions'},
          iconBtn(isDark() ? 'sun' : 'moon', isDark() ? 'Passer en clair' : 'Passer en sombre', () => { state.theme = isDark() ? 'light' : 'dark'; save(); render(); }, {class: 'icon-btn theme'}),
          h('button', {type: 'button', class: 'avatar', 'aria-label': `Profil ${p.name}, réglages`, title: p.name, onclick: () => go('settings')}, p.name.slice(0, 1).toUpperCase()))),
      demo && h('div', {class: 'banner'}, 'Exemple fictif. Rien n’est enregistré.', h('button', {type: 'button', class: 'link', onclick: leaveDemo}, 'Quitter l’exemple')),
      !demo && !storageOk && h('div', {class: 'banner', role: 'alert'}, 'L’enregistrement est bloqué dans ce navigateur. Exporte tes données avant de fermer la page.'),
      h('main', {id: 'main', tabIndex: -1}, content)),
    h('nav', {class: 'tabbar', 'aria-label': 'Sections principales'},
      navButton(NAV[0]), navButton(NAV[1]), h('button', {type: 'button', class: 'add', 'aria-label': 'Ajouter une dépense', onclick: () => expenseDialog()}, icon('plus')), navButton(NAV[3]), navButton(NAV[4]))));
  freshId = null;
}
function transition(update) {
  if (!document.startViewTransition || reduced.matches) update();
  else document.startViewTransition(update);
}
function go(key) {
  if (key === view) return;
  transition(() => {
    view = key;
    render();
    scrollTo(0, 0);
    $('main')?.focus({preventScroll: true});
  });
}
function setMonth(value) {
  const label = document.activeElement?.getAttribute('aria-label');
  month = value;
  render();
  const again = label && [...app.querySelectorAll('.month button')].find(item => item.getAttribute('aria-label') === label);
  again?.focus();
}
function commit(message, undo) {
  save();
  render();
  if (message) toast(message, undo);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const item of app.querySelectorAll('.star')) item.style.rotate = '45deg';
  }));
}
/* Pour annuler, on remet une copie du profil prise avant le changement. */
function change(action, message) {
  if (stale) reload();
  const p = profile(), before = structuredClone(p);
  action(p);
  commit(message, () => {
    for (const key of Object.keys(p)) delete p[key];
    Object.assign(p, before);
    commit();
  });
}
let toastTimer;
function toast(message, undo) {
  clearTimeout(toastTimer);
  toastBox.replaceChildren(h('div', {class: 'toast'}, message, undo && h('button', {type: 'button', onclick: () => { toastBox.replaceChildren(); undo(); }}, 'Annuler')));
  toastTimer = setTimeout(() => toastBox.replaceChildren(), undo ? 7000 : 5000);
}

/* ---------- Infobulles ---------- */
function hideTip() { tooltip.hidden = true; }
function showTip(target, build) {
  tooltip.replaceChildren();
  fill(tooltip, build());
  tooltip.hidden = false;
  const box = target.getBoundingClientRect(), tip = tooltip.getBoundingClientRect();
  tooltip.style.left = Math.max(8, Math.min(innerWidth - tip.width - 8, box.left + box.width / 2 - tip.width / 2)) + 'px';
  const above = box.top - tip.height - 8;
  tooltip.style.top = (above > 8 ? above : Math.min(innerHeight - tip.height - 8, box.bottom + 8)) + 'px';
}
function withTip(node, build) {
  for (const type of ['pointerenter', 'focus', 'click']) node.addEventListener(type, () => showTip(node, build));
  for (const type of ['pointerleave', 'blur']) node.addEventListener(type, hideTip);
  return node;
}
addEventListener('scroll', hideTip, {passive: true});

/* ---------- Accueil ---------- */
function homeView() {
  const data = compute(), p = profile();
  if (data.income === null) return h('div', null, salaryHero(), h('div', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Le plan proposé')),
    ENVELOPES.map(item => h('div', {class: 'row compact'}, badge(ENV_ICON[item.key], item.key), h('div', null, h('div', {class: 'label'}, item.label), h('div', {class: 'soft small'}, item.hint)), h('strong', {class: 'tab'}, percent(p.plan[item.key]))))));
  const previous = core.compute(p, core.addMonths(month, -1), now());
  const recent = data.expenses.filter(item => !item.charge).sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 5);
  return h('div', null,
    hero(data),
    data.phase !== 'past' && h('section', {class: 'tiles', 'aria-label': 'Tolérance par type de plaisir'}, data.subs.map(sub => subTile(sub, data))),
    h('div', {class: 'cols'},
      h('div', null, salaryCard(data),
        h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Dernières dépenses'), recent.length > 0 && h('button', {type: 'button', class: 'link small', onclick: () => go('expenses')}, 'Tout voir')),
          recent.length ? recent.map(item => expenseRow(item, true)) : h('p', {class: 'soft'}, 'Aucune dépense ce mois-ci.'))),
      h('div', null,
        h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Conseils')), tipsList(core.advise(p, data, previous))),
        safetyMini(data))));
}
function salaryHero() {
  const input = moneyInput({name: 'net', placeholder: '2 000', 'aria-label': 'Salaire net en euros', autocomplete: 'off'});
  const error = h('p', {class: 'error', role: 'alert', hidden: true});
  return h('section', {class: 'hero'}, h('div', null, h('h1', null, 'Quel est ton salaire net ?'),
    h('p', {class: 'explain'}, 'Le montant qui arrive sur ton compte. Tes plafonds et ta tolérance sont calculés à partir de lui, et il est repris chaque mois.'),
    h('form', {noValidate: true, onsubmit: event => {
      event.preventDefault();
      const net = core.parseMoney(input.value);
      if (!net) {
        error.textContent = 'Saisis un montant, par exemple 2000.';
        error.hidden = false;
        input.focus();
        return;
      }
      profile().salaries[month] = {net, gross: null, ratio: 75};
      wasGate = true;
      commit('Salaire enregistré. Ajoute maintenant tes charges fixes.');
    }}, wrapMoney(input), h('button', {type: 'submit', class: 'btn accent'}, 'Calculer mon plan'), error),
    h('p', {class: 'small explain'}, h('button', {type: 'button', class: 'link', style: {color: '#fff'}, onclick: () => salaryDialog()}, 'Je connais seulement mon brut'))));
}
function hero(data) {
  const actions = h('div', {class: 'hero-actions'}, btn('Ajouter une dépense', () => expenseDialog(), 'accent', 'plus'), btn('Je peux l’acheter ?', () => buyDialog(), 'ghost', 'bag'));
  if (data.phase === 'past') {
    return h('section', {class: 'hero' + (data.cash < 0 ? ' neg' : '')}, h('div', null,
      h('p', {class: 'lead'}, data.cash < 0 ? `En ${monthName(month)}, tu as dépassé de` : `En ${monthName(month)}, il t’est resté`),
      h('div', {class: 'num'}, countUp('hero', Math.abs(data.cash))),
      h('p', {class: 'explain'}, `Sur ${money(data.income)} de rentrées : `, h('b', null, money(data.spent)), ' dépensés et ', h('b', null, money(data.saved)), ' mis de côté.')),
      h('div', {class: 'hero-actions'}, btn('Ajouter une dépense', () => expenseDialog(), 'ghost', 'plus')));
  }
  const value = data.tolerance, budget = data.envelopes.leisure.budget;
  const until = `${data.days} ${monthName(month).split(' ')[0]}`;
  if (value <= 0) {
    return h('section', {class: 'hero neg'}, h('div', null,
      h('p', {class: 'lead'}, value === 0 ? 'Pour te faire plaisir, il te reste' : 'Ta tolérance plaisir est dépassée de'),
      h('div', {class: 'num'}, countUp('hero', -value)),
      h('p', {class: 'explain'}, value === 0 ? `Plus de café ni d’achat en ligne avant le mois prochain.` : `Pause sur les cafés et les achats en ligne jusqu’au ${until}. Ce dépassement mord sur l’argent prévu pour tes autres enveloppes.`)), actions);
  }
  return h('section', {class: 'hero' + (value < budget * 0.2 ? ' low' : '')}, h('div', null,
    h('p', {class: 'lead'}, data.phase === 'future' ? `En ${monthName(month)}, tu pourras te faire plaisir avec` : 'Tu peux encore te faire plaisir avec'),
    h('div', {class: 'num'}, countUp('hero', value)),
    h('p', {class: 'explain'}, data.phase === 'current' && data.daysLeft > 7 ? ['Soit ', h('b', null, money(Math.floor(data.weekly / 100) * 100) + ' par semaine'), ` jusqu’au ${until}. `] : data.phase === 'current' ? [`Pour tenir jusqu’au ${until}. `] : null,
      'Tes charges, tes courses, tes imprévus et ton épargne sont déjà mis de côté.')), actions);
}
function subTile(sub, data) {
  const over = sub.left < 0, weekly = data.daysLeft > 7 ? Math.floor(sub.available * 7 / data.daysLeft / 100) * 100 : 0;
  const coffees = Math.floor(sub.available / profile().coffee);
  let note = over ? `Limite de ${money(sub.limit)} dépassée de ${money(-sub.left)}.` : sub.available === 0 ? 'Plus rien de disponible ce mois-ci.' :
    sub.key === 'cafe' ? `Environ ${plural(coffees, 'café')} à ${money(profile().coffee)}${weekly ? `, ou ${money(weekly)} par semaine` : ''}.` : weekly ? `Environ ${money(weekly)} par semaine.` : 'Jusqu’à la fin du mois.';
  if (!over && sub.available < sub.left - 1 && sub.available > 0) note += ' Limite réduite ce mois-ci.';
  return h('article', {class: 'card tile' + (over ? ' over' : ''), style: {'--c': 'var(--leisure)'}},
    h('div', {class: 'tile-top'}, badge(sub.icon, 'leisure'), sub.label),
    h('div', {class: 'num'}, countUp('sub-' + sub.key, over ? sub.left : sub.available)),
    meter('m-' + sub.key, sub.limit ? sub.spent * 100 / sub.limit : sub.spent ? 100 : 0),
    h('p', {class: 'soft small'}, `${money(sub.spent)} dépensés sur ${money(sub.limit)}. `, note));
}
function salaryCard(data) {
  const env = key => data.envelopes[key];
  return h('section', {class: 'card'},
    h('div', {class: 'card-head'}, h('h2', null, 'Ton argent, enveloppe par enveloppe'), h('button', {type: 'button', class: 'link small', onclick: () => go('settings')}, 'Changer le plan')),
    h('div', {class: 'bar-key', 'aria-hidden': 'true'}, h('span', null, h('i'), 'Utilisé'), h('span', null, h('i', {class: 'light'}), 'Prévu')),
    h('div', {class: 'salary-bar'}, ENVELOPES.filter(item => env(item.key).plan > 0).map(item => {
      const e = env(item.key), bar = h('i'), target = Math.min(100, e.used);
      bar.style.width = (last.get('bar-' + item.key) ?? 0) + '%';
      last.set('bar-' + item.key, target);
      requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = target + '%'; }));
      return withTip(h('button', {type: 'button', class: e.left < 0 && item.key !== 'safety' && item.key !== 'projects' ? 'over' : '', style: {flex: `${e.plan} 1 0`, '--c': color(item.key)}, 'aria-label': `${item.label} : ${money(e.spent)} sur ${money(e.budget)}`}, bar),
        () => [h('b', null, item.label), h('div', null, h('strong', null, money(e.spent)), 'utilisés'), h('div', null, h('strong', null, money(e.budget)), `prévus (${percent(e.plan)})`)]);
    })),
    ENVELOPES.map(item => {
      const e = env(item.key), saving = item.key === 'safety' || item.key === 'projects';
      const over = !saving && e.left < 0, near = !saving && !over && e.used >= 80 && item.key !== 'fixed' && data.phase === 'current';
      const status = saving ? (e.left <= 0 ? 'Objectif atteint' : `Encore ${money(e.left)} à verser`) : over ? `Dépassé de ${money(-e.left)}` : `Reste ${money(e.left)}`;
      return h('div', {class: 'env' + (over ? ' over' : near ? ' near' : ''), style: {'--c': color(item.key)}},
        badge(ENV_ICON[item.key], item.key),
        h('div', {class: 'name'}, item.label), h('div', {class: 'amount tab'}, money(e.spent), h('span', null, ' / ' + money(e.budget))),
        h('div', {class: 'share tab'}, `${percent(e.share ?? 0)} du revenu, ${saving ? 'objectif' : 'plafond'} ${percent(e.plan)}`), h('div', {class: 'state tab'}, (over || near) && icon('alert'), status),
        meter('env-' + item.key, e.used));
    }),
    h('dl', {class: 'totals'},
      h('div', null, h('dt', null, 'Rentrées'), h('dd', null, money(data.income))),
      h('div', null, h('dt', null, 'Sorties et épargne'), h('dd', null, money(data.spent + data.saved))),
      h('div', null, h('dt', null, 'Reste sur le compte'), h('dd', {class: data.cash < 0 ? 'neg-text' : ''}, money(data.cash)))));
}
const TIP_ICON = {critical: 'alert', warn: 'alert', info: 'info', good: 'check'};
function tipsList(tips) {
  const actions = {
    salary: ['Saisir mon salaire', () => salaryDialog()], charges: ['Ajouter mes charges', () => go('charges')], plan: ['Voir mon plan', () => go('settings')],
    adapt: ['Adapter mon plan', adaptPlan], deposit: ['Verser maintenant', () => depositDialog()]
  };
  return h('ul', {class: 'tips'}, tips.map(tip => h('li', {class: 'tip ' + tip.level}, icon(TIP_ICON[tip.level]), h('strong', null, tip.title), h('p', null, tip.text),
    tip.action && h('button', {type: 'button', class: 'link', onclick: actions[tip.action][1]}, actions[tip.action][0]))));
}
function adaptPlan() {
  const data = compute(), p = profile();
  const next = core.rebalance(p.plan, 'fixed', Math.min(100, Math.ceil(data.envelopes.fixed.share)));
  openDialog('Adapter mon plan', close => [
    h('p', {class: 'soft'}, 'La part des charges fixes suit tes vrais montants. Le reste garde les mêmes proportions.'),
    h('div', null, ENVELOPES.map(item => h('div', {class: 'row compact'}, badge(ENV_ICON[item.key], item.key), h('div', null, h('div', {class: 'label'}, item.label), h('div', {class: 'soft small tab'}, `${percent(p.plan[item.key])} aujourd’hui`)),
      h('div', {class: 'amount'}, `${percent(next[item.key])}, ${money(Math.round(data.income * next[item.key] / 100))}`)))),
    foot(close, 'Utiliser ce plan', () => { close(); change(q => { q.plan = next; }, 'Plan adapté.'); })
  ]);
}
function safetyMini(data) {
  const status = core.safetyStatus(profile(), data);
  return h('section', {class: 'card', style: {'--c': 'var(--savings)'}}, h('div', {class: 'card-head'}, h('h2', null, 'Réserve de sécurité'), h('button', {type: 'button', class: 'link small', onclick: () => go('savings')}, 'Voir l’épargne')),
    h('div', {class: 'between'}, h('strong', {class: 'num', style: {'font-size': '1.5rem'}}, money(status.balance)), status.target && h('span', {class: 'soft tab', style: {'align-self': 'end'}}, `sur ${money(status.target)}`)),
    h('div', {style: {'margin-top': '12px'}}, meter('mini-safety', status.percent)));
}

/* ---------- Dépenses ---------- */
function expenseRow(item, compact) {
  const category = CATEGORY[item.category];
  const editItem = () => item.charge ? chargeDialog(item.charge) : expenseDialog(item);
  return h('div', {class: 'row' + (compact ? ' compact' : '') + (item.id === freshId ? ' fresh' : '')},
    badge(category.icon, category.envelope),
    h('div', null, h('div', {class: 'label'}, item.label), h('div', {class: 'soft small'}, category.label + (item.charge ? ', chaque mois' : ''))),
    h('div', {class: 'amount'}, money(item.amount)),
    !compact && h('div', {class: 'acts'}, iconBtn('pen', 'Modifier ' + item.label, editItem),
      item.charge ? iconBtn('stop', `Arrêter ${item.label} à partir de ce mois`, () => stopCharge(item.charge)) : iconBtn('trash', 'Supprimer ' + item.label, () => removeFrom('expenses', item, 'Dépense supprimée.'))));
}
function removeFrom(listName, item, message) {
  change(p => { p[listName] = p[listName].filter(entry => entry.id !== item.id); }, message);
}
function expensesView() {
  const data = compute();
  const filters = [['all', 'Tout'], ['essentials', 'Quotidien'], ['leisure', 'Plaisir'], ['unexpected', 'Imprévus'], ['income', 'Rentrées']];
  const variable = data.expenses.filter(item => item.category !== 'fixed');
  const shown = filter === 'income' ? data.incomes : filter === 'all' ? [...variable, ...data.incomes] : variable.filter(item => CATEGORY[item.category].envelope === filter);
  const total = core.sum(shown.filter(item => item.category).map(item => item.amount));
  const groups = Map.groupBy ? Map.groupBy(shown, item => item.undated ? '' : item.date) : shown.reduce((map, item) => map.set(item.undated ? '' : item.date, [...(map.get(item.undated ? '' : item.date) ?? []), item]), new Map());
  return h('div', null,
    h('div', {class: 'head'}, h('div', null, h('h1', null, 'Dépenses'), h('p', null, filter === 'income' ? `${money(data.extra)} en plus du salaire.` : `${money(total)} dépensés hors charges fixes.`)),
      h('div', {class: 'btns'}, btn('Charges fixes', () => go('charges'), '', 'repeat'), btn('Rentrée d’argent', () => incomeDialog(), '', 'wallet'), btn('Ajouter', () => expenseDialog(), 'primary', 'plus'))),
    h('div', {class: 'filters', role: 'group', 'aria-label': 'Filtrer'}, filters.map(([key, label]) => h('button', {type: 'button', 'aria-pressed': String(filter === key), onclick: () => { filter = key; render(); }}, label))),
    h('section', {class: 'card'}, shown.length ? [...groups].sort((a, b) => a[0] < b[0] ? 1 : -1).map(([date, items]) => [
      h('div', {class: 'day'}, date ? dayName(date) : 'Sans date précise'),
      items.map(item => item.category ? expenseRow(item) : h('div', {class: 'row' + (item.id === freshId ? ' fresh' : '')}, badge('wallet', 'safety'), h('div', null, h('div', {class: 'label'}, item.label), h('div', {class: 'soft small'}, 'Rentrée d’argent')),
        h('div', {class: 'amount in'}, '+ ' + money(item.amount)), h('div', {class: 'acts'}, iconBtn('pen', 'Modifier ' + item.label, () => incomeDialog(item)), iconBtn('trash', 'Supprimer ' + item.label, () => removeFrom('incomes', item, 'Rentrée supprimée.')))))
    ]) : h('div', {class: 'empty'}, h('p', null, 'Rien à afficher pour ce mois.'), filter !== 'income' && btn('Ajouter une dépense', () => expenseDialog(), 'primary', 'plus'))));
}

/* ---------- Charges fixes ---------- */
function stopCharge(charge) {
  change(p => core.stopCharge(p, charge.series, month), `« ${charge.label} » s’arrête à partir de ${monthName(month)}.`);
}
function chargesView() {
  const data = compute(), env = data.envelopes.fixed;
  const items = data.expenses.filter(item => item.category === 'fixed').sort((a, b) => a.date < b.date ? -1 : 1);
  const dayOf = item => item.undated ? null : Number(item.date.slice(8));
  return h('div', null,
    h('div', {class: 'head'}, h('div', null, h('h1', null, 'Charges fixes'), h('p', null, 'Ce qui revient tous les mois. Un changement vaut à partir du mois affiché.')), btn('Ajouter une charge', () => chargeDialog(), 'primary', 'plus')),
    data.income !== null && h('section', {class: 'card' + (env.left < 0 ? ' over' : ''), style: {'--c': 'var(--fixed)'}},
      h('div', {class: 'between'}, h('div', null, h('strong', {class: 'num', style: {'font-size': '1.9rem'}}, money(env.spent)), h('div', {class: 'soft'}, `${percent(env.share ?? 0)} de tes rentrées`)),
        h('div', {class: 'soft', style: {'text-align': 'right'}}, `Plafond ${money(env.budget)} (${percent(env.plan)})`, h('div', {class: env.left < 0 ? 'neg-text' : ''}, env.left < 0 ? `Dépassé de ${money(-env.left)}` : `Marge de ${money(env.left)}`))),
      h('div', {style: {'margin-top': '14px'}}, meter('charges', env.used))),
    h('section', {class: 'card'}, items.length ? items.map(item => h('div', {class: 'row'}, badge('repeat', 'fixed'),
      h('div', null, h('div', {class: 'label'}, item.label), h('div', {class: 'soft small'}, item.charge ? (dayOf(item) ? `Le ${dayOf(item)} de chaque mois` : 'Chaque mois') : 'Ce mois seulement')),
      h('div', {class: 'amount'}, money(item.amount)),
      h('div', {class: 'acts'}, iconBtn('pen', 'Modifier ' + item.label, () => chargeDialog(item.charge, item.charge ? null : item)),
        item.charge ? iconBtn('stop', `Arrêter ${item.label} à partir de ce mois`, () => stopCharge(item.charge)) : iconBtn('trash', 'Supprimer ' + item.label, () => removeFrom('expenses', item, 'Charge supprimée.'))))) :
      h('div', {class: 'empty'}, h('p', null, 'Ajoute ton loyer, tes factures, tes abonnements et tes crédits.'), btn('Ajouter une charge', () => chargeDialog(), 'primary', 'plus'))));
}

/* ---------- Épargne ---------- */
const potName = pot => pot === 'safety' ? 'Réserve de sécurité' : profile().projects.find(item => item.id === pot)?.name ?? 'Projet';
function savingsView() {
  const data = compute(), p = profile(), status = core.safetyStatus(p, data), env = data.envelopes;
  const moves = [...data.deposits].sort((a, b) => a.date < b.date ? 1 : -1);
  const needed = core.sum(p.projects.map(item => core.projectStatus(p, item, month).perMonth ?? 0));
  return h('div', null,
    h('div', {class: 'head'}, h('div', null, h('h1', null, 'Épargne'), h('p', null, data.income === null ? 'Saisis ton salaire pour calculer combien mettre de côté.' : `Objectif de ${monthName(month)} : ${money(env.safety.budget + env.projects.budget)}, dont ${money(data.saved)} déjà versés.`)),
      h('div', {class: 'btns'}, btn('Retirer', () => depositDialog('safety', true), '', 'up'), btn('Verser', () => depositDialog(), 'primary', 'down'))),
    h('section', {class: 'card reserve', style: {'--c': 'var(--savings)'}},
      h('div', {class: 'card-head'}, h('h2', null, 'Réserve de sécurité'), h('button', {type: 'button', class: 'link small', onclick: reserveDialog}, 'Régler l’objectif')),
      h('div', {class: 'num'}, countUp('reserve', status.balance)),
      meter('reserve', status.percent),
      h('div', {class: 'between soft'}, h('span', null, status.covers !== null ? `Couvre ${new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 1}).format(status.covers)} mois de charges et de quotidien` : 'L’argent pour les coups durs'),
        status.target !== null && h('span', {class: 'tab'}, `Objectif ${money(status.target)}`)),
      status.missing !== null && h('p', {style: {'margin-top': '14px'}}, status.missing === 0 ? 'Objectif atteint. Garde cette somme sur un compte disponible à tout moment.' :
        status.months ? `Avec ${money(env.safety.budget)} par mois, objectif atteint en ${monthName(core.addMonths(month, status.months))}.` : status.months === 0 ? 'Avec le versement de ce mois-ci, objectif atteint.' : 'Ajoute une part Sécurité dans ton plan pour avancer.')),
    h('div', {class: 'head'}, h('div', null, h('h2', null, 'Mes projets'), data.income !== null && needed > env.projects.budget && h('p', null, `Tes échéances demandent ${money(needed)} par mois, ton plan prévoit ${money(env.projects.budget)}. Repousse une date ou augmente cette part.`)), btn('Nouveau projet', () => projectDialog(), '', 'plus')),
    p.projects.length ? h('div', {class: 'projects'}, p.projects.map(item => {
      const s = core.projectStatus(p, item, month);
      return h('article', {class: 'card project', style: {'--c': 'var(--savings)'}}, h('div', {class: 'between'}, h('h3', null, item.name), h('div', {class: 'acts'}, iconBtn('pen', 'Modifier ' + item.name, () => projectDialog(item)))),
        h('div', null, h('span', {class: 'num'}, money(s.balance)), h('span', {class: 'soft tab'}, ` sur ${money(item.target)}`)), meter('p-' + item.id, s.percent),
        h('p', {class: 'soft small'}, s.missing === 0 ? 'Projet financé.' : s.late ? `Échéance dépassée, il manque ${money(s.missing)}.` : s.perMonth !== null ? `${money(s.perMonth)} par mois jusqu’en ${monthName(item.deadline)}.` : `Il manque ${money(s.missing)}.`),
        btn('Verser', () => depositDialog(item.id), 'slim'));
    })) : h('section', {class: 'card empty'}, h('p', null, 'Un voyage, une voiture, un apport : donne un nom et un montant à ton objectif.'), btn('Créer un projet', () => projectDialog(), 'primary', 'plus')),
    h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Mouvements du mois')), moves.length ? moves.map(item => h('div', {class: 'row' + (item.id === freshId ? ' fresh' : '')}, badge(item.pot === 'safety' ? 'shield' : 'flag', 'safety'),
      h('div', null, h('div', {class: 'label'}, potName(item.pot)), h('div', {class: 'soft small'}, dayName(item.date))), h('div', {class: 'amount' + (item.amount > 0 ? ' in' : '')}, (item.amount > 0 ? '+ ' : '− ') + money(Math.abs(item.amount))),
      h('div', {class: 'acts'}, iconBtn('trash', 'Supprimer ce mouvement', () => removeFrom('deposits', item, 'Mouvement supprimé.'))))) : h('p', {class: 'soft'}, 'Aucun versement ce mois-ci.')));
}

/* ---------- Historique ---------- */
function historyView() {
  const months = core.history(profile(), month, historyCount, now());
  const series = [['fixed', 'Charges fixes'], ['essentials', 'Quotidien'], ['leisure', 'Plaisir'], ['unexpected', 'Imprévus'], ['savings', 'Épargne']];
  const value = (data, key) => key === 'savings' ? data.saved : data.envelopes[key].spent;
  const max = Math.max(1, ...months.map(data => Math.max(data.income ?? 0, data.spent + data.saved)));
  const rough = max / 4, power = 10 ** Math.floor(Math.log10(rough)), step = [1, 2, 2.5, 5, 10].map(k => k * power).find(k => k >= rough), top = step * Math.ceil(max / step);
  const ticks = Array.from({length: Math.round(top / step) + 1}, (_, i) => i * step);
  const head = h('div', {class: 'head'}, h('div', null, h('h1', null, 'Historique'), h('p', null, `Jusqu’à ${monthName(month)}.`)),
    h('div', {class: 'seg', role: 'group', 'aria-label': 'Période'}, [6, 12].map(count => h('button', {type: 'button', 'aria-pressed': String(historyCount === count), onclick: () => { historyCount = count; render(); }}, count + ' mois'))));
  if (!months.length) return h('div', null, head, h('section', {class: 'card empty'}, h('p', null, 'L’historique apparaît dès que tu saisis un salaire ou une dépense.')));
  return h('div', null, head,
    h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Où est parti l’argent'), h('div', {class: 'legend'}, series.map(([key, label]) => h('span', null, h('i', {style: {'--c': color(key)}}), label)), h('span', null, h('i', {class: 'line', style: {'--c': 'var(--ink)'}}), 'Rentrées'))),
      h('div', {class: 'plot'}, ticks.map(tick => h('div', {class: 'grid', style: {bottom: tick * 100 / top + '%'}}, h('span', null, money(tick)))),
        h('div', {class: 'columns'}, months.map((data, index) => withTip(h('button', {type: 'button', class: 'col', 'aria-label': `${monthName(data.month)} : ${money(data.spent)} dépensés, ${money(data.saved)} épargnés, ${money(data.income)} de rentrées`},
          h('div', {class: 'stack', style: {height: (data.spent + data.saved) * 100 / top + '%', 'animation-delay': index * 50 + 'ms'}}, series.filter(([key]) => value(data, key) > 0).map(([key]) => h('i', {style: {'--c': color(key), flex: `${value(data, key)} 1 0`}}))),
          data.income !== null && h('span', {class: 'inc', style: {bottom: data.income * 100 / top + '%'}}),
          h('span', {class: 'name'}, monthShort(data.month))),
        () => [h('b', null, monthName(data.month)), h('div', null, h('i', {style: {'--c': 'var(--bg)'}}), h('strong', null, money(data.income)), 'Rentrées'), series.filter(([key]) => value(data, key)).reverse().map(([key, label]) => h('div', null, h('i', {style: {'--c': color(key)}}), h('strong', null, money(value(data, key))), label))])))) ),
    h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Le détail')), h('div', {class: 'scroll', tabIndex: 0, role: 'region', 'aria-label': 'Tableau détaillé'}, h('table', null,
      h('thead', null, h('tr', null, h('th', {scope: 'col'}, 'Mois'), h('th', {scope: 'col'}, 'Rentrées'), series.map(([, label]) => h('th', {scope: 'col'}, label)), h('th', {scope: 'col'}, 'Reste'))),
      h('tbody', null, [...months].reverse().map(data => h('tr', null, h('th', {scope: 'row'}, monthShort(data.month) + ' ' + data.month.slice(0, 4)), h('td', null, money(data.income)), series.map(([key]) => h('td', null, money(value(data, key)))), h('td', {class: data.cash < 0 ? 'neg-text' : ''}, money(data.cash)))))))));
}

/* ---------- Réglages ---------- */
function percentEditor(items, values, total, onSave) {
  const draft = {...values}, rows = {};
  const sumNode = h('span', {class: 'tab'}), saveBtn = h('button', {type: 'submit', class: 'btn primary slim'}, 'Enregistrer');
  const refresh = () => {
    const amount = core.sum(Object.values(draft).map(item => item ?? NaN));
    const ok = Math.abs(amount - 100) < 0.05;
    sumNode.textContent = Number.isNaN(amount) ? 'Un pourcentage est incorrect' : ok ? 'Total 100 %' : amount > 100 ? `Total ${percent(amount)}, retire ${percent(amount - 100)}` : `Total ${percent(amount)}, ajoute ${percent(100 - amount)}`;
    sumNode.className = 'tab' + (ok ? '' : ' neg-text');
    saveBtn.disabled = !ok || items.every(item => draft[item.key] === values[item.key]);
    for (const item of items) rows[item.key].textContent = total === null || draft[item.key] === null ? '' : money(Math.round(total * draft[item.key] / 100));
  };
  const form = h('form', {noValidate: true, onsubmit: event => { event.preventDefault(); if (!saveBtn.disabled) onSave({...draft}); }},
    items.map(item => {
      rows[item.key] = h('div', {class: 'eur tab'});
      return h('label', {class: 'plan-row'}, badge(item.icon, item.envelope), h('div', null, h('div', {class: 'label', style: {'font-weight': '600'}}, item.label), item.hint && h('div', {class: 'soft small'}, item.hint)),
        h('div', {class: 'money', 'data-unit': '%'}, h('input', {class: 'input', type: 'text', inputMode: 'decimal', value: String(values[item.key]).replace('.', ','), 'aria-label': item.label + ', pourcentage', oninput: event => {
          const number = Number(event.target.value.trim().replace(',', '.'));
          draft[item.key] = event.target.value.trim() !== '' && number >= 0 && number <= 100 ? Math.round(number * 10) / 10 : null;
          event.target.classList.toggle('bad', draft[item.key] === null);
          refresh();
        }})), rows[item.key]);
    }), h('div', {class: 'plan-total'}, sumNode, saveBtn));
  refresh();
  return form;
}
function settingsView() {
  const p = profile(), data = compute();
  const salary = data.salary;
  return h('div', null,
    h('div', {class: 'head'}, h('h1', null, 'Réglages')),
    h('div', {class: 'cols'}, h('div', null,
      h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Salaire')),
        h('div', {class: 'between', style: {'align-items': 'center'}}, h('div', null, h('strong', {class: 'num', style: {'font-size': '1.9rem'}}, money(salary.amount)),
          h('div', {class: 'soft small'}, salary.amount === null ? 'À saisir' : (salary.estimated ? 'Net estimé à partir du brut. ' : 'Net. ') + (salary.inherited ? `Repris de ${monthName(salary.from)}.` : `Saisi pour ${monthName(month)}.`)),
          data.extra > 0 && h('div', {class: 'soft small'}, `+ ${money(data.extra)} d’autres rentrées ce mois-ci.`)),
          h('div', {class: 'btns'}, btn('Autre rentrée', () => incomeDialog(), 'slim', 'plus'), btn('Modifier', () => salaryDialog(), 'slim', 'pen')))),
      h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('h2', null, 'Mon plan'), h('button', {type: 'button', class: 'link small', onclick: () => change(q => { q.plan = core.defaultPlan(); }, 'Plan conseillé rétabli.')}, 'Plan conseillé')),
        percentEditor(ENVELOPES.map(item => ({...item, icon: ENV_ICON[item.key], envelope: item.key})), p.plan, data.income, values => change(q => { q.plan = values; }, 'Plan enregistré.'))),
      h('section', {class: 'card'}, h('div', {class: 'card-head'}, h('div', null, h('h2', null, 'Limites plaisir'), h('p', {class: 'soft small', style: {'margin-top': '4px'}}, 'Comment partager ton enveloppe Plaisir.'))),
        percentEditor(LEISURE, p.split, data.income === null ? null : data.envelopes.leisure.budget, values => change(q => { q.split = values; }, 'Limites enregistrées.')))),
    h('div', null,
      h('section', {class: 'card stack-sm'}, h('h2', null, 'Profil'), h('p', null, p.name),
        h('div', {class: 'btns'}, !demo && btn('Renommer', renameDialog, 'slim', 'pen'), btn('Changer de profil', () => { demo = null; gate = true; render(); }, 'slim'), !demo && btn('Supprimer', deleteProfileDialog, 'slim danger', 'trash'))),
      h('section', {class: 'card stack-sm'}, h('h2', null, 'Prix d’un café'), h('p', {class: 'soft small'}, 'Sert à traduire ta limite en nombre de cafés.'), coffeeField(p)),
      h('section', {class: 'card stack-sm'}, h('h2', null, 'Apparence'), h('div', {class: 'seg', role: 'group', 'aria-label': 'Thème'}, [['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].map(([key, label]) => h('button', {type: 'button', 'aria-pressed': String(state.theme === key), onclick: () => { state.theme = key; save(); render(); }}, label)))),
      h('section', {class: 'card stack-sm'}, h('h2', null, 'Mes données'), h('p', {class: 'soft small'}, 'Tout reste dans ce navigateur, sur cet appareil. Exporte une sauvegarde de temps en temps, ou pour passer du téléphone à l’ordinateur.'),
        h('div', {class: 'btns'}, btn('Exporter', exportJson, 'slim', 'down'), btn('Importer', importJson, 'slim', 'up'), btn('Tableau CSV', exportCsv, 'slim', 'list')),
        !demo && h('button', {type: 'button', class: 'link small', style: {'justify-self': 'start'}, onclick: () => { demo = demoProfile(); last.clear(); wasGate = true; view = 'home'; month = now().slice(0, 7); render(); }}, 'Voir un exemple')))));
}
function coffeeField(p) {
  const input = moneyInput({value: formatInput(p.coffee), 'aria-label': 'Prix d’un café', onchange: event => {
    const value = core.parseMoney(event.target.value);
    if (!value) { event.target.value = formatInput(p.coffee); return; }
    p.coffee = value;
    save();
    toast('Prix du café enregistré.');
  }});
  return wrapMoney(input);
}
function leaveDemo() {
  demo = null;
  last.clear();
  view = 'home';
  wasGate = true;
  render();
}

/* ---------- Fenêtres ---------- */
const formatInput = value => value === null || value === undefined ? '' : (value / 100).toFixed(value % 100 ? 2 : 0).replace('.', ',');
const moneyInput = props => h('input', {class: 'input', type: 'text', inputMode: 'decimal', autocomplete: 'off', ...props});
const wrapMoney = input => h('div', {class: 'money', 'data-unit': '€'}, input);
const field = (label, control, hint) => h('label', {class: 'field'}, label, control, hint && h('small', null, hint));
const foot = (close, label, onclick, extra) => h('div', {class: 'dlg-foot'}, extra, h('button', {type: 'button', class: 'btn', onclick: close}, 'Annuler'), h('button', {type: onclick ? 'button' : 'submit', class: 'btn primary', onclick}, label));
function closeDialog() { if (dialog.open) dialog.close(); }
let opener = null;
function openDialog(title, build, onsubmit) {
  opener = document.activeElement;
  hideTip();
  const form = h('form', {class: 'dlg', noValidate: true, onsubmit: event => { event.preventDefault(); onsubmit?.(form); }},
    h('div', {class: 'dlg-head'}, h('h2', {id: 'dialog-title'}, title), iconBtn('close', 'Fermer', closeDialog)));
  fill(form, [build(closeDialog)]);
  dialog.replaceChildren(form);
  if (!dialog.open) dialog.showModal();
  const first = form.querySelector('[data-first]') ?? form.querySelector('.input');
  first?.focus();
  dialog.scrollTop = 0;
}
dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
dialog.addEventListener('close', () => {
  if (opener?.isConnected) opener.focus({preventScroll: true});
  else $('main')?.focus({preventScroll: true});
});
function errorBox() {
  const node = h('p', {class: 'error', role: 'alert', hidden: true});
  return {node, show(message, input) { node.textContent = message; node.hidden = false; input?.classList.add('bad'); input?.focus(); }};
}
function chips(legend, name, keys, checked, onchange) {
  return h('fieldset', {class: 'chips'}, h('legend', null, legend), keys.map(key => {
    const item = CATEGORY[key];
    return h('label', {class: 'chip', style: {'--c': color(item.envelope)}}, h('input', {type: 'radio', name, value: key, checked: key === checked, onchange}), h('span', null, icon(item.icon), item.label));
  }));
}
const SPEND_KEYS = CATEGORIES.filter(item => item.key !== 'fixed').map(item => item.key);
const defaultDate = () => now().slice(0, 7) === month ? now() : month + '-01';

function expenseDialog(item = null, preset = {}) {
  const current = item ?? preset, error = errorBox();
  const amount = moneyInput({class: 'input big', value: formatInput(current.amount), placeholder: '0', 'data-first': '', 'aria-label': 'Montant en euros'});
  const label = h('input', {class: 'input', type: 'text', maxLength: 65, value: current.label ?? '', placeholder: 'Facultatif', autocomplete: 'off'});
  const date = h('input', {class: 'input', type: 'date', value: current.date ?? defaultDate(), min: '2000-01-01', max: '2099-12-31'});
  const impact = h('div', {class: 'impact', 'aria-live': 'polite'});
  let group;
  const category = () => group.querySelector('input:checked').value;
  const refresh = () => {
    const value = core.parseMoney(amount.value);
    const target = core.isDate(date.value) ? date.value.slice(0, 7) : month;
    const base = structuredClone(profile());
    if (item) base.expenses = base.expenses.filter(entry => entry.id !== item.id);
    if (value) base.expenses.push({id: 'x', date: target + '-01', category: category(), label: 'x', amount: value});
    const data = core.compute(base, target, now());
    if (data.income === null) { impact.replaceChildren('Saisis ton salaire pour voir l’effet sur ton budget.'); return; }
    const sub = data.subs.find(entry => entry.key === category());
    const env = data.envelopes[CATEGORY[category()].envelope];
    const left = sub ? sub.left : env.left, name = sub ? sub.label : ENVELOPE[env.key].label;
    impact.replaceChildren(icon(left < 0 ? 'alert' : 'info'), h('span', null, value ? 'Après cette dépense : ' : 'Aujourd’hui : ', h('b', null, left < 0 ? `${money(-left)} au-dessus de la limite` : `${money(left)} restants`), ` en ${name.toLowerCase()}.`));
    impact.style.color = left < 0 ? 'var(--critical)' : '';
  };
  group = chips('Catégorie', 'category', SPEND_KEYS, current.category && current.category !== 'fixed' ? current.category : 'cafe', refresh);
  amount.addEventListener('input', () => { amount.classList.remove('bad'); refresh(); });
  date.addEventListener('change', refresh);
  openDialog(item ? 'Modifier la dépense' : 'Nouvelle dépense', close => [wrapMoney(amount), error.node, group, h('div', {class: 'two'}, field('Libellé', label), field('Date', date)), impact, foot(close, item ? 'Enregistrer' : 'Ajouter')], () => {
    const value = core.parseMoney(amount.value);
    if (!value) return error.show('Saisis un montant, par exemple 4,50.', amount);
    if (!core.isDate(date.value)) return error.show('Choisis une date.', date);
    const entry = {id: item?.id ?? core.newId(), date: date.value, undated: Boolean(item?.undated && item.date === date.value), category: category(), label: label.value.trim() || CATEGORY[category()].label, amount: value};
    closeDialog();
    freshId = entry.id;
    const other = entry.date.slice(0, 7) !== month;
    change(p => { p.expenses = [...p.expenses.filter(old => old.id !== entry.id), entry]; }, other ? `Enregistré dans ${monthName(entry.date.slice(0, 7))}.` : item ? 'Dépense modifiée.' : `${money(value)} ajoutés.`);
  });
  refresh();
}

function buyDialog() {
  const amount = moneyInput({class: 'input big', placeholder: '0', 'data-first': '', 'aria-label': 'Prix en euros'});
  const result = h('div', {'aria-live': 'polite'}), record = h('button', {type: 'submit', class: 'btn primary', disabled: true}, 'Je l’achète, enregistrer');
  let group;
  const category = () => group.querySelector('input:checked').value;
  const target = now().slice(0, 7);
  let shown = '';
  const refresh = () => {
    const value = core.parseMoney(amount.value);
    record.disabled = !value;
    if (!value) { shown = ''; result.replaceChildren(h('div', {class: 'impact'}, icon('info'), 'Saisis le prix pour avoir la réponse.')); return; }
    const p = profile(), data = compute(target), answer = core.canBuy(p, data, value, category());
    const next = core.addMonths(target, 1);
    let title, lines = [];
    if (answer.verdict === 'unknown') { title = 'Il me manque ton salaire'; lines = ['Saisis-le pour avoir une réponse.']; }
    else if (answer.reason === 'fits') {
      title = answer.verdict === 'yes' ? 'Oui, tu peux' : 'Oui, mais c’est juste';
      lines = [`Il te restera ${money(answer.left)} en ${answer.label.toLowerCase()} jusqu’à la fin du mois.`];
    } else if (answer.reason === 'borrow') {
      title = 'Possible, avec un compromis';
      lines = [`C’est ${money(answer.over)} de plus que ta limite ${answer.label.toLowerCase()}. Il te resterait ${money(answer.after)} pour tous tes plaisirs du mois.`];
    } else if (answer.reason === 'eats') {
      title = 'Possible, avec un compromis';
      lines = [`C’est ${money(answer.over)} de plus que l’enveloppe ${answer.label.toLowerCase()}. Ta tolérance plaisir descendrait à ${money(answer.after)}.`];
    } else {
      title = 'Pas ce mois-ci';
      lines = [`Il te manque ${money(answer.over)} sans toucher à tes charges ni à ton épargne.`];
      if (answer.safety) lines.push(`Si c’est urgent, ta réserve de sécurité (${money(answer.safety)}) est là pour ça.`);
      else if (answer.months === 1) lines.push(`Attends le 1er ${monthName(next).split(' ')[0]}, ça tiendra dans ta limite.`);
      else if (answer.months) lines.push(`En réservant ta limite ${answer.label.toLowerCase()} (${money(answer.limit)} par mois), il faudrait ${answer.months} mois. Crée un projet pour y arriver plus sereinement.`);
    }
    const cls = answer.verdict === 'unknown' ? '' : answer.verdict;
    result.replaceChildren(h('div', {class: 'verdict ' + cls + (shown === title ? '' : ' pop')}, h('strong', null, icon({yes: 'check', tight: 'alert', no: 'no', unknown: 'info'}[answer.verdict]), title), lines.map(text => h('p', null, text))));
    shown = title;
  };
  group = chips('Pour quoi ?', 'buy', ['online', 'cafe', 'outings', 'groceries', 'transport', 'health', 'essentials', 'unexpected'], 'online', refresh);
  amount.addEventListener('input', refresh);
  openDialog('Je peux l’acheter ?', close => [wrapMoney(amount), group, result, h('div', {class: 'dlg-foot'}, h('button', {type: 'button', class: 'btn', onclick: close}, 'Fermer'), record)], () => {
    const value = core.parseMoney(amount.value);
    if (value) expenseDialog(null, {amount: value, category: category(), date: now()});
  });
  refresh();
}

function chargeDialog(charge = null, single = null) {
  const item = charge ?? single, error = errorBox();
  const label = h('input', {class: 'input', type: 'text', maxLength: 65, value: item?.label ?? '', placeholder: 'Loyer', autocomplete: 'off', 'data-first': ''});
  const amount = moneyInput({value: formatInput(item?.amount), placeholder: '0'});
  const day = h('input', {class: 'input', type: 'text', inputMode: 'numeric', maxLength: 2, value: charge?.day ?? '', placeholder: 'Facultatif', autocomplete: 'off'});
  const repeat = h('input', {type: 'checkbox', checked: !single});
  const end = charge?.until ? `Vaut de ${monthName(month)} à ${monthName(core.addMonths(charge.until, -1))}.` : `Vaut à partir de ${monthName(month)}.`;
  openDialog(item ? 'Modifier la charge' : 'Nouvelle charge fixe', close => [field('Libellé', label), h('div', {class: 'two'}, field('Montant', wrapMoney(amount)), field('Jour du prélèvement', day)),
    h('label', {class: 'check'}, repeat, 'Reprendre tous les mois'), h('p', {class: 'soft small'}, charge ? end : `À partir de ${monthName(month)}.`), error.node, foot(close, item ? 'Enregistrer' : 'Ajouter')], () => {
    const name = label.value.trim(), value = core.parseMoney(amount.value), dayText = day.value.trim(), dayNumber = dayText === '' ? null : Number(dayText);
    if (!name) return error.show('Saisis un libellé.', label);
    if (!value) return error.show('Saisis un montant, par exemple 750.', amount);
    if (dayNumber !== null && !(Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 31)) return error.show('Le jour va de 1 à 31.', day);
    closeDialog();
    change(p => {
      const fields = {label: name, amount: value, day: dayNumber};
      if (single) p.expenses = p.expenses.filter(entry => entry.id !== single.id);
      if (repeat.checked) {
        if (charge) core.updateCharge(p, charge.id, month, fields);
        else core.addCharge(p, month, fields);
      } else {
        if (charge) core.stopCharge(p, charge.series, month);
        const date = month + '-' + core.pad(Math.min(dayNumber ?? 1, core.daysInMonth(month)));
        p.expenses.push({id: core.newId(), date, undated: dayNumber === null, category: 'fixed', label: name, amount: value});
      }
    }, item ? 'Charge modifiée.' : 'Charge ajoutée.');
  });
}

function salaryDialog() {
  const p = profile(), salary = core.salaryFor(p, month), error = errorBox();
  const net = moneyInput({value: formatInput(salary.raw?.net), placeholder: '2 000', 'data-first': ''});
  const gross = moneyInput({value: formatInput(salary.raw?.gross), placeholder: 'Facultatif'});
  const ratio = h('input', {class: 'input', type: 'text', inputMode: 'decimal', value: String(salary.raw?.ratio ?? 75).replace('.', ','), autocomplete: 'off'});
  openDialog('Mon salaire', close => [field('Net reçu sur ton compte', wrapMoney(net), `Repris chaque mois à partir de ${monthName(month)}.`),
    h('div', {class: 'two'}, field('Brut', wrapMoney(gross), 'Utilisé si le net est vide.'), field('Part du brut reçue en net', h('div', {class: 'money', 'data-unit': '%'}, ratio), '75 % est une estimation.')), error.node, foot(close, 'Enregistrer')], () => {
    const read = input => input.value.trim() === '' ? null : core.parseMoney(input.value) ?? NaN;
    const netValue = read(net), grossValue = read(gross), ratioValue = Number(ratio.value.trim().replace(',', '.'));
    if (Number.isNaN(netValue)) return error.show('Ce montant net est incorrect.', net);
    if (Number.isNaN(grossValue)) return error.show('Ce montant brut est incorrect.', gross);
    if (netValue === null && grossValue === null) return error.show('Saisis ton net ou ton brut.', net);
    if (!(ratioValue > 0 && ratioValue <= 100)) return error.show('Le pourcentage va de 1 à 100.', ratio);
    closeDialog();
    change(q => { q.salaries[month] = {net: netValue, gross: grossValue, ratio: ratioValue}; }, 'Salaire enregistré.');
  });
}

function incomeDialog(item = null) {
  const error = errorBox();
  const label = h('input', {class: 'input', type: 'text', maxLength: 65, value: item?.label ?? '', placeholder: 'Prime, remboursement, vente', autocomplete: 'off'});
  const amount = moneyInput({class: 'input big', value: formatInput(item?.amount), placeholder: '0', 'data-first': '', 'aria-label': 'Montant en euros'});
  const date = h('input', {class: 'input', type: 'date', value: item?.date ?? defaultDate()});
  openDialog(item ? 'Modifier la rentrée' : 'Rentrée d’argent', close => [h('p', {class: 'soft'}, 'En plus du salaire. Elle augmente tes plafonds de ce mois-là.'), wrapMoney(amount), h('div', {class: 'two'}, field('Libellé', label), field('Date', date)), error.node, foot(close, item ? 'Enregistrer' : 'Ajouter')], () => {
    const value = core.parseMoney(amount.value);
    if (!value) return error.show('Saisis un montant.', amount);
    if (!core.isDate(date.value)) return error.show('Choisis une date.', date);
    const entry = {id: item?.id ?? core.newId(), date: date.value, label: label.value.trim() || 'Rentrée d’argent', amount: value};
    closeDialog();
    freshId = entry.id;
    change(p => { p.incomes = [...p.incomes.filter(old => old.id !== entry.id), entry]; }, 'Rentrée enregistrée.');
  });
}

function depositDialog(pot = null, withdraw = false) {
  const p = profile(), data = compute(), error = errorBox();
  const select = h('select', {class: 'input'}, [['safety', 'Réserve de sécurité'], ...p.projects.map(item => [item.id, item.name])].map(([value, label]) => h('option', {value, selected: value === (pot ?? 'safety')}, label)));
  const planned = data.income === null ? null : Math.max(0, pot && pot !== 'safety' ? data.envelopes.projects.left : data.envelopes.safety.left);
  const amount = moneyInput({class: 'input big', value: !withdraw && planned ? formatInput(planned) : '', placeholder: '0', 'data-first': '', 'aria-label': 'Montant en euros'});
  const date = h('input', {class: 'input', type: 'date', value: defaultDate()});
  let out = withdraw;
  const mode = h('div', {class: 'seg', role: 'group', 'aria-label': 'Type de mouvement'}, [[false, 'Verser'], [true, 'Retirer']].map(([value, label]) => h('button', {type: 'button', 'aria-pressed': String(out === value), onclick: event => {
    out = value;
    for (const item of mode.children) item.setAttribute('aria-pressed', String(item === event.currentTarget));
  }}, label)));
  openDialog('Mouvement d’épargne', close => [mode, wrapMoney(amount), h('div', {class: 'two'}, field('Où', select), field('Date', date)), error.node,
    h('p', {class: 'soft small'}, 'Pense à faire le virement dans ta banque : le site note le mouvement, il ne déplace pas d’argent.'), foot(close, 'Enregistrer')], () => {
    const value = core.parseMoney(amount.value);
    if (!value) return error.show('Saisis un montant.', amount);
    if (!core.isDate(date.value)) return error.show('Choisis une date.', date);
    if (out && value > core.potBalance(p, select.value, date.value.slice(0, 7))) return error.show(`Il y a ${money(core.potBalance(p, select.value, date.value.slice(0, 7)))} disponibles.`, amount);
    const entry = {id: core.newId(), date: date.value, pot: select.value, amount: out ? -value : value};
    closeDialog();
    freshId = entry.id;
    change(q => { q.deposits.push(entry); }, out ? 'Retrait enregistré.' : `${money(value)} mis de côté.`);
  });
}

function reserveDialog() {
  const p = profile(), error = errorBox();
  const initial = moneyInput({value: formatInput(p.safety.initial), 'data-first': ''});
  const months = h('input', {class: 'input', type: 'text', inputMode: 'numeric', value: p.safety.months, autocomplete: 'off'});
  const target = moneyInput({value: formatInput(p.safety.target), placeholder: 'Calculé'});
  openDialog('Réserve de sécurité', close => [field('Déjà de côté avant d’utiliser le site', wrapMoney(initial)), h('div', {class: 'two'}, field('Objectif en mois de dépenses', months, 'Charges fixes et quotidien. 3 mois est un bon début.'), field('Ou un montant précis', wrapMoney(target), 'Vide : calculé à partir des mois.')), error.node, foot(close, 'Enregistrer')], () => {
    const initialValue = initial.value.trim() === '' ? 0 : core.parseMoney(initial.value), monthsValue = Number(months.value.trim()), targetValue = target.value.trim() === '' ? null : core.parseMoney(target.value);
    if (initialValue === null) return error.show('Ce montant est incorrect.', initial);
    if (!Number.isInteger(monthsValue) || monthsValue < 1 || monthsValue > 24) return error.show('Choisis entre 1 et 24 mois.', months);
    if (target.value.trim() !== '' && !targetValue) return error.show('Ce montant est incorrect.', target);
    closeDialog();
    change(q => { q.safety = {initial: initialValue, months: monthsValue, target: targetValue}; }, 'Réserve mise à jour.');
  });
}

function projectDialog(item = null) {
  const error = errorBox();
  const name = h('input', {class: 'input', type: 'text', maxLength: 40, value: item?.name ?? '', placeholder: 'Voyage', autocomplete: 'off', 'data-first': ''});
  const target = moneyInput({value: formatInput(item?.target), placeholder: '0'});
  const start = now().slice(0, 7), choices = Array.from({length: 60}, (_, i) => core.addMonths(start, i + 1));
  if (item?.deadline && !choices.includes(item.deadline)) choices.unshift(item.deadline);
  const deadline = h('select', {class: 'input'}, h('option', {value: ''}, 'Sans date'), choices.map(value => h('option', {value, selected: value === item?.deadline}, monthName(value))));
  const used = item && profile().deposits.some(entry => entry.pot === item.id);
  openDialog(item ? 'Modifier le projet' : 'Nouveau projet', close => [field('Nom', name), h('div', {class: 'two'}, field('Montant', wrapMoney(target)), field('Pour', deadline)), error.node,
    foot(close, item ? 'Enregistrer' : 'Créer', null, item && btn('Supprimer', () => {
      closeDialog();
      change(p => { p.projects = p.projects.filter(entry => entry.id !== item.id); p.deposits = p.deposits.filter(entry => entry.pot !== item.id); }, used ? 'Projet et versements supprimés.' : 'Projet supprimé.');
    }, 'danger'))], () => {
    const value = core.parseMoney(target.value);
    if (!name.value.trim()) return error.show('Donne un nom au projet.', name);
    if (!value) return error.show('Saisis un montant.', target);
    const entry = {id: item?.id ?? core.newId(), name: name.value.trim(), target: value, deadline: deadline.value || null};
    closeDialog();
    change(p => { p.projects = item ? p.projects.map(old => old.id === item.id ? entry : old) : [...p.projects, entry]; }, item ? 'Projet modifié.' : 'Projet créé.');
  });
}

function renameDialog() {
  const error = errorBox(), p = profile();
  const name = h('input', {class: 'input', type: 'text', maxLength: 32, value: p.name, autocomplete: 'off', 'data-first': ''});
  openDialog('Renommer le profil', close => [field('Prénom', name), error.node, foot(close, 'Enregistrer')], () => {
    const value = name.value.trim();
    if (!value) return error.show('Saisis un prénom.', name);
    closeDialog();
    change(q => { q.name = value; }, 'Profil renommé.');
  });
}
function deleteProfileDialog() {
  const p = profile();
  openDialog(`Supprimer le profil « ${p.name} » ?`, close => [h('p', null, 'Ses salaires, dépenses et versements seront effacés de ce navigateur. Exporte une sauvegarde si tu veux les garder.'),
    h('div', {class: 'dlg-foot'}, btn('Exporter', exportJson, '', 'down'), h('button', {type: 'button', class: 'btn', 'data-first': '', onclick: close}, 'Annuler'), btn('Supprimer', () => {
      closeDialog();
      state.profiles = state.profiles.filter(item => item.id !== p.id);
      state.active = null;
      view = 'home';
      save();
      render();
    }, 'danger', 'trash'))]);
}

/* ---------- Import et export ---------- */
function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  h('a', {href: url, download: name}).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function exportJson() {
  const data = demo ? {...core.emptyState(), profiles: [demo]} : state;
  download(`budget-clair-${now()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast('Sauvegarde téléchargée.');
}
function exportCsv() {
  const p = profile(), first = core.firstMonth(p), end = [now().slice(0, 7), ...p.expenses.map(item => item.date.slice(0, 7))].sort().pop(), rows = [['Date', 'Type', 'Enveloppe', 'Catégorie', 'Libellé', 'Montant']];
  const amount = value => (value / 100).toFixed(2).replace('.', ',');
  for (let m = first; m && m <= end; m = core.addMonths(m, 1)) {
    const data = compute(m);
    if (data.salary.amount !== null) rows.push([m + '-01', 'Rentrée', '', 'Salaire', data.salary.estimated ? 'Net estimé' : 'Net', amount(data.salary.amount)]);
    for (const item of data.incomes) rows.push([item.date, 'Rentrée', '', 'Autre', item.label, amount(item.amount)]);
    for (const item of data.expenses) rows.push([item.date, 'Dépense', ENVELOPE[CATEGORY[item.category].envelope].label, CATEGORY[item.category].label, item.label, amount(-item.amount)]);
    for (const item of data.deposits) rows.push([item.date, item.amount > 0 ? 'Versement' : 'Retrait', 'Épargne', potName(item.pot), '', amount(item.amount)]);
  }
  /* Une apostrophe évite qu'un tableur exécute un libellé commençant par =, +, - ou @. */
  const cell = (value, index) => '"' + (index === 5 || !/^[=+\-@\t]/.test(value) ? value : "'" + value).replace(/"/g, '""') + '"';
  download(`budget-clair-${now()}.csv`, '﻿' + rows.map(row => row.map(cell).join(';')).join('\r\n'), 'text/csv');
  toast('Tableau téléchargé.');
}
function importJson() {
  const input = h('input', {type: 'file', accept: '.json,application/json', onchange: async () => {
    const file = input.files[0];
    if (!file) return;
    let incoming;
    try {
      const parsed = JSON.parse(await file.text());
      incoming = parsed?.version === core.VERSION ? core.cleanState(parsed) : core.migrateV1(parsed);
    } catch { incoming = core.emptyState(); }
    if (!incoming.profiles.length) return toast('Ce fichier n’est pas une sauvegarde de Budget Clair.');
    const replaced = incoming.profiles.filter(item => state.profiles.some(old => old.id === item.id));
    const apply = () => {
      const ids = new Set(incoming.profiles.map(item => item.id));
      state.profiles = [...state.profiles.filter(item => !ids.has(item.id)), ...incoming.profiles];
      state.active = incoming.active ?? incoming.profiles[0].id;
      demo = null; gate = false; view = 'home'; wasGate = true;
      last.clear();
      save();
      render();
      toast(plural(incoming.profiles.length, 'profil') + (incoming.profiles.length > 1 ? ' importés.' : ' importé.'));
    };
    if (!replaced.length) return apply();
    openDialog('Remplacer les données ?', close => [h('p', null, `La sauvegarde remplace ${replaced.map(item => '« ' + item.name + ' »').join(', ')} sur cet appareil.`), foot(close, 'Remplacer', () => { closeDialog(); apply(); })]);
  }});
  input.click();
}

/* ---------- Profils ---------- */
function gateView() {
  const error = errorBox();
  const name = h('input', {class: 'input', type: 'text', maxLength: 32, placeholder: 'Ton prénom', autocomplete: 'given-name', 'aria-label': 'Prénom'});
  const keep = oldBudgets && !state.profiles.length ? h('input', {type: 'checkbox', checked: true}) : null;
  const open = item => {
    state.active = item.id;
    gate = false; view = 'home'; month = now().slice(0, 7);
    last.clear();
    save();
    render();
  };
  return h('main', {class: 'gate', id: 'main', tabIndex: -1}, h('div', {class: 'card enter'}, brand(),
    h('div', null, h('h1', null, state.profiles.length ? 'Bon retour' : 'Ton argent, au clair'), h('p', {class: 'soft', style: {'margin-top': '8px'}}, state.profiles.length ? 'Choisis ton profil.' : 'Saisis ton salaire et tes dépenses. Le site te dit ce que tu peux encore dépenser et combien mettre de côté.')),
    notice && h('div', {class: 'banner', role: 'alert', style: {margin: '0'}}, notice),
    !storageOk && h('div', {class: 'banner', role: 'alert', style: {margin: '0'}}, 'L’enregistrement est bloqué dans ce navigateur.'),
    state.profiles.length > 0 && h('ul', null, state.profiles.map(item => h('li', null, h('button', {type: 'button', class: 'btn', onclick: () => open(item)}, h('span', {class: 'avatar'}, item.name.slice(0, 1).toUpperCase()), item.name)))),
    h('form', {noValidate: true, onsubmit: event => {
      event.preventDefault();
      const value = name.value.trim().replace(/\s+/g, ' ');
      if (!value) return error.show('Saisis ton prénom.', name);
      let item = state.profiles.find(entry => entry.name.toLocaleLowerCase('fr') === value.toLocaleLowerCase('fr'));
      if (!item) {
        item = keep?.checked ? core.migrateProfileV1({name: value, budgets: oldBudgets, charges: []}) : core.createProfile(value);
        state.profiles.push(item);
        navigator.storage?.persist?.().catch(() => {});
      }
      open(item);
    }}, field(state.profiles.length ? 'Nouveau profil' : 'Prénom', name), keep && h('label', {class: 'check'}, keep, 'Reprendre le budget déjà saisi ici'), error.node, h('button', {type: 'submit', class: 'btn primary'}, 'Ouvrir mon budget')),
    h('div', {class: 'btns'}, btn('Voir un exemple', () => { demo = demoProfile(); gate = false; view = 'home'; month = now().slice(0, 7); last.clear(); render(); }, 'slim'), btn('Importer une sauvegarde', importJson, 'slim', 'up')),
    h('p', {class: 'soft small'}, 'Tes données restent dans ce navigateur. Toute personne qui l’utilise peut ouvrir les profils.')));
}

/* Deux onglets ouverts : on reprend ce que l'autre vient d'enregistrer. */
addEventListener('storage', event => {
  if (event.key !== KEY || demo) return;
  if (dialog.open) { stale = true; return; }
  reload();
  render();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (state.theme === 'auto') render(); });
let seenDay = now();
document.addEventListener('visibilitychange', () => {
  if (document.hidden || dialog.open || seenDay === now()) return;
  if (month === seenDay.slice(0, 7)) month = now().slice(0, 7);
  seenDay = now();
  render();
});

load();
render();
})();
