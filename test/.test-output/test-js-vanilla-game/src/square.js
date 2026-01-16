import './square.css';
const createSquare = (position, value, onClick, disabled, winning) => {
  const square = document.createElement('button');
  square.className = `square${disabled ? ' disabled' : ''}${winning ? ' winning' : ''}`;
  square.textContent = value || '';
  square.disabled = disabled;
  square.addEventListener('click', onClick);
  return square;
};
export {createSquare};
