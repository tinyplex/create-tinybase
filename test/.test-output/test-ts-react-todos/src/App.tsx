import {StrictMode} from 'react';
import {Provider} from 'tinybase/ui-react';
import {Inspector} from 'tinybase/ui-react-inspector';

import {Store} from './Store';

import {TodoInput} from './TodoInput';

import {TodoList} from './TodoList';

const App = () => {
  return (
    <StrictMode>
      <Provider>
        <Store />
        <TodoInput />
        <TodoList />
        <Inspector />
      </Provider>
    </StrictMode>
  );
};

export {App};
