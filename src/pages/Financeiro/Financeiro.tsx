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

export default function Financeiro() {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>(carregarLancamentos());
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | TipoLancamento>('Todos');

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [tipo, setTipo] = useState<TipoLancamento>('Entrada');
  const [status, setStatus] = useState<StatusLancamento>('Pendente');
  const [data, setData] = useState('');
  const [categoria, setCategoria] = useState('');

  const orcamentos = carregarOrcamentos();
  const contasReceber = orcamentos.filter((orcamento) => orcamento.status === 'Aprovado');

  const totalReceberOrcamentos = contasReceber.reduce((soma, orcamento) => soma + orcamento.total, 0);
  const totalEntradasManuais = lancamentos.filter((item) => item.tipo === 'Entrada').reduce((soma, item) => soma + item.valor, 0);
  const totalSaidas = lancamentos.filter((item) => item.tipo === 'Saída').reduce((soma, item) => soma + item.valor, 0);
  const totalPago = lancamentos.filter((item) => item.status === 'Pago').reduce((soma, item) => soma + item.valor, 0);
  const totalReceber = totalReceberOrcamentos + totalEntradasManuais;
  const lucroPrevisto = totalReceber - totalSaidas;
  const pendentes = lancamentos.filter((item) => item.status === 'Pendente');

  const lancamentosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return lancamentos.filter((item) => {
      const passaBusca = item.descricao.toLowerCase().includes(texto) || item.categoria.toLowerCase().includes(texto);
      const passaTipo = filtroTipo === 'Todos' || item.tipo === filtroTipo;
      return passaBusca && passaTipo;
    });
  }, [lancamentos, busca, filtroTipo]);

  function limparFormulario() {
    setDescricao('');
    setValor(0);
    setTipo('Entrada');
    setStatus('Pendente');
    setData('');
    setCategoria('');
  }

  function salvarLancamento() {
    if (!descricao.trim()) return alert('Informe a descrição.');
    if (!valor || valor <= 0) return alert('Informe um valor válido.');

    const novoLancamento: LancamentoFinanceiro = {
      id: Date.now(),
      descricao,
      valor,
      tipo,
      status,
      data: data || new Date().toISOString().split('T')[0],
      categoria: categoria || 'Geral',
    };

    const novaLista = [novoLancamento, ...lancamentos];
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

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <Button variant="outline" onClick={() => navigate('/')}>← Voltar</Button>
          <div>
            <h1 style={styles.titulo}>Financeiro</h1>
            <p style={styles.subtitulo}>Receitas, despesas, pendências, lucro previsto e contas a receber.</p>
          </div>
          <Button onClick={() => setMostrarFormulario(true)}>Novo lançamento</Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card title="A receber"><strong style={styles.valorVerde}>{formatarMoeda(totalReceber)}</strong><p style={styles.textoFraco}>Orçamentos aprovados + entradas manuais</p></Card>
          <Card title="A pagar"><strong style={styles.valorVermelho}>{formatarMoeda(totalSaidas)}</strong><p style={styles.textoFraco}>Saídas cadastradas</p></Card>
          <Card title="Lucro previsto"><strong style={lucroPrevisto >= 0 ? styles.valorVerde : styles.valorVermelho}>{formatarMoeda(lucroPrevisto)}</strong><p style={styles.textoFraco}>Receber menos pagar</p></Card>
          <Card title="Pago"><strong style={styles.valorAzul}>{formatarMoeda(totalPago)}</strong><p style={styles.textoFraco}>Lançamentos marcados como pagos</p></Card>
          <Card title="Pendências"><strong style={styles.valorAzul}>{pendentes.length}</strong><p style={styles.textoFraco}>Lançamentos pendentes</p></Card>
        </div>

        {mostrarFormulario && (
          <Card title="Novo lançamento">
            <div style={styles.grid}>
              <Input label="Descrição" value={descricao} onChange={(event) => setDescricao(event.target.value)} placeholder="Ex: material, gasolina, pagamento cliente..." />
              <Input label="Valor" type="number" value={valor} onChange={(event) => setValor(Number(event.target.value))} />
              <div style={styles.campo}><label style={styles.label}>Tipo</label><select style={styles.select} value={tipo} onChange={(event) => setTipo(event.target.value as TipoLancamento)}><option value="Entrada">Entrada</option><option value="Saída">Saída</option></select></div>
              <div style={styles.campo}><label style={styles.label}>Status</label><select style={styles.select} value={status} onChange={(event) => setStatus(event.target.value as StatusLancamento)}><option value="Pendente">Pendente</option><option value="Pago">Pago</option></select></div>
              <Input label="Data" type="date" value={data} onChange={(event) => setData(event.target.value)} />
              <Input label="Categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)} placeholder="Material, combustível, funcionário..." />
            </div>
            <div style={styles.acoes}><Button onClick={salvarLancamento}>Salvar lançamento</Button><Button variant="outline" onClick={() => { limparFormulario(); setMostrarFormulario(false); }}>Cancelar</Button></div>
          </Card>
        )}

        <Card title="Filtros">
          <div style={styles.gridFiltros}>
            <Input label="Pesquisar" value={busca} onChange={(event) => setBusca(event.target.value)} />
            <div style={styles.campo}><label style={styles.label}>Tipo</label><select style={styles.select} value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value as 'Todos' | TipoLancamento)}><option value="Todos">Todos</option><option value="Entrada">Entrada</option><option value="Saída">Saída</option></select></div>
          </div>
        </Card>

        <Card title="Contas a receber dos orçamentos">
          {contasReceber.length === 0 ? <p style={styles.textoFraco}>Nenhum orçamento aprovado ainda.</p> : <div style={styles.lista}>{contasReceber.map((orcamento) => <div key={orcamento.id} style={styles.item}><div><strong>{orcamento.cliente}</strong><p style={styles.textoFraco}>Orçamento aprovado{orcamento.dataObra ? ` • Obra em ${orcamento.dataObra}` : ''}</p></div><strong style={styles.entrada}>{formatarMoeda(orcamento.total)}</strong></div>)}</div>}
        </Card>

        <Card title="Lançamentos manuais">
          {lancamentosFiltrados.length === 0 ? <p style={styles.textoFraco}>Nenhum lançamento encontrado.</p> : <div style={styles.lista}>{lancamentosFiltrados.map((item) => <div key={item.id} style={styles.item}><div><strong>{item.descricao}</strong><p style={styles.textoFraco}>{item.categoria} • {item.data} • {item.status}</p></div><div style={styles.itemDireita}><strong style={item.tipo === 'Entrada' ? styles.entrada : styles.saida}>{item.tipo === 'Entrada' ? '+' : '-'} {formatarMoeda(item.valor)}</strong><div style={styles.botoes}><Button size="sm" variant="outline" onClick={() => alterarStatus(item.id)}>{item.status === 'Pago' ? 'Marcar pendente' : 'Marcar pago'}</Button><Button size="sm" variant="danger" onClick={() => excluirLancamento(item.id)}>Remover</Button></div></div></div>)}</div>}
        </Card>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  topo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  titulo: { margin: 0, fontSize: 28, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b' },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 },
  valorVerde: { color: '#16A34A', fontSize: 24 },
  valorVermelho: { color: '#DC2626', fontSize: 24 },
  valorAzul: { color: '#2563EB', fontSize: 24 },
  textoFraco: { margin: '6px 0 0', color: '#64748b', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  gridFiltros: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 },
  campo: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#334155' },
  select: { width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 15, background: '#fff' },
  acoes: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  itemDireita: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  entrada: { color: '#16A34A' },
  saida: { color: '#DC2626' },
  botoes: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
};
