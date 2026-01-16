import {store} from './store';
import {createGame} from './game';
const app = () => {
  const appContainer = document.getElementById('app');
  appContainer.appendChild(createGame(store));
};
export {app};
