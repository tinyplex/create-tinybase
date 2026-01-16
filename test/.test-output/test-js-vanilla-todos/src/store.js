import {createMergeableStore} from 'tinybase';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
const SERVER = 'wss://vite.tinybase.org';
const STORE_ID = 'todos';
const store = createMergeableStore(STORE_ID).setTable('todos', {
  1: {text: 'Learn TinyBase', completed: false},
  2: {text: 'Build an app', completed: false},
});
const serverPathId = location.pathname;
createWsSynchronizer(
  store,
  new ReconnectingWebSocket(SERVER + serverPathId),
).then(async (synchronizer) => {
  await synchronizer.startSync();
  synchronizer.getWebSocket().addEventListener('open', () => {
    synchronizer.load().then(() => synchronizer.save());
  });
});
export {store};
