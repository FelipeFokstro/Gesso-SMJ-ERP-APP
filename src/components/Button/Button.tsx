import './Button.css';
import type { ButtonProps } from './Button.types';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} button--${size} ${
        fullWidth ? 'button--full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}