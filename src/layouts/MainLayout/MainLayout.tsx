import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import Header from '../../components/Header';
import { colors } from '../../theme';

interface MainLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Orçamentos', path: '/orcamentos' },
  { label: 'Clientes', path: '/clientes' },
  { label: 'Obras', path: '/obras' },
  { label: 'Agenda', path: '/agenda' },
  { label: 'Financeiro', path: '/financeiro' },
  { label: 'Estoque', path: '/estoque' },
  { label: 'Catálogo', path: '/catalogo' },
];

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F5F7FB',
      }}
    >
      <Header />

      <nav
        style={{
          background: '#fff',
          borderBottom: '1px solid #E5E7EB',
          padding: '12px 24px',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              padding: '8px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              transition: '0.2s',

              background: isActive ? colors.primary : 'transparent',
              color: isActive ? '#fff' : colors.text,
              border: `1px solid ${
                isActive ? colors.primary : '#E5E7EB'
              }`,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: 24,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          color: colors.text,
        }}
      >
        {children}
      </main>
    </div>
  );
}