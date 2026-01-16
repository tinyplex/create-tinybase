import {useState} from 'react';
import {useAddRowCallback} from './ChatStore';
import {useValue} from './SettingsStore';
import './messageInput.css';

import {Button} from './Button';

import {Input} from './Input';

export const MessageInput = () => {
  const [message, setMessage] = useState('');
  const username = useValue('username', 'settings') || 'Anonymous';

  const handleSend = useAddRowCallback(
    'messages',
    () => ({
      username,
      text: message,
      timestamp: Date.now(),
    }),
    [message, username],
    'chat',
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      handleSend();
      setMessage('');
    }
  };

  return (
    <form onSubmit={onSubmit} id="messageInput">
      <Input
        value={message}
        onChange={setMessage}
        placeholder="Type a message..."
        autoFocus
      />
      <Button type="submit" variant="primary">
        Send
      </Button>
    </form>
  );
};
