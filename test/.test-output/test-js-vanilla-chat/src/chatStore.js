import {createMergeableStore} from 'tinybase';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
const SERVER = 'wss://vite.tinybase.org';
const STORE_ID = 'chat';
const chatStore = createMergeableStore(STORE_ID).setTable('messages', {
  1: {username: 'Alice', text: 'Hello!', timestamp: Date.now() - 6e4},
  2: {username: 'Bob', text: 'Hi there!', timestamp: Date.now() - 3e4},
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
export {chatStore};
