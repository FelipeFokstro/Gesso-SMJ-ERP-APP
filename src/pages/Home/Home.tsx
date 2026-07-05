import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';

export default function Home() {
  const temOrcamentosPendentes = true;

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Visão geral da Gesso SMJ</p>
          </div>
        </div>

        <div style={styles.quickActions}>
          <Button fullWidth onClick={() => (window.location.href = '/orcamentos')}>
            Fazer orçamento
          </Button>

          <Button variant="secondary" fullWidth onClick={() => (window.location.href = '/agenda')}>
            Agenda
          </Button>

          <Button variant="outline" fullWidth onClick={() => (window.location.href = '/catalogo')}>
            Catálogo
          </Button>
        </div>

        <div style={styles.grid}>
          <Card title="Obras">
            <div style={styles.compactList}>
              <p><strong>Vai iniciar:</strong> Farmácia Fred — amanhã</p>
              <p><strong>Em andamento:</strong> Rafael — forro e sanca</p>
              <p><strong>Agendadas:</strong> Elimar — próxima semana</p>
              <p><strong>Aguardando:</strong> Restaurante — sem data</p>
            </div>
          </Card>

          {temOrcamentosPendentes && (
            <Card title="Orçamentos">
              <div style={styles.compactList}>
                <p>Cliente novo — forro drywall</p>
                <p>Itarana — sanca e cortineiro</p>
              </div>
            </Card>
          )}

          <Card title="Financeiro">
            <div style={styles.financeBox}>
              <div>
                <span style={styles.label}>Receber</span>
                <strong style={styles.moneyPositive}>R$ 24.500,00</strong>
              </div>

              <div>
                <span style={styles.label}>Pagar</span>
                <strong style={styles.moneyNegative}>R$ 6.200,00</strong>
              </div>
            </div>
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

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 10,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 14,
  },

  compactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    fontSize: 14,
    color: '#334155',
  },

  financeBox: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },

  label: {
    display: 'block',
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },

  moneyPositive: {
    color: '#16A34A',
    fontSize: 18,
  },

  moneyNegative: {
    color: '#DC2626',
    fontSize: 18,
  },
};