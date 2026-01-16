import './drawingControls.css';
import {createButton} from './button';
import {createColorPicker} from './colorPicker';
import {createBrushSize} from './brushSize';
const createDrawingControls = (settingsStore, canvasStore) => {
  const controls = document.createElement('div');
  controls.id = 'drawingControls';
  controls.appendChild(createColorPicker(settingsStore));
  controls.appendChild(createBrushSize(settingsStore));
  const clearButton = createButton(
    'Clear',
    () => canvasStore.delTable('strokes'),
    'primary',
  );
  controls.appendChild(clearButton);
  return controls;
};
export {createDrawingControls};
