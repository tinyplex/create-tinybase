import './button.css';
const Button = ({children, onClick, variant = 'default', type = 'button'}) => (
  <button
    onClick={onClick}
    type={type}
    className={variant === 'primary' ? 'primary' : void 0}
  >
    {children}
  </button>
);
export {Button};
