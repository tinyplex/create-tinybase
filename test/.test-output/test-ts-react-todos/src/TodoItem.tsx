import './todoItem.css';
import {useDelRowCallback, useRow, useSetPartialRowCallback} from './Store';

import {Button} from './Button';

export const TodoItem = ({rowId}: {rowId: string}) => {
  const todo = useRow('todos', rowId, 'todos') as {
    text: string;
    completed: boolean;
  };
  const setPartialRow = useSetPartialRowCallback(
    'todos',
    rowId,
    (e: React.ChangeEvent<HTMLInputElement>) => ({completed: e.target.checked}),
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
