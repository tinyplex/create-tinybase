import {createStore} from 'tinybase';
const STORE_ID = 'settings';
const settingsStore = createStore()
  .setValue('brushColor', '#d81b60')
  .setValue('brushSize', 5);
export {settingsStore};
