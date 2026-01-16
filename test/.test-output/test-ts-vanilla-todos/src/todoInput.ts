import './todoInput.css';
import {type TodosStore} from './store';

import {createButton} from './button';

import {createInput} from './input';

export const createTodoInput = (store: TodosStore): HTMLDivElement => {
  const container = document.createElement('div');
  container.id = 'todoInput';

  const input = createInput('What needs to be done?');

  const addTodo = () => {
    const text = input.value.trim();
    if (text) {
      store.addRow('todos', {text, completed: false});
      input.value = '';
      input.focus();
    }
  };

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  });

  const addButton = createButton('Add', addTodo, 'primary');

  container.appendChild(input);
  container.appendChild(addButton);

  return container;
};
