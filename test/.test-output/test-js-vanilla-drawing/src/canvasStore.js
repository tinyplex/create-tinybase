import {createMergeableStore} from 'tinybase';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
const SERVER = 'wss://vite.tinybase.org';
const STORE_ID = 'canvas';
const canvasStore = createMergeableStore(STORE_ID).setTable('strokes', {});
const serverPathId = location.pathname;
createWsSynchronizer(
  canvasStore,
  new ReconnectingWebSocket(SERVER + serverPathId),
).then(async (synchronizer) => {
  await synchronizer.startSync();
  synchronizer.getWebSocket().addEventListener('open', () => {
    synchronizer.load().then(() => synchronizer.save());
  });
});
export {canvasStore};
