import './button.css';
import {ReactNode} from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  type?: 'button' | 'submit';
}

export const Button = ({
  children,
  onClick,
  variant = 'default',
  type = 'button',
}: ButtonProps) => (
  <button
    onClick={onClick}
    type={type}
    className={variant === 'primary' ? 'primary' : undefined}
  >
    {children}
  </button>
);
