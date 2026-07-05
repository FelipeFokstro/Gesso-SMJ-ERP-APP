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
    .slice(0, 3);
  const totalReceber = aprovados.reduce((soma, item) => soma + item.total, 0);

  return (
    <MainLayout>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <span style={styles.badge}>Hoje</span>
            <h1 style={styles.title}>Painel da obra</h1>
            <p style={styles.subtitle}>Orçamentos, agenda e próximos serviços em um lugar só.</p>
          </div>
          <div style={styles.heroResumo}>
            <strong style={styles.heroResumoStrong}>{proximasObras.length}</strong>
            <span>obras próximas</span>
          </div>
        </section>

        <div style={styles.quickActions}>
          <Button fullWidth onClick={() => navigate('/orcamentos')}>Fazer orçamento</Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/agenda')}>Abrir agenda</Button>
          <Button variant="outline" fullWidth onClick={() => navigate('/catalogo')}>Ver catálogo</Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card>
            <span style={styles.cardLabel}>Pendentes</span>
            <strong style={styles.cardNumber}>{pendentes.length}</strong>
            <small style={styles.cardSmall}>orçamentos</small>
          </Card>
          <Card>
            <span style={styles.cardLabel}>Aprovadas</span>
            <strong style={styles.cardNumber}>{aprovados.length}</strong>
            <small style={styles.cardSmall}>obras</small>
          </Card>
          <Card>
            <span style={styles.cardLabel}>A receber</span>
            <strong style={styles.cardMoney}>{formatarMoeda(totalReceber)}</strong>
            <small style={styles.cardSmall}>previsto</small>
          </Card>
        </div>

        <Card title="Próximas obras" subtitle="Clique para abrir o orçamento salvo.">
          {proximasObras.length === 0 ? (
            <p style={styles.textoFraco}>Nenhuma obra com data marcada.</p>
          ) : (
            <div style={styles.lista}>
              {proximasObras.map((obra) => (
                <button key={obra.id} style={styles.itemObra} onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>
                  <div style={styles.itemIcon}>▣</div>
                  <div style={{ minWidth: 0 }}>
                    <strong style={styles.nomeObra}>{obra.cliente || 'Cliente não informado'}</strong>
                    <p style={styles.textoFraco}>{obra.dataObra} {obra.horaObra || ''}</p>
                  </div>
                  <span style={styles.status}>Abrir</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  hero: {
    padding: 20,
    borderRadius: 30,
    background: 'linear-gradient(135deg, #0B1228, #1F3C88 62%, #2F6DF6)',
    color: '#fff',
    boxShadow: '0 18px 38px rgba(15, 23, 42, 0.20)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-end',
  },
  badge: { display: 'inline-block', padding: '6px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', fontSize: 12, fontWeight: 900, marginBottom: 12 },
  title: { margin: 0, fontSize: 30, letterSpacing: -1.2, lineHeight: 1.02 },
  subtitle: { margin: '8px 0 0', opacity: 0.88, fontSize: 14, lineHeight: 1.4, maxWidth: 260 },
  heroResumo: { minWidth: 106, padding: '14px 12px', borderRadius: 22, background: 'rgba(255,255,255,.14)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', justifyContent: 'center' },
  heroResumoStrong: { display: 'block', fontSize: 30, lineHeight: 1, letterSpacing: -1, marginBottom: 2 },
  quickActions: { display: 'grid', gridTemplateColumns: '1fr', gap: 10 },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 },
  cardLabel: { display: 'block', color: '#64748b', fontSize: 12, fontWeight: 900, marginBottom: 7 },
  cardNumber: { color: '#0f172a', fontSize: 28, letterSpacing: -1 },
  cardMoney: { color: '#16a34a', fontSize: 18, letterSpacing: -0.7 },
  cardSmall: { display: 'block', marginTop: 3, color: '#94a3b8', fontWeight: 700 },
  lista: { display: 'flex', flexDirection: 'column', gap: 10 },
  itemObra: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 22, padding: 12, background: '#f8fafc', display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 10, alignItems: 'center', textAlign: 'left', cursor: 'pointer' },
  itemIcon: { width: 42, height: 42, borderRadius: 16, background: '#eaf1ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 },
  nomeObra: { color: '#0f172a', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' },
  textoFraco: { margin: '4px 0', color: '#64748b', fontSize: 13, lineHeight: 1.35 },
  status: { fontSize: 12, fontWeight: 900, color: '#2563eb' },
};
