import {StrictMode, useState, useMemo} from 'react';
import {createStore} from 'tinybase';
import {
  Provider,
  useCreateStore,
  useAddRowCallback,
  useRow,
  useSetValueCallback,
  useValue,
  useRowIds,
  useStore,
} from 'tinybase/ui-react';
import {Inspector} from 'tinybase/ui-react-inspector';
const MessageInput = () => {
  const [message, setMessage] = useState('');
  const username = useValue('username') || 'Anonymous';
  const handleSend = useAddRowCallback(
    'messages',
    () => ({
      username,
      text: message,
      timestamp: Date.now(),
    }),
    [message, username],
  );
  const onSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      handleSend();
      setMessage('');
    }
  };
  return (
    <form onSubmit={onSubmit} className="message-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        autoFocus
      />
      <button type="submit">Send</button>
    </form>
  );
};
const Message = ({rowId}) => {
  const row = useRow('messages', rowId);
  const time = new Date(row.timestamp).toLocaleTimeString();
  return (
    <div className="message">
      <span className="username">{row.username}:</span>
      <span className="text">{row.text}</span>
      <span className="time">{time}</span>
    </div>
  );
};
const Messages = () => {
  const store = useStore();
  const messageIds = useRowIds('messages');
  const sortedIds = useMemo(() => {
    return [...messageIds].sort((a, b) => {
      const rowA = store.getRow('messages', a);
      const rowB = store.getRow('messages', b);
      return rowA.timestamp - rowB.timestamp;
    });
  }, [messageIds, store]);
  return (
    <div className="messages">
      {sortedIds.map((id) => (
        <Message key={id} rowId={id} />
      ))}
    </div>
  );
};
const UsernameInput = () => {
  const username = useValue('username') || '';
  const handleChange = useSetValueCallback(
    'username',
    (e) => e.target.value,
    [],
  );
  return (
    <div className="username-input">
      <label>Username:</label>
      <input
        type="text"
        value={username}
        onChange={handleChange}
        placeholder="Enter your name"
      />
    </div>
  );
};
const App = () => {
  const store = useCreateStore(() => {
    return createStore()
      .setValue('username', 'User')
      .setTable('messages', {
        1: {username: 'Alice', text: 'Hello!', timestamp: Date.now() - 6e4},
        2: {username: 'Bob', text: 'Hi there!', timestamp: Date.now() - 3e4},
      });
  });
  return (
    <StrictMode>
      <Provider store={store}>
        <UsernameInput />
        <Messages />
        <MessageInput />
        <Inspector />
      </Provider>
    </StrictMode>
  );
};
export {App};
