import './button.css';
const createButton = (text, onClick, variant = 'default') => {
  const button = document.createElement('button');
  button.textContent = text;
  if (variant === 'primary') {
    button.className = 'primary';
  }
  button.addEventListener('click', onClick);
  return button;
};
export {createButton};
