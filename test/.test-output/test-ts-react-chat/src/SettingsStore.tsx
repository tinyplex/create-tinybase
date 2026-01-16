import {createStore} from 'tinybase';
import {
  useCreateStore,
  useProvideStore,
  useValue,
  useSetValueCallback,
} from 'tinybase/ui-react';

const STORE_ID = 'settings';

export {useValue, useSetValueCallback};

export const SettingsStore = () => {
  const store = useCreateStore(() =>
    createStore().setValue('username', 'Carol'),
  );

  useProvideStore(STORE_ID, store);

  return null;
};
