import './todoInput.css';
import {useState} from 'react';
import {useAddRowCallback} from './Store';
import {Button} from './Button';
import {Input} from './Input';
const TodoInput = () => {
  const [text, setText] = useState('');
  const addRow = useAddRowCallback('todos', () => ({text, completed: false}), [
    text,
  ]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      addRow();
      setText('');
    }
  };
  return (
    <form id="todoInput" onSubmit={handleSubmit}>
      <Input
        value={text}
        onChange={setText}
        placeholder="What needs to be done?"
        autoFocus
      />
      <Button type="submit" variant="primary">
        Add
      </Button>
    </form>
  );
};
export {TodoInput};
