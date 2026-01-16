import './input.css';
const Input = ({value, onChange, placeholder = '', autoFocus = false}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    autoFocus={autoFocus}
  />
);
export {Input};
