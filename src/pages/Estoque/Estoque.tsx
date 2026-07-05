import { useMemo, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import type { ItemEstoque } from '../../services/estoqueService';
import { carregarEstoque, salvarEstoque } from '../../services/estoqueService';
import { consolidarMateriaisObras } from '../../services/materialService';
import { formatarMoeda } from '../../utils/formatarMoeda';

export default function Estoque() {
  const [itens, setItens] = useState<ItemEstoque[]>(carregarEstoque());
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [itemEditandoId, setItemEditandoId] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Material');
  const [quantidade, setQuantidade] = useState(0);
  const [unidade, setUnidade] = useState('un');
  const [minimo, setMinimo] = useState(0);
  const [custoUnitario, setCustoUnitario] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  const obrasAgendadas = useMemo(() => {
    return carregarOrcamentos().filter((orcamento) => orcamento.status === 'Aprovado');
  }, []);

  const materiaisAgendados = useMemo(() => consolidarMateriaisObras(obrasAgendadas), [obrasAgendadas, itens]);
  const custoMaterialAgendado = materiaisAgendados.reduce((soma, item) => soma + item.custoTotal, 0);
  const custoParaComprar = materiaisAgendados.reduce((soma, item) => soma + item.falta * item.custoUnitario, 0);

  const itensFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return itens.filter((item) => item.nome.toLowerCase().includes(texto) || item.categoria.toLowerCase().includes(texto));
  }, [itens, busca]);

  const itensBaixos = itens.filter((item) => item.quantidade <= item.minimo).length;
  const valorEmEstoque = itens.reduce((soma, item) => soma + item.quantidade * item.custoUnitario, 0);

  function atualizarLista(novaLista: ItemEstoque[]) {
    setItens(novaLista);
    salvarEstoque(novaLista);
  }

  function limpar() {
    setItemEditandoId(null);
    setNome('');
    setCategoria('Material');
    setQuantidade(0);
    setUnidade('un');
    setMinimo(0);
    setCustoUnitario(0);
    setObservacoes('');
  }

  function abrirNovoItem() {
    limpar();
    setMostrarFormulario(true);
  }

  function carregarParaEdicao(item: ItemEstoque) {
    setItemEditandoId(item.id);
    setNome(item.nome);
    setCategoria(item.categoria);
    setQuantidade(item.quantidade);
    setUnidade(item.unidade);
    setMinimo(item.minimo);
    setCustoUnitario(item.custoUnitario);
    setObservacoes(item.observacoes);
    setMostrarFormulario(true);
  }

  function salvarItem() {
    if (!nome.trim()) return alert('Informe o nome do item.');
    const dados: ItemEstoque = { id: itemEditandoId || Date.now(), nome, categoria, quantidade, unidade, minimo, custoUnitario, observacoes };
    const novaLista = itemEditandoId ? itens.map((item) => item.id === itemEditandoId ? dados : item) : [dados, ...itens];
    atualizarLista(novaLista);
    limpar();
    setMostrarFormulario(false);
  }

  function ajustarQuantidade(id: number, delta: number) {
    const novaLista = itens.map((item) => item.id === id ? { ...item, quantidade: Math.max(0, Number((item.quantidade + delta).toFixed(2))) } : item);
    atualizarLista(novaLista);
  }

  function editarCusto(id: number) {
    const item = itens.find((atual) => atual.id === id);
    if (!item) return;
    const novoCusto = prompt(`Custo unitário de ${item.nome}`, String(item.custoUnitario));
    if (novoCusto === null) return;
    const valor = Number(novoCusto.replace(',', '.'));
    if (Number.isNaN(valor) || valor < 0) return alert('Informe um custo válido.');
    atualizarLista(itens.map((atual) => atual.id === id ? { ...atual, custoUnitario: valor } : atual));
  }

  function excluirItem(id: number) {
    if (!confirm('Deseja excluir este item?')) return;
    atualizarLista(itens.filter((item) => item.id !== id));
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <div>
            <h1 style={styles.titulo}>Estoque</h1>
            <p style={styles.subtitulo}>Controle manual + cálculo automático de material das obras agendadas.</p>
          </div>
          <Button onClick={abrirNovoItem}>Cadastrar item</Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card><span style={styles.label}>Itens</span><strong style={styles.numero}>{itens.length}</strong></Card>
          <Card><span style={styles.label}>Estoque baixo</span><strong style={styles.numeroAlerta}>{itensBaixos}</strong></Card>
          <Card><span style={styles.label}>Valor em estoque</span><strong style={styles.numero}>{formatarMoeda(valorEmEstoque)}</strong></Card>
          <Card><span style={styles.label}>Comprar p/ obras</span><strong style={styles.numeroAlerta}>{formatarMoeda(custoParaComprar)}</strong></Card>
        </div>

        <Card title="Material das obras agendadas" subtitle="Calculado pelos orçamentos aprovados. Ajuste o custo unitário no estoque para melhorar a precisão.">
          {materiaisAgendados.length === 0 ? (
            <p style={styles.textoFraco}>Nenhuma obra aprovada/agendada para calcular material.</p>
          ) : (
            <div style={styles.listaMaterial}>
              <div style={styles.totalBox}>
                <span>Custo estimado de material</span>
                <strong>{formatarMoeda(custoMaterialAgendado)}</strong>
              </div>
              {materiaisAgendados.map((material) => (
                <div key={`${material.nome}-${material.unidade}`} style={styles.materialLinha}>
                  <div>
                    <strong>{material.nome}</strong>
                    <p style={styles.textoFraco}>Precisa: {material.quantidade} {material.unidade} • Estoque: {material.estoqueAtual} {material.unidade}</p>
                  </div>
                  <div style={styles.materialDireita}>
                    <strong>{formatarMoeda(material.custoTotal)}</strong>
                    {material.falta > 0 ? <span style={styles.falta}>Comprar {material.falta} {material.unidade}</span> : <span style={styles.ok}>Estoque OK</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {mostrarFormulario && (
          <Card title={itemEditandoId ? "Editar item" : "Novo item"}>
            <div style={styles.grid}>
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Gesso cola" />
              <Input label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
              <Input label="Quantidade" type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              <Input label="Unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="saco, rolo, un, kg" />
              <Input label="Mínimo" type="number" value={minimo} onChange={(e) => setMinimo(Number(e.target.value))} />
              <Input label="Custo unitário" type="number" value={custoUnitario} onChange={(e) => setCustoUnitario(Number(e.target.value))} />
              <Input label="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
            <div style={styles.acoes}><Button onClick={salvarItem}>{itemEditandoId ? "Salvar alterações" : "Salvar"}</Button><Button variant="outline" onClick={() => { limpar(); setMostrarFormulario(false); }}>Cancelar</Button></div>
          </Card>
        )}

        <Card title="Pesquisar estoque">
          <Input label="Buscar item" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </Card>

        <div style={styles.lista}>
          {itensFiltrados.map((item) => {
            const baixo = item.quantidade <= item.minimo;
            return (
              <Card key={item.id}>
                <div style={styles.itemTopo}>
                  <div>
                    <h2 style={styles.itemTitulo}>{item.nome}</h2>
                    <p style={styles.textoFraco}>{item.categoria} {item.observacoes ? `• ${item.observacoes}` : ''}</p>
                  </div>
                  <span style={{ ...styles.tag, background: baixo ? '#fee2e2' : '#dcfce7', color: baixo ? '#b91c1c' : '#166534' }}>{baixo ? 'Baixo' : 'OK'}</span>
                </div>
                <div style={styles.quantidadeBox}>
                  <Button size="sm" variant="outline" onClick={() => ajustarQuantidade(item.id, -1)}>-</Button>
                  <strong>{item.quantidade} {item.unidade}</strong>
                  <Button size="sm" onClick={() => ajustarQuantidade(item.id, 1)}>+</Button>
                </div>
                <p style={styles.textoFraco}>Mínimo: {item.minimo} {item.unidade}</p>
                <p style={styles.textoFraco}>Custo: {formatarMoeda(item.custoUnitario)} / {item.unidade}</p>
                <div style={styles.acoesMini}>
                  <Button size="sm" variant="outline" onClick={() => carregarParaEdicao(item)}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => editarCusto(item.id)}>Editar custo</Button>
                  <Button size="sm" variant="danger" onClick={() => excluirItem(item.id)}>Excluir</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  topo: { display: 'grid', gridTemplateColumns: '1fr', gap: 12 },
  titulo: { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: -1, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.4 },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 },
  label: { display: 'block', color: '#64748b', fontSize: 13, marginBottom: 8, fontWeight: 800 },
  numero: { fontSize: 22, color: '#0f172a', letterSpacing: -0.7 },
  numeroAlerta: { fontSize: 22, color: '#dc2626', letterSpacing: -0.7 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 },
  acoes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 16 },
  acoesMini: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 },
  lista: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 },
  itemTopo: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  itemTitulo: { margin: 0, fontSize: 19, color: '#0f172a' },
  textoFraco: { margin: '6px 0', color: '#64748b', fontSize: 13, lineHeight: 1.35 },
  tag: { padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 800 },
  quantidadeBox: { display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' },
  listaMaterial: { display: 'flex', flexDirection: 'column', gap: 10 },
  materialLinha: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: 13, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' },
  materialDireita: { display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' },
  falta: { fontSize: 12, color: '#b91c1c', fontWeight: 900, background: '#fee2e2', padding: '4px 8px', borderRadius: 999 },
  ok: { fontSize: 12, color: '#166534', fontWeight: 900, background: '#dcfce7', padding: '4px 8px', borderRadius: 999 },
  totalBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 15, borderRadius: 24, background: '#0f1b3d', color: '#fff' },
};
