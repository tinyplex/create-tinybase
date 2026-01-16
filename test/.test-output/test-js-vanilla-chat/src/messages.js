import './messages.css';
import {createMessage} from './message';
const createMessages = (store) => {
  const messagesContainer = document.createElement('div');
  messagesContainer.id = 'messages';
  const updateMessages = () => {
    const messageRows = store.getTable('messages');
    const sortedIds = Object.keys(messageRows).sort(
      (a, b) => messageRows[a].timestamp - messageRows[b].timestamp,
    );
    messagesContainer.innerHTML = '';
    sortedIds.forEach((id) => {
      const msg = messageRows[id];
      const messageElement = createMessage(
        msg.username,
        msg.text,
        msg.timestamp,
      );
      messagesContainer.appendChild(messageElement);
    });
  };
  updateMessages();
  store.addTablesListener(updateMessages);
  return messagesContainer;
};
export {createMessages};
