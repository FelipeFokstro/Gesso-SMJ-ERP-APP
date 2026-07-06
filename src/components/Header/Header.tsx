import { useNavigate } from 'react-router-dom';
import logoGessoSMJ from '../../assets/logo-gesso-smj.png';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header
      onClick={() => navigate('/')}
      style={{
        height: 82,
        minHeight: 82,
        background: 'linear-gradient(135deg, #062f4f 0%, #08385f 55%, #0B1228 100%)',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '8px 16px 10px',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 8px 22px rgba(15,23,42,0.14)',
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <img
        src={logoGessoSMJ}
        alt="Gesso SMJ"
        style={{
          width: 'auto',
          maxWidth: 'min(164px, 52vw)',
          height: 58,
          maxHeight: 58,
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.20))',
        }}
      />
    </header>
  );
}
