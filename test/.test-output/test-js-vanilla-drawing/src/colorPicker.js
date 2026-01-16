import './colorPicker.css';
const createColorPicker = (store) => {
  const colors = [
    '#d81b60',
    '#1976d2',
    '#388e3c',
    '#f57c00',
    '#7b1fa2',
    '#fff',
  ];
  const container = document.createElement('div');
  container.id = 'colorPicker';
  const buttons = [];
  colors.forEach((color) => {
    const btn = document.createElement('button');
    btn.className = 'colorBtn';
    btn.style.background = color;
    btn.addEventListener('click', () => {
      store.setValue('brushColor', color);
    });
    container.appendChild(btn);
    buttons.push(btn);
  });
  const updateActive = () => {
    const currentColor = store.getValue('brushColor');
    buttons.forEach((btn, i) => {
      btn.classList.toggle('active', colors[i] === currentColor);
    });
  };
  store.addValueListener('brushColor', updateActive);
  updateActive();
  return container;
};
export {createColorPicker};
