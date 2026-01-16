import {useMemo} from 'react';
import {useRowIds, useStore} from './ChatStore';
import './messages.css';
import {Message} from './Message';
const Messages = () => {
  const store = useStore('chat');
  const messageIds = useRowIds('messages', 'chat');
  const sortedIds = useMemo(() => {
    return [...messageIds].sort((a, b) => {
      const rowA = store.getRow('messages', a);
      const rowB = store.getRow('messages', b);
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
export {Messages};
