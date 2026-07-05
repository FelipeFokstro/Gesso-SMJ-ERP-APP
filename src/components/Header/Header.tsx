import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header
      onClick={() => navigate('/')}
      style={{
        height: 72,
        background: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 24px',
        cursor: 'pointer',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
        <strong style={{ fontSize: 22 }}>Gesso SMJ</strong>
        <div style={{ fontSize: 12, opacity: 0.8, letterSpacing: 2 }}>ERP</div>
      </div>
    </header>
  );
}