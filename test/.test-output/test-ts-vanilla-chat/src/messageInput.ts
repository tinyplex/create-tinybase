import './messageInput.css';
import {type SettingsStore} from './settingsStore';
import {type ChatStore} from './chatStore';

import {createButton} from './button';

import {createInput} from './input';

export const createMessageInput = (
  settingsStore: SettingsStore,
  chatStore: ChatStore,
): HTMLDivElement => {
  const messageInputContainer = document.createElement('div');
  messageInputContainer.id = 'messageInput';

  const messageInput = createInput('Type a message...');
  messageInputContainer.appendChild(messageInput);

  const sendMessage = () => {
    const text = messageInput.value.trim();
    if (text) {
      chatStore.addRow('messages', {
        username: settingsStore.getValue('username'),
        text,
        timestamp: Date.now(),
      });
      messageInput.value = '';
      messageInput.focus();
    }
  };

  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  const sendButton = createButton('Send', sendMessage, 'primary');
  messageInputContainer.appendChild(sendButton);

  return messageInputContainer;
};
