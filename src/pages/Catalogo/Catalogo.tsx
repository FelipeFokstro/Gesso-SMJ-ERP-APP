import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';

type CategoriaCatalogo = 'Forro' | 'Sanca' | 'Parede' | 'Decorado' | 'Nicho' | 'Outro';

interface ItemCatalogo {
  id: number;
  titulo: string;
  categoria: CategoriaCatalogo;
  descricao: string;
  valorReferencia: number;
  imagemUrl: string;
  criadoEm: string;
}

const STORAGE_KEY = 'gesso-smj-catalogo';

const itensIniciais: ItemCatalogo[] = [
  { id: 1, titulo: 'Forro liso', categoria: 'Forro', descricao: 'Forro de gesso liso para sala, quarto e cozinha.', valorReferencia: 48, imagemUrl: '', criadoEm: '2026-07-05' },
  { id: 2, titulo: 'Sanca e tabica', categoria: 'Sanca', descricao: 'Acabamento lateral para forro de gesso.', valorReferencia: 18, imagemUrl: '', criadoEm: '2026-07-05' },
  { id: 3, titulo: 'Nicho decorativo', categoria: 'Nicho', descricao: 'Nicho em gesso para parede, bancada ou painel.', valorReferencia: 650, imagemUrl: '', criadoEm: '2026-07-05' },
];

function carregarCatalogo(): ItemCatalogo[] {
  const dados = localStorage.getItem(STORAGE_KEY);
  if (dados) return JSON.parse(dados);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(itensIniciais));
  return itensIniciais;
}

function salvarCatalogo(itens: ItemCatalogo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
}

