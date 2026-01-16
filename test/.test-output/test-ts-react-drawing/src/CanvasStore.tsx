import {createMergeableStore} from 'tinybase';
import {useCreateStore, useProvideStore, useAddRowCallback, useDelTableCallback, useRow, useRowIds, useStore, useTable} from 'tinybase/ui-react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import {createWsSynchronizer} from 'tinybase/synchronizers/synchronizer-ws-client';
import {useCreateSynchronizer} from 'tinybase/ui-react';
import type {MergeableStore} from 'tinybase';

const SERVER = 'wss://vite.tinybase.org';

const STORE_ID = 'canvas';


export {useAddRowCallback, useDelTableCallback, useRow, useRowIds, useStore, useTable};

export const CanvasStore = () => {
  const store = useCreateStore(() =>\n    createMergeableStore(STORE_ID)
      .setTable('strokes', {}),
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