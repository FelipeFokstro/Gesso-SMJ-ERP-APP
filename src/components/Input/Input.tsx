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
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    width: '100%',
  },

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#334155',
  },

  input: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    padding: '0 12px',
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#0f172a',
    boxSizing: 'border-box',
  },
};