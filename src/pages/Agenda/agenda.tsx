import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';

export default function Agenda() {
  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.top}>
          <div>
            <h1 style={styles.title}>Agenda</h1>
            <p style={styles.subtitle}>Obras agendadas e próximas execuções</p>
          </div>

          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Voltar para Home
          </Button>
        </div>

        <div style={styles.grid}>
          <Card title="Vai iniciar">
            <p><strong>Farmácia Fred</strong></p>
            <p style={styles.text}>Amanhã — Forro, nichos e acabamento</p>
          </Card>

          <Card title="Em andamento">
            <p><strong>Rafael</strong></p>
            <p style={styles.text}>Forro e sanca</p>
          </Card>

          <Card title="Agendadas">
            <p><strong>Elimar</strong></p>
            <p style={styles.text}>Próxima semana</p>

            <br />

            <p><strong>Restaurante Baldoto</strong></p>
            <p style={styles.text}>Aguardando confirmação de data</p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },

  top: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  title: {
    margin: 0,
    fontSize: 26,
    color: '#0F172A',
  },

  subtitle: {
    margin: '4px 0 0',
    color: '#64748B',
    fontSize: 14,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 14,
  },

  text: {
    margin: '6px 0 0',
    color: '#64748B',
    fontSize: 14,
  },
};