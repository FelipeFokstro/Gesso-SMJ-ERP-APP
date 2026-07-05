import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header
      onClick={() => navigate('/')}
      style={{
        height: 64,
        background: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 20px',
        cursor: 'pointer',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ textAlign: 'center', lineHeight: 1.05 }}>
        <strong style={{ fontSize: 21 }}>Gesso SMJ</strong>
        <div style={{ fontSize: 11, opacity: 0.82, letterSpacing: 2 }}>ERP</div>
      </div>
    </header>
  );
}
