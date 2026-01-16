import {getUniqueId} from 'tinybase';
if (location.pathname === '/') {
  location.assign('/' + getUniqueId());
}
import ReactDOM from 'react-dom/client';
import {App} from './App';
addEventListener('load', () => {
  ReactDOM.createRoot(document.getElementById('app')).render(<App />);
});
