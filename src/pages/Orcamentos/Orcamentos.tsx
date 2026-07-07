import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';

import type { ItemOrcamento, Orcamento, StatusOrcamento } from '../../models/Orcamento';
import type { Servico } from '../../models/Servico';

import { clienteService } from '../../services/clienteService';
import { carregarOrcamentos, carregarTabelaPrecos, proximoNumeroOrcamento, salvarOrcamentos, salvarTabelaPrecos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';
import logoGessoSMJ from '../../assets/logo-gesso-smj.png';

const ORCAMENTO_RASCUNHO_KEY = 'gesso-smj-orcamento-rascunho';

function isAndroidApp() {
  return Capacitor.isNativePlatform();
}

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


function blobParaBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const resultado = String(reader.result || '');
      resolve(resultado.includes(',') ? resultado.split(',')[1] : resultado);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function salvarImagemOrcamentoAndroid(blob: Blob, nomeArquivo: string, texto: string) {
  if (!isAndroidApp()) {
    throw new Error('Salvamento nativo disponível somente no aplicativo instalado.');
  }

  const base64 = await blobParaBase64(blob);
  const caminho = `GessoSMJ/${nomeArquivo}`;

  await Filesystem.mkdir({
    path: 'GessoSMJ',
    directory: Directory.Documents,
    recursive: true,
  }).catch(() => {
    // A pasta já pode existir.
  });

  await Filesystem.writeFile({
    path: caminho,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });

  const arquivo = await Filesystem.getUri({
    path: caminho,
    directory: Directory.Documents,
  });

  try {
    await Share.share({
      title: 'Orçamento Gesso SMJ',
      text: texto,
      url: arquivo.uri,
      dialogTitle: 'Salvar ou enviar orçamento',
    });
  } catch {
    // Mesmo se o compartilhamento falhar, o arquivo já foi salvo no aparelho.
  }

  return `Imagem salva no aparelho: ${nomeArquivo}`;
}


async function salvarPdfOrcamentoAndroid(blob: Blob, nomeArquivo: string, texto: string) {
  if (!isAndroidApp()) {
    throw new Error('Salvamento nativo disponível somente no aplicativo instalado.');
  }

  const base64 = await blobParaBase64(blob);
  const caminho = `GessoSMJ/${nomeArquivo}`;

  await Filesystem.mkdir({
    path: 'GessoSMJ',
    directory: Directory.Documents,
    recursive: true,
  }).catch(() => {
    // A pasta já pode existir.
  });

  await Filesystem.writeFile({
    path: caminho,
    data: base64,
    directory: Directory.Documents,
    recursive: true,
  });

  const arquivo = await Filesystem.getUri({
    path: caminho,
    directory: Directory.Documents,
  });

  try {
    await Share.share({
      title: 'Orçamento Gesso SMJ',
      text: texto,
      url: arquivo.uri,
      dialogTitle: 'Salvar ou enviar orçamento em PDF',
    });
  } catch {
    // Mesmo se o compartilhamento falhar, o PDF já foi salvo no aparelho.
  }

  return `PDF salvo no aparelho: ${nomeArquivo}`;
}

function baixarPdfWeb(blob: Blob, nomeArquivo: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function gerarPdfOrcamento(orcamento: Orcamento) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const largura = 210;
  const margem = 14;
  let y = 14;

  function textoLinha(texto: string, x: number, yAtual: number, tamanho = 10, estilo: 'normal' | 'bold' = 'normal', cor = '#0f172a') {
    pdf.setFont('helvetica', estilo);
    pdf.setFontSize(tamanho);
    pdf.setTextColor(cor);
    pdf.text(texto, x, yAtual);
  }

  function textoDireita(texto: string, x: number, yAtual: number, tamanho = 10, estilo: 'normal' | 'bold' = 'normal', cor = '#0f172a') {
    pdf.setFont('helvetica', estilo);
    pdf.setFontSize(tamanho);
    pdf.setTextColor(cor);
    pdf.text(texto, x, yAtual, { align: 'right' });
  }

  function linha(yAtual: number) {
    pdf.setDrawColor(210, 220, 232);
    pdf.setLineWidth(0.3);
    pdf.line(margem, yAtual, largura - margem, yAtual);
  }

  function garantirEspaco(alturaNecessaria = 24) {
    if (y + alturaNecessaria < 278) return;
    pdf.addPage();
    y = 18;
  }

  const logo = await carregarImagem(logoGessoSMJ);
  pdf.addImage(logo, 'PNG', margem, y, 34, 34);

  textoDireita('ORÇAMENTO', largura - margem, y + 8, 18, 'bold', '#0b2f4f');
  textoDireita(numeroOrcamento(orcamento), largura - margem, y + 17, 11, 'bold', '#0f172a');
  textoDireita(`Data: ${new Date(orcamento.criadoEm).toLocaleDateString('pt-BR')}`, largura - margem, y + 25, 10, 'normal', '#64748b');
  y += 42;
  linha(y);
  y += 10;

  textoLinha(orcamento.cliente || 'Cliente não informado', margem, y, 15, 'bold', '#0f172a');
  y += 7;

  const descricao = orcamento.observacoes || 'Execução de serviços em gesso e drywall conforme medições abaixo.';
  const descLinhas = pdf.splitTextToSize(descricao, 182);
  textoLinha(descLinhas[0] || '', margem, y, 10, 'normal', '#334155');
  if (descLinhas.length > 1) {
    descLinhas.slice(1, 3).forEach((linhaTexto: string) => {
      y += 5;
      textoLinha(linhaTexto, margem, y, 10, 'normal', '#334155');
    });
  }
  y += 7;

  const local = [orcamento.endereco, orcamento.bairro, orcamento.cidade, orcamento.referencia].filter(Boolean).join(' • ');
  if (local) {
    const linhasLocal = pdf.splitTextToSize(local, 182);
    linhasLocal.slice(0, 2).forEach((linhaTexto: string) => {
      textoLinha(linhaTexto, margem, y, 9, 'normal', '#64748b');
      y += 5;
    });
    y += 2;
  }

  linha(y);
  y += 9;
  textoLinha('MEDIÇÕES E VALORES', margem, y, 12, 'bold', '#0b2f4f');
  y += 8;

  pdf.setFillColor(244, 247, 251);
  pdf.roundedRect(margem, y - 5, largura - margem * 2, 9, 2, 2, 'F');
  textoLinha('Serviço', margem + 3, y, 9, 'bold', '#334155');
  textoDireita('Qtd.', 124, y, 9, 'bold', '#334155');
  textoDireita('Valor', 162, y, 9, 'bold', '#334155');
  textoDireita('Subtotal', largura - margem - 3, y, 9, 'bold', '#334155');
  y += 9;

  orcamento.itens.forEach((item) => {
    garantirEspaco(14);
    const nomeLinhas = pdf.splitTextToSize(item.nome, 78);
    textoLinha(nomeLinhas[0], margem + 3, y, 9, 'bold', '#0f172a');
    if (nomeLinhas[1]) {
      y += 4.5;
      textoLinha(nomeLinhas[1], margem + 3, y, 8, 'normal', '#64748b');
    }
    textoDireita(`${formatarQuantidade(item.quantidade)} ${item.unidade}`, 124, y, 9, 'normal', '#0f172a');
    textoDireita(formatarMoeda(item.valorUnitario), 162, y, 9, 'normal', '#0f172a');
    textoDireita(formatarMoeda(item.subtotal), largura - margem - 3, y, 9, 'bold', '#0b2f4f');
    y += 8;
    pdf.setDrawColor(235, 240, 246);
    pdf.line(margem, y - 3, largura - margem, y - 3);
  });

  y += 4;
  garantirEspaco(45);

  if (orcamento.desconto > 0 || orcamento.acrescimo > 0) {
    textoDireita('Subtotal', 154, y, 10, 'normal', '#64748b');
    textoDireita(formatarMoeda(orcamento.subtotal), largura - margem, y, 10, 'bold', '#0f172a');
    y += 7;
  }
  if (orcamento.desconto > 0) {
    textoDireita('Desconto', 154, y, 10, 'normal', '#64748b');
    textoDireita(`- ${formatarMoeda(orcamento.desconto)}`, largura - margem, y, 10, 'bold', '#b91c1c');
    y += 7;
  }
  if (orcamento.acrescimo > 0) {
    textoDireita('Acréscimo', 154, y, 10, 'normal', '#64748b');
    textoDireita(formatarMoeda(orcamento.acrescimo), largura - margem, y, 10, 'bold', '#0f172a');
    y += 7;
  }

  pdf.setFillColor(6, 47, 79);
  pdf.roundedRect(margem, y, largura - margem * 2, 24, 4, 4, 'F');
  textoLinha(orcamento.desconto > 0 ? 'VALOR TOTAL COM DESCONTO' : 'VALOR TOTAL', margem + 6, y + 10, 11, 'bold', '#ffffff');
  textoDireita(formatarMoeda(orcamento.total), largura - margem - 6, y + 16, 18, 'bold', '#ffffff');
  y += 34;

  garantirEspaco(38);
  textoLinha('OBSERVAÇÕES', margem, y, 11, 'bold', '#0b2f4f');
  y += 7;
  [
    'Material e mão de obra de gesso inclusos.',
    'Material de emassamento por conta do cliente quando houver emassamento.',
    'Pintura não inclusa.',
    'Validade do orçamento: 15 dias.',
  ].forEach((obs) => {
    textoLinha(`- ${obs}`, margem, y, 9, 'normal', '#334155');
    y += 5.5;
  });

  garantirEspaco(48);
  y += 5;
  pdf.setFillColor(6, 47, 79);
  pdf.roundedRect(margem, y, largura - margem * 2, 41, 4, 4, 'F');
  textoLinha('CONTATOS', margem + 6, y + 9, 10, 'bold', '#ffffff');
  textoLinha('Felipe: (27) 99797-9021', margem + 6, y + 18, 9, 'normal', '#ffffff');
  textoLinha('Vitor: (27) 99839-8331', margem + 6, y + 26, 9, 'normal', '#ffffff');
  textoLinha('Fábrica: Vila dos Italianos, Santa Maria de Jetibá - ES', margem + 6, y + 34, 8.5, 'normal', '#ffffff');
  textoDireita('Ref.: em cima da serraria do Elimar Schwambach', largura - margem - 6, y + 34, 8, 'normal', '#ffffff');

  const totalPaginas = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i += 1) {
    pdf.setPage(i);
    textoDireita(`Página ${i}/${totalPaginas}`, largura - margem, 290, 8, 'normal', '#94a3b8');
  }

  return pdf.output('blob');
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

  const [tabelaPrecos, setTabelaPrecos] = useState<Servico[]>(carregarTabelaPrecos());
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
  const [itemEditandoId, setItemEditandoId] = useState<number | null>(null);
  const [servicoCadastroAberto, setServicoCadastroAberto] = useState(false);
  const [novoServicoNome, setNovoServicoNome] = useState('');
  const [novoServicoValor, setNovoServicoValor] = useState<number>(0);
  const [novoServicoUnidade, setNovoServicoUnidade] = useState<Servico['unidade']>('m²');
  const [itemModal, setItemModal] = useState<ItemOrcamento | null>(null);
  const [itemModalQuantidade, setItemModalQuantidade] = useState<number>(1);
  const [itemModalValor, setItemModalValor] = useState<number>(0);
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);

  const [orcamentoAprovando, setOrcamentoAprovando] = useState<Orcamento | null>(null);
  const [dataAprovacao, setDataAprovacao] = useState('');
  const [horaAprovacao, setHoraAprovacao] = useState('');

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
    if (location.search) return;

    const rascunhoSalvo = localStorage.getItem(ORCAMENTO_RASCUNHO_KEY);
    if (!rascunhoSalvo) return;

    try {
      const rascunho = JSON.parse(rascunhoSalvo);
      if (!rascunho?.temConteudo) return;

      setClienteId(rascunho.clienteId || '');
      setCliente(rascunho.cliente || '');
      setTelefone(rascunho.telefone || '');
      setCidade(rascunho.cidade || '');
      setBairro(rascunho.bairro || '');
      setEndereco(rascunho.endereco || '');
      setReferencia(rascunho.referencia || '');
      setObservacoes(rascunho.observacoes || '');
      setStatus(rascunho.status || 'Pendente');
      setDataObra(rascunho.dataObra || '');
      setHoraObra(rascunho.horaObra || '');
      setEquipe(rascunho.equipe || '');
      setObservacoesExecucao(rascunho.observacoesExecucao || '');
      setItens(Array.isArray(rascunho.itens) ? rascunho.itens : []);
      setDesconto(Number(rascunho.desconto || 0));
      setAcrescimo(Number(rascunho.acrescimo || 0));
      setServicoSelecionadoId(rascunho.servicoSelecionadoId || tabelaPrecos[0]?.id || 1);
      setQuantidade(Number(rascunho.quantidade || 1));
      setValorUnitario(Number(rascunho.valorUnitario || tabelaPrecos[0]?.valorUnitario || 0));
      setMostrarFormulario(true);
    } catch {
      localStorage.removeItem(ORCAMENTO_RASCUNHO_KEY);
    }
  }, []);

  useEffect(() => {
    if (!mostrarFormulario || orcamentoEditandoId) return;

    const temConteudo = Boolean(
      cliente.trim() || telefone.trim() || cidade.trim() || bairro.trim() || endereco.trim() || referencia.trim() || observacoes.trim() ||
      itens.length > 0 || desconto > 0 || acrescimo > 0 || status !== 'Pendente'
    );

    if (!temConteudo) {
      localStorage.removeItem(ORCAMENTO_RASCUNHO_KEY);
      return;
    }

    localStorage.setItem(ORCAMENTO_RASCUNHO_KEY, JSON.stringify({
      temConteudo,
      clienteId,
      cliente,
      telefone,
      cidade,
      bairro,
      endereco,
      referencia,
      observacoes,
      status,
      dataObra,
      horaObra,
      equipe,
      observacoesExecucao,
      itens,
      desconto,
      acrescimo,
      servicoSelecionadoId,
      quantidade,
      valorUnitario,
      salvoEm: new Date().toISOString(),
    }));
  }, [
    mostrarFormulario,
    orcamentoEditandoId,
    clienteId,
    cliente,
    telefone,
    cidade,
    bairro,
    endereco,
    referencia,
    observacoes,
    status,
    dataObra,
    horaObra,
    equipe,
    observacoesExecucao,
    itens,
    desconto,
    acrescimo,
    servicoSelecionadoId,
    quantidade,
    valorUnitario,
  ]);

  useEffect(() => {
    if (servicoAtual && !itemEditandoId) setValorUnitario(servicoAtual.valorUnitario);
  }, [servicoSelecionadoId, itemEditandoId]);

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
    setItemEditandoId(null);
    setDesconto(0);
    setAcrescimo(0);
    localStorage.removeItem(ORCAMENTO_RASCUNHO_KEY);
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

  function abrirCadastroServico() {
    setNovoServicoNome('');
    setNovoServicoValor(0);
    setNovoServicoUnidade('m²');
    setServicoCadastroAberto(true);
  }

  function salvarNovoServico() {
    const nome = novoServicoNome.trim();
    if (!nome) return alert('Informe o nome do serviço.');
    if (!novoServicoValor || novoServicoValor <= 0) return alert('Informe o valor do serviço.');

    const novoServico: Servico = {
      id: Date.now(),
      nome,
      valorUnitario: novoServicoValor,
      unidade: novoServicoUnidade,
      categoria: 'Serviço',
    };

    const novaTabela = [...tabelaPrecos, novoServico];
    setTabelaPrecos(novaTabela);
    salvarTabelaPrecos(novaTabela);
    setServicoSelecionadoId(novoServico.id);
    setValorUnitario(novoServico.valorUnitario);
    setServicoCadastroAberto(false);
  }

  function selecionarServico(valor: string) {
    if (valor === '__novo_servico__') {
      abrirCadastroServico();
      return;
    }

    setServicoSelecionadoId(Number(valor));
  }

  function adicionarServico() {
    if (!servicoAtual) return;
    if (!quantidade || quantidade <= 0) return alert('Informe uma quantidade válida.');
    if (!valorUnitario || valorUnitario <= 0) return alert('Informe um valor unitário válido.');

    const itemAtualizado: ItemOrcamento = {
      id: Date.now(),
      servicoId: servicoAtual.id,
      nome: servicoAtual.nome,
      unidade: servicoAtual.unidade,
      quantidade,
      valorUnitario,
      subtotal: quantidade * valorUnitario,
    };

    setItens((listaAtual) => [...listaAtual, itemAtualizado]);
    setQuantidade(1);
    setValorUnitario(servicoAtual.valorUnitario);
  }

  function editarItem(item: ItemOrcamento) {
    setItemModal(item);
    setItemModalQuantidade(item.quantidade);
    setItemModalValor(item.valorUnitario);
  }

  function salvarEdicaoItem() {
    if (!itemModal) return;
    if (!itemModalQuantidade || itemModalQuantidade <= 0) return alert('Informe uma quantidade válida.');
    if (!itemModalValor || itemModalValor <= 0) return alert('Informe um valor unitário válido.');

    setItens((listaAtual) => listaAtual.map((item) => (
      item.id === itemModal.id
        ? { ...item, quantidade: itemModalQuantidade, valorUnitario: itemModalValor, subtotal: itemModalQuantidade * itemModalValor }
        : item
    )));

    setItemModal(null);
  }

  function cancelarEdicaoItem() {
    setItemEditandoId(null);
    setItemModal(null);
    setQuantidade(1);
    setValorUnitario(servicoAtual?.valorUnitario || 0);
  }

  function removerItem(id: number) {
    if (!confirm('Remover este serviço do orçamento?')) return;
    setItens((listaAtual) => listaAtual.filter((item) => item.id !== id));
    if (itemEditandoId === id) cancelarEdicaoItem();
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
    localStorage.removeItem(ORCAMENTO_RASCUNHO_KEY);
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

  function abrirCalendarioAprovacao(orcamento: Orcamento) {
    setOrcamentoAprovando(orcamento);
    setDataAprovacao(orcamento.dataObra || '');
    setHoraAprovacao(orcamento.horaObra || '');
  }

  function confirmarAprovacao() {
    if (!orcamentoAprovando) return;
    if (!dataAprovacao) return alert('Escolha a data de início da obra.');

    const novaLista = orcamentos.map((item) =>
      item.id === orcamentoAprovando.id
        ? { ...item, status: 'Aprovado' as StatusOrcamento, dataObra: dataAprovacao, horaObra: horaAprovacao, atualizadoEm: new Date().toISOString().split('T')[0] }
        : item
    );

    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
    setOrcamentoAprovando(null);
    setDataAprovacao('');
    setHoraAprovacao('');
    alert('Orçamento aprovado e obra agendada.');
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
    const texto = `Gesso SMJ\n${numeroOrcamento(orcamento)}\nCliente: ${orcamento.cliente}\nTotal: ${formatarMoeda(orcamento.total)}\nStatus: ${orcamento.status}`;
    const nomeBase = `orcamento-${numeroOrcamento(orcamento).replace(/[^a-zA-Z0-9]/g, '-')}`;

    try {
      const blob = await gerarPdfOrcamento(orcamento);
      const nomeArquivo = `${nomeBase}.pdf`;

      if (isAndroidApp()) {
        const resultado = await salvarPdfOrcamentoAndroid(blob, nomeArquivo, texto);
        alert(resultado);
        return;
      }

      baixarPdfWeb(blob, nomeArquivo);
      await navigator.clipboard?.writeText(texto);
      alert('PDF do orçamento gerado e baixado. O resumo também foi copiado.');
    } catch (erroPdf) {
      console.warn('Falha ao gerar PDF, tentando gerar imagem:', erroPdf);

      try {
        const blobImagem = await gerarImagemOrcamento(orcamento);
        const nomeImagem = `${nomeBase}.png`;

        try {
          const resultado = await salvarImagemOrcamentoAndroid(blobImagem, nomeImagem, texto);
          alert(resultado);
          return;
        } catch (erroNativo) {
          console.warn('Salvamento nativo de imagem indisponível, usando fallback web:', erroNativo);
        }

        const arquivo = new File([blobImagem], nomeImagem, { type: 'image/png' });

        if (navigator.share && navigator.canShare?.({ files: [arquivo] })) {
          await navigator.share({ title: 'Orçamento Gesso SMJ', text: texto, files: [arquivo] });
          return;
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blobImagem);
        link.download = nomeImagem;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
        await navigator.clipboard?.writeText(texto);
        alert('Não foi possível gerar PDF. A imagem do orçamento foi gerada e baixada.');
      } catch {
        try {
          await navigator.clipboard.writeText(texto);
          alert('Não foi possível gerar PDF nem imagem agora. Resumo copiado.');
        } catch {
          alert('Não foi possível compartilhar agora.');
        }
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

        {orcamentoAprovando && (
          <Card>
            <h2 style={styles.cardTitulo}>Aprovar e agendar obra</h2>
            <p style={styles.textoFraco}>{numeroOrcamento(orcamentoAprovando)} • {orcamentoAprovando.cliente} • {formatarMoeda(orcamentoAprovando.total)}</p>
            <div style={styles.grid}>
              <Input label="Data de início" type="date" value={dataAprovacao} onChange={(e) => setDataAprovacao(e.target.value)} />
              <Input label="Hora" type="time" value={horaAprovacao} onChange={(e) => setHoraAprovacao(e.target.value)} />
            </div>
            <div style={styles.acoesFormulario}>
              <Button onClick={confirmarAprovacao}>Salvar obra agendada</Button>
              <Button variant="outline" onClick={() => setOrcamentoAprovando(null)}>Cancelar</Button>
            </div>
          </Card>
        )}

        {mostrarFormulario && (
          <Card>
            <h2 style={styles.cardTitulo}>{orcamentoEditandoId ? 'Editar orçamento' : 'Novo orçamento'}</h2>
            {!orcamentoEditandoId && (
              <p style={styles.textoFraco}>Salvamento automático ativo. Se sair da tela, o orçamento em andamento continua salvo.</p>
            )}

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
                <select style={styles.select} value={servicoSelecionadoId} onChange={(e) => selecionarServico(e.target.value)}>
                  <option value="__novo_servico__">+ Cadastrar novo serviço</option>
                  {tabelaPrecos.map((servico) => (
                    <option key={servico.id} value={servico.id}>{servico.nome} - {formatarMoeda(servico.valorUnitario)}/{servico.unidade}</option>
                  ))}
                </select>
              </div>
              <Input label="Quantidade" type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} />
              <Input label="Valor unitário" type="number" value={valorUnitario} onChange={(e) => setValorUnitario(Number(e.target.value))} />
              <Button onClick={adicionarServico}>Adicionar serviço</Button>
            </div>

            {itens.length > 0 && (
              <div style={styles.listaItens}>
                {itens.map((item) => (
                  <div key={item.id} style={styles.itemOrcamento}>
                    <div><strong>{item.nome}</strong><p style={styles.textoFraco}>{item.quantidade} {item.unidade} × {formatarMoeda(item.valorUnitario)}</p></div>
                    <div style={styles.itemDireita}>
                      <strong>{formatarMoeda(item.subtotal)}</strong>
                      <div style={styles.botoesItem}>
                        <button style={styles.botaoEditarItem} onClick={() => editarItem(item)}>Editar</button>
                        <button style={styles.botaoRemover} onClick={() => removerItem(item.id)}>Remover</button>
                      </div>
                    </div>
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
                    {orcamento.status !== 'Aprovado' && <Button size="sm" onClick={() => abrirCalendarioAprovacao(orcamento)}>Marcar aprovado</Button>}
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

        {servicoCadastroAberto && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h2 style={styles.modalTitulo}>Cadastrar novo serviço</h2>
              <p style={styles.textoFraco}>Esse serviço ficará salvo na tabela de preços para os próximos orçamentos.</p>
              <Input label="Nome do serviço" value={novoServicoNome} onChange={(e) => setNovoServicoNome(e.target.value)} placeholder="Ex.: Moldura, Rebaixo, Reparo" />
              <div style={styles.grid}>
                <Input label="Valor" type="number" value={novoServicoValor} onChange={(e) => setNovoServicoValor(Number(e.target.value))} />
                <div style={styles.campoSemMargem}>
                  <label style={styles.label}>Unidade</label>
                  <select style={styles.select} value={novoServicoUnidade} onChange={(e) => setNovoServicoUnidade(e.target.value as Servico['unidade'])}>
                    <option value="m²">m²</option>
                    <option value="m">metro linear</option>
                    <option value="un">unidade</option>
                  </select>
                </div>
              </div>
              <div style={styles.acoesFormulario}>
                <Button onClick={salvarNovoServico}>Salvar serviço</Button>
                <Button variant="outline" onClick={() => setServicoCadastroAberto(false)}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}

        {itemModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
              <h2 style={styles.modalTitulo}>Editar serviço</h2>
              <p style={styles.textoFraco}>{itemModal.nome}</p>
              <div style={styles.grid}>
                <Input label={`Quantidade (${itemModal.unidade})`} type="number" value={itemModalQuantidade} onChange={(e) => setItemModalQuantidade(Number(e.target.value))} />
                <Input label="Valor unitário" type="number" value={itemModalValor} onChange={(e) => setItemModalValor(Number(e.target.value))} />
              </div>
              <div style={styles.totalBox}><span>Novo subtotal</span><strong>{formatarMoeda(itemModalQuantidade * itemModalValor)}</strong></div>
              <div style={styles.acoesFormulario}>
                <Button onClick={salvarEdicaoItem}>Salvar alteração</Button>
                <Button variant="outline" onClick={() => setItemModal(null)}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: '100%', overflowX: 'hidden' },
  topo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', width: '100%' },
  titulo: { margin: 0, fontSize: 'clamp(24px, 7vw, 28px)', color: '#0f172a', lineHeight: 1.05 },
  subtitulo: { margin: '6px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.35 },
  cardTitulo: { margin: '0 0 12px', fontSize: 20, color: '#0f172a' },
  textoFraco: { margin: '4px 0', color: '#64748b', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12, marginTop: 12, width: '100%', maxWidth: '100%' },
  gridServico: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, alignItems: 'end', width: '100%', maxWidth: '100%', overflow: 'hidden' },
  gridFiltros: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12, marginBottom: 16, width: '100%' },
  campo: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 },
  campoSemMargem: { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, width: '100%' },
  label: { fontSize: 14, fontWeight: 600, color: '#334155' },
  select: { width: '100%', minWidth: 0, minHeight: 50, borderRadius: 18, border: '1.5px solid #D8E0EC', padding: '0 12px', fontSize: 15, fontWeight: 650, background: '#fff', boxSizing: 'border-box', color: '#0f172a' },
  textarea: { width: '100%', minHeight: 90, borderRadius: 10, border: '1px solid #cbd5e1', padding: 12, fontSize: 15, boxSizing: 'border-box' },
  divisor: { height: 1, backgroundColor: '#e2e8f0', margin: '20px 0' },
  listaItens: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 },
  itemOrcamento: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', flexWrap: 'wrap' },
  itemDireita: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  botaoRemover: { border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 800 },
  botaoEditarItem: { border: 'none', background: 'transparent', color: '#0b2f4f', cursor: 'pointer', fontWeight: 800 },
  botaoCancelarItem: { alignSelf: 'flex-start', marginTop: 10, border: 'none', background: '#eef2ff', color: '#0b2f4f', borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontWeight: 800 },
  botoesItem: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  totalBox: { display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: '#0f172a', color: '#fff', fontSize: 18 },
  acoesFormulario: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  orcamentoCard: { display: 'flex', justifyContent: 'space-between', gap: 16, padding: 14, borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', flexWrap: 'wrap' },
  orcamentoCliente: { margin: 0, fontSize: 18, color: '#0f172a' },
  status: { display: 'inline-block', marginTop: 8, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#e0f2fe', color: '#075985' },
  valorOrcamento: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, color: '#0f172a', width: '100%' },
  botoesCard: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start', width: '100%' },
  visualizacaoTopo: { display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' },
  valorGrande: { fontSize: 26, color: '#16a34a' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, boxSizing: 'border-box' },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '86vh', overflowY: 'auto', background: '#ffffff', borderRadius: 28, padding: 22, boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)', boxSizing: 'border-box' },
  modalTitulo: { margin: '0 0 8px', fontSize: 22, color: '#0f172a', lineHeight: 1.1 },
};
