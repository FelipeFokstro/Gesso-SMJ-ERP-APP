import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';
import { carregarEstoque } from '../../services/estoqueService';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

type LancamentoFinanceiro = {
  id: number;
  descricao: string;
  valor: number;
  tipo: 'Entrada' | 'Saída';
  status: 'Pendente' | 'Pago';
  data: string;
  categoria: string;
};

const FINANCEIRO_KEY = 'gesso-smj-financeiro';
const META_MENSAL_PADRAO = 60000;

function hojeISO() {
  return new Date().toISOString().split('T')[0];
}

function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

function formatarDataCurta(data?: string) {
  if (!data) return 'Sem data';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function carregarLancamentosFinanceiros(): LancamentoFinanceiro[] {
  try {
    const dados = localStorage.getItem(FINANCEIRO_KEY);
    return dados ? JSON.parse(dados) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const dados = useMemo(() => {
    const orcamentos = carregarOrcamentos();
    const estoque = carregarEstoque();
    const lancamentos = carregarLancamentosFinanceiros();
    const hoje = hojeISO();
    const mes = mesAtual();

    const aprovados = orcamentos.filter((orcamento) => orcamento.status === 'Aprovado');
    const pendentes = orcamentos.filter((orcamento) => orcamento.status === 'Pendente');
    const negociacao = orcamentos.filter((orcamento) => orcamento.status === 'Em negociação');

    const obrasAtrasadas = aprovados.filter((orcamento) => orcamento.dataObra && orcamento.dataObra < hoje);
    const obrasHoje = aprovados.filter((orcamento) => orcamento.dataObra === hoje);
    const proximasObras = aprovados
      .filter((orcamento) => orcamento.dataObra && orcamento.dataObra >= hoje)
      .sort((a, b) => String(a.dataObra).localeCompare(String(b.dataObra)))
      .slice(0, 4);

    const lancamentosMes = lancamentos.filter((item) => item.data?.slice(0, 7) === mes);
    const entradasManuaisMes = lancamentosMes
      .filter((item) => item.tipo === 'Entrada')
      .reduce((soma, item) => soma + Number(item.valor || 0), 0);
    const saidasMes = lancamentosMes
      .filter((item) => item.tipo === 'Saída')
      .reduce((soma, item) => soma + Number(item.valor || 0), 0);

    const obrasMes = aprovados.filter((orcamento) => {
      const dataBase = orcamento.dataObra || orcamento.criadoEm || '';
      return dataBase.slice(0, 7) === mes;
    });

    const faturamentoMes = obrasMes.reduce((soma, item) => soma + Number(item.total || 0), 0) + entradasManuaisMes;
    const lucroMes = faturamentoMes - saidasMes;
    const m2Executados = obrasMes.reduce((soma, orcamento) => {
      const totalM2 = orcamento.itens
        .filter((item) => item.unidade === 'm²')
        .reduce((subtotal, item) => subtotal + Number(item.quantidade || 0), 0);
      return soma + totalM2;
    }, 0);

    const estoqueBaixo = estoque.filter((item) => Number(item.quantidade || 0) <= Number(item.minimo || 0));
    const receberSemana = aprovados
      .filter((orcamento) => orcamento.dataObra && orcamento.dataObra >= hoje)
      .slice(0, 7)
      .reduce((soma, item) => soma + Number(item.total || 0), 0);

    const metaPercentual = Math.min(100, Math.round((faturamentoMes / META_MENSAL_PADRAO) * 100));

    return {
      orcamentos,
      aprovados,
      pendentes,
      negociacao,
      obrasAtrasadas,
      obrasHoje,
      proximasObras,
      estoqueBaixo,
      receberSemana,
      faturamentoMes,
      lucroMes,
      saidasMes,
      m2Executados,
      metaPercentual,
    };
  }, []);

  function abrirAtalho(destino: string) {
    setMenuAberto(false);
    navigate(destino);
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <section style={styles.hero}>
          <div>
            <span style={styles.badge}>Central de comando</span>
            <h1 style={styles.title}>Painel da obra</h1>
            <p style={styles.subtitle}>Veja o que precisa de atenção hoje, sem abrir cada módulo.</p>
          </div>
          <div style={styles.heroResumo}>
            <strong style={styles.heroResumoStrong}>{dados.obrasHoje.length}</strong>
            <span>obra(s) hoje</span>
          </div>
        </section>

        <div style={styles.resumoGrid}>
          <MiniCard label="Em andamento" valor={String(dados.aprovados.length)} detalhe="obras aprovadas" tom="azul" />
          <MiniCard label="Orçamentos" valor={String(dados.orcamentos.length)} detalhe="total salvo" tom="amarelo" />
          <MiniCard label="A receber" valor={formatarMoeda(dados.faturamentoMes)} detalhe="mês atual" tom="verde" />
        </div>

        <Card title="Hoje" subtitle="O que precisa de atenção agora.">
          <div style={styles.alertGrid}>
            <InfoPill label="Obras hoje" value={dados.obrasHoje.length} color="#2563eb" />
            <InfoPill label="Atrasadas" value={dados.obrasAtrasadas.length} color="#dc2626" />
            <InfoPill label="Estoque baixo" value={dados.estoqueBaixo.length} color="#d97706" />
          </div>

          {dados.proximasObras.length === 0 ? (
            <p style={styles.textoFraco}>Nenhuma obra com data marcada.</p>
          ) : (
            <div style={styles.lista}>
              {dados.proximasObras.map((obra) => (
                <button key={obra.id} style={styles.itemObra} onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>
                  <div style={styles.itemIcon}>▣</div>
                  <div style={{ minWidth: 0 }}>
                    <strong style={styles.nomeObra}>{obra.cliente || 'Cliente não informado'}</strong>
                    <p style={styles.textoFraco}>{formatarDataCurta(obra.dataObra)} {obra.horaObra || ''}</p>
                  </div>
                  <span style={styles.status}>Abrir</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Financeiro" subtitle="Resumo rápido do mês.">
          <div style={styles.financeiroLista}>
            <LinhaResumo label="Receber esta semana" valor={formatarMoeda(dados.receberSemana)} destaque="verde" />
            <LinhaResumo label="Saídas do mês" valor={formatarMoeda(dados.saidasMes)} destaque="vermelho" />
            <LinhaResumo label="Lucro previsto" valor={formatarMoeda(dados.lucroMes)} destaque={dados.lucroMes >= 0 ? 'verde' : 'vermelho'} />
          </div>
          <div style={styles.metaBox}>
            <div style={styles.metaTopo}>
              <strong>Meta do mês</strong>
              <span>{dados.metaPercentual}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressBar, width: `${dados.metaPercentual}%` }} />
            </div>
            <p style={styles.textoFraco}>{formatarMoeda(dados.faturamentoMes)} de {formatarMoeda(META_MENSAL_PADRAO)}</p>
          </div>
        </Card>

        <Card title="Orçamentos" subtitle="Status dos orçamentos salvos.">
          <div style={styles.statusGrid}>
            <StatusBox label="Pendentes" value={dados.pendentes.length} color="#d97706" />
            <StatusBox label="Em negociação" value={dados.negociacao.length} color="#2563eb" />
            <StatusBox label="Aprovados" value={dados.aprovados.length} color="#16a34a" />
          </div>
        </Card>

        <Card title="Estoque" subtitle="Materiais que podem travar obra.">
          {dados.estoqueBaixo.length === 0 ? (
            <p style={styles.okTexto}>Estoque sem itens abaixo do mínimo.</p>
          ) : (
            <div style={styles.listaMaterial}>
              {dados.estoqueBaixo.slice(0, 5).map((item) => (
                <div key={item.id} style={styles.materialLinha}>
                  <div>
                    <strong>{item.nome}</strong>
                    <p style={styles.textoFraco}>{item.quantidade} {item.unidade} em estoque</p>
                  </div>
                  <span style={styles.falta}>mín. {item.minimo}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Resumo do mês" subtitle="Visão rápida de produção e resultado.">
          <div style={styles.resumoMesGrid}>
            <ResumoNumero label="Obras" value={dados.aprovados.length} />
            <ResumoNumero label="Faturamento" value={formatarMoeda(dados.faturamentoMes)} />
            <ResumoNumero label="Lucro" value={formatarMoeda(dados.lucroMes)} />
            <ResumoNumero label="m²" value={dados.m2Executados.toFixed(1)} />
          </div>
        </Card>
      </div>

      <div style={styles.fabArea}>
        {menuAberto && (
          <div style={styles.fabMenu}>
            <button style={styles.fabOpcao} onClick={() => abrirAtalho('/orcamentos?novo=1')}>Novo orçamento</button>
            <button style={styles.fabOpcao} onClick={() => abrirAtalho('/financeiro')}>Lançamento financeiro</button>
            <button style={styles.fabOpcao} onClick={() => abrirAtalho('/estoque')}>Item de estoque</button>
            <button style={styles.fabOpcao} onClick={() => abrirAtalho('/catalogo')}>Item do catálogo</button>
          </div>
        )}
        <button
          aria-label="Ações rápidas"
          style={styles.fab}
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          {menuAberto ? '×' : '+'}
        </button>
      </div>
    </MainLayout>
  );
}

function MiniCard({ label, valor, detalhe, tom }: { label: string; valor: string; detalhe: string; tom: 'azul' | 'verde' | 'amarelo' }) {
  const cor = tom === 'verde' ? '#16a34a' : tom === 'amarelo' ? '#d97706' : '#2563eb';
  return (
    <Card>
      <span style={styles.cardLabel}>{label}</span>
      <strong style={{ ...styles.cardNumber, color: cor }}>{valor}</strong>
      <small style={styles.cardSmall}>{detalhe}</small>
    </Card>
  );
}

function InfoPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ ...styles.infoPill, borderColor: `${color}28`, background: `${color}10` }}>
      <strong style={{ color }}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function LinhaResumo({ label, valor, destaque }: { label: string; valor: string; destaque: 'verde' | 'vermelho' }) {
  return (
    <div style={styles.linhaResumo}>
      <span>{label}</span>
      <strong style={{ color: destaque === 'verde' ? '#16a34a' : '#dc2626' }}>{valor}</strong>
    </div>
  );
}

function StatusBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={styles.statusBox}>
      <strong style={{ color }}>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ResumoNumero({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={styles.resumoNumero}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  hero: {
    padding: 18,
    borderRadius: 28,
    background: 'linear-gradient(135deg, #0B1228, #1F3C88 62%, #2F6DF6)',
    color: '#fff',
    boxShadow: '0 18px 38px rgba(15, 23, 42, 0.20)',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 14,
    alignItems: 'end',
  },
  badge: { display: 'inline-block', padding: '6px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', fontSize: 12, fontWeight: 900, marginBottom: 12 },
  title: { margin: 0, fontSize: 29, letterSpacing: -1.2, lineHeight: 1.02 },
  subtitle: { margin: '8px 0 0', opacity: 0.88, fontSize: 14, lineHeight: 1.35, maxWidth: 280 },
  heroResumo: { minWidth: 92, padding: '13px 10px', borderRadius: 22, background: 'rgba(255,255,255,.14)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center', justifyContent: 'center' },
  heroResumoStrong: { display: 'block', fontSize: 28, lineHeight: 1, letterSpacing: -1 },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 },
  cardLabel: { display: 'block', color: '#64748b', fontSize: 11.5, fontWeight: 900, marginBottom: 7 },
  cardNumber: { fontSize: 22, letterSpacing: -0.8, lineHeight: 1.1 },
  cardSmall: { display: 'block', marginTop: 4, color: '#94a3b8', fontWeight: 750, fontSize: 11.5 },
  alertGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 12 },
  infoPill: { border: '1px solid', borderRadius: 18, padding: 10, display: 'flex', flexDirection: 'column', gap: 3 },
  lista: { display: 'flex', flexDirection: 'column', gap: 10 },
  itemObra: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 22, padding: 12, background: '#f8fafc', display: 'grid', gridTemplateColumns: '42px 1fr auto', gap: 10, alignItems: 'center', textAlign: 'left', cursor: 'pointer' },
  itemIcon: { width: 42, height: 42, borderRadius: 16, background: '#eaf1ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 },
  nomeObra: { color: '#0f172a', fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' },
  textoFraco: { margin: '4px 0', color: '#64748b', fontSize: 13, lineHeight: 1.35 },
  status: { fontSize: 12, fontWeight: 900, color: '#2563eb' },
  financeiroLista: { display: 'flex', flexDirection: 'column', gap: 9 },
  linhaResumo: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: 14 },
  metaBox: { marginTop: 13, padding: 13, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' },
  metaTopo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0f172a', marginBottom: 10 },
  progressTrack: { height: 12, borderRadius: 999, background: '#dbe4f0', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #0f172a, #2563eb)' },
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 9 },
  statusBox: { border: '1px solid #e2e8f0', borderRadius: 18, padding: 12, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 4 },
  listaMaterial: { display: 'flex', flexDirection: 'column', gap: 9 },
  materialLinha: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center', padding: 12, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0' },
  falta: { fontSize: 12, color: '#b91c1c', fontWeight: 900, background: '#fee2e2', padding: '5px 8px', borderRadius: 999 },
  okTexto: { margin: 0, color: '#166534', fontWeight: 800, background: '#dcfce7', padding: 12, borderRadius: 18 },
  resumoMesGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 9 },
  resumoNumero: { padding: 12, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 },
  fabArea: { position: 'fixed', right: 18, bottom: 'calc(92px + env(safe-area-inset-bottom))', zIndex: 2300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 },
  fab: { width: 58, height: 58, borderRadius: 24, border: 'none', background: 'linear-gradient(135deg, #0B1228, #2563eb)', color: '#fff', fontSize: 30, fontWeight: 800, boxShadow: '0 18px 32px rgba(37, 99, 235, .32)', cursor: 'pointer' },
  fabMenu: { width: 220, padding: 8, borderRadius: 22, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 18px 42px rgba(15, 23, 42, .18)', display: 'flex', flexDirection: 'column', gap: 6 },
  fabOpcao: { border: 'none', background: '#f8fafc', borderRadius: 16, padding: '12px 14px', textAlign: 'left', fontWeight: 850, color: '#0f172a', cursor: 'pointer' },
};
