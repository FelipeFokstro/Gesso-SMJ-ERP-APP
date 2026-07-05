import { ReactNode } from 'react';
import Header from '../../components/Header';
import { colors, spacing } from '../../theme';

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
        background: colors.background,
      }}
    >
      <Header />

      <main
        style={{
          flex: 1,
          padding: spacing.lg,
        }}
      >
        {children}
      </main>
    </div>
  );
}