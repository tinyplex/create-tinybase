import {createMergeableStore} from 'tinybase';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
const SERVER = 'wss://vite.tinybase.org';
const STORE_ID = 'game';
const store = createMergeableStore(STORE_ID)
  .setValue('currentPlayer', 'X')
  .setValue('gameStatus', 'playing');
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
