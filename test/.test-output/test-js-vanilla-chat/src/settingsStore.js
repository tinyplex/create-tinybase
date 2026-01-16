import {createStore} from 'tinybase';
const STORE_ID = 'settings';
const settingsStore = createStore().setValue('username', 'Carol');
export {settingsStore};
