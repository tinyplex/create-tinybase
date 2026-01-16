import {createStore} from 'tinybase';

const STORE_ID = 'settings';

export const settingsStore = createStore().setValue('username', 'Carol');

export type SettingsStore = typeof settingsStore;
