import './todoList.css';
import {useRowIds} from './Store';
import {TodoItem} from './TodoItem';
const TodoList = () => {
  const todoIds = useRowIds('todos', 'todos');
  return (
    <div id="todoList">
      {todoIds.map((id) => (
        <TodoItem key={id} rowId={id} />
      ))}
    </div>
  );
};
export {TodoList};
