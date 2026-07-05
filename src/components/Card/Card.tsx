import './Card.css';
import type { CardProps } from './Card.types';

export default function Card({ children, title, subtitle }: CardProps) {
  return (
    <div className="card">
      {title && <h2 className="card__title">{title}</h2>}
      {subtitle && <p className="card__subtitle">{subtitle}</p>}

      <div className="card__content">{children}</div>
    </div>
  );
}