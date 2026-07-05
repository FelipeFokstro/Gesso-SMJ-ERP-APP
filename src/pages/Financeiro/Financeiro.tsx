import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

type TipoLancamento = 'Entrada' | 'Saída';
type StatusLancamento = 'Pendente' | 'Pago';

interface LancamentoFinanceiro {
  id: number;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  status: StatusLancamento;
  data: string;
  categoria: string;
}

const STORAGE_KEY = 'gesso-smj-financeiro';

function carregarLancamentos(): LancamentoFinanceiro[] {
  const dados = localStorage.getItem(STORAGE_KEY);
  if (dados) return JSON.parse(dados);

  const iniciais: LancamentoFinanceiro[] = [
    { id: 1, descricao: 'Aluguel', valor: 2000, tipo: 'Saída', status: 'Pendente', data: '2026-07-05', categoria: 'Fixo' },
    { id: 2, descricao: 'Gasolina', valor: 400, tipo: 'Saída', status: 'Pendente', data: '2026-07-05', categoria: 'Transporte' },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(iniciais));
  return iniciais;
}

function salvarLancamentosStorage(lancamentos: LancamentoFinanceiro[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lancamentos));
}

function mesAtual() {
  return new Date().toISOString().slice(0, 7);
}

function mesAnterior(mes: string) {
  const [ano, mesNumero] = mes.split('-').map(Number);
  return new Date(ano, mesNumero - 2, 1).toISOString().slice(0, 7);
}