export default function Catalogo() {
  const navigate = useNavigate();
  const [itens, setItens] = useState<ItemCatalogo[]>(carregarCatalogo());
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'Todas' | CategoriaCatalogo>('Todas');

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaCatalogo>('Forro');
  const [descricao, setDescricao] = useState('');
  const [valorReferencia, setValorReferencia] = useState(0);
  const [imagemUrl, setImagemUrl] = useState('');

  const itensFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();
    return itens.filter((item) => {
      const passaBusca = item.titulo.toLowerCase().includes(texto) || item.descricao.toLowerCase().includes(texto);
      const passaCategoria = filtroCategoria === 'Todas' || item.categoria === filtroCategoria;
      return passaBusca && passaCategoria;
    });
  }, [itens, busca, filtroCategoria]);

  function limparFormulario() {
    setTitulo('');
    setCategoria('Forro');
    setDescricao('');
    setValorReferencia(0);
    setImagemUrl('');
  }

  function selecionarImagem(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = () => {
      setImagemUrl(String(leitor.result || ''));
    };
    leitor.readAsDataURL(arquivo);
  }

  function salvarItem() {
    if (!titulo.trim()) return alert('Informe o título do item.');

    const novoItem: ItemCatalogo = {
      id: Date.now(),
      titulo,
      categoria,
      descricao,
      valorReferencia,
      imagemUrl,
      criadoEm: new Date().toISOString().split('T')[0],
    };

    const novaLista = [novoItem, ...itens];
    setItens(novaLista);
    salvarCatalogo(novaLista);
    limparFormulario();
    setMostrarFormulario(false);
  }

  function excluirItem(id: number) {
    if (!confirm('Deseja excluir este item do catálogo?')) return;
    const novaLista = itens.filter((item) => item.id !== id);
    setItens(novaLista);
    salvarCatalogo(novaLista);
  }

  async function compartilharItem(item: ItemCatalogo) {
    const texto = `Gesso SMJ\n${item.titulo}\n${item.descricao}\nValor referência: R$ ${item.valorReferencia || 0}`;
    try {
      if (navigator.share) await navigator.share({ title: item.titulo, text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        alert('Texto copiado para compartilhar.');
      }
    } catch {
      alert('Não foi possível compartilhar agora.');
    }
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <Button variant="outline" onClick={() => navigate('/')}>← Voltar</Button>
          <div>
            <h1 style={styles.titulo}>Catálogo</h1>
            <p style={styles.subtitulo}>Portfólio de serviços, fotos, categorias e compartilhamento.</p>
          </div>
          <Button onClick={() => setMostrarFormulario(true)}>Novo item</Button>
        </div>

        {mostrarFormulario && (
          <Card title="Novo item do catálogo">
            <div style={styles.grid}>
              <Input label="Título" value={titulo} onChange={(event) => setTitulo(event.target.value)} placeholder="Ex: Forro liso sala" />
              <div style={styles.campo}><label style={styles.label}>Categoria</label><select style={styles.select} value={categoria} onChange={(event) => setCategoria(event.target.value as CategoriaCatalogo)}><option value="Forro">Forro</option><option value="Sanca">Sanca</option><option value="Parede">Parede</option><option value="Decorado">Decorado</option><option value="Nicho">Nicho</option><option value="Outro">Outro</option></select></div>
              <Input label="Valor referência" type="number" value={valorReferencia} onChange={(event) => setValorReferencia(Number(event.target.value))} />
              <Input label="URL da imagem" value={imagemUrl} onChange={(event) => setImagemUrl(event.target.value)} placeholder="Cole o link da foto ou escolha um arquivo" />
              <div style={styles.campo}><label style={styles.label}>Foto do serviço</label><input style={styles.fileInput} type="file" accept="image/*" onChange={selecionarImagem} /></div>
            </div>
            <div style={styles.campo}><label style={styles.label}>Descrição</label><textarea style={styles.textarea} value={descricao} onChange={(event) => setDescricao(event.target.value)} /></div>
            <div style={styles.acoes}><Button onClick={salvarItem}>Salvar item</Button><Button variant="outline" onClick={() => { limparFormulario(); setMostrarFormulario(false); }}>Cancelar</Button></div>
          </Card>
        )}

        <Card title="Filtros">
          <div style={styles.gridFiltros}>
            <Input label="Pesquisar" value={busca} onChange={(event) => setBusca(event.target.value)} />
            <div style={styles.campo}><label style={styles.label}>Categoria</label><select style={styles.select} value={filtroCategoria} onChange={(event) => setFiltroCategoria(event.target.value as 'Todas' | CategoriaCatalogo)}><option value="Todas">Todas</option><option value="Forro">Forro</option><option value="Sanca">Sanca</option><option value="Parede">Parede</option><option value="Decorado">Decorado</option><option value="Nicho">Nicho</option><option value="Outro">Outro</option></select></div>
          </div>
        </Card>

        <div style={styles.catalogoGrid}>
          {itensFiltrados.map((item) => (
            <Card key={item.id}>
              <div style={styles.imagemBox}>
                {item.imagemUrl ? <img src={item.imagemUrl} alt={item.titulo} style={styles.imagem} /> : <span style={styles.semImagem}>Sem foto</span>}
              </div>
              <span style={styles.tag}>{item.categoria}</span>
              <h2 style={styles.cardTitulo}>{item.titulo}</h2>
              <p style={styles.textoFraco}>{item.descricao || 'Sem descrição.'}</p>
              <strong style={styles.valor}>Referência: {item.valorReferencia ? `R$ ${item.valorReferencia}` : '-'}</strong>
              <div style={styles.acoesCard}>
                <Button size="sm" onClick={() => navigate('/orcamentos')}>Adicionar ao orçamento</Button>
                <Button size="sm" variant="secondary" onClick={() => compartilharItem(item)}>Compartilhar</Button>
                <Button size="sm" variant="danger" onClick={() => excluirItem(item.id)}>Excluir</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  topo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  titulo: { margin: 0, fontSize: 28, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  gridFiltros: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 },
  catalogoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 },
  campo: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#334155' },
  select: { width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 15, background: '#fff' },
  fileInput: { width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid #cbd5e1', padding: 10, fontSize: 14, background: '#fff', boxSizing: 'border-box' },
  textarea: { width: '100%', minHeight: 90, borderRadius: 10, border: '1px solid #cbd5e1', padding: 12, fontSize: 15, boxSizing: 'border-box', marginTop: 12 },
  acoes: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 },
  acoesCard: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 },
  imagemBox: { height: 160, borderRadius: 14, background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  imagem: { width: '100%', height: '100%', objectFit: 'cover' },
  semImagem: { color: '#64748b', fontWeight: 700 },
  tag: { display: 'inline-block', padding: '4px 10px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 700 },
  cardTitulo: { margin: '10px 0 6px', fontSize: 20, color: '#0f172a' },
  textoFraco: { margin: '6px 0', color: '#64748b', fontSize: 14 },
  valor: { display: 'block', marginTop: 10, color: '#16a34a' },
};
