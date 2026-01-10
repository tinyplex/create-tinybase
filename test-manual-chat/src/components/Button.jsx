import './button.css';
const Button = ({children, onClick, variant = 'default'}) => (
  <button
    onClick={onClick}
    className={variant === 'primary' ? 'primary' : void 0}
  >
    {children}
  </button>
);
export {Button};
