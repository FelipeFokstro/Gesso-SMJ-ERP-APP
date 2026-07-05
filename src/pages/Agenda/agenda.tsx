import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

function formatarMes(data: Date) {
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function yyyyMmDd(data: Date) {
  return data.toISOString().split('T')[0];
}

export default function Agenda() {
  const navigate = useNavigate();
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [diaSelecionado, setDiaSelecionado] = useState(yyyyMmDd(new Date()));

  const obras = carregarOrcamentos()
    .filter((orcamento) => orcamento.status === 'Aprovado' && orcamento.dataObra)
    .sort((a, b) => String(a.dataObra).localeCompare(String(b.dataObra)));

  const diasCalendario = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const inicioSemana = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();
    const dias: Array<{ data: string; dia: number | null; fora: boolean }> = [];

    for (let i = 0; i < inicioSemana; i += 1) {
      dias.push({ data: `vazio-${i}`, dia: null, fora: true });
    }

    for (let dia = 1; dia <= totalDias; dia += 1) {
      const data = new Date(ano, mes, dia);
      dias.push({ data: yyyyMmDd(data), dia, fora: false });
    }

    while (dias.length % 7 !== 0) {
      dias.push({ data: `vazio-final-${dias.length}`, dia: null, fora: true });
    }

    return dias;
  }, [mesAtual]);

  const obrasDoDia = obras.filter((obra) => obra.dataObra === diaSelecionado);

  function trocarMes(delta: number) {
    setMesAtual((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <div>
            <h1 style={styles.titulo}>Agenda</h1>
            <p style={styles.subtitulo}>Calendário das obras aprovadas.</p>
          </div>
          <Button onClick={() => navigate('/orcamentos')}>Agendar obra</Button>
        </div>

        <Card>
          <div style={styles.calendarioTopo}>
            <Button size="sm" variant="outline" onClick={() => trocarMes(-1)}>←</Button>
            <strong style={styles.mesTitulo}>{formatarMes(mesAtual)}</strong>
            <Button size="sm" variant="outline" onClick={() => trocarMes(1)}>→</Button>
          </div>

          <div style={styles.semanaGrid}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <span key={dia} style={styles.semanaDia}>{dia}</span>
            ))}
          </div>

          <div style={styles.diasGrid}>
            {diasCalendario.map((dia) => {
              const qtdObras = obras.filter((obra) => obra.dataObra === dia.data).length;
              const selecionado = dia.data === diaSelecionado;

              return (
                <button
                  key={dia.data}
                  style={{
                    ...styles.diaBotao,
                    ...(selecionado ? styles.diaSelecionado : {}),
                    ...(dia.fora ? styles.diaVazio : {}),
                  }}
                  disabled={dia.fora}
                  onClick={() => setDiaSelecionado(dia.data)}
                >
                  <span>{dia.dia || ''}</span>
                  {qtdObras > 0 && <small style={styles.bolinha}>{qtdObras}</small>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={`Dia selecionado: ${diaSelecionado}`}>
          {obrasDoDia.length === 0 ? (
            <p style={styles.textoFraco}>Nenhuma obra neste dia.</p>
          ) : (
            <div style={styles.lista}>
              {obrasDoDia.map((obra) => (
                <button key={obra.id} style={styles.item} onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>
                  <div>
                    <strong>{obra.cliente}</strong>
                    <p style={styles.textoFraco}>{obra.horaObra || 'Sem hora'} • {obra.equipe || 'Equipe não informada'}</p>
                  </div>
                  <strong>{formatarMoeda(obra.total)}</strong>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Todas as obras agendadas">
          {obras.length === 0 ? (
            <p style={styles.textoFraco}>Aprove um orçamento e marque uma data para ele aparecer aqui.</p>
          ) : (
            <div style={styles.lista}>
              {obras.slice(0, 8).map((obra) => (
                <button key={obra.id} style={styles.item} onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>
                  <div>
                    <strong>{obra.cliente}</strong>
                    <p style={styles.textoFraco}>{obra.dataObra} {obra.horaObra || ''}</p>
                  </div>
                  <span style={styles.abrir}>Abrir</span>
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
  topo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  titulo: { margin: 0, fontSize: 28, color: '#0f172a' },
  subtitulo: { margin: '4px 0 0', color: '#64748b' },
  calendarioTopo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  mesTitulo: { textTransform: 'capitalize', color: '#0f172a', fontSize: 18 },
  semanaGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 },
  semanaDia: { textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 800 },
  diasGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 },
  diaBotao: { minHeight: 46, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: 800, position: 'relative', cursor: 'pointer' },
  diaSelecionado: { background: '#0f172a', color: '#fff', borderColor: '#0f172a' },
  diaVazio: { opacity: 0, cursor: 'default' },
  bolinha: { position: 'absolute', right: 5, bottom: 5, minWidth: 16, height: 16, borderRadius: 999, background: '#2563eb', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lista: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 14, background: '#f8fafc', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', gap: 12, cursor: 'pointer' },
  textoFraco: { margin: '5px 0', color: '#64748b', fontSize: 14 },
  abrir: { color: '#2563eb', fontSize: 12, fontWeight: 800 },
};
