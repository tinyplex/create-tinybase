import {settingsStore} from './settingsStore';

import {chatStore} from './chatStore';

import {createButton} from './button';

import {createInput} from './input';

import {createMessage} from './message';

import {createMessages} from './messages';

import {createUsernameInput} from './usernameInput';

import {createMessageInput} from './messageInput';

const app = () => {
  const appContainer = document.getElementById('app')!;

  appContainer.appendChild(createUsernameInput(settingsStore, chatStore));
  appContainer.appendChild(createMessages(chatStore));

  const messageInputContainer = createMessageInput(settingsStore, chatStore);
  appContainer.appendChild(messageInputContainer);

  // Focus the input after it's in the DOM
  const messageInput = messageInputContainer.querySelector('input')!;
  messageInput.focus();
};

export {app};
