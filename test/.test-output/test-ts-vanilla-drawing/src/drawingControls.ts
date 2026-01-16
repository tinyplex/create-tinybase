import './drawingControls.css';
import type {Store as SettingsStore} from './settingsStore';
import type {Store as CanvasStore} from './canvasStore';

import {createButton} from './button';

import {createColorPicker} from './colorPicker';

import {createBrushSize} from './brushSize';

export const createDrawingControls = (
  settingsStore: SettingsStore,
  canvasStore: CanvasStore,
): HTMLDivElement => {
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
