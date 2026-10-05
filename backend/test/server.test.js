const test = require('node:test');
const assert = require('node:assert/strict');
const { resources, isDate, isTime } = require('../server');

test('isDate valide les dates au format YYYY-MM-DD', () => {
  assert.equal(isDate('2026-10-05'), true);
  assert.equal(isDate('05-10-2026'), false);
  assert.equal(isDate('2026/10/05'), false);
});

test('isTime valide les heures au format HH:MM', () => {
  assert.equal(isTime('14:30'), true);
  assert.equal(isTime('9:30'), false);
  assert.equal(isTime('14:60'), true);
});

test('la création d\'une todo nettoie le texte', () => {
  assert.deepEqual(resources.todos.create({ text: '  Réviser le CCNA  ' }), {
    text: 'Réviser le CCNA',
    done: false,
  });
});

test('la création d\'une todo refuse un texte vide', () => {
  assert.equal(resources.todos.create({ text: '   ' }), null);
});

test('la création d\'un événement valide la date et l\'heure', () => {
  assert.deepEqual(resources.events.create({
    title: 'Cours réseau',
    date: '2026-10-05',
    time: '08:30',
  }), {
    title: 'Cours réseau',
    date: '2026-10-05',
    time: '08:30',
  });
});

test('la création d\'un événement refuse une date invalide', () => {
  assert.equal(resources.events.create({
    title: 'Cours réseau',
    date: '05/10/2026',
    time: '08:30',
  }), null);
});

test('la création d\'un pomodoro accepte focus et break', () => {
  const focus = resources.pomodoros.create({ type: 'focus', minutes: 25 });
  const pause = resources.pomodoros.create({ type: 'break', minutes: 5 });

  assert.equal(focus.type, 'focus');
  assert.equal(focus.minutes, 25);
  assert.match(focus.at, /^\d{4}-\d{2}-\d{2}T/);

  assert.equal(pause.type, 'break');
  assert.equal(pause.minutes, 5);
});

test('la création d\'un pomodoro refuse une durée invalide', () => {
  assert.equal(resources.pomodoros.create({ type: 'focus', minutes: 0 }), null);
  assert.equal(resources.pomodoros.create({ type: 'other', minutes: 25 }), null);
});

test('la mise à jour d\'une todo modifie les champs fournis', () => {
  const todo = { id: 1, text: 'Ancienne tâche', done: false };
  resources.todos.update(todo, { text: '  Nouvelle tâche  ', done: true });

  assert.deepEqual(todo, { id: 1, text: 'Nouvelle tâche', done: true });
});

test('la mise à jour d\'un événement conserve les valeurs absentes', () => {
  const event = { id: 1, title: 'Cours', date: '2026-10-05', time: '08:30' };
  resources.events.update(event, { title: '  Nouveau cours  ' });

  assert.deepEqual(event, {
    id: 1,
    title: 'Nouveau cours',
    date: '2026-10-05',
    time: '08:30',
  });
});
