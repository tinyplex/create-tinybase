import {useValue, useSetValueCallback} from './SettingsStore';
import './usernameInput.css';
import {Input} from './Input';
const UsernameInput = () => {
  const username = useValue('username', 'settings') || '';
  const setUsername = useSetValueCallback(
    'username',
    (_e) => _e,
    [],
    'settings',
  );
  return (
    <div id="usernameInput">
      <label>Your name:</label>
      <Input
        value={username}
        onChange={setUsername}
        placeholder="Enter your name"
      />
    </div>
  );
};
export {UsernameInput};
