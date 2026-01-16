import './messageInput.css';
import {createButton} from './button';
import {createInput} from './input';
const createMessageInput = (settingsStore, chatStore) => {
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
export {createMessageInput};
