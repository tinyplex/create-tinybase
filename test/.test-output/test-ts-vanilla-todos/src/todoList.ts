import './todoList.css';
import {type TodosStore} from './store';

import {createTodoItem} from './todoItem';

export const createTodoList = (store: TodosStore): HTMLDivElement => {
  const list = document.createElement('div');
  list.id = 'todoList';

  const render = () => {
    const todos = store.getTable('todos');
    const todoIds = Object.keys(todos);

    list.innerHTML = '';
    todoIds.forEach((id) => {
      const todo = todos[id];
      const item = createTodoItem(
        id,
        todo.text,
        todo.completed,
        () => {
          store.setPartialRow('todos', id, {completed: !todo.completed});
        },
        () => {
          store.delRow('todos', id);
        },
      );
      list.appendChild(item);
    });
  };

  store.addTablesListener(render);
  render();

  return list;
};
