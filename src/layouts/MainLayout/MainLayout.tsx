import type { ReactNode } from 'react';
import Header from '../../components/Header';
import BottomNavigation from '../../components/BottomNavigation';
import { colors } from '../../theme';

interface MainLayoutProps {
  children: ReactNode;
}

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

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '18px 16px 96px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          color: colors.text,
        }}
      >
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
}
