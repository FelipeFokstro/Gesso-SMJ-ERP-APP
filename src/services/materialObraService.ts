import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { MaterialCalculado } from './materialService';

const MATERIAL_OBRA_KEY = 'gesso-smj-material-obras';

export interface MaterialObraEditavel extends MaterialCalculado {
  id: number;
}

type MaterialObrasStorage = Record<string, MaterialObraEditavel[]>;

function normalizarMaterial(item: Partial<MaterialObraEditavel>, index: number): MaterialObraEditavel {
  const quantidade = Number(item.quantidade || 0);
  const custoUnitario = Number(item.custoUnitario || 0);
  const estoqueAtual = Number(item.estoqueAtual || 0);

  return {
    id: Number(item.id || Date.now() + index),
    nome: String(item.nome || ''),
    quantidade,
    unidade: String(item.unidade || 'un'),
    custoUnitario,
    custoTotal: Number(item.custoTotal || quantidade * custoUnitario),
    estoqueAtual,
    falta: Number(item.falta || Math.max(0, quantidade - estoqueAtual)),
  };
}

function carregarStorage(): MaterialObrasStorage {
  const dados = localStorage.getItem(MATERIAL_OBRA_KEY);
  if (!dados) return {};

  try {
    const parsed = JSON.parse(dados) as Record<string, Partial<MaterialObraEditavel>[]>;
    return Object.fromEntries(
      Object.entries(parsed).map(([obraId, materiais]) => [
        obraId,
        materiais.map((item, index) => normalizarMaterial(item, index)),
      ])
    );
  } catch {
    return {};
  }
}

function salvarStorage(storage: MaterialObrasStorage) {
  localStorage.setItem(MATERIAL_OBRA_KEY, JSON.stringify(storage));
}

export function carregarMaterialPersonalizado(obraId: number): MaterialObraEditavel[] | null {
  const storage = carregarStorage();
  return storage[String(obraId)] || null;
}

export function salvarMaterialPersonalizado(obraId: number, materiais: MaterialObraEditavel[]) {
  const storage = carregarStorage();
  storage[String(obraId)] = materiais.map((item, index) => normalizarMaterial(item, index));
  salvarStorage(storage);
}

export function limparMaterialPersonalizado(obraId: number) {
  const storage = carregarStorage();
  delete storage[String(obraId)];
  salvarStorage(storage);
}

export function materialCalculadoParaEditavel(materiais: MaterialCalculado[]): MaterialObraEditavel[] {
  return materiais.map((item, index) => normalizarMaterial({ ...item, id: Date.now() + index }, index));
}

export function recalcularMaterial(item: MaterialObraEditavel): MaterialObraEditavel {
  const quantidade = Number(item.quantidade || 0);
  const custoUnitario = Number(item.custoUnitario || 0);
  const estoqueAtual = Number(item.estoqueAtual || 0);

  return {
    ...item,
    quantidade,
    custoUnitario,
    estoqueAtual,
    custoTotal: Math.round(quantidade * custoUnitario * 100) / 100,
    falta: Math.max(0, Math.round((quantidade - estoqueAtual) * 100) / 100),
  };
}

function baixarTextoWeb(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function salvarTextoAndroid(conteudo: string, nomeArquivo: string) {
  const pasta = 'GessoSMJ';
  const caminho = `${pasta}/${nomeArquivo}`;

  await Filesystem.mkdir({ path: pasta, directory: Directory.Documents, recursive: true }).catch(() => {});
  await Filesystem.writeFile({
    path: caminho,
    data: conteudo,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  const arquivo = await Filesystem.getUri({ path: caminho, directory: Directory.Documents });
  try {
    await Share.share({
      title: 'Lista de material Gesso SMJ',
      text: 'Lista de material da obra.',
      url: arquivo.uri,
      dialogTitle: 'Salvar ou enviar lista de material',
    });
  } catch {
    // O arquivo já foi salvo no aparelho.
  }

  return `Lista salva no aparelho: ${nomeArquivo}`;
}

function limparNomeArquivo(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export async function baixarListaMaterialObra(params: {
  obraNome: string;
  obraNumero?: number;
  materiais: MaterialObraEditavel[];
}) {
  const total = params.materiais.reduce((soma, item) => soma + Number(item.custoTotal || 0), 0);
  const linhas = [
    'GESSO SMJ - LISTA DE MATERIAL',
    params.obraNumero ? `Orçamento: ORÇ-${String(params.obraNumero).padStart(4, '0')}` : '',
    `Obra: ${params.obraNome || 'Sem nome'}`,
    `Data: ${new Date().toLocaleDateString('pt-BR')}`,
    '',
    'MATERIAIS',
    ...params.materiais.map((item) => {
      const falta = item.falta > 0 ? ` | falta comprar: ${item.falta} ${item.unidade}` : '';
      return `- ${item.nome}: ${item.quantidade} ${item.unidade} | estoque: ${item.estoqueAtual} | custo un.: R$ ${item.custoUnitario.toFixed(2)} | total: R$ ${item.custoTotal.toFixed(2)}${falta}`;
    }),
    '',
    `Custo total previsto: R$ ${total.toFixed(2)}`,
  ].filter(Boolean);

  const conteudo = linhas.join('\n');
  const nomeBase = limparNomeArquivo(params.obraNome || 'obra');
  const nomeArquivo = `material-${params.obraNumero ? `orc-${params.obraNumero}-` : ''}${nomeBase || 'obra'}.txt`;

  if (Capacitor.isNativePlatform()) {
    return salvarTextoAndroid(conteudo, nomeArquivo);
  }

  baixarTextoWeb(conteudo, nomeArquivo);
  return `Lista baixada: ${nomeArquivo}`;
}
