import { colors, spacing, typography } from '../../theme';

export default function Header() {
  return (
    <header
      style={{
        height: 72,
        background: '#0F172A',
        color: '#FFFFFF',

        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

        padding: `0 ${spacing.lg}px`,

        borderBottom: '1px solid rgba(255,255,255,0.08)',

        position: 'sticky',
        top: 0,
        zIndex: 1000,

        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,

            background: '#1D4ED8',

            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',

            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          G
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            lineHeight: 1.1,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 0.3,
              fontFamily:
                'Inter, SF Pro Display, Segoe UI, sans-serif',
            }}
          >
            Gesso SMJ
          </span>

          <span
            style={{
              fontSize: 12,
              opacity: 0.8,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontFamily:
                'Inter, SF Pro Display, Segoe UI, sans-serif',
            }}
          >
            ERP
          </span>
        </div>
      </div>
    </header>
  );
}