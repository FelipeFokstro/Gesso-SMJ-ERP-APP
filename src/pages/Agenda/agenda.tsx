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

function diffDias(data: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(`${data}T00:00:00`);
  return Math.ceil((alvo.getTime() - hoje.getTime()) / 86400000);
}

function statusAgenda(data?: string) {
  if (!data) return { texto: 'Sem data', cor: '#64748b', fundo: '#f1f5f9' };
  const dias = diffDias(data);
  if (dias < 0) return { texto: 'Atrasada', cor: '#b91c1c', fundo: '#fee2e2' };
  if (dias <= 7) return { texto: 'Atenção', cor: '#a16207', fundo: '#fef3c7' };
  return { texto: 'Em dia', cor: '#166534', fundo: '#dcfce7' };
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

    for (let i = 0; i < inicioSemana; i += 1) dias.push({ data: `vazio-${i}`, dia: null, fora: true });
    for (let dia = 1; dia <= totalDias; dia += 1) dias.push({ data: yyyyMmDd(new Date(ano, mes, dia)), dia, fora: false });
    while (dias.length % 7 !== 0) dias.push({ data: `vazio-final-${dias.length}`, dia: null, fora: true });

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
            <p style={styles.subtitulo}>Calendário das obras aprovadas, com cor por prazo.</p>
          </div>
          <Button onClick={() => navigate('/orcamentos')}>Agendar obra</Button>
        </div>

        <Card>
          <div style={styles.legenda}>
            <span style={{ ...styles.legendaItem, background: '#dcfce7', color: '#166534' }}>Verde: em dia</span>
            <span style={{ ...styles.legendaItem, background: '#fef3c7', color: '#a16207' }}>Amarelo: inicia em até 7 dias</span>
            <span style={{ ...styles.legendaItem, background: '#fee2e2', color: '#b91c1c' }}>Vermelho: atrasada</span>
          </div>

          <div style={styles.calendarioTopo}>
            <Button size="sm" variant="outline" onClick={() => trocarMes(-1)}>←</Button>
            <strong style={styles.mesTitulo}>{formatarMes(mesAtual)}</strong>
            <Button size="sm" variant="outline" onClick={() => trocarMes(1)}>→</Button>
          </div>

          <div style={styles.semanaGrid}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => <span key={dia} style={styles.semanaDia}>{dia}</span>)}
          </div>

          <div style={styles.diasGrid}>
            {diasCalendario.map((dia) => {
              const obrasNoDia = obras.filter((obra) => obra.dataObra === dia.data);
              const selecionado = dia.data === diaSelecionado;
              const indicador = obrasNoDia.some((obra) => diffDias(String(obra.dataObra)) < 0)
                ? statusAgenda('2000-01-01')
                : obrasNoDia.some((obra) => diffDias(String(obra.dataObra)) <= 7)
                  ? statusAgenda(yyyyMmDd(new Date()))
                  : obrasNoDia.length > 0
                    ? statusAgenda('2999-01-01')
                    : null;

              return (
                <button
                  key={dia.data}
                  style={{
                    ...styles.diaBotao,
                    ...(indicador ? { background: indicador.fundo, color: indicador.cor, borderColor: indicador.cor } : {}),
                    ...(selecionado ? styles.diaSelecionado : {}),
                    ...(dia.fora ? styles.diaVazio : {}),
                  }}
                  disabled={dia.fora}
                  onClick={() => setDiaSelecionado(dia.data)}
                >
                  <span>{dia.dia || ''}</span>
                  {obrasNoDia.length > 0 && <small style={styles.bolinha}>{obrasNoDia.length}</small>}
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
              {obrasDoDia.map((obra) => {
                const status = statusAgenda(obra.dataObra);
                return (
                  <button key={obra.id} style={styles.item} onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>
                    <div>
                      <strong>{obra.cliente}</strong>
                      <p style={styles.textoFraco}>{obra.horaObra || 'Sem hora'} • {obra.equipe || 'Equipe não informada'}</p>
                    </div>
                    <div style={styles.itemDireita}>
                      <span style={{ ...styles.status, background: status.fundo, color: status.cor }}>{status.texto}</span>
                      <strong>{formatarMoeda(obra.total)}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Todas as obras agendadas">
          {obras.length === 0 ? (
            <p style={styles.textoFraco}>Aprove um orçamento e marque uma data para ele aparecer aqui.</p>
          ) : (
            <div style={styles.lista}>
              {obras.slice(0, 12).map((obra) => {
                const status = statusAgenda(obra.dataObra);
                return (
                  <button key={obra.id} style={styles.item} onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>
                    <div>
                      <strong>{obra.cliente}</strong>
                      <p style={styles.textoFraco}>{obra.dataObra} {obra.horaObra || ''}</p>
                    </div>
                    <span style={{ ...styles.status, background: status.fundo, color: status.cor }}>{status.texto}</span>
                  </button>
                );
              })}
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
  legenda: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  legendaItem: { padding: '6px 10px', borderRadius: 999, fontSize: 11, fontWeight: 900 },
  calendarioTopo: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  mesTitulo: { textTransform: 'capitalize', color: '#0f172a', fontSize: 18 },
  semanaGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 },
  semanaDia: { textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 800 },
  diasGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 },
  diaBotao: { minHeight: 46, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontWeight: 900, position: 'relative', cursor: 'pointer' },
  diaSelecionado: { outline: '3px solid #0f172a', boxShadow: '0 0 0 2px #fff inset' },
  diaVazio: { opacity: 0, cursor: 'default' },
  bolinha: { position: 'absolute', right: 5, bottom: 5, minWidth: 16, height: 16, borderRadius: 999, background: '#0f172a', color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  lista: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 18, background: '#f8fafc', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', gap: 12, cursor: 'pointer' },
  itemDireita: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  status: { padding: '5px 9px', borderRadius: 999, fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap' },
  textoFraco: { margin: '5px 0', color: '#64748b', fontSize: 14 },
};
