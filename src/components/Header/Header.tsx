import { useNavigate } from 'react-router-dom';
import logoGessoSMJ from '../../assets/logo-gesso-smj.png';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header
      onClick={() => navigate('/')}
      style={{
        minHeight: 112,
        background: 'linear-gradient(135deg, #062f4f 0%, #08385f 55%, #0B1228 100%)',
        color: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 20px 16px',
        cursor: 'pointer',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 10px 28px rgba(15,23,42,0.16)',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
      }}
    >
      <img
        src={logoGessoSMJ}
        alt="Gesso SMJ"
        style={{
          width: 'min(210px, 64vw)',
          height: 86,
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.20))',
        }}
      />
    </header>
  );
}
