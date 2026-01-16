import {settingsStore} from './settingsStore';
import {chatStore} from './chatStore';
import {createMessages} from './messages';
import {createUsernameInput} from './usernameInput';
import {createMessageInput} from './messageInput';
const app = () => {
  const appContainer = document.getElementById('app');
  appContainer.appendChild(createUsernameInput(settingsStore, chatStore));
  appContainer.appendChild(createMessages(chatStore));
  const messageInputContainer = createMessageInput(settingsStore, chatStore);
  appContainer.appendChild(messageInputContainer);
  const messageInput = messageInputContainer.querySelector('input');
  messageInput.focus();
};
export {app};
