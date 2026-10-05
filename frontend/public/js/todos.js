// ============================================================
// todos.js — section Tâches
// ============================================================
import { api, json } from './api.js';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const counter = document.getElementById('todo-counter');
const filterButtons = document.querySelectorAll('#todo-filters button');

let todos = [];
let filter = 'all';

function render() {
  // 1. Filtre
  const visible = todos.filter((t) => (filter === 'all' ? true : filter === 'done' ? t.done : !t.done));

  // 2. Liste (textContent : pas d'injection de HTML)
  list.innerHTML = '';
  if (!visible.length) list.innerHTML = '<li class="empty">Aucune tâche ici. Ajoutez-en une ci-dessus.</li>';

  visible.forEach((todo) => {
    const li = document.createElement('li');
    li.className = 'item' + (todo.done ? ' done' : '');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = todo.done;
    check.addEventListener('change', async () => {
      Object.assign(todo, await api(`/api/todos/${todo.id}`, json('PATCH', { done: check.checked })));
      render();
    });

    const label = document.createElement('span');
    label.textContent = todo.text;

    const del = document.createElement('button');
    del.className = 'danger';
    del.textContent = 'Supprimer';
    del.addEventListener('click', async () => {
      await api(`/api/todos/${todo.id}`, { method: 'DELETE' });
      todos = todos.filter((t) => t.id !== todo.id);
      render();
    });

    li.append(check, label, del);
    list.appendChild(li);
  });

  // 3. Compteur
  const left = todos.filter((t) => !t.done).length;
  counter.textContent = `${left} tâche${left > 1 ? 's' : ''} restante${left > 1 ? 's' : ''}`;
}

export async function initTodos() {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    todos.push(await api('/api/todos', json('POST', { text: input.value })));
    input.value = '';
    render();
  });

  filterButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.toggle('active', b === btn));
      render();
    })
  );

  todos = await api('/api/todos');
  render();
}
