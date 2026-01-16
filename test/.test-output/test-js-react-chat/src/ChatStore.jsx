import {createMergeableStore} from 'tinybase';
import {
  useCreateStore,
  useProvideStore,
  useAddRowCallback,
  useRow,
  useRowIds,
  useStore,
} from 'tinybase/ui-react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
import {useCreateSynchronizer} from 'tinybase/ui-react';
const SERVER = 'wss://vite.tinybase.org';
const STORE_ID = 'chat';
const ChatStore = () => {
  const store = useCreateStore(() =>
    createMergeableStore(STORE_ID).setTable('messages', {
      1: {username: 'Alice', text: 'Hello!', timestamp: Date.now() - 6e4},
      2: {username: 'Bob', text: 'Hi there!', timestamp: Date.now() - 3e4},
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
export {ChatStore, useAddRowCallback, useRow, useRowIds, useStore};
