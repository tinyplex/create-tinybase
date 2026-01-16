import './usernameInput.css';
import {createInput} from './input';
const createUsernameInput = (settingsStore, chatStore) => {
  const container = document.createElement('div');
  container.id = 'usernameInput';
  const label = document.createElement('label');
  label.textContent = 'Your name:';
  const usernameInput = createInput(
    'Enter your name',
    settingsStore.getValue('username'),
  );
  container.appendChild(label);
  container.appendChild(usernameInput);
  usernameInput.addEventListener('input', () => {
    settingsStore.setValue('username', usernameInput.value);
  });
  settingsStore.addValuesListener(() => {
    usernameInput.value = settingsStore.getValue('username');
  });
  return container;
};
export {createUsernameInput};
