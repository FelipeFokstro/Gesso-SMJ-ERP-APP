import { useMemo, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';

interface ItemEstoque {
  id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  minimo: number;
  observacoes: string;
}

const STORAGE_KEY = 'gesso-smj-estoque';

function carregarEstoque(): ItemEstoque[] {
  const dados = localStorage.getItem(STORAGE_KEY);
  if (dados) return JSON.parse(dados);
  const iniciais: ItemEstoque[] = [
    { id: 1, nome: 'Saco de gesso 50kg', categoria: 'Material', quantidade: 0, unidade: 'saco', minimo: 5, observacoes: '' },
    { id: 2, nome: 'Sisal', categoria: 'Material', quantidade: 0, unidade: 'un', minimo: 2, observacoes: '' },
    { id: 3, nome: 'Fita telada', categoria: 'Acabamento', quantidade: 0, unidade: 'rolo', minimo: 2, observacoes: '' },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(iniciais));
  return iniciais;
}

function salvarEstoque(itens: ItemEstoque[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
}

export default function Estoque() {
  const [itens, setItens] = useState<ItemEstoque[]>(carregarEstoque());
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busca, setBusca] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Material');
  const [quantidade, setQuantidade] = useState(0);
  const [unidade, setUnidade] = useState('un');
  const [minimo, setMinimo] = useState(0);
  const [observacoes, setObservacoes] = useState('');

  const itensFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return itens.filter((item) => item.nome.toLowerCase().includes(texto) || item.categoria.toLowerCase().includes(texto));
  }, [itens, busca]);

  const itensBaixos = itens.filter((item) => item.quantidade <= item.minimo).length;

  function limpar() {
    setNome('');
    setCategoria('Material');
    setQuantidade(0);
    setUnidade('un');
    setMinimo(0);
    setObservacoes('');
  }

  function salvarItem() {
    if (!nome.trim()) return alert('Informe o nome do item.');
    const novoItem: ItemEstoque = { id: Date.now(), nome, categoria, quantidade, unidade, minimo, observacoes };
    const novaLista = [novoItem, ...itens];
    setItens(novaLista);
    salvarEstoque(novaLista);
    limpar();
    setMostrarFormulario(false);
  }

  function ajustarQuantidade(id: number, delta: number) {
    const novaLista = itens.map((item) => item.id === id ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item);
    setItens(novaLista);
    salvarEstoque(novaLista);
  }

  function excluirItem(id: number) {
    if (!confirm('Deseja excluir este item?')) return;
    const novaLista = itens.filter((item) => item.id !== id);
    setItens(novaLista);
    salvarEstoque(novaLista);
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <div>
            <h1 style={styles.titulo}>Estoque</h1>
            <p style={styles.subtitulo}>Cadastro simples para controlar material manualmente.</p>
          </div>
          <Button onClick={() => setMostrarFormulario(true)}>Cadastrar item</Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card><span style={styles.label}>Itens cadastrados</span><strong style={styles.numero}>{itens.length}</strong></Card>
          <Card><span style={styles.label}>Estoque baixo</span><strong style={styles.numeroAlerta}>{itensBaixos}</strong></Card>
        </div>

        {mostrarFormulario && (
          <Card title="Novo item">
            <div style={styles.grid}>
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Gesso cola" />
              <Input label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
              <Input label="Quantidade" type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              <Input label="Unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="saco, rolo, un, kg" />
              <Input label="Mínimo" type="number" value={minimo} onChange={(e) => setMinimo(Number(e.target.value))} />
              <Input label="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
            <div style={styles.acoes}><Button onClick={salvarItem}>Salvar</Button><Button variant="outline" onClick={() => { limpar(); setMostrarFormulario(false); }}>Cancelar</Button></div>
          </Card>
        )}

        <Card title="Pesquisar">
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
                <Button size="sm" variant="danger" onClick={() => excluirItem(item.id)}>Excluir</Button>
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
  topo: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  titulo: { margin: 0, fontSize: 28, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b' },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  label: { display: 'block', color: '#64748b', fontSize: 13, marginBottom: 8, fontWeight: 700 },
  numero: { fontSize: 28, color: '#0f172a' },
  numeroAlerta: { fontSize: 28, color: '#dc2626' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  acoes: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 },
  lista: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 },
  itemTopo: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  itemTitulo: { margin: 0, fontSize: 19, color: '#0f172a' },
  textoFraco: { margin: '6px 0', color: '#64748b', fontSize: 14 },
  tag: { padding: '4px 9px', borderRadius: 999, fontSize: 12, fontWeight: 800 },
  quantidadeBox: { display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' },
};
