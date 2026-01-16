import './drawingControls.css';
import {useDelTableCallback} from './CanvasStore';

import {Button} from './Button';

import {ColorPicker} from './ColorPicker';

import {BrushSize} from './BrushSize';

export const DrawingControls = () => {
  const clearStrokes = useDelTableCallback('strokes', () => null, [], 'canvas');

  return (
    <div id="drawingControls">
      <ColorPicker />
      <BrushSize />
      <Button onClick={clearStrokes} variant="primary">
        Clear
      </Button>
    </div>
  );
};
