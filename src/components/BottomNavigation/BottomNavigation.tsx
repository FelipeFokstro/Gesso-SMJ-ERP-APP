import { NavLink } from 'react-router-dom';
import './BottomNavigation.css';

const menuItems = [
  { label: 'Início', icon: '⌂', path: '/' },
  { label: 'Obras', icon: '▣', path: '/obras' },
  { label: 'Agenda', icon: '◇', path: '/agenda' },
  { label: 'Estoque', icon: '▤', path: '/estoque' },
  { label: 'Financ.', icon: '$', path: '/financeiro' },
  { label: 'Backup', icon: '↥', path: '/configuracoes' },
];

export default function BottomNavigation() {
  return (
    <nav className="bottom-navigation" aria-label="Menu principal">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `bottom-navigation__item ${isActive ? 'bottom-navigation__item--active' : ''}`
          }
        >
          <span className="bottom-navigation__icon">{item.icon}</span>
          <span className="bottom-navigation__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
