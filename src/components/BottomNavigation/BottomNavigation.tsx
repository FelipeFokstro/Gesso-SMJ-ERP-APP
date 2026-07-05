import { NavLink } from 'react-router-dom';
import './BottomNavigation.css';

const menuItems = [
  { label: 'Início', path: '/' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Obras', path: '/obras' },
  { label: 'Agenda', path: '/agenda' },
  { label: 'Mais', path: '/financeiro' },
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
          <span className="bottom-navigation__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
