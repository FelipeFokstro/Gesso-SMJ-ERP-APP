import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';

import type { ItemOrcamento, Orcamento, StatusOrcamento } from '../../models/Orcamento';
import type { Servico } from '../../models/Servico';

import { clienteService } from '../../services/clienteService';
import { carregarOrcamentos, carregarTabelaPrecos, proximoNumeroOrcamento, salvarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';
import logoGessoSMJ from '../../assets/logo-gesso-smj.png';


function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, larguraMaxima: number, alturaLinha: number) {
  const palavras = texto.split(' ');
  let linha = '';
  let yAtual = y;

  palavras.forEach((palavra) => {
    const teste = linha ? `${linha} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > larguraMaxima && linha) {
      ctx.fillText(linha, x, yAtual);
      linha = palavra;
      yAtual += alturaLinha;
    } else {
      linha = teste;
    }
  });

  if (linha) ctx.fillText(linha, x, yAtual);
  return yAtual + alturaLinha;
}

function carregarImagem(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imagem = new Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = reject;
    imagem.src = src;
  });
}

function formatarQuantidade(valor: number) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: valor % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function numeroOrcamento(orcamento: Orcamento) {
  const numero = orcamento.numero || orcamento.id;
  return `ORÇ-${String(numero).padStart(4, '0')}`;
}

function desenharLinhaValor(ctx: CanvasRenderingContext2D, nome: string, detalhe: string, valor: string, y: number) {
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 25px Arial';
  ctx.fillText(nome, 95, y);
  ctx.fillStyle = '#64748b';
  ctx.font = '700 20px Arial';
  if (detalhe) ctx.fillText(detalhe, 95, y + 27);
  ctx.fillStyle = '#0b2f4f';
  ctx.font = '900 25px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(valor, 985, y + 10);
  ctx.textAlign = 'left';
  return y + 66;
}

async function gerarImagemOrcamento(orcamento: Orcamento) {
  const largura = 1080;
  const altura = 1530;
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  ctx.fillStyle = '#f4f7fb';
  ctx.fillRect(0, 0, largura, altura);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(48, 42, largura - 96, altura - 84, 42);
  ctx.fill();

  ctx.strokeStyle = '#dbe4f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  const logo = await carregarImagem(logoGessoSMJ);
  ctx.drawImage(logo, 84, 78, 178, 178);

  ctx.fillStyle = '#0b2f4f';
  ctx.font = '900 44px Arial';
  ctx.textAlign = 'right';
  ctx.fillText('ORÇAMENTO', 995, 118);
  ctx.font = '800 27px Arial';
  ctx.fillText(numeroOrcamento(orcamento), 995, 158);
  ctx.fillStyle = '#64748b';
  ctx.font = '700 23px Arial';
  ctx.fillText(new Date(orcamento.criadoEm).toLocaleDateString('pt-BR'), 995, 194);
  ctx.textAlign = 'left';

  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(84, 292);
  ctx.lineTo(996, 292);
  ctx.stroke();

  let y = 350;
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 34px Arial';
  y = quebrarTexto(ctx, orcamento.cliente || 'Cliente não informado', 84, y, 912, 42);

  ctx.fillStyle = '#334155';
  ctx.font = '700 24px Arial';
  const descricao = orcamento.observacoes || 'Execução de serviços em gesso e drywall conforme medições abaixo.';
  y = quebrarTexto(ctx, descricao, 84, y + 6, 912, 32);

  const local = [orcamento.endereco, orcamento.bairro, orcamento.cidade, orcamento.referencia].filter(Boolean).join(' • ');
  if (local) {
    ctx.fillStyle = '#64748b';
    ctx.font = '700 21px Arial';
    y = quebrarTexto(ctx, local, 84, y + 2, 912, 28);
  }

  y += 26;
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(84, y);
  ctx.lineTo(996, y);
  ctx.stroke();
  y += 44;

  ctx.fillStyle = '#0b2f4f';
  ctx.font = '900 27px Arial';
  ctx.fillText('MEDIÇÕES E VALORES', 84, y);
  y += 42;

  const itensVisiveis = orcamento.itens.slice(0, 8);
  itensVisiveis.forEach((item) => {
    y = desenharLinhaValor(
      ctx,
      item.nome,
      `${formatarQuantidade(item.quantidade)} ${item.unidade} × ${formatarMoeda(item.valorUnitario)}`,
      formatarMoeda(item.subtotal),
      y,
    );
  });

  if (orcamento.desconto > 0 || orcamento.acrescimo > 0) {
    y = desenharLinhaValor(ctx, 'Subtotal', '', formatarMoeda(orcamento.subtotal), y);
  }

  if (orcamento.itens.length > itensVisiveis.length) {
    ctx.fillStyle = '#64748b';
    ctx.font = '800 21px Arial';
    ctx.fillText(`+ ${orcamento.itens.length - itensVisiveis.length} item(ns) no orçamento`, 95, y);
    y += 42;
  }

  if (orcamento.desconto > 0) {
    y = desenharLinhaValor(ctx, 'Desconto', '', `- ${formatarMoeda(orcamento.desconto)}`, y);
  }

  if (orcamento.acrescimo > 0) {
    y = desenharLinhaValor(ctx, 'Acréscimo', '', formatarMoeda(orcamento.acrescimo), y);
  }

  ctx.fillStyle = '#062f4f';
  ctx.beginPath();
  ctx.roundRect(84, y + 8, 912, 118, 28);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 27px Arial';
  ctx.fillText(orcamento.desconto > 0 ? 'VALOR TOTAL COM DESCONTO' : 'VALOR TOTAL', 124, y + 58);
  ctx.font = '900 52px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(formatarMoeda(orcamento.total), 956, y + 76);
  ctx.textAlign = 'left';
  y += 162;

  const observacoesPadrao = [
    'Material e mão de obra de gesso inclusos.',
    'Material de emassamento por conta do cliente quando houver emassamento.',
    'Pintura não inclusa.',
    'Validade do orçamento: 15 dias.',
  ];

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 22px Arial';
  observacoesPadrao.forEach((texto) => {
    ctx.fillText(`✓ ${texto}`, 94, y);
    y += 34;
  });

  ctx.fillStyle = '#062f4f';
  ctx.beginPath();
  ctx.roundRect(48, altura - 286, largura - 96, 244, 0);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px Arial';
  ctx.fillText('CONTATOS', 84, altura - 222);
  ctx.font = '800 23px Arial';
  ctx.fillText('Felipe: (27) 99797-9021', 84, altura - 180);
  ctx.fillText('Vitor: (27) 99839-8331', 84, altura - 145);

  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath();
  ctx.moveTo(84, altura - 112);
  ctx.lineTo(996, altura - 112);
  ctx.stroke();

  ctx.font = '900 24px Arial';
  ctx.fillText('FÁBRICA', 84, altura - 76);
  ctx.font = '700 21px Arial';
  ctx.fillText('Vila dos Italianos, Santa Maria de Jetibá - ES', 205, altura - 76);
  ctx.fillText('Referência: em cima da serraria do Elimar Schwambach', 84, altura - 44);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem')), 'image/png', 0.96);
  });
}

export default function Orcamentos() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tabelaPrecos] = useState<Servico[]>(carregarTabelaPrecos());
  const [clientes] = useState(clienteService.listar());
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(carregarOrcamentos());

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [orcamentoEditandoId, setOrcamentoEditandoId] = useState<number | null>(null);
  const [orcamentoVisualizado, setOrcamentoVisualizado] = useState<Orcamento | null>(null);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | StatusOrcamento>('Todos');
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'maiorValor' | 'cliente'>('recentes');

  const [clienteId, setClienteId] = useState('');
  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [status, setStatus] = useState<StatusOrcamento>('Pendente');
  const [dataObra, setDataObra] = useState('');
  const [horaObra, setHoraObra] = useState('');
  const [equipe, setEquipe] = useState('');
  const [observacoesExecucao, setObservacoesExecucao] = useState('');

  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<number>(tabelaPrecos[0]?.id || 1);
  const servicoAtual = tabelaPrecos.find((item) => item.id === Number(servicoSelecionadoId));
  const [quantidade, setQuantidade] = useState<number>(1);
  const [valorUnitario, setValorUnitario] = useState<number>(servicoAtual?.valorUnitario || 0);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editar = params.get('editar');
    const clienteParam = params.get('clienteId');

    if (clienteParam) {
      const clienteEncontrado = clienteService.buscarPorId(clienteParam);
      if (clienteEncontrado) preencherCliente(clienteEncontrado.id);
      setMostrarFormulario(true);
    }

    if (editar) {
      const orcamento = carregarOrcamentos().find((item) => item.id === Number(editar));
      if (orcamento) carregarParaEdicao(orcamento);
    }
  }, [location.search]);

  useEffect(() => {
    if (servicoAtual) setValorUnitario(servicoAtual.valorUnitario);
  }, [servicoSelecionadoId]);

  const subtotal = useMemo(() => itens.reduce((soma, item) => soma + item.subtotal, 0), [itens]);
  const total = subtotal - desconto + acrescimo;

  const orcamentosFiltrados = useMemo(() => {
    const texto = busca.toLowerCase();

    return [...orcamentos]
      .filter((orcamento) => {
        const passaBusca =
          orcamento.cliente.toLowerCase().includes(texto) ||
          orcamento.telefone.toLowerCase().includes(texto) ||
          (orcamento.cidade || '').toLowerCase().includes(texto) ||
          (orcamento.bairro || '').toLowerCase().includes(texto);
        const passaStatus = filtroStatus === 'Todos' || orcamento.status === filtroStatus;
        return passaBusca && passaStatus;
      })
      .sort((a, b) => {
        if (ordenacao === 'maiorValor') return b.total - a.total;
        if (ordenacao === 'cliente') return a.cliente.localeCompare(b.cliente);
        return b.id - a.id;
      });
  }, [orcamentos, busca, filtroStatus, ordenacao]);

  function preencherCliente(id: string) {
    if (!id || id === '__sem_cliente__') {
      setClienteId('');
      if (id === '__sem_cliente__') {
        setCliente('');
        setTelefone('');
        setCidade('');
        setBairro('');
        setEndereco('');
      }
      return;
    }

    const clienteSelecionado = clienteService.buscarPorId(id);
    setClienteId(id);

    if (!clienteSelecionado) return;

    setCliente(clienteSelecionado.nome);
    setTelefone(clienteSelecionado.telefone || clienteSelecionado.whatsapp);
    setCidade(clienteSelecionado.cidade);
    setBairro(clienteSelecionado.bairro);
    setEndereco(clienteSelecionado.endereco);
  }

  function limparFormulario() {
    setOrcamentoEditandoId(null);
    setClienteId('');
    setCliente('');
    setTelefone('');
    setCidade('');
    setBairro('');
    setEndereco('');
    setReferencia('');
    setObservacoes('');
    setStatus('Pendente');
    setDataObra('');
    setHoraObra('');
    setEquipe('');
    setObservacoesExecucao('');
    setServicoSelecionadoId(tabelaPrecos[0]?.id || 1);
    setQuantidade(1);
    setValorUnitario(tabelaPrecos[0]?.valorUnitario || 0);
    setItens([]);
    setDesconto(0);
    setAcrescimo(0);
  }

  function carregarParaEdicao(orcamento: Orcamento) {
    setOrcamentoEditandoId(orcamento.id);
    setClienteId(orcamento.clienteId || '');
    setCliente(orcamento.cliente);
    setTelefone(orcamento.telefone);
    setCidade(orcamento.cidade);
    setBairro(orcamento.bairro || '');
    setEndereco(orcamento.endereco || '');
    setReferencia(orcamento.referencia || '');
    setItens(orcamento.itens);
    setDesconto(orcamento.desconto);
    setAcrescimo(orcamento.acrescimo);
    setObservacoes(orcamento.observacoes);
    setStatus(orcamento.status);
    setDataObra(orcamento.dataObra || '');
    setHoraObra(orcamento.horaObra || '');
    setEquipe(orcamento.equipe || '');
    setObservacoesExecucao(orcamento.observacoesExecucao || '');
    setMostrarFormulario(true);
    setOrcamentoVisualizado(null);
  }

  function adicionarServico() {
    if (!servicoAtual) return;
    if (!quantidade || quantidade <= 0) return alert('Informe uma quantidade válida.');
    if (!valorUnitario || valorUnitario <= 0) return alert('Informe um valor unitário válido.');

    const novoItem: ItemOrcamento = {
      id: Date.now(),
      servicoId: servicoAtual.id,
      nome: servicoAtual.nome,
      unidade: servicoAtual.unidade,
      quantidade,
      valorUnitario,
      subtotal: quantidade * valorUnitario,
    };

    setItens((listaAtual) => [...listaAtual, novoItem]);
    setQuantidade(1);
  }

  function removerItem(id: number) {
    setItens((listaAtual) => listaAtual.filter((item) => item.id !== id));
  }

  function salvarOrcamento() {
    if (itens.length === 0) return alert('Adicione pelo menos um serviço.');

    const nomeCliente = cliente.trim() || 'Cliente não informado';
    if (status === 'Aprovado' && !dataObra) return alert('Orçamento aprovado precisa ter data da obra.');

    const orcamentoExistente = orcamentos.find((item) => item.id === orcamentoEditandoId);

    const dados: Orcamento = {
      id: orcamentoEditandoId || Date.now(),
      numero: orcamentoExistente?.numero || proximoNumeroOrcamento(orcamentos),
      clienteId: clienteId || undefined,
      cliente: nomeCliente,
      telefone,
      cidade,
      bairro,
      endereco,
      referencia,
      itens,
      subtotal,
      desconto,
      acrescimo,
      total,
      observacoes,
      status,
      dataObra: status === 'Aprovado' ? dataObra : '',
      horaObra: status === 'Aprovado' ? horaObra : '',
      equipe: status === 'Aprovado' ? equipe : '',
      observacoesExecucao: status === 'Aprovado' ? observacoesExecucao : '',
      criadoEm:
        orcamentoExistente?.criadoEm ||
        new Date().toISOString().split('T')[0],
      atualizadoEm: new Date().toISOString().split('T')[0],
    };

    const novaLista = orcamentoEditandoId
      ? orcamentos.map((item) => (item.id === orcamentoEditandoId ? dados : item))
      : [dados, ...orcamentos];

    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
    limparFormulario();
    setMostrarFormulario(false);
    alert(orcamentoEditandoId ? 'Orçamento atualizado.' : 'Orçamento salvo com sucesso.');
  }

  function excluirOrcamento(id: number) {
    if (!confirm('Deseja excluir este orçamento?')) return;
    const novaLista = orcamentos.filter((orcamento) => orcamento.id !== id);
    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
  }

  function aprovarOrcamento(orcamento: Orcamento) {
    const data = prompt('Informe a data da obra. Exemplo: 2026-07-10', orcamento.dataObra || '');
    if (!data) return;
    const novaLista = orcamentos.map((item) =>
      item.id === orcamento.id ? { ...item, status: 'Aprovado' as StatusOrcamento, dataObra: data } : item
    );
    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
  }

  function duplicarOrcamento(orcamento: Orcamento) {
    const novo: Orcamento = {
      ...orcamento,
      id: Date.now(),
      numero: proximoNumeroOrcamento(orcamentos),
      cliente: `${orcamento.cliente} - cópia`,
      status: 'Pendente',
      dataObra: '',
      horaObra: '',
      criadoEm: new Date().toISOString().split('T')[0],
      atualizadoEm: new Date().toISOString().split('T')[0],
    };
    const novaLista = [novo, ...orcamentos];
    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
  }

  async function compartilharOrcamento(orcamento: Orcamento) {
    const texto = `Gesso SMJ\nOrçamento: ${orcamento.cliente}\nTotal: ${formatarMoeda(orcamento.total)}\nStatus: ${orcamento.status}`;

    try {
      const blob = await gerarImagemOrcamento(orcamento);
      const arquivo = new File([blob], `orcamento-gesso-smj-${orcamento.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ title: 'Orçamento Gesso SMJ', text: texto, files: [arquivo] });
        return;
      }

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orcamento-gesso-smj-${orcamento.id}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      await navigator.clipboard?.writeText(texto);
      alert('Imagem do orçamento gerada. O resumo também foi copiado.');
    } catch {
      try {
        await navigator.clipboard.writeText(texto);
        alert('Não foi possível gerar a imagem agora. Resumo copiado.');
      } catch {
        alert('Não foi possível compartilhar agora.');
      }
    }
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <Button variant="outline" onClick={() => navigate('/')}>← Voltar</Button>
          <div>
            <h1 style={styles.titulo}>Orçamentos</h1>
            <p style={styles.subtitulo}>Cadastro, edição, aprovação, busca e agendamento automático.</p>
          </div>
          <Button onClick={() => { limparFormulario(); setMostrarFormulario(true); }}>Novo orçamento</Button>
        </div>

        {mostrarFormulario && (
          <Card>
            <h2 style={styles.cardTitulo}>{orcamentoEditandoId ? 'Editar orçamento' : 'Novo orçamento'}</h2>

            {clientes.length > 0 && (
              <div style={styles.campoSemMargem}>
                <label style={styles.label}>Selecionar cliente cadastrado</label>
                <select style={styles.select} value={clienteId} onChange={(e) => preencherCliente(e.target.value)}>
                  <option value="">Digitar cliente manualmente</option>
                  <option value="__sem_cliente__">Fazer orçamento sem cliente</option>
                  {clientes.map((item) => <option key={item.id} value={item.id}>{item.nome} - {item.cidade}</option>)}
                </select>
              </div>
            )}

            <div style={styles.grid}>
              <Input label="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Opcional: pode deixar vazio" />
              <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              <Input label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
              <Input label="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
              <Input label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              <Input label="Referência" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>

            <div style={styles.divisor} />
            <h3 style={styles.cardTitulo}>Serviços</h3>

            <div style={styles.gridServico}>
              <div style={styles.campoSemMargem}>
                <label style={styles.label}>Serviço</label>
                <select style={styles.select} value={servicoSelecionadoId} onChange={(e) => setServicoSelecionadoId(Number(e.target.value))}>
                  {tabelaPrecos.map((servico) => (
                    <option key={servico.id} value={servico.id}>{servico.nome} - {formatarMoeda(servico.valorUnitario)}/{servico.unidade}</option>
                  ))}
                </select>
              </div>
              <Input label="Quantidade" type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              <Input label="Valor unitário" type="number" value={valorUnitario} onChange={(e) => setValorUnitario(Number(e.target.value))} />
              <Button onClick={adicionarServico}>Adicionar</Button>
            </div>

            {itens.length > 0 && (
              <div style={styles.listaItens}>
                {itens.map((item) => (
                  <div key={item.id} style={styles.itemOrcamento}>
                    <div><strong>{item.nome}</strong><p style={styles.textoFraco}>{item.quantidade} {item.unidade} × {formatarMoeda(item.valorUnitario)}</p></div>
                    <div style={styles.itemDireita}><strong>{formatarMoeda(item.subtotal)}</strong><button style={styles.botaoRemover} onClick={() => removerItem(item.id)}>Remover</button></div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.grid}>
              <Input label="Desconto" type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
              <Input label="Acréscimo" type="number" value={acrescimo} onChange={(e) => setAcrescimo(Number(e.target.value))} />
            </div>

            <div style={styles.totalBox}><span>Total</span><strong>{formatarMoeda(total)}</strong></div>

            <div style={styles.campo}>
              <label style={styles.label}>Status</label>
              <select style={styles.select} value={status} onChange={(e) => setStatus(e.target.value as StatusOrcamento)}>
                <option value="Pendente">Pendente</option>
                <option value="Em negociação">Em negociação</option>
                <option value="Aprovado">Aprovado</option>
              </select>
            </div>

            {status === 'Aprovado' && (
              <div style={styles.grid}>
                <Input label="Data da obra" type="date" value={dataObra} onChange={(e) => setDataObra(e.target.value)} />
                <Input label="Hora" type="time" value={horaObra} onChange={(e) => setHoraObra(e.target.value)} />
                <Input label="Equipe" value={equipe} onChange={(e) => setEquipe(e.target.value)} />
              </div>
            )}

            <div style={styles.campo}><label style={styles.label}>Observações</label><textarea style={styles.textarea} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} /></div>
            {status === 'Aprovado' && <div style={styles.campo}><label style={styles.label}>Observações da execução</label><textarea style={styles.textarea} value={observacoesExecucao} onChange={(e) => setObservacoesExecucao(e.target.value)} /></div>}

            <div style={styles.acoesFormulario}>
              <Button onClick={salvarOrcamento}>{orcamentoEditandoId ? 'Salvar alterações' : 'Salvar orçamento'}</Button>
              <Button variant="outline" onClick={() => { limparFormulario(); setMostrarFormulario(false); }}>Cancelar</Button>
            </div>
          </Card>
        )}

        {orcamentoVisualizado && (
          <Card title="Visualização do orçamento">
            <div style={styles.visualizacaoTopo}>
              <div>
                <h2 style={styles.cardTitulo}>{orcamentoVisualizado.cliente}</h2>
                <p style={styles.textoFraco}>{numeroOrcamento(orcamentoVisualizado)} • {orcamentoVisualizado.cidade} • {orcamentoVisualizado.status}</p>
              </div>
              <strong style={styles.valorGrande}>{formatarMoeda(orcamentoVisualizado.total)}</strong>
            </div>
            {orcamentoVisualizado.itens.map((item) => <p key={item.id}>{item.nome}: {item.quantidade} {item.unidade} × {formatarMoeda(item.valorUnitario)}</p>)}
            <div style={styles.acoesFormulario}>
              <Button onClick={() => carregarParaEdicao(orcamentoVisualizado)}>Editar</Button>
              <Button variant="secondary" onClick={() => compartilharOrcamento(orcamentoVisualizado)}>Compartilhar</Button>
              <Button variant="outline" onClick={() => setOrcamentoVisualizado(null)}>Fechar</Button>
            </div>
          </Card>
        )}

        <Card title="Lista de orçamentos">
          <div style={styles.gridFiltros}>
            <Input label="Pesquisar" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Cliente, telefone, cidade ou bairro" />
            <div style={styles.campoSemMargem}><label style={styles.label}>Status</label><select style={styles.select} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as 'Todos' | StatusOrcamento)}><option value="Todos">Todos</option><option value="Pendente">Pendente</option><option value="Em negociação">Em negociação</option><option value="Aprovado">Aprovado</option></select></div>
            <div style={styles.campoSemMargem}><label style={styles.label}>Ordenar</label><select style={styles.select} value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as 'recentes' | 'maiorValor' | 'cliente')}><option value="recentes">Mais recentes</option><option value="maiorValor">Maior valor</option><option value="cliente">Cliente A-Z</option></select></div>
          </div>

          <div style={styles.lista}>
            {orcamentosFiltrados.map((orcamento) => (
              <div key={orcamento.id} style={styles.orcamentoCard}>
                <div>
                  <h3 style={styles.orcamentoCliente}>{orcamento.cliente}</h3>
                  <p style={styles.textoFraco}>{numeroOrcamento(orcamento)} • {orcamento.cidade || 'Cidade não informada'} • {orcamento.itens.length} serviço(s)</p>
                  {orcamento.dataObra && <p style={styles.textoFraco}>Obra: {orcamento.dataObra} {orcamento.horaObra || ''}</p>}
                  <span style={styles.status}>{orcamento.status}</span>
                </div>
                <div style={styles.valorOrcamento}>
                  <strong>{formatarMoeda(orcamento.total)}</strong>
                  <div style={styles.botoesCard}>
                    <Button size="sm" variant="outline" onClick={() => setOrcamentoVisualizado(orcamento)}>Visualizar</Button>
                    <Button size="sm" onClick={() => carregarParaEdicao(orcamento)}>Editar</Button>
                    {orcamento.status !== 'Aprovado' && <Button size="sm" onClick={() => aprovarOrcamento(orcamento)}>Aprovar</Button>}
                    <Button size="sm" variant="secondary" onClick={() => duplicarOrcamento(orcamento)}>Duplicar</Button>
                    <Button size="sm" variant="secondary" onClick={() => compartilharOrcamento(orcamento)}>Compartilhar</Button>
                    <Button size="sm" variant="danger" onClick={() => excluirOrcamento(orcamento.id)}>Excluir</Button>
                  </div>
                </div>
              </div>
            ))}
            {orcamentosFiltrados.length === 0 && <p style={styles.textoFraco}>Nenhum orçamento encontrado.</p>}
          </div>
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
  cardTitulo: { margin: '0 0 12px', fontSize: 20, color: '#0f172a' },
  textoFraco: { margin: '4px 0', color: '#64748b', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 },
  gridServico: { display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) minmax(120px, 1fr) minmax(140px, 1fr) auto', gap: 12, alignItems: 'end' },
  gridFiltros: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 },
  campo: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 },
  campoSemMargem: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 600, color: '#334155' },
  select: { width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 15, background: '#fff' },
  textarea: { width: '100%', minHeight: 90, borderRadius: 10, border: '1px solid #cbd5e1', padding: 12, fontSize: 15, boxSizing: 'border-box' },
  divisor: { height: 1, backgroundColor: '#e2e8f0', margin: '20px 0' },
  listaItens: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 },
  itemOrcamento: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  itemDireita: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  botaoRemover: { border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 600 },
  totalBox: { display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: '#0f172a', color: '#fff', fontSize: 18 },
  acoesFormulario: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  orcamentoCard: { display: 'flex', justifyContent: 'space-between', gap: 16, padding: 14, borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  orcamentoCliente: { margin: 0, fontSize: 18, color: '#0f172a' },
  status: { display: 'inline-block', marginTop: 8, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#e0f2fe', color: '#075985' },
  valorOrcamento: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, color: '#0f172a' },
  botoesCard: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
  visualizacaoTopo: { display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  valorGrande: { fontSize: 26, color: '#16a34a' },
};
