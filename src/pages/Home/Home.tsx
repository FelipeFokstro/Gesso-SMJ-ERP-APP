import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

export default function Home() {
  const navigate = useNavigate();
  const orcamentos = carregarOrcamentos();
  const aprovados = orcamentos.filter((orcamento) => orcamento.status === 'Aprovado');
  const pendentes = orcamentos.filter((orcamento) => orcamento.status !== 'Aprovado');
  const hoje = new Date().toISOString().split('T')[0];
  const proximasObras = aprovados
    .filter((orcamento) => orcamento.dataObra && orcamento.dataObra >= hoje)
    .sort((a, b) => String(a.dataObra).localeCompare(String(b.dataObra)))
    .slice(0, 4);
  const totalReceber = aprovados.reduce((soma, item) => soma + item.total, 0);

  return (
    <MainLayout>
      <div style={styles.container}>
        <section style={styles.hero}>
          <span style={styles.badge}>Painel de hoje</span>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Veja o que precisa de atenção na Gesso SMJ.</p>
        </section>

        <div style={styles.quickActions}>
          <Button fullWidth onClick={() => navigate('/orcamentos')}>
            Fazer orçamento
          </Button>

          <Button variant="secondary" fullWidth onClick={() => navigate('/agenda')}>
            Agenda
          </Button>

          <Button variant="outline" fullWidth onClick={() => navigate('/catalogo')}>
            Catálogo
          </Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card>
            <span style={styles.cardLabel}>Orçamentos pendentes</span>
            <strong style={styles.cardNumber}>{pendentes.length}</strong>
          </Card>

          <Card>
            <span style={styles.cardLabel}>Obras aprovadas</span>
            <strong style={styles.cardNumber}>{aprovados.length}</strong>
          </Card>

          <Card>
            <span style={styles.cardLabel}>A receber</span>
            <strong style={styles.cardMoney}>{formatarMoeda(totalReceber)}</strong>
          </Card>
        </div>

        <Card title="Próximas obras">
          {proximasObras.length === 0 ? (
            <p style={styles.textoFraco}>Nenhuma obra com data marcada.</p>
          ) : (
            <div style={styles.lista}>
              {proximasObras.map((obra) => (
                <button key={obra.id} style={styles.itemObra} onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>
                  <div>
                    <strong>{obra.cliente}</strong>
                    <p style={styles.textoFraco}>{obra.dataObra} {obra.horaObra || ''}</p>
                  </div>
                  <span style={styles.status}>Abrir</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Atalhos">
          <div style={styles.atalhos}>
            <Button variant="outline" onClick={() => navigate('/clientes')}>Clientes</Button>
            <Button variant="outline" onClick={() => navigate('/obras')}>Obras</Button>
            <Button variant="outline" onClick={() => navigate('/financeiro')}>Financeiro</Button>
            <Button variant="outline" onClick={() => navigate('/estoque')}>Estoque</Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  hero: { padding: 20, borderRadius: 24, background: 'linear-gradient(135deg, #0f172a, #1d4ed8)', color: '#fff', boxShadow: '0 14px 32px rgba(15, 23, 42, 0.18)' },
  badge: { display: 'inline-block', padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', fontSize: 12, fontWeight: 800, marginBottom: 10 },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: '6px 0 0', opacity: 0.86 },
  quickActions: { display: 'grid', gridTemplateColumns: '1fr', gap: 10 },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  cardLabel: { display: 'block', color: '#64748b', fontSize: 13, fontWeight: 700, marginBottom: 8 },
  cardNumber: { color: '#0f172a', fontSize: 28 },
  cardMoney: { color: '#16a34a', fontSize: 22 },
  lista: { display: 'flex', flexDirection: 'column', gap: 10 },
  itemObra: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 16, padding: 14, background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', cursor: 'pointer' },
  textoFraco: { margin: '4px 0', color: '#64748b', fontSize: 14 },
  status: { fontSize: 12, fontWeight: 800, color: '#2563eb' },
  atalhos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 },
};
