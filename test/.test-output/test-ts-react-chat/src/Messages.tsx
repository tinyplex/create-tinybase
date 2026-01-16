import {useMemo} from 'react';
import {useRowIds, useStore} from './ChatStore';

import './messages.css';

import {Message} from './Message';

export const Messages = () => {
  const store = useStore('chat');
  const messageIds = useRowIds('messages', 'chat');

  const sortedIds = useMemo(() => {
    return [...messageIds].sort((a, b) => {
      const rowA = store.getRow('messages', a) as any;
      const rowB = store.getRow('messages', b) as any;
      return rowA.timestamp - rowB.timestamp;
    });
  }, [messageIds, store]);

  return (
    <div id="messages">
      {sortedIds.map((id) => (
        <Message key={id} rowId={id} />
      ))}
    </div>
  );
};
