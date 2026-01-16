import {createMergeableStore} from 'tinybase';
import {
  useCreateStore,
  useProvideStore,
  useAddRowCallback,
  useDelRowCallback,
  useRow,
  useRowIds,
  useSetPartialRowCallback,
} from 'tinybase/ui-react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
import {useCreateSynchronizer} from 'tinybase/ui-react';
import type {MergeableStore} from 'tinybase';

const SERVER = 'wss://vite.tinybase.org';

const STORE_ID = 'todos';

export {
  useAddRowCallback,
  useDelRowCallback,
  useRow,
  useRowIds,
  useSetPartialRowCallback,
};

export const Store = () => {
  const store = useCreateStore(() =>
    createMergeableStore(STORE_ID).setTable('todos', {
      '1': {text: 'Learn TinyBase', completed: false},
      '2': {text: 'Build an app', completed: false},
    }),
  );

  useProvideStore(STORE_ID, store);

  useCreateSynchronizer(store, async (store: MergeableStore) => {
    const serverPathId = location.pathname;
    const synchronizer = await createWsSynchronizer(
      store,
      new ReconnectingWebSocket(SERVER + serverPathId),
    );
    await synchronizer.startSync();

    // If the websocket reconnects in the future, do another explicit sync.
    synchronizer.getWebSocket().addEventListener('open', () => {
      synchronizer.load().then(() => synchronizer.save());
    });

    return synchronizer;
  });

  return null;
};
