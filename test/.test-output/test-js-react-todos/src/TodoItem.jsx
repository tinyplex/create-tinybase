import './todoItem.css';
import {useDelRowCallback, useRow, useSetPartialRowCallback} from './Store';
import {Button} from './Button';
const TodoItem = ({rowId}) => {
  const todo = useRow('todos', rowId, 'todos');
  const setPartialRow = useSetPartialRowCallback(
    'todos',
    rowId,
    (e) => ({completed: e.target.checked}),
    [],
    'todos',
  );
  const delRow = useDelRowCallback('todos', rowId, 'todos');
  return (
    <div className={`todoItem${todo.completed ? ' completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={setPartialRow}
        id={`todo-${rowId}`}
      />
      <label htmlFor={`todo-${rowId}`}>{todo.text}</label>
      <Button onClick={delRow}>Delete</Button>
    </div>
  );
};
export {TodoItem};
