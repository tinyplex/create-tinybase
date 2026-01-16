import './input.css';
const createInput = (placeholder = '', value = '', onInput) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.value = value;
  if (onInput) {
    input.addEventListener('input', () => onInput(input.value));
  }
  return input;
};
export {createInput};
