import './board.css';
import {createSquare} from './square';
const createBoard = (store) => {
  const board = document.createElement('div');
  board.id = 'board';
  const render = () => {
    const gameStatus = store.getValue('gameStatus');
    const winningLine = store.getValue('winningLine');
    const currentPlayer = store.getValue('currentPlayer');
    const winningPositions = new Set(
      winningLine ? winningLine.split(',').map(Number) : [],
    );
    const disabled = gameStatus !== 'playing';
    board.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = store.getCell('board', i.toString(), 'value');
      const square = createSquare(
        i,
        cell,
        () => {
          if (gameStatus === 'playing' && !cell) {
            store.setCell('board', i.toString(), 'value', currentPlayer);
          }
        },
        disabled || !!cell,
        winningPositions.has(i),
      );
      board.appendChild(square);
    }
  };
  store.addValuesListener(render);
  store.addTableListener('board', render);
  render();
  return board;
};
export {createBoard};
