'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../assets/core.js');

const TODAY = '2026-11-15';
const profile = () => {
  const p = core.createProfile('Test');
  p.salaries['2026-01'] = {net: 200000, gross: null, ratio: 75};
  return p;
};
const spend = (p, category, amount, date = '2026-11-10') => p.expenses.push({id: core.newId(), date, category, label: 'x', amount});
const amounts = (p, month) => core.chargesFor(p, month).map(c => c.amount);

test('le plan par défaut fait 100 %', () => {
  assert.equal(core.sum(Object.values(core.defaultPlan())), 100);
  assert.equal(core.sum(Object.values(core.defaultSplit())), 100);
});
test('montants saisis à la française', () => {
  for (const [input, expected] of [['12,50', 1250], ['12.5', 1250], ['1 200,05 €', 120005], ['0,1', 10], ['', null], ['abc', null], ['-5', null], ['1,234', null], ['9999999', null]]) {
    assert.equal(core.parseMoney(input), expected, input);
  }
});
test('bug 1 : modifier une charge arrêtée ne la fait pas revenir', () => {
  const p = profile();
  const c = core.addCharge(p, '2026-01', {label: 'Box', amount: 3000});
  core.stopCharge(p, c.series, '2026-06');
  core.updateCharge(p, c.id, '2026-03', {amount: 3500});
  assert.deepEqual(['2026-02', '2026-03', '2026-05', '2026-06', '2026-07'].map(m => amounts(p, m)), [[3000], [3500], [3500], [], []]);
});
test('bug 2 : modifier un mois passé garde le changement suivant', () => {
  const p = profile();
  const c = core.addCharge(p, '2026-01', {label: 'Loyer', amount: 80000});
  core.updateCharge(p, c.id, '2026-05', {amount: 85000});
  core.updateCharge(p, c.id, '2026-03', {amount: 82000});
  assert.deepEqual(['2026-01', '2026-03', '2026-04', '2026-05', '2026-12'].map(m => amounts(p, m)), [[80000], [82000], [82000], [85000], [85000]]);
});
test('arrêter une charge supprime aussi ses changements futurs', () => {
  const p = profile();
  const c = core.addCharge(p, '2026-01', {label: 'Salle', amount: 3000});
  core.updateCharge(p, c.id, '2026-08', {amount: 4000});
  core.stopCharge(p, c.series, '2026-06');
  assert.deepEqual(['2026-05', '2026-06', '2026-09'].map(m => amounts(p, m)), [[3000], [], []]);
});
test('bug 3 : le salaire est repris les mois suivants', () => {
  const p = profile();
  p.salaries['2026-06'] = {net: 220000, gross: null, ratio: 75};
  assert.equal(core.salaryFor(p, '2025-12').amount, null);
  assert.equal(core.salaryFor(p, '2026-05').amount, 200000);
  assert.equal(core.salaryFor(p, '2026-11').amount, 220000);
  assert.equal(core.salaryFor(p, '2026-11').inherited, true);
});
test('bug 5 : des données illisibles donnent un état vide', () => {
  for (const bad of [null, {}, [], 'x', {profiles: 3}, {profiles: [null, 4]}]) assert.deepEqual(core.cleanState(bad).profiles, []);
  const p = core.cleanState({profiles: [{name: 'A', expenses: [{date: '2026-13-01', category: 'cafe', label: 'x', amount: 1}, {date: '2026-01-01', category: 'constructor', label: 'x', amount: 1}], plan: {fixed: 90}}]}).profiles[0];
  assert.deepEqual(p.expenses, []);
  assert.deepEqual(p.plan, core.defaultPlan());
});
test('un état valide traverse cleanState sans changer', () => {
  const p = profile();
  core.addCharge(p, '2026-01', {label: 'Loyer', amount: 80000, day: 5});
  p.projects.push({id: 'p1', name: 'Voyage', target: 100000, deadline: '2027-06'});
  p.deposits.push({id: 'd', date: '2026-11-02', pot: 'p1', amount: 5000});
  p.expenses.push({id: 'e', date: '2026-11-02', undated: false, category: 'cafe', label: 'Café', amount: 300});
  const state = {version: 2, active: p.id, theme: 'light', skin: 1, profiles: [p]};
  assert.deepEqual(core.cleanState(JSON.parse(JSON.stringify(state))), state);
});
test('reprise des données de la version 1', () => {
  const state = core.migrateV1({active: 'a', profiles: [{id: 'a', name: 'Lina',
    budgets: {
      '2026-10': {net: 2000.5, gross: null, ratio: 75, reserve: 500, target: 3000, expenses: [{label: 'Resto', category: 'leisure', amount: 2500}, {label: 'Loyer', category: 'fixed', amount: 80000, series: 's'}]},
      '2026-11': {net: null, gross: null, ratio: 75, reserve: null, target: null, expenses: [{label: 'Courses', category: 'essentials', amount: 4000}]}
    },
    charges: [{id: 's', from: '2026-10', entry: {label: 'Loyer', category: 'fixed', amount: 80000}}]}]});
  const p = state.profiles[0];
  assert.equal(state.active, 'a');
  assert.equal(p.safety.initial, 50000);
  assert.equal(p.safety.target, 300000);
  assert.equal(p.expenses.length, 2);
  const d = core.compute(p, '2026-11', TODAY);
  assert.equal(d.income, 200050);
  assert.equal(d.envelopes.fixed.spent, 80000);
  assert.equal(core.compute(p, '2026-10', TODAY).leaf.outings.spent, 2500);
});
test('plafonds en euros selon le salaire', () => {
  const d = core.compute(profile(), '2026-11', TODAY);
  assert.deepEqual(core.ENVELOPES.map(e => d.envelopes[e.key].budget), [100000, 30000, 20000, 10000, 0, 20000, 10000, 10000]);
  assert.equal(d.tolerance, 20000);
  assert.deepEqual(d.subs.map(s => s.limit), [8000, 7000, 5000]);
  assert.deepEqual(d.subs.map(s => s.available), [8000, 7000, 5000]);
  assert.equal(d.daysLeft, 16);
});
test('la tolérance baisse avec le plaisir et les débordements', () => {
  const p = profile();
  spend(p, 'cafe', 3000);
  assert.equal(core.compute(p, '2026-11', TODAY).tolerance, 17000);
  spend(p, 'groceries', 35000); // 50 € au-dessus du quotidien
  const d = core.compute(p, '2026-11', TODAY);
  assert.equal(d.tolerance, 12000);
  assert.equal(d.limitedBy, 'cash');
  assert.ok(core.sum(d.subs.map(s => s.available)) <= 12000);
});
test('des charges trop hautes réduisent la tolérance', () => {
  const p = profile();
  core.addCharge(p, '2026-01', {label: 'Loyer', amount: 115000});
  assert.equal(core.compute(p, '2026-11', TODAY).tolerance, 5000);
});
test('verser son épargne ne change pas la tolérance, retirer de la réserve aide', () => {
  const p = profile();
  p.deposits.push({id: 'd', date: '2026-11-02', pot: 'safety', amount: 20000});
  assert.equal(core.compute(p, '2026-11', TODAY).tolerance, 20000);
  spend(p, 'unexpected', 40000);
  assert.equal(core.compute(p, '2026-11', TODAY).tolerance, -10000);
  p.safety.initial = 100000;
  p.deposits.push({id: 'w', date: '2026-11-03', pot: 'safety', amount: -30000});
  const d = core.compute(p, '2026-11', TODAY);
  assert.equal(d.tolerance, 20000);
  assert.equal(core.potBalance(p, 'safety', '2026-11'), 90000);
  assert.equal(d.cash, 200000 + 30000 - 40000 - 20000);
});
test('je peux l’acheter ?', () => {
  const p = profile();
  const ask = (amount, category) => core.canBuy(p, core.compute(p, '2026-11', TODAY), amount, category);
  assert.equal(ask(3000, 'online').verdict, 'yes');
  assert.equal(ask(6500, 'online').verdict, 'tight');
  assert.equal(ask(9000, 'online').reason, 'borrow');
  assert.equal(ask(30000, 'online').verdict, 'no');
  assert.equal(ask(30000, 'online').over, 10000);
  assert.equal(ask(30000, 'online').months, 5);
  assert.equal(ask(10000, 'groceries').verdict, 'yes');
  assert.equal(ask(35000, 'groceries').reason, 'eats');
  assert.equal(ask(80000, 'unexpected').verdict, 'no');
  p.safety.initial = 100000;
  assert.equal(ask(80000, 'unexpected').safety, 100000);
  assert.equal(core.canBuy(core.createProfile('v'), core.compute(core.createProfile('v'), '2026-11', TODAY), 100, 'cafe').verdict, 'unknown');
});
test('un plan sans investissement est gardé, pas remplacé', () => {
  const old = {fixed: 60, essentials: 15, leisure: 5, unexpected: 5, safety: 10, projects: 5};
  const p = core.cleanProfile({name: 'A', plan: old});
  assert.deepEqual(p.plan, {...old, invest: 0, debts: 0});
  assert.equal(core.cleanState({version: 2, theme: 'auto', profiles: []}).theme, 'dark');
});
test('khotta : toujours 100 %, couvre les charges, épargne quand c’est possible', () => {
  for (let euros = 0; euros <= 2100; euros += 7) {
    const p = profile();
    if (euros) core.addCharge(p, '2026-01', {label: 'x', amount: euros * 100});
    const d = core.compute(p, '2026-11', TODAY), k = core.recommend(p, d, TODAY);
    assert.equal(core.sum(Object.values(k.plan)), 100, String(euros));
    assert.ok(Object.values(k.plan).every(v => Number.isInteger(v) && v >= 0), JSON.stringify(k.plan));
    if (euros <= 2000) assert.ok(k.amounts.fixed >= euros * 100);
    if (euros && euros <= 1400) assert.ok(k.shares.saving >= 10 && k.plan.leisure >= 5, euros + JSON.stringify(k.plan));
    p.plan = k.plan;
    assert.equal(core.recommend(p, core.compute(p, '2026-11', TODAY), TODAY).active, true);
  }
});
test('khotta : la réserve passe avant l’investissement', () => {
  const p = profile();
  core.addCharge(p, '2026-01', {label: 'Loyer', amount: 70000});
  const get = balance => { p.safety.initial = balance; return core.recommend(p, core.compute(p, '2026-11', TODAY), TODAY); };
  const k = get(0);
  assert.deepEqual(k.plan, {fixed: 35, essentials: 15, leisure: 20, unexpected: 5, debts: 0, safety: 20, projects: 5, invest: 0});
  assert.equal(k.monthly, 100000);
  assert.deepEqual([0, 100000, 300000, 600000].map(v => get(v).stage), [0, 1, 2, 3]);
  assert.deepEqual([0, 100000, 300000, 600000].map(v => get(v).plan.invest), [0, 5, 13, 16]);
  assert.equal(k.reached[0].month, '2027-01'); // 400 € par mois, 1000 € au 3e mois
  assert.equal(get(300000).reached[1].done, true);
  assert.equal(core.recommend(core.createProfile('v'), core.compute(core.createProfile('v'), '2026-11', TODAY), TODAY), null);
});
test('khotta : un versement déjà fait ce mois-ci n’est pas compté deux fois', () => {
  const p = profile();
  core.addCharge(p, '2026-01', {label: 'Loyer', amount: 70000});
  p.deposits.push({id: 'd', date: '2026-11-02', pot: 'safety', amount: 40000});
  assert.equal(core.recommend(p, core.compute(p, '2026-11', TODAY), TODAY).reached[0].month, '2027-01');
});
test('investissement : enveloppe séparée des projets', () => {
  const p = profile();
  p.deposits.push({id: 'i', date: '2026-11-02', pot: 'invest', amount: 5000});
  const d = core.compute(p, '2026-11', TODAY);
  assert.equal(d.envelopes.invest.spent, 5000);
  assert.equal(d.envelopes.projects.spent, 0);
  assert.equal(d.tolerance, 20000);
  assert.equal(core.project(10000, 10, 0), 1200000);
  assert.ok(Math.abs(core.project(10000, 10, 0.05) - 1544000) < 10000);
});
test('trèfle', () => {
  const p = profile();
  const leaves = () => core.clover(p, core.compute(p, '2026-11', TODAY), TODAY).map(l => l.done);
  assert.deepEqual(leaves(), [false, false, false, false, false]);
  core.addCharge(p, '2026-01', {label: 'Loyer', amount: 70000});
  p.safety.initial = 100000;
  for (const m of ['08', '09', '10']) p.deposits.push({id: m, date: `2026-${m}-02`, pot: 'invest', amount: 5000});
  assert.deepEqual(leaves(), [true, true, false, true, true]);
});
test('réserve et projets', () => {
  const p = profile();
  core.addCharge(p, '2026-01', {label: 'Loyer', amount: 80000});
  p.safety.initial = 110000;
  const d = core.compute(p, '2026-11', TODAY);
  const s = core.safetyStatus(p, d);
  assert.equal(s.monthly, 110000);
  assert.equal(s.target, 330000);
  assert.equal(s.covers, 1);
  assert.equal(s.months, 10); // 2200 € manquants, 200 € ce mois-ci puis 10 mois
  const project = {id: 'p', name: 'Voyage', target: 120000, deadline: '2027-05'};
  p.projects.push(project);
  assert.equal(core.projectStatus(p, project, '2026-11').perMonth, 20000);
});
test('conseils', () => {
  const p = profile();
  const tips = () => core.advise(p, core.compute(p, '2026-11', TODAY), null);
  assert.equal(core.advise(core.createProfile('v'), core.compute(core.createProfile('v'), '2026-11', TODAY))[0].action, 'salary');
  spend(p, 'cafe', 17000);
  assert.ok(tips().some(t => t.level === 'warn' && t.title.startsWith('Plaisir')));
  spend(p, 'online', 5000);
  assert.ok(tips()[0].level === 'critical' && tips()[0].title.includes('20'));
});
test('historique sans mois vides avant le début', () => {
  assert.deepEqual(core.history(profile(), '2026-03', 6, TODAY).map(d => d.month), ['2026-01', '2026-02', '2026-03']);
  assert.equal(core.addMonths('2026-01', -1), '2025-12');
  assert.equal(core.addMonths('2026-12', 1), '2027-01');
});

