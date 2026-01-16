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
const SERVER = 'wss://vite.tinybase.org';
const STORE_ID = 'todos';
const Store = () => {
  const store = useCreateStore(() =>
    createMergeableStore(STORE_ID).setTable('todos', {
      1: {text: 'Learn TinyBase', completed: false},
      2: {text: 'Build an app', completed: false},
    }),
  );
  useProvideStore(STORE_ID, store);
  useCreateSynchronizer(store, async (store2) => {
    const serverPathId = location.pathname;
    const synchronizer = await createWsSynchronizer(
      store2,
      new ReconnectingWebSocket(SERVER + serverPathId),
    );
    await synchronizer.startSync();
    synchronizer.getWebSocket().addEventListener('open', () => {
      synchronizer.load().then(() => synchronizer.save());
    });
    return synchronizer;
  });
  return null;
};
export {
  Store,
  useAddRowCallback,
  useDelRowCallback,
  useRow,
  useRowIds,
  useSetPartialRowCallback,
};
