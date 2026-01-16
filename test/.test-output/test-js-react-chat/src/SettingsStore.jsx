import {createStore} from 'tinybase';
import {
  useCreateStore,
  useProvideStore,
  useValue,
  useSetValueCallback,
} from 'tinybase/ui-react';
const STORE_ID = 'settings';
const SettingsStore = () => {
  const store = useCreateStore(() =>
    createStore().setValue('username', 'Carol'),
  );
  useProvideStore(STORE_ID, store);
  return null;
};
export {SettingsStore, useSetValueCallback, useValue};
