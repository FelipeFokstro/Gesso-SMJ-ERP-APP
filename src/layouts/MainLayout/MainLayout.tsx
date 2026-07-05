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
        background: 'radial-gradient(circle at top left, #EAF0FF 0, #F7F8FC 34%, #F2F5FA 100%)',
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 980,
          margin: '0 auto',
          padding: '18px 16px calc(112px + env(safe-area-inset-bottom))',
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
