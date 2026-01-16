import {store} from './store';
import {createTodoInput} from './todoInput';
import {createTodoList} from './todoList';
const app = () => {
  const appContainer = document.getElementById('app');
  const todoInputContainer = createTodoInput(store);
  appContainer.appendChild(todoInputContainer);
  const input = todoInputContainer.querySelector('input');
  input.focus();
  appContainer.appendChild(createTodoList(store));
};
export {app};
