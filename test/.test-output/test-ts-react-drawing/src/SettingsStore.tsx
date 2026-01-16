import {createStore} from 'tinybase';
import {
  useCreateStore,
  useProvideStore,
  useValue,
  useSetValueCallback,
  useValues,
} from 'tinybase/ui-react';

const STORE_ID = 'settings';

export {useValue, useSetValueCallback, useValues};

export const SettingsStore = () => {
  const store = useCreateStore(() =>
    createStore().setValue('brushColor', '#d81b60').setValue('brushSize', 5),
  );

  useProvideStore(STORE_ID, store);

  return null;
};
