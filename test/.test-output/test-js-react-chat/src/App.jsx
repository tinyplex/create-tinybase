import {StrictMode} from 'react';
import {Provider} from 'tinybase/ui-react';
import {Inspector} from 'tinybase/ui-react-inspector';
import {SettingsStore} from './SettingsStore';
import {ChatStore} from './ChatStore';
import {UsernameInput} from './UsernameInput';
import {Messages} from './Messages';
import {MessageInput} from './MessageInput';
const App = () => {
  return (
    <StrictMode>
      <Provider>
        <SettingsStore />
        <ChatStore />
        <UsernameInput />
        <Messages />
        <MessageInput />
        <Inspector />
      </Provider>
    </StrictMode>
  );
};
export {App};
