/* Budget Clair : modèle de données et calculs, sans accès au DOM.
   Tous les montants sont des entiers en centimes. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BudgetCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 2;
  const MAX_AMOUNT = 100000000; // 1 000 000 €

  const ENVELOPES = [
    {key: 'fixed', label: 'Charges fixes', hint: 'Loyer, factures, assurances, crédits', plan: 50},
    {key: 'essentials', label: 'Quotidien', hint: 'Courses, transport, santé', plan: 15},
    {key: 'leisure', label: 'Plaisir', hint: 'Cafés, achats en ligne, sorties', plan: 10},
    {key: 'unexpected', label: 'Imprévus', hint: 'Réparations, factures surprises', plan: 5},
    {key: 'debts', label: 'Remboursements', hint: 'Argent rendu aux proches, crédits sans mensualité', plan: 0},
    {key: 'safety', label: 'Sécurité', hint: 'Argent de côté pour les coups durs', plan: 10},
    {key: 'projects', label: 'Épargne projets', hint: 'Voyage, voiture, apport', plan: 5},
    {key: 'invest', label: 'Investissement', hint: 'Argent placé pour le long terme', plan: 5}
  ];
  const SAVING_KEYS = ['safety', 'projects', 'invest'];
  const ENVELOPE = Object.fromEntries(ENVELOPES.map(item => [item.key, item]));

  const CATEGORIES = [
    {key: 'cafe', label: 'Cafés et restos', envelope: 'leisure', icon: 'coffee', split: 40},
    {key: 'online', label: 'Achats en ligne', envelope: 'leisure', icon: 'bag', split: 35},
    {key: 'outings', label: 'Sorties et loisirs', envelope: 'leisure', icon: 'ticket', split: 25},
    {key: 'groceries', label: 'Courses', envelope: 'essentials', icon: 'cart'},
    {key: 'transport', label: 'Transport', envelope: 'essentials', icon: 'car'},
    {key: 'health', label: 'Santé', envelope: 'essentials', icon: 'heart'},
    {key: 'essentials', label: 'Autres besoins', envelope: 'essentials', icon: 'home'},
    {key: 'unexpected', label: 'Imprévu', envelope: 'unexpected', icon: 'bolt'},
    {key: 'fixed', label: 'Charge fixe', envelope: 'fixed', icon: 'repeat'}
  ];
  const CATEGORY = Object.fromEntries(CATEGORIES.map(item => [item.key, item]));
  const LEISURE = CATEGORIES.filter(item => item.envelope === 'leisure');

  /* ---------- Dates et montants ---------- */
  const pad = value => String(value).padStart(2, '0');
  const isMonth = value => typeof value === 'string' && /^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(value);
  const isDate = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !isMonth(value.slice(0, 7))) return false;
    const day = Number(value.slice(8));
    return day >= 1 && day <= daysInMonth(value.slice(0, 7));
  };
  function daysInMonth(month) {
    const [year, index] = month.split('-').map(Number);
    return new Date(Date.UTC(year, index, 0)).getUTCDate();
  }
  function addMonths(month, count) {
    const [year, index] = month.split('-').map(Number);
    const total = year * 12 + index - 1 + count;
    return Math.floor(total / 12) + '-' + pad(total % 12 + 1);
  }
  function monthsBetween(from, to) {
    const [y1, m1] = from.split('-').map(Number);
    const [y2, m2] = to.split('-').map(Number);
    return (y2 - y1) * 12 + m2 - m1;
  }
  function parseMoney(text) {
    const clean = String(text ?? '').replace(/[\s  €]/g, '').replace(',', '.');
    if (!/^\d+(\.\d{0,2})?$|^\.\d{1,2}$/.test(clean)) return null;
    const cents = Math.round(Number(clean) * 100);
    return cents <= MAX_AMOUNT ? cents : null;
  }
  const sum = list => list.reduce((total, value) => total + value, 0);
  const newId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);

  /* ---------- Création, validation et migration ---------- */
  const defaultPlan = () => Object.fromEntries(ENVELOPES.map(item => [item.key, item.plan]));
  const defaultSplit = () => Object.fromEntries(LEISURE.map(item => [item.key, item.split]));

  function createProfile(name) {
    return {
      id: newId(), name, plan: defaultPlan(), split: defaultSplit(), coffee: 300,
      safety: {initial: 0, months: 3, target: null}, invest: {initial: 0},
      projects: [], deposits: [], salaries: {}, incomes: [], expenses: [], charges: [], debts: [], repayments: []
    };
  }
  const emptyState = () => ({version: VERSION, active: null, theme: 'dark', skin: 1, profiles: []});

  const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
  const cents = (value, min = 0) => Number.isSafeInteger(value) && value >= min && value <= MAX_AMOUNT;
  const list = value => Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
  const id = value => typeof value === 'string' && value ? value : newId();

  function cleanPercents(value, base) {
    const result = {};
    for (const key of Object.keys(base)) {
      const number = value?.[key];
      if (!Number.isFinite(number) || number < 0 || number > 100) return base;
      result[key] = Math.round(number * 10) / 10;
    }
    return Math.abs(sum(Object.values(result)) - 100) < 0.05 ? result : base;
  }

  function cleanProfile(raw) {
    const profile = createProfile(text(raw?.name, 32) || 'Mon budget');
    profile.id = id(raw?.id);
    /* Un plan d'avant les enveloppes Investissement ou Remboursements est gardé tel quel, avec 0 % pour elles. */
    const plan = raw?.plan && typeof raw.plan === 'object' ? {invest: 0, debts: 0, ...raw.plan} : raw?.plan;
    profile.plan = cleanPercents(plan, profile.plan);
    profile.split = cleanPercents(raw?.split, profile.split);
    if (cents(raw?.coffee, 1)) profile.coffee = raw.coffee;
    if (cents(raw?.safety?.initial)) profile.safety.initial = raw.safety.initial;
    if (Number.isInteger(raw?.safety?.months) && raw.safety.months >= 1 && raw.safety.months <= 24) profile.safety.months = raw.safety.months;
    if (cents(raw?.safety?.target, 1)) profile.safety.target = raw.safety.target;
    if (cents(raw?.invest?.initial)) profile.invest.initial = raw.invest.initial;
    profile.projects = list(raw?.projects).filter(item => text(item.name, 40) && cents(item.target, 1)).map(item => ({
      id: id(item.id), name: text(item.name, 40), target: item.target, deadline: isMonth(item.deadline) ? item.deadline : null
    }));
    const pots = new Set(['safety', 'invest', ...profile.projects.map(item => item.id)]);
    profile.deposits = list(raw?.deposits)
      .filter(item => isDate(item.date) && pots.has(item.pot) && Number.isSafeInteger(item.amount) && item.amount !== 0 && Math.abs(item.amount) <= MAX_AMOUNT)
      .map(item => ({id: id(item.id), date: item.date, pot: item.pot, amount: item.amount}));
    for (const [month, value] of Object.entries(raw?.salaries ?? {})) {
      if (!isMonth(month) || !value) continue;
      const net = cents(value.net) ? value.net : null;
      const gross = cents(value.gross) ? value.gross : null;
      const ratio = Number.isFinite(value.ratio) && value.ratio > 0 && value.ratio <= 100 ? value.ratio : 75;
      if (net !== null || gross !== null) profile.salaries[month] = {net, gross, ratio};
    }
    profile.incomes = list(raw?.incomes).filter(item => isDate(item.date) && text(item.label, 65) && cents(item.amount, 1))
      .map(item => ({id: id(item.id), date: item.date, label: text(item.label, 65), amount: item.amount}));
    profile.expenses = list(raw?.expenses)
      .filter(item => isDate(item.date) && Object.hasOwn(CATEGORY, item.category) && text(item.label, 65) && cents(item.amount, 1))
      .map(item => ({id: id(item.id), date: item.date, undated: item.undated === true, category: item.category, label: text(item.label, 65), amount: item.amount}));
    profile.charges = list(raw?.charges)
      .filter(item => isMonth(item.from) && text(item.label, 65) && cents(item.amount, 1) && (item.until == null || (isMonth(item.until) && item.until > item.from)))
      .map(item => ({
        id: id(item.id), series: id(item.series), from: item.from, until: item.until ?? null, label: text(item.label, 65), amount: item.amount,
        day: Number.isInteger(item.day) && item.day >= 1 && item.day <= 31 ? item.day : null
      }));
    profile.debts = list(raw?.debts).filter(item => text(item.name, 40) && cents(item.amount, 1) && isMonth(item.start)).map(item => ({
      id: id(item.id), name: text(item.name, 40), kind: item.kind === 'bank' ? 'bank' : 'person', amount: item.amount, start: item.start,
      monthly: cents(item.monthly, 1) ? item.monthly : null,
      day: Number.isInteger(item.day) && item.day >= 1 && item.day <= 31 ? item.day : null,
      deadline: isMonth(item.deadline) ? item.deadline : null
    }));
    const debtIds = new Set(profile.debts.map(item => item.id));
    profile.repayments = list(raw?.repayments).filter(item => isDate(item.date) && debtIds.has(item.debt) && cents(item.amount, 1))
      .map(item => ({id: id(item.id), date: item.date, debt: item.debt, amount: item.amount}));
    return profile;
  }

  function cleanState(raw) {
    const state = emptyState();
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.profiles)) return state;
    state.profiles = list(raw.profiles).map(cleanProfile);
    if (raw.skin === 1 && ['auto', 'light', 'dark'].includes(raw.theme)) state.theme = raw.theme;
    state.active = state.profiles.some(item => item.id === raw.active) ? raw.active : null;
    return state;
  }

  /* Reprise de la première version du site. Les anciennes données restent dans le navigateur. */
  function migrateProfileV1(old) {
    const profile = createProfile(text(old?.name, 32) || 'Mon budget');
    profile.id = id(old?.id);
    const euros = value => Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
    const budgets = Object.entries(old?.budgets ?? {}).filter(([month, value]) => isMonth(month) && value).sort((a, b) => a[0] < b[0] ? -1 : 1);
    for (const [month, budget] of budgets) {
      const net = euros(budget.net);
      const gross = euros(budget.gross);
      if (net !== null || gross !== null) {
        profile.salaries[month] = {net, gross, ratio: Number.isFinite(budget.ratio) && budget.ratio > 0 ? budget.ratio : 75};
      }
      const reserve = euros(budget.reserve);
      const target = euros(budget.target);
      if (reserve !== null) profile.safety.initial = reserve;
      if (target) profile.safety.target = target;
      for (const entry of list(budget.expenses)) {
        if (entry.series) continue;
        const category = entry.category === 'leisure' ? 'outings' : entry.category;
        profile.expenses.push({id: newId(), date: month + '-01', undated: true, category, label: entry.label, amount: entry.amount});
      }
    }
    for (const rule of list(old?.charges)) {
      profile.charges.push({id: newId(), series: rule.id, from: rule.from, until: rule.until ?? null, label: rule.entry?.label, amount: rule.entry?.amount, day: null});
    }
    return cleanProfile(profile);
  }
  function migrateV1(registry) {
    const state = emptyState();
    state.profiles = list(registry?.profiles).map(migrateProfileV1);
    state.active = state.profiles.some(item => item.id === registry?.active) ? registry.active : null;
    return state;
  }

  /* ---------- Charges mensuelles ----------
     Une série est une suite de périodes [from, until[ qui ne se chevauchent pas. */
  const activeIn = (charge, month) => charge.from <= month && (!charge.until || month < charge.until);
  const chargesFor = (profile, month) => profile.charges.filter(item => activeIn(item, month));

  function addCharge(profile, month, fields) {
    const charge = {id: newId(), series: newId(), from: month, until: null, day: null, ...fields};
    profile.charges.push(charge);
    return charge;
  }
  /* Le changement vaut à partir de `month`, jusqu'au prochain changement ou arrêt déjà prévu. */
  function updateCharge(profile, chargeId, month, fields) {
    const charge = profile.charges.find(item => item.id === chargeId);
    if (!charge || !activeIn(charge, month)) return null;
    if (charge.from === month) return Object.assign(charge, fields);
    const next = {...charge, ...fields, id: newId(), from: month};
    charge.until = month;
    profile.charges.push(next);
    return next;
  }
  function stopCharge(profile, series, month) {
    profile.charges = profile.charges.filter(item => item.series !== series || item.from < month);
    for (const item of profile.charges) {
      if (item.series === series && (!item.until || item.until > month)) item.until = month;
    }
  }

  /* ---------- Crédits et dettes ----------
     Un crédit avec mensualité est payé tout seul chaque mois : il compte dans les charges fixes.
     Une dette sans mensualité (un prêt d'un proche, par exemple) est rendue avec l'enveloppe Remboursements. */
  const repaidUpTo = (profile, debt, month) => sum(profile.repayments.filter(item => item.debt === debt.id && item.date.slice(0, 7) <= month).map(item => item.amount));
  /* Reste dû à la fin du mois. Avant le mois de départ, la dette n'a pas encore commencé. */
  function debtLeft(profile, debt, month) {
    if (month < debt.start) return debt.amount;
    const manual = repaidUpTo(profile, debt, month);
    const auto = debt.monthly ? Math.max(0, Math.min(debt.monthly * (monthsBetween(debt.start, month) + 1), debt.amount - manual)) : 0;
    return Math.max(0, debt.amount - manual - auto);
  }
  function installment(profile, debt, month) {
    if (!debt.monthly || month < debt.start) return 0;
    const left = debt.amount - repaidUpTo(profile, debt, month) - debt.monthly * monthsBetween(debt.start, month);
    return Math.max(0, Math.min(debt.monthly, left));
  }
  function debtStatus(profile, debt, month) {
    const active = month >= debt.start;
    const before = active ? debtLeft(profile, debt, addMonths(month, -1)) : 0;
    const remaining = active ? debtLeft(profile, debt, month) : debt.amount;
    const paid = sum(profile.repayments.filter(item => item.debt === debt.id && item.date.slice(0, 7) === month).map(item => item.amount));
    return {
      active, before, remaining, paid, installment: installment(profile, debt, month),
      repaid: debt.amount - remaining, done: active && remaining === 0,
      percent: Math.max(0, Math.min(100, (debt.amount - remaining) * 100 / debt.amount)),
      end: debt.monthly && remaining ? addMonths(month, Math.ceil(remaining / debt.monthly)) : null,
      late: Boolean(debt.deadline && remaining && month > debt.deadline)
    };
  }
  /* Ce qu'il reste à rendre au début du mois sur les dettes sans mensualité, et le minimum pour tenir les dates promises. */
  function debtNeeds(profile, month) {
    let total = 0, minimum = 0;
    for (const debt of profile.debts) {
      if (debt.monthly || month < debt.start) continue;
      const before = debtLeft(profile, debt, addMonths(month, -1));
      total += before;
      if (debt.deadline && before) minimum += Math.ceil(before / Math.max(1, monthsBetween(month, debt.deadline) + 1));
    }
    return {total, minimum};
  }
  /* Le plan de remboursement : d'abord de quoi tenir chaque date promise, puis tout le reste sur la plus petite dette
     (méthode « boule de neige »). `budget` est le montant mensuel de l'enveloppe Remboursements. */
  function debtPlan(profile, month, budget) {
    const items = profile.debts.filter(debt => !debt.monthly && month >= debt.start)
      .map(debt => ({debt, ...debtStatus(profile, debt, month)})).filter(item => item.before > 0)
      .sort((a, b) => (a.debt.deadline ?? '9999-99').localeCompare(b.debt.deadline ?? '9999-99') || a.before - b.before)
      .map(item => ({...item, left: item.before, suggested: 0, payoff: null}));
    budget = Math.max(0, budget ?? 0);
    for (let i = 0; budget > 0 && i < 360 && items.some(item => item.left > 0); i++) {
      const current = addMonths(month, i);
      let pot = budget;
      const pay = (item, amount) => {
        const value = Math.max(0, Math.min(amount, item.left, pot));
        item.left -= value;
        pot -= value;
        if (i === 0) item.suggested += value;
        if (!item.left && !item.payoff) item.payoff = current;
      };
      for (const item of items) if (item.left && item.debt.deadline) pay(item, Math.ceil(item.left / Math.max(1, monthsBetween(current, item.debt.deadline) + 1)));
      for (const item of [...items].sort((x, y) => x.left - y.left)) if (item.left) pay(item, pot);
    }
    for (const item of items) {
      item.toPay = Math.max(0, item.suggested - item.paid);
      item.risk = Boolean(item.debt.deadline && (!item.payoff || item.payoff > item.debt.deadline));
      delete item.left;
    }
    const free = items.every(item => item.payoff) ? items.map(item => item.payoff).sort().pop() ?? null : null;
    return {items, free, total: sum(items.map(item => item.before)), suggested: sum(items.map(item => item.suggested))};
  }

  /* ---------- Revenus ---------- */
  function salaryFor(profile, month) {
    const from = Object.keys(profile.salaries).filter(key => key <= month).sort().pop();
    if (!from) return {amount: null, from: null, inherited: false, estimated: false, raw: null};
    const raw = profile.salaries[from];
    const estimated = raw.net === null;
    return {amount: estimated ? Math.round(raw.gross * raw.ratio / 100) : raw.net, from, inherited: from !== month, estimated, raw};
  }

  /* ---------- Calcul du mois ---------- */
  function potBalance(profile, pot, month) {
    const initial = pot === 'safety' ? profile.safety.initial : pot === 'invest' ? profile.invest.initial : 0;
    return initial + sum(profile.deposits.filter(item => item.pot === pot && item.date.slice(0, 7) <= month).map(item => item.amount));
  }
  const movements = (items, sign) => sum(items.map(item => Math.max(0, sign * item.amount)));

  function compute(profile, month, today) {
    const salary = salaryFor(profile, month);
    const inMonth = item => item.date.slice(0, 7) === month;
    const incomes = profile.incomes.filter(inMonth);
    const extra = sum(incomes.map(item => item.amount));
    const income = salary.amount === null && !extra ? null : (salary.amount ?? 0) + extra;
    const charges = chargesFor(profile, month).map(item => ({
      id: item.id, charge: item, category: 'fixed', label: item.label, amount: item.amount,
      date: month + '-' + pad(Math.min(item.day ?? 1, daysInMonth(month))), undated: !item.day
    }));
    for (const debt of profile.debts) {
      const amount = installment(profile, debt, month);
      if (amount) charges.push({id: 'debt-' + debt.id, debt, category: 'fixed', label: debt.name, amount,
        date: month + '-' + pad(Math.min(debt.day ?? 1, daysInMonth(month))), undated: !debt.day});
    }
    const expenses = [...profile.expenses.filter(inMonth), ...charges];
    const leaf = Object.fromEntries(CATEGORIES.map(item => [item.key, {spent: 0, count: 0}]));
    for (const item of expenses) {
      leaf[item.category].spent += item.amount;
      leaf[item.category].count += 1;
    }
    const deposits = profile.deposits.filter(inMonth);
    const envelopeOf = item => item.pot === 'safety' || item.pot === 'invest' ? item.pot : 'projects';
    const withdrawn = movements(deposits, -1);
    const repayments = profile.repayments.filter(inMonth);
    const repaid = sum(repayments.map(item => item.amount));

    const envelopes = {};
    for (const {key} of ENVELOPES) {
      const budget = income === null ? null : Math.round(income * profile.plan[key] / 100);
      const spent = key === 'debts' ? repaid : SAVING_KEYS.includes(key) ? movements(deposits.filter(item => envelopeOf(item) === key), 1) :
        sum(CATEGORIES.filter(item => item.envelope === key).map(item => leaf[item.key].spent));
      envelopes[key] = {
        key, budget, spent, plan: profile.plan[key],
        share: income ? spent * 100 / income : null,
        left: budget === null ? null : budget - spent,
        used: budget ? spent * 100 / budget : spent ? Infinity : 0
      };
    }
    const spent = sum(['fixed', 'essentials', 'leisure', 'unexpected'].map(key => envelopes[key].spent));
    const saved = sum(SAVING_KEYS.map(key => envelopes[key].spent));
    const cash = income === null ? null : income + withdrawn - spent - saved - repaid;

    const currentMonth = today.slice(0, 7);
    const phase = month === currentMonth ? 'current' : month < currentMonth ? 'past' : 'future';
    const days = daysInMonth(month);
    const day = phase === 'current' ? Number(today.slice(8)) : phase === 'past' ? days : 1;
    const daysLeft = phase === 'past' ? 0 : days - day + 1;

    /* Ce qui reste pour le plaisir une fois tout le reste mis de côté. */
    let tolerance = null, limitedBy = null, reserved = null;
    if (income !== null) {
      reserved = {
        fixed: envelopes.fixed.spent || envelopes.fixed.budget,
        essentials: Math.max(envelopes.essentials.budget, envelopes.essentials.spent),
        unexpected: Math.max(envelopes.unexpected.budget, envelopes.unexpected.spent),
        debts: Math.max(envelopes.debts.budget, envelopes.debts.spent),
        safety: Math.max(envelopes.safety.budget, envelopes.safety.spent),
        projects: Math.max(envelopes.projects.budget, envelopes.projects.spent),
        invest: Math.max(envelopes.invest.budget, envelopes.invest.spent)
      };
      const free = income + withdrawn - sum(Object.values(reserved)) - envelopes.leisure.spent;
      tolerance = Math.min(envelopes.leisure.left, free);
      limitedBy = free < envelopes.leisure.left - 1 ? 'cash' : 'plan'; // 1 centime d'arrondi toléré
      if (limitedBy === 'plan') tolerance = envelopes.leisure.left;
    }
    const subs = LEISURE.map(item => {
      const limit = income === null ? null : Math.round(envelopes.leisure.budget * profile.split[item.key] / 100);
      return {...item, limit, ...leaf[item.key], left: limit === null ? null : limit - leaf[item.key].spent, available: null};
    });
    if (tolerance !== null) {
      const open = sum(subs.map(item => Math.max(0, item.left)));
      const scale = open > tolerance ? Math.max(0, tolerance) / (open || 1) : 1;
      for (const item of subs) item.available = Math.floor(Math.max(0, item.left) * scale);
    }
    return {
      month, phase, day, days, daysLeft, salary, incomes, extra, income, expenses, charges, deposits, withdrawn, repayments, repaid,
      leaf, envelopes, subs, spent, saved, cash, tolerance, limitedBy, reserved,
      weekly: tolerance === null || !daysLeft ? null : daysLeft <= 7 ? Math.max(0, tolerance) : Math.floor(Math.max(0, tolerance) * 7 / daysLeft)
    };
  }

  /* ---------- Réserve de sécurité et projets ---------- */
  function safetyStatus(profile, data) {
    const balance = potBalance(profile, 'safety', data.month);
    const monthly = data.income === null ? 0 : (data.reserved.fixed + data.envelopes.essentials.budget);
    const target = profile.safety.target ?? (monthly ? monthly * profile.safety.months : null);
    const missing = target === null ? null : Math.max(0, target - balance);
    const planned = data.envelopes.safety.budget;
    const toGo = missing === null ? null : Math.max(0, missing - Math.max(0, (planned ?? 0) - data.envelopes.safety.spent));
    return {
      balance, target, missing, monthly,
      percent: target ? Math.max(0, Math.min(100, balance * 100 / target)) : 0,
      covers: monthly ? Math.max(0, balance) / monthly : null,
      months: missing === 0 ? 0 : planned ? Math.ceil(toGo / planned) : null
    };
  }
  function projectStatus(profile, project, month) {
    const balance = potBalance(profile, project.id, month);
    const missing = Math.max(0, project.target - balance);
    const left = project.deadline ? Math.max(0, monthsBetween(month, project.deadline)) : null;
    return {
      balance, missing, monthsLeft: left, late: Boolean(project.deadline && missing && month > project.deadline),
      percent: Math.max(0, Math.min(100, balance * 100 / project.target)),
      perMonth: left === null ? null : Math.ceil(missing / Math.max(1, left))
    };
  }

  /* ---------- « Je peux l'acheter ? » ---------- */
  function canBuy(profile, data, amount, category) {
    if (data.income === null) return {verdict: 'unknown'};
    const envelope = CATEGORY[category].envelope;
    const pool = data.tolerance;
    if (envelope === 'leisure') {
      const sub = data.subs.find(item => item.key === category);
      const base = {envelope, label: sub.label, available: sub.available, limit: sub.limit, after: pool - amount};
      if (amount <= sub.available) return {...base, verdict: sub.available - amount < sub.limit * 0.15 ? 'tight' : 'yes', reason: 'fits', left: sub.available - amount};
      if (amount <= pool) return {...base, verdict: 'tight', reason: 'borrow', over: amount - sub.available};
      return {...base, verdict: 'no', reason: 'over', over: amount - Math.max(0, pool), months: sub.limit ? Math.ceil(amount / sub.limit) : null};
    }
    const env = data.envelopes[envelope];
    // Une charge fixe non encore saisie est déjà réservée dans l'enveloppe.
    const room = Math.max(0, envelope === 'fixed' ? Math.min(env.left, env.spent ? Math.max(0, pool) : env.left) : env.left);
    const base = {envelope, label: ENVELOPE[envelope].label, available: room, limit: env.budget};
    if (amount <= room) return {...base, verdict: room - amount < env.budget * 0.1 ? 'tight' : 'yes', reason: 'fits', left: room - amount};
    const over = amount - room;
    if (over <= pool) return {...base, verdict: 'tight', reason: 'eats', over, after: pool - over};
    const safety = potBalance(profile, 'safety', data.month);
    const missing = over - Math.max(0, pool);
    return {...base, verdict: 'no', reason: 'over', over: missing, safety: envelope === 'unexpected' && safety >= missing ? safety : null};
  }

  /* ---------- Khotta : plan calculé ----------
     Repères : 50/30/20 (Warren et Tyagi), 50 à 60 % de charges et 20 à 25 % d'épargne (Sethi),
     réserve de 3 à 6 mois de dépenses avant d'investir davantage. */
  /* `withDebts` : la répartition tant qu'il reste une dette sans mensualité. Une petite réserve se construit
     en même temps, mais rien n'est investi : rembourser passe avant placer. */
  const STAGES = [
    {title: 'Poser le bouclier', goal: '1 mois de réserve', upTo: 1, split: {safety: 80, projects: 20, invest: 0}, withDebts: {safety: 50, projects: 10, invest: 0, debts: 40}},
    {title: 'Renforcer la réserve', goal: '3 mois de réserve', upTo: 3, split: {safety: 60, projects: 20, invest: 20}, withDebts: {safety: 30, projects: 10, invest: 0, debts: 60}},
    {title: 'Faire grandir l’argent', goal: '6 mois de réserve', upTo: 6, split: {safety: 25, projects: 25, invest: 50}, withDebts: {safety: 15, projects: 10, invest: 0, debts: 75}},
    {title: 'Bâtir sur la durée', goal: 'Réserve complète', upTo: Infinity, split: {safety: 0, projects: 35, invest: 65}, withDebts: {safety: 0, projects: 15, invest: 0, debts: 85}}
  ];
  const stageFor = months => STAGES.findIndex(item => months < item.upTo);

  function largestRemainder(exact, total) {
    const keys = Object.keys(exact);
    const result = Object.fromEntries(keys.map(key => [key, Math.floor(exact[key] + 1e-9)]));
    const order = [...keys].sort((x, y) => (exact[y] - result[y]) - (exact[x] - result[x]));
    let missing = total - sum(Object.values(result));
    for (let i = 0; missing > 0; i++, missing--) result[order[i % order.length]] += 1;
    return result;
  }

  /* Part réelle du quotidien sur les trois derniers mois terminés et suivis. */
  function usualEssentials(profile, month, today) {
    const shares = [];
    for (let i = 1; i <= 3; i++) {
      const data = compute(profile, addMonths(month, -i), today);
      const count = data.expenses.filter(item => CATEGORY[item.category].envelope === 'essentials').length;
      if (data.phase === 'past' && data.income && count >= 3) shares.push(data.envelopes.essentials.share);
    }
    return shares.length ? sum(shares) / shares.length : null;
  }

  function recommend(profile, data, today) {
    if (data.income === null || data.income <= 0) return null;
    const {income} = data;
    const hasCharges = data.envelopes.fixed.spent > 0;
    const fixedShare = hasCharges ? data.envelopes.fixed.share : 35;
    const fixed = Math.min(100, Math.ceil(fixedShare - 1e-9));
    const usual = usualEssentials(profile, data.month, today);
    const daily = usual === null ? 15 : Math.max(10, Math.min(25, Math.ceil(usual)));
    const ideal = {essentials: daily, leisure: 20, unexpected: 5, saving: 25};
    const floor = {essentials: 10, leisure: 5, unexpected: 3, saving: 10};
    const rest = 100 - fixed, best = sum(Object.values(ideal)), least = sum(Object.values(floor));
    const exact = {};
    for (const key of Object.keys(ideal)) {
      exact[key] = rest >= best ? ideal[key] : rest >= least ? floor[key] + (ideal[key] - floor[key]) * (rest - least) / (best - least) : floor[key] * rest / least;
    }
    if (rest > best) {
      const bonus = rest - best, fun = Math.min(5, bonus * 0.3);
      exact.leisure += fun;
      exact.saving += bonus - fun;
    }
    const parts = largestRemainder(exact, rest);
    const balance = potBalance(profile, 'safety', data.month);
    const monthly = Math.round(income * (fixed + parts.essentials) / 100);
    const covered = monthly ? Math.max(0, balance) / monthly : 0;
    const stage = stageFor(covered);
    const debts = debtNeeds(profile, data.month);
    /* Part du salaire pour chaque poche d'épargne et pour les remboursements, en pourcentages entiers. */
    const allocate = (index, need, minimum) => {
      let part = 0;
      if (need > 0) {
        part = Math.round(parts.saving * STAGES[index].withDebts.debts / 100);
        part = Math.max(part, Math.min(parts.saving, Math.ceil(minimum * 100 / income - 1e-9))); // les dates promises d'abord
        part = Math.min(part, Math.ceil(need * 100 / income - 1e-9)); // pas plus que ce qui reste dû
      }
      const split = part ? STAGES[index].withDebts : STAGES[index].split, rest = parts.saving - part;
      const weight = sum(SAVING_KEYS.map(key => split[key]));
      return {...largestRemainder(Object.fromEntries(SAVING_KEYS.map(key => [key, rest * split[key] / weight])), rest), debts: part};
    };
    const plan = {fixed, essentials: parts.essentials, leisure: parts.leisure, unexpected: parts.unexpected, ...allocate(stage, debts.total, debts.minimum)};
    const amounts = Object.fromEntries(Object.keys(plan).map(key => [key, Math.round(income * plan[key] / 100)]));

    /* Dates estimées de chaque palier, en suivant la khotta. Le mois en cours compte. */
    const reached = [1, 3, 6].map(months => ({months, target: monthly * months, month: balance >= monthly * months ? data.month : null, done: balance >= monthly * months}));
    let simulated = Math.max(0, balance - (data.phase === 'current' ? data.envelopes.safety.spent : 0)), owed = debts.total, debtFree = owed ? null : data.month;
    for (let i = 0; i < 240 && (reached.some(item => !item.month) || !debtFree); i++) {
      const part = allocate(stageFor(monthly ? simulated / monthly : 0), owed, debts.minimum);
      simulated += Math.round(income * part.safety / 100);
      owed -= Math.round(income * part.debts / 100);
      for (const item of reached) if (!item.month && simulated >= item.target) item.month = addMonths(data.month, i);
      if (!debtFree && owed <= 0) debtFree = addMonths(data.month, i);
    }
    const later = allocate(3, 0, 0).invest;
    return {
      plan, amounts, stage, covered, monthly, reached, hasCharges, usual, fixedShare, debts, debtFree,
      tight: rest < least, high: fixed > 60,
      cut: hasCharges && fixed > 50 ? Math.max(0, data.envelopes.fixed.spent - Math.round(income / 2)) : 0,
      shares: {needs: fixed + plan.essentials + plan.unexpected, wants: plan.leisure, saving: parts.saving},
      investLater: Math.round(income * later / 100),
      active: Object.keys(plan).every(key => Math.abs(plan[key] - profile.plan[key]) < 0.05)
    };
  }
  /* Versements mensuels en fin de mois, au taux annuel donné. */
  function project(amount, years, rate) {
    const r = (1 + rate) ** (1 / 12) - 1, n = years * 12;
    return Math.round(r ? amount * ((1 + r) ** n - 1) / r : amount * n);
  }

  /* Le trèfle à cinq feuilles : les étapes franchies. */
  function clover(profile, data, today) {
    const covers = recommend(profile, data, today)?.covered ?? 0;
    const env = data.envelopes;
    let kept = 0;
    const current = today.slice(0, 7);
    for (let i = 1; i <= 3; i++) {
      const past = compute(profile, addMonths(current, -i), today);
      if (past.income !== null && past.spent > 0 && past.saved > 0 && past.cash >= 0 && past.envelopes.leisure.left >= 0) kept++;
    }
    return [
      {title: 'Plan posé', hint: 'Salaire, charges et parts à jour', done: data.salary.amount !== null && env.fixed.spent > 0 && env.fixed.share <= env.fixed.plan + 0.5},
      {title: '1 mois de réserve', hint: 'Le premier bouclier', done: covers >= 1},
      {title: '3 mois de réserve', hint: 'Les coups durs sont couverts', done: covers >= 3},
      {title: 'Premier investissement', hint: 'Une somme placée pour longtemps', done: potBalance(profile, 'invest', data.month) > 0},
      {title: '3 mois tenus', hint: `${kept} sur 3 sans dépassement`, done: kept === 3}
    ];
  }

  /* ---------- Conseils ---------- */
  const euro = new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR'});
  const euro0 = new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'EUR', maximumFractionDigits: 0});
  const money = value => value === null || value === undefined ? '—' : (value % 100 === 0 ? euro0 : euro).format(value / 100);
  const percent = value => value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 1}).format(value) + ' %';

  function advise(profile, data, previous) {
    const tips = [];
    const add = (level, title, textValue, action) => tips.push({level, title, text: textValue, action});
    const {envelopes: env, income} = data;
    if (income === null) {
      add('info', 'Commence par ton salaire', 'Une fois ton net renseigné, chaque enveloppe affiche son plafond exact en euros.', 'salary');
      return tips;
    }
    if (data.cash < 0) {
      add('critical', 'Ton mois est à découvert', `Tes sorties dépassent tes rentrées de ${money(-data.cash)}. Bloque les achats plaisir et décale ce qui peut attendre.`);
    }
    if (env.fixed.spent && env.fixed.share > env.fixed.plan + 0.5) {
      add('warn', 'Tes charges fixes dépassent le plan', `Elles prennent ${percent(env.fixed.share)} de tes revenus pour un plafond de ${percent(env.fixed.plan)}, soit ${money(-env.fixed.left)} de trop. Renégocie un abonnement ou une assurance, ou suis la khotta recalculée.`, 'khotta');
    } else if (!env.fixed.spent && data.phase !== 'past') {
      add('info', 'Ajoute tes charges fixes', `En attendant, ${money(env.fixed.budget)} sont réservés pour elles. Avec tes vrais montants, le calcul sera exact.`, 'charges');
    }
    for (const key of ['essentials', 'leisure', 'unexpected']) {
      const item = env[key];
      const label = ENVELOPE[key].label;
      if (!item.spent) continue;
      if (item.left < 0) {
        const advice = key === 'leisure' ? 'Mets les cafés et les achats en ligne en pause jusqu’au mois prochain.' :
          key === 'essentials' ? 'Compense sur le plaisir ce mois-ci et prépare une liste avant les courses.' :
          'Puise dans ta réserve de sécurité plutôt que dans tes autres enveloppes.';
        add('critical', `${label} : plafond dépassé de ${money(-item.left)}`, data.phase === 'past' ? 'Vérifie si ce plafond est réaliste pour les prochains mois.' : advice);
      } else if (item.used >= 80 && data.phase === 'current' && data.daysLeft > 3) {
        add('warn', `${label} : ${percent(Math.round(item.used))} du plafond utilisé`, `Il te reste ${money(item.left)} pour ${data.daysLeft} jours.`);
      } else if (key !== 'unexpected' && data.phase === 'current' && data.day >= 6 && data.day < data.days - 2) {
        const dated = data.expenses.filter(entry => CATEGORY[entry.category].envelope === key && !entry.undated);
        const projected = Math.round(item.spent * data.days / data.day);
        if (dated.length >= 3 && projected > item.budget * 1.05) {
          add('warn', `${label} : tu dépenses un peu vite`, `À ce rythme, tu finirais le mois vers ${money(Math.round(projected / 100) * 100)} pour un plafond de ${money(item.budget)}. Vise ${money(Math.floor(item.left / data.daysLeft))} par jour au maximum.`);
        }
      }
    }
    if (data.phase !== 'past') {
      for (const sub of data.subs) {
        if (sub.spent && sub.left < 0 && env.leisure.left >= 0) {
          add('warn', `${sub.label} : limite dépassée de ${money(-sub.left)}`, 'Les autres limites plaisir sont réduites pour compenser.');
        }
      }
      if (data.limitedBy === 'cash' && data.tolerance > 0 && env.fixed.left >= 0) {
        add('info', 'Ta tolérance plaisir est réduite', `Une autre enveloppe a débordé. Il reste ${money(data.tolerance)} au lieu de ${money(env.leisure.left)}.`);
      }
      const toSave = sum(SAVING_KEYS.map(key => Math.max(0, env[key].left)));
      if (toSave > 0 && data.phase === 'current' && data.cash >= toSave) {
        add('info', `${money(toSave)} à mettre de côté ce mois-ci`, `${[env.safety.left > 0 && `${money(env.safety.left)} en sécurité`, env.projects.left > 0 && `${money(env.projects.left)} pour tes projets`, env.invest.left > 0 && `${money(env.invest.left)} à investir`].filter(Boolean).join(', ')}. Le plus simple est de faire le virement dès que le salaire arrive.`, 'deposit');
      } else if (toSave > 0 && data.phase === 'current' && data.cash > 0) {
        add('warn', 'Ton épargne du mois n’est plus couverte', `Il reste ${money(data.cash)} pour ${money(toSave)} prévus. Mets de côté ce que tu peux, même un petit montant.`, 'deposit');
      }
      if (env.fixed.spent && env.fixed.left > income * 0.04) {
        add('good', `${money(env.fixed.left)} de marge sur tes charges`, `Tes charges restent sous le plafond de ${percent(env.fixed.plan)}. La khotta la répartit pour toi.`, 'khotta');
      }
    } else if (data.cash > 0) {
      add('good', `Il t’est resté ${money(data.cash)}`, 'Si cet argent est encore sur ton compte, verse-le dans ta réserve de sécurité.');
    }
    const cafe = data.leaf.cafe;
    if (cafe.count >= 5) {
      add('info', `${cafe.count} cafés et restos, ${money(cafe.spent)}`, `Au même rythme toute l’année, cela fait ${money(cafe.spent * 12)}.`);
    }
    if (previous && previous.income !== null && data.phase === 'past') {
      for (const key of ['essentials', 'leisure']) {
        const before = previous.envelopes[key].spent;
        const diff = env[key].spent - before;
        if (before && diff > before * 0.2 && diff > 2000) add('info', `${ENVELOPE[key].label} : ${money(diff)} de plus que le mois d’avant`, `${money(env[key].spent)} contre ${money(before)}.`);
      }
    }
    if (data.phase !== 'past') {
      const needs = debtNeeds(profile, data.month);
      if (needs.total > 0 && !env.debts.budget) {
        add('warn', `Tu dois encore ${money(needs.total)} sans plan pour le rendre`, 'Ton plan ne prévoit rien pour rembourser. La khotta te propose une part Remboursements, prise sur l’épargne.', 'khotta');
      } else if (env.debts.left > 0 && data.phase === 'current' && needs.total > 0) {
        add('info', `${money(Math.min(env.debts.left, needs.total))} à rembourser ce mois-ci`, 'Le plan de remboursement te dit à qui rendre combien. Fais-le dès que le salaire arrive.', 'debts');
      }
      for (const item of debtPlan(profile, data.month, env.debts.budget).items) {
        if (item.risk) add('warn', `${item.debt.name} : la date promise ne tiendra pas`, `Il reste ${money(item.before)} à rendre. Préviens la personne et propose une nouvelle date, ou augmente ta part Remboursements.`, 'debts');
      }
    }
    const loans = sum(data.charges.filter(item => item.debt).map(item => item.amount));
    if (loans && loans > income * 0.35) {
      add('warn', `Tes mensualités prennent ${percent(Math.round(loans * 1000 / income) / 10)} de tes revenus`, 'Le repère des banques est 35 % au maximum. Évite tout nouveau crédit et rembourse en priorité.', 'debts');
    }
    const safety = safetyStatus(profile, data);
    if (safety.target && safety.missing === 0) add('good', 'Ta réserve de sécurité est complète', 'Tu peux investir davantage : la khotta recalcule tes parts.', 'khotta');
    if (!tips.some(tip => tip.level === 'critical' || tip.level === 'warn') && env.leisure.spent + env.essentials.spent > 0) {
      add('good', 'Tu tiens ton plan', 'Aucun plafond n’est dépassé. Continue comme ça.');
    }
    const order = {critical: 0, warn: 1, info: 2, good: 3};
    return tips.sort((a, b) => order[a.level] - order[b.level]);
  }

  /* ---------- Historique ---------- */
  function firstMonth(profile) {
    const months = [...Object.keys(profile.salaries), ...profile.charges.map(item => item.from), ...profile.debts.map(item => item.start),
      ...[...profile.expenses, ...profile.incomes, ...profile.deposits, ...profile.repayments].map(item => item.date.slice(0, 7))];
    return months.sort()[0] ?? null;
  }
  function history(profile, last, count, today) {
    const first = firstMonth(profile);
    const result = [];
    for (let i = count - 1; i >= 0; i--) {
      const month = addMonths(last, -i);
      if (first && month >= first) result.push(compute(profile, month, today));
    }
    return result;
  }

  return {
    VERSION, MAX_AMOUNT, ENVELOPES, ENVELOPE, CATEGORIES, CATEGORY, LEISURE,
    isMonth, isDate, daysInMonth, addMonths, monthsBetween, parseMoney, newId, money, percent, sum, pad,
    createProfile, emptyState, cleanProfile, cleanState, migrateV1, migrateProfileV1, defaultPlan, defaultSplit,
    chargesFor, addCharge, updateCharge, stopCharge, salaryFor, compute, potBalance, safetyStatus, projectStatus,
    canBuy, recommend, clover, project, STAGES, SAVING_KEYS, advise, history, firstMonth,
    debtLeft, debtStatus, debtNeeds, debtPlan
  };
});
