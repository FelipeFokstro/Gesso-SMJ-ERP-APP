import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div style={styles.container}>
      {label && <label style={styles.label}>{label}</label>}
      <input style={styles.input} {...props} />
    </div>
  );
}

export default Input;

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 7, width: '100%' },
  label: { fontSize: 13, fontWeight: 800, color: '#334155', letterSpacing: -0.1 },
  input: {
    width: '100%',
    minHeight: 50,
    borderRadius: 18,
    border: '1.5px solid #D8E0EC',
    padding: '0 14px',
    fontSize: 15,
    fontWeight: 650,
    backgroundColor: 'rgba(255,255,255,.92)',
    color: '#0f172a',
    boxSizing: 'border-box',
    outline: 'none',
    boxShadow: '0 6px 14px rgba(15,23,42,.04)',
  },
};