export default function Financeiro() {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>(carregarLancamentos());
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [lancamentoEditandoId, setLancamentoEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | TipoLancamento>('Todos');
  const [mesSelecionado, setMesSelecionado] = useState(mesAtual());

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [tipo, setTipo] = useState<TipoLancamento>('Entrada');
  const [status, setStatus] = useState<StatusLancamento>('Pendente');
  const [data, setData] = useState('');
  const [categoria, setCategoria] = useState('');

  const orcamentos = carregarOrcamentos();
  const contasReceber = orcamentos.filter((orcamento) => orcamento.status === 'Aprovado');

  function calcularResumoMes(mes: string) {
    const lancamentosMes = lancamentos.filter((item) => item.data.slice(0, 7) === mes);
    const orcamentosMes = contasReceber.filter((orcamento) => {
      const dataBase = orcamento.dataObra || orcamento.criadoEm || '';
      return dataBase.slice(0, 7) === mes;
    });

    const entradasOrcamentos = orcamentosMes.reduce((soma, item) => soma + item.total, 0);
    const entradasManuais = lancamentosMes.filter((item) => item.tipo === 'Entrada').reduce((soma, item) => soma + item.valor, 0);
    const saidas = lancamentosMes.filter((item) => item.tipo === 'Saída').reduce((soma, item) => soma + item.valor, 0);
    const receber = entradasOrcamentos + entradasManuais;

    return { receber, saidas, lucro: receber - saidas, lancamentosMes, orcamentosMes };
  }

  const resumoAtual = calcularResumoMes(mesSelecionado);
  const resumoAnterior = calcularResumoMes(mesAnterior(mesSelecionado));
  const totalPago = resumoAtual.lancamentosMes.filter((item) => item.status === 'Pago').reduce((soma, item) => soma + item.valor, 0);
  const pendentes = resumoAtual.lancamentosMes.filter((item) => item.status === 'Pendente');

  const maiorGrafico = Math.max(
    1,
    resumoAtual.receber,
    resumoAtual.saidas,
    Math.abs(resumoAtual.lucro),
    resumoAnterior.receber,
    resumoAnterior.saidas,
    Math.abs(resumoAnterior.lucro),
  );

  const lancamentosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return resumoAtual.lancamentosMes.filter((item) => {
      const passaBusca = item.descricao.toLowerCase().includes(texto) || item.categoria.toLowerCase().includes(texto);
      const passaTipo = filtroTipo === 'Todos' || item.tipo === filtroTipo;
      return passaBusca && passaTipo;
    });
  }, [resumoAtual.lancamentosMes, busca, filtroTipo]);

  function limparFormulario() {
    setLancamentoEditandoId(null);
    setDescricao('');
    setValor(0);
    setTipo('Entrada');
    setStatus('Pendente');
    setData('');
    setCategoria('');
  }

  function abrirNovoLancamento() {
    limparFormulario();
    setData(`${mesSelecionado}-01`);
    setMostrarFormulario(true);
  }

  function carregarParaEdicao(item: LancamentoFinanceiro) {
    setLancamentoEditandoId(item.id);
    setDescricao(item.descricao);
    setValor(item.valor);
    setTipo(item.tipo);
    setStatus(item.status);
    setData(item.data);
    setCategoria(item.categoria);
    setMostrarFormulario(true);
  }

  function salvarLancamento() {
    if (!descricao.trim()) return alert('Informe a descrição.');
    if (!valor || valor <= 0) return alert('Informe um valor válido.');

    const dados: LancamentoFinanceiro = {
      id: lancamentoEditandoId || Date.now(),
      descricao,
      valor,
      tipo,
      status,
      data: data || new Date().toISOString().split('T')[0],
      categoria: categoria || 'Geral',
    };

    const novaLista = lancamentoEditandoId
      ? lancamentos.map((item) => (item.id === lancamentoEditandoId ? dados : item))
      : [dados, ...lancamentos];

    setLancamentos(novaLista);
    salvarLancamentosStorage(novaLista);
    limparFormulario();
    setMostrarFormulario(false);
  }

  function alterarStatus(id: number) {
    const novaLista = lancamentos.map((item) => item.id === id ? { ...item, status: item.status === 'Pago' ? 'Pendente' as const : 'Pago' as const } : item);
    setLancamentos(novaLista);
    salvarLancamentosStorage(novaLista);
  }

  function excluirLancamento(id: number) {
    if (!confirm('Deseja excluir este lançamento?')) return;
    const novaLista = lancamentos.filter((item) => item.id !== id);
    setLancamentos(novaLista);
    salvarLancamentosStorage(novaLista);
  }

  function Barra({ label, valor, tipoBarra }: { label: string; valor: number; tipoBarra: 'entrada' | 'saida' | 'lucro' }) {
    const largura = Math.max(3, Math.min(100, (Math.abs(valor) / maiorGrafico) * 100));
    const cor = tipoBarra === 'entrada' ? '#16A34A' : tipoBarra === 'saida' ? '#DC2626' : valor >= 0 ? '#2563EB' : '#DC2626';
    return (
      <div style={styles.graficoLinha}>
        <div style={styles.graficoCabecalho}><span>{label}</span><strong>{formatarMoeda(valor)}</strong></div>
        <div style={styles.graficoTrilho}><div style={{ ...styles.graficoBarra, width: `${largura}%`, background: cor }} /></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <Button variant="outline" onClick={() => navigate('/')}>← Voltar</Button>
          <div>
            <h1 style={styles.titulo}>Financeiro</h1>
            <p style={styles.subtitulo}>Controle mensal, lançamentos editáveis e comparação com o mês anterior.</p>
          </div>
          <Button onClick={abrirNovoLancamento}>Novo lançamento</Button>
        </div>

        <Card>
          <div style={styles.mesCard}>
            <div>
              <strong style={styles.mesTitulo}>Resumo mensal</strong>
              <p style={styles.textoFraco}>Escolha o mês para separar entradas, saídas e lucro.</p>
            </div>
            <Input label="Mês" type="month" value={mesSelecionado} onChange={(event) => setMesSelecionado(event.target.value)} />
          </div>
        </Card>

        <div style={styles.resumoGrid}>
          <Card title="A receber"><strong style={styles.valorVerde}>{formatarMoeda(resumoAtual.receber)}</strong><p style={styles.textoFraco}>Orçamentos aprovados + entradas manuais</p></Card>
          <Card title="A pagar"><strong style={styles.valorVermelho}>{formatarMoeda(resumoAtual.saidas)}</strong><p style={styles.textoFraco}>Saídas cadastradas</p></Card>
          <Card title="Lucro previsto"><strong style={resumoAtual.lucro >= 0 ? styles.valorVerde : styles.valorVermelho}>{formatarMoeda(resumoAtual.lucro)}</strong><p style={styles.textoFraco}>Receber menos pagar</p></Card>
          <Card title="Pago"><strong style={styles.valorAzul}>{formatarMoeda(totalPago)}</strong><p style={styles.textoFraco}>Lançamentos pagos</p></Card>
          <Card title="Pendências"><strong style={styles.valorAzul}>{pendentes.length}</strong><p style={styles.textoFraco}>Lançamentos pendentes</p></Card>
        </div>

        <Card title="Comparativo mensal" subtitle="Mês atual comparado com o mês anterior.">
          <div style={styles.comparativoGrid}>
            <div style={styles.comparativoBox}>
              <strong style={styles.comparativoTitulo}>Mês atual</strong>
              <Barra label="Entradas" valor={resumoAtual.receber} tipoBarra="entrada" />
              <Barra label="Saídas" valor={resumoAtual.saidas} tipoBarra="saida" />
              <Barra label="Lucro" valor={resumoAtual.lucro} tipoBarra="lucro" />
            </div>
            <div style={styles.comparativoBox}>
              <strong style={styles.comparativoTitulo}>Mês anterior</strong>
              <Barra label="Entradas" valor={resumoAnterior.receber} tipoBarra="entrada" />
              <Barra label="Saídas" valor={resumoAnterior.saidas} tipoBarra="saida" />
              <Barra label="Lucro" valor={resumoAnterior.lucro} tipoBarra="lucro" />
            </div>
          </div>
        </Card>

        {mostrarFormulario && (
          <Card title={lancamentoEditandoId ? 'Editar lançamento' : 'Novo lançamento'}>
            <div style={styles.grid}>
              <Input label="Descrição" value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Ex: material, gasolina, pagamento cliente..." />
              <Input label="Valor" type="number" value={valor} onChange={(event) => setValor(Number(event.target.value))} />
              <div style={styles.campo}><label style={styles.label}>Tipo</label><select style={styles.select} value={tipo} onChange={(event) => setTipo(event.target.value as TipoLancamento)}><option value="Entrada">Entrada</option><option value="Saída">Saída</option></select></div>
              <div style={styles.campo}><label style={styles.label}>Status</label><select style={styles.select} value={status} onChange={(event) => setStatus(event.target.value as StatusLancamento)}><option value="Pendente">Pendente</option><option value="Pago">Pago</option></select></div>
              <Input label="Data" type="date" value={data} onChange={(event) => setData(event.target.value)} />
              <Input label="Categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)} placeholder="Material, combustível, funcionário..." />
            </div>
            <div style={styles.acoes}><Button onClick={salvarLancamento}>{lancamentoEditandoId ? 'Salvar alterações' : 'Salvar lançamento'}</Button><Button variant="outline" onClick={() => { limparFormulario(); setMostrarFormulario(false); }}>Cancelar</Button></div>
          </Card>
        )}

        <Card title="Filtros">
          <div style={styles.gridFiltros}>
            <Input label="Pesquisar" value={busca} onChange={(event) => setBusca(event.target.value)} />
            <div style={styles.campo}><label style={styles.label}>Tipo</label><select style={styles.select} value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value as 'Todos' | TipoLancamento)}><option value="Todos">Todos</option><option value="Entrada">Entrada</option><option value="Saída">Saída</option></select></div>
          </div>
        </Card>

        <Card title="Contas a receber do mês" subtitle="Somente orçamentos aprovados dentro do mês selecionado.">
          {resumoAtual.orcamentosMes.length === 0 ? <p style={styles.textoFraco}>Nenhum orçamento aprovado neste mês.</p> : <div style={styles.lista}>{resumoAtual.orcamentosMes.map((orcamento) => <div key={orcamento.id} style={styles.item}><div><strong>{orcamento.cliente || 'Cliente não informado'}</strong><p style={styles.textoFraco}>Orçamento aprovado{orcamento.dataObra ? ` • Obra em ${orcamento.dataObra}` : ''}</p></div><strong style={styles.entrada}>{formatarMoeda(orcamento.total)}</strong></div>)}</div>}
        </Card>

        <Card title="Lançamentos manuais">
          {lancamentosFiltrados.length === 0 ? <p style={styles.textoFraco}>Nenhum lançamento encontrado.</p> : <div style={styles.lista}>{lancamentosFiltrados.map((item) => <div key={item.id} style={styles.item}><div><strong>{item.descricao}</strong><p style={styles.textoFraco}>{item.categoria} • {item.data} • {item.status}</p></div><div style={styles.itemDireita}><strong style={item.tipo === 'Entrada' ? styles.entrada : styles.saida}>{item.tipo === 'Entrada' ? '+' : '-'} {formatarMoeda(item.valor)}</strong><div style={styles.botoes}><Button size="sm" variant="outline" onClick={() => carregarParaEdicao(item)}>Editar</Button><Button size="sm" variant="outline" onClick={() => alterarStatus(item.id)}>{item.status === 'Pago' ? 'Pendente' : 'Pago'}</Button><Button size="sm" variant="danger" onClick={() => excluirLancamento(item.id)}>Remover</Button></div></div></div>)}</div>}
        </Card>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  topo: { display: 'grid', gridTemplateColumns: '1fr', gap: 12 },
  titulo: { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: -1.1, color: '#0f172a' },
  subtitulo: { margin: '7px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.4 },
  mesCard: { display: 'grid', gridTemplateColumns: '1fr minmax(160px, 220px)', gap: 14, alignItems: 'end' },
  mesTitulo: { display: 'block', color: '#0f172a', fontSize: 18, letterSpacing: -0.4 },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 },
  valorVerde: { color: '#16A34A', fontSize: 23, letterSpacing: -0.8 },
  valorVermelho: { color: '#DC2626', fontSize: 23, letterSpacing: -0.8 },
  valorAzul: { color: '#2563EB', fontSize: 23, letterSpacing: -0.8 },
  textoFraco: { margin: '5px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.35 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 },
  gridFiltros: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 },
  campo: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: 13, fontWeight: 800, color: '#334155' },
  select: { width: '100%', minHeight: 50, borderRadius: 18, border: '1.5px solid #D8E0EC', padding: '0 14px', fontSize: 15, fontWeight: 650, background: '#fff', color: '#0f172a', boxSizing: 'border-box' },
  acoes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginTop: 16 },
  lista: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12, padding: 13, borderRadius: 22, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  itemDireita: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  entrada: { color: '#16A34A', fontWeight: 900 },
  saida: { color: '#DC2626', fontWeight: 900 },
  botoes: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  comparativoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 },
  comparativoBox: { display: 'flex', flexDirection: 'column', gap: 12, padding: 12, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' },
  comparativoTitulo: { color: '#0f172a', fontSize: 16 },
  graficoLinha: { display: 'flex', flexDirection: 'column', gap: 6 },
  graficoCabecalho: { display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, color: '#334155' },
  graficoTrilho: { height: 12, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' },
  graficoBarra: { height: '100%', borderRadius: 999 },
};
