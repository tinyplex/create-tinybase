import {createStore} from 'tinybase';
import {
  useCreateStore,
  useProvideStore,
  useValue,
  useSetValueCallback,
  useValues,
} from 'tinybase/ui-react';
const STORE_ID = 'settings';
const SettingsStore = () => {
  const store = useCreateStore(() =>
    createStore().setValue('brushColor', '#d81b60').setValue('brushSize', 5),
  );
  useProvideStore(STORE_ID, store);
  return null;
};
export {SettingsStore, useSetValueCallback, useValue, useValues};
