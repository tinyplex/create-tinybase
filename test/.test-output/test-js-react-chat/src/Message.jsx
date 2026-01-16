import {useRow} from './ChatStore';
import './message.css';
const Message = ({rowId}) => {
  const row = useRow('messages', rowId, 'chat');
  const time = new Date(row.timestamp).toLocaleTimeString();
  return (
    <div className="message">
      <span className="username">{row.username}:</span>
      <span className="text">{row.text}</span>
      <span className="time">{time}</span>
    </div>
  );
};
export {Message};
