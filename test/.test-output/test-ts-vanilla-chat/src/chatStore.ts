import {createMergeableStore} from 'tinybase';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';

const SERVER = 'wss://vite.tinybase.org';

const STORE_ID = 'chat';

export const chatStore = createMergeableStore(STORE_ID).setTable('messages', {
  '1': {username: 'Alice', text: 'Hello!', timestamp: Date.now() - 60000},
  '2': {username: 'Bob', text: 'Hi there!', timestamp: Date.now() - 30000},
});

const serverPathId = location.pathname;
createWsSynchronizer(
  chatStore,
  new ReconnectingWebSocket(SERVER + serverPathId),
).then(async (synchronizer) => {
  await synchronizer.startSync();

  synchronizer.getWebSocket().addEventListener('open', () => {
    synchronizer.load().then(() => synchronizer.save());
  });
});

export type ChatStore = typeof chatStore;
