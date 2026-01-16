import {settingsStore} from './settingsStore';

import {canvasStore} from './canvasStore';

import {createDrawingControls} from './drawingControls';

import {createCanvas} from './canvas';

const app = () => {
  const appContainer = document.getElementById('app')!;

  appContainer.appendChild(createDrawingControls(settingsStore, canvasStore));
  appContainer.appendChild(createCanvas(settingsStore, canvasStore));
};

export {app};
