import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

function definirStatus(dataObra?: string) {
  if (!dataObra) return { label: 'Sem data', color: '#64748b', bg: '#f1f5f9' };
  const hoje = new Date().toISOString().split('T')[0];
  if (dataObra < hoje) return { label: 'Atenção', color: '#b45309', bg: '#fef3c7' };
  if (dataObra === hoje) return { label: 'Hoje', color: '#166534', bg: '#dcfce7' };
  return { label: 'Agendada', color: '#1d4ed8', bg: '#dbeafe' };
}

export default function Obras() {
  const navigate = useNavigate();
  const obras = carregarOrcamentos()
    .filter((orcamento) => orcamento.status === 'Aprovado')
    .sort((a, b) => String(a.dataObra || '9999').localeCompare(String(b.dataObra || '9999')));

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <div>
            <h1 style={styles.titulo}>Obras</h1>
            <p style={styles.subtitulo}>Orçamentos aprovados viram obras aqui.</p>
          </div>
          <Button onClick={() => navigate('/orcamentos')}>Novo orçamento</Button>
        </div>

        {obras.length === 0 ? (
          <Card title="Nenhuma obra ainda">
            <p style={styles.textoFraco}>Aprove um orçamento para ele aparecer como obra.</p>
          </Card>
        ) : (
          <div style={styles.lista}>
            {obras.map((obra) => {
              const status = definirStatus(obra.dataObra);
              return (
                <Card key={obra.id}>
                  <div style={styles.cardTopo}>
                    <div>
                      <h2 style={styles.cardTitulo}>{obra.cliente}</h2>
                      <p style={styles.textoFraco}>{obra.cidade || 'Cidade não informada'} {obra.bairro ? `• ${obra.bairro}` : ''}</p>
                    </div>
                    <span style={{ ...styles.status, background: status.bg, color: status.color }}>{status.label}</span>
                  </div>

                  <div style={styles.infoGrid}>
                    <p><strong>Data:</strong> {obra.dataObra || 'Sem data'}</p>
                    <p><strong>Hora:</strong> {obra.horaObra || 'Sem hora'}</p>
                    <p><strong>Equipe:</strong> {obra.equipe || 'Não informada'}</p>
                    <p><strong>Total:</strong> {formatarMoeda(obra.total)}</p>
                  </div>

                  {obra.observacoesExecucao && <p style={styles.textoFraco}>{obra.observacoesExecucao}</p>}

                  <div style={styles.acoes}>
                    <Button size="sm" onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>Abrir orçamento</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate('/agenda')}>Ver agenda</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  topo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  titulo: { margin: 0, fontSize: 28, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b' },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  cardTopo: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  cardTitulo: { margin: 0, fontSize: 20, color: '#0f172a' },
  textoFraco: { margin: '6px 0', color: '#64748b', fontSize: 14 },
  status: { padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 12, color: '#334155' },
  acoes: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 },
};
