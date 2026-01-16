import {StrictMode} from 'react';
import {Provider} from 'tinybase/ui-react';
import {Inspector} from 'tinybase/ui-react-inspector';
import {SettingsStore} from './SettingsStore';
import {CanvasStore} from './CanvasStore';
import {DrawingControls} from './DrawingControls';
import {Canvas} from './Canvas';
const App = () => {
  return (
    <StrictMode>
      <Provider>
        <SettingsStore />
        <CanvasStore />
        <DrawingControls />
        <Canvas />
        <Inspector />
      </Provider>
    </StrictMode>
  );
};
export {App};
