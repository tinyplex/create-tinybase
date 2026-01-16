import {getUniqueId} from 'tinybase';

if (location.pathname === '/') {
  location.assign('/' + getUniqueId());
}
import {app} from './app';

addEventListener('load', () => {
  app();
});
