import { ReactNode } from 'react';
import Header from '../../components/Header';
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