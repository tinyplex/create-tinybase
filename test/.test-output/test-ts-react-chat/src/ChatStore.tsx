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
import type {MergeableStore} from 'tinybase';

const SERVER = 'wss://vite.tinybase.org';

const STORE_ID = 'chat';

export {useAddRowCallback, useRow, useRowIds, useStore};

export const ChatStore = () => {
  const store = useCreateStore(() =>
    createMergeableStore(STORE_ID).setTable('messages', {
      '1': {username: 'Alice', text: 'Hello!', timestamp: Date.now() - 60000},
      '2': {username: 'Bob', text: 'Hi there!', timestamp: Date.now() - 30000},
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

    synchronizer.getWebSocket().addEventListener('open', () => {
      synchronizer.load().then(() => synchronizer.save());
    });

    return synchronizer;
  });

  return null;
};