/* ---------- Crédits ---------- */
const debt = (p, fields) => { const d = {id: core.newId(), name: 'Karim', kind: 'person', amount: 60000, start: '2026-11', monthly: null, day: null, deadline: null, ...fields}; p.debts.push(d); return d; };
test('crédits : un crédit à mensualité compte dans les charges fixes jusqu’au bout', () => {
  const p = profile();
  const car = debt(p, {name: 'Crédit voiture', kind: 'bank', amount: 50000, start: '2026-09', monthly: 20000, day: 5});
  const fixed = month => core.compute(p, month, TODAY).envelopes.fixed.spent;
  assert.deepEqual(['2026-08', '2026-09', '2026-10', '2026-11', '2026-12'].map(fixed), [0, 20000, 20000, 10000, 0]);
  const s = core.debtStatus(p, car, '2026-10');
  assert.equal(s.remaining, 10000);
  assert.equal(s.end, '2026-11');
  assert.equal(core.debtStatus(p, car, '2026-11').done, true);
  /* Un remboursement anticipé raccourcit le crédit. */
  p.repayments.push({id: 'r', date: '2026-10-20', debt: car.id, amount: 10000});
  assert.equal(fixed('2026-11'), 0);
  assert.equal(core.compute(p, '2026-10', TODAY).envelopes.debts.spent, 10000);
});
test('crédits : rembourser un proche baisse le reste sur le compte, pas la dette des autres', () => {
  const p = profile();
  const k = debt(p, {amount: 30000});
  p.repayments.push({id: 'r', date: '2026-11-03', debt: k.id, amount: 10000});
  const d = core.compute(p, '2026-11', TODAY);
  assert.equal(d.repaid, 10000);
  assert.equal(d.cash, 200000 - 10000);
  const s = core.debtStatus(p, k, '2026-11');
  assert.deepEqual([s.before, s.remaining, s.paid], [30000, 20000, 10000]);
  assert.equal(core.debtStatus(p, k, '2026-12').before, 20000);
});
test('crédits : plan de remboursement, dates promises puis la plus petite dette', () => {
  const p = profile();
  const big = debt(p, {name: 'Sara', amount: 90000});
  const small = debt(p, {name: 'Yassine', amount: 20000});
  const promised = debt(p, {name: 'Karim', amount: 40000, deadline: '2027-02'}); // 4 mois : 100 € par mois minimum
  const plan = core.debtPlan(p, '2026-11', 25000);
  assert.deepEqual(plan.items.map(i => i.debt.name), ['Karim', 'Yassine', 'Sara']);
  assert.deepEqual(plan.items.map(i => i.suggested), [10000, 15000, 0]);
  assert.equal(plan.items.find(i => i.debt === small).payoff, '2026-12');
  assert.equal(plan.items.find(i => i.debt === promised).risk, false);
  assert.equal(plan.free, '2027-04'); // 1500 € à 250 € par mois : 6 mois
  assert.equal(core.debtPlan(p, '2026-11', 5000).items[0].risk, true);
  assert.equal(core.debtPlan(p, '2026-11', 0).free, null);
  assert.equal(big.amount, 90000);
});
test('khotta : avec une dette, on rembourse avant d’investir', () => {
  const p = profile();
  core.addCharge(p, '2026-01', {label: 'Loyer', amount: 70000});
  p.safety.initial = 100000; // étape 2 : sans dette, 5 % investis
  debt(p, {amount: 300000});
  const k = core.recommend(p, core.compute(p, '2026-11', TODAY), TODAY);
  assert.equal(core.sum(Object.values(k.plan)), 100);
  assert.equal(k.plan.invest, 0);
  assert.equal(k.plan.debts, 15); // 60 % des 25 % d'épargne
  assert.equal(k.amounts.debts, 30000);
  assert.equal(k.debtFree, '2027-08'); // 3000 € à 300 € par mois
  /* Presque fini : la part est réduite à ce qui reste. */
  p.debts[0].amount = 5000;
  const end = core.recommend(p, core.compute(p, '2026-11', TODAY), TODAY);
  assert.equal(end.plan.debts, 3);
  assert.equal(core.sum(Object.values(end.plan)), 100);
  /* Une date promise proche passe avant le reste de l'épargne. */
  p.debts[0].amount = 120000;
  p.debts[0].deadline = '2026-12';
  assert.equal(core.recommend(p, core.compute(p, '2026-11', TODAY), TODAY).plan.debts, 25);
});
test('crédits : conseils et sauvegarde', () => {
  const p = profile();
  const k = debt(p, {amount: 30000, deadline: '2027-01'});
  p.repayments.push({id: 'r', date: '2026-11-03', debt: k.id, amount: 1000});
  const tips = core.advise(p, core.compute(p, '2026-11', TODAY), null);
  assert.ok(tips.some(t => t.level === 'warn' && t.action === 'khotta'));
  const copy = core.cleanProfile(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(copy.debts, p.debts);
  assert.deepEqual(copy.repayments, p.repayments);
  assert.equal(core.cleanProfile({...p, debts: []}).repayments.length, 0);
  assert.equal(core.firstMonth({...core.createProfile('v'), debts: [k]}), '2026-11');
});
