import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';

import { carregarOrcamentos } from '../../services/orcamentoStorage';

export default function Agenda() {
  const navigate = useNavigate();

  const obras = carregarOrcamentos()
    .filter((orcamento) => orcamento.status === 'Aprovado' && orcamento.dataObra)
    .sort((a, b) => String(a.dataObra).localeCompare(String(b.dataObra)));

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Voltar
          </Button>

          <div>
            <h1 style={styles.titulo}>Agenda</h1>
            <p style={styles.subtitulo}>
              Obras aprovadas com data marcada.
            </p>
          </div>
        </div>

        {obras.length === 0 ? (
          <Card title="Nenhuma obra agendada">
            <p style={styles.texto}>
              Aprove um orçamento e marque uma data para ele aparecer aqui.
            </p>
          </Card>
        ) : (
          <div style={styles.grid}>
            {obras.map((obra) => (
              <Card key={obra.id} title={obra.cliente}>
                <p style={styles.texto}>
                  <strong>Data:</strong> {obra.dataObra}
                </p>

                <p style={styles.texto}>
                  <strong>Hora:</strong> {obra.horaObra || 'Não informada'}
                </p>

                <p style={styles.texto}>
                  <strong>Equipe:</strong> {obra.equipe || 'Não informada'}
                </p>

                <p style={styles.texto}>
                  <strong>Total:</strong> {obra.total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 18 },
  topo: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  titulo: { margin: 0, fontSize: 28, color: '#0f172a' },
  subtitulo: { margin: '4px 0 0', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 },
  texto: { margin: '6px 0', color: '#334155' },
};