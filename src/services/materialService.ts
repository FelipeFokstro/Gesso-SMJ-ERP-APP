import type { Orcamento } from '../models/Orcamento';
import { buscarItemEstoque, carregarEstoque } from './estoqueService';

export interface MaterialCalculado {
  nome: string;
  quantidade: number;
  unidade: string;
  custoUnitario: number;
  custoTotal: number;
  estoqueAtual: number;
  falta: number;
}

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100;
}

function adicionarMaterial(lista: MaterialCalculado[], nome: string, quantidade: number, unidade: string, custoPadrao: number) {
  if (!quantidade || quantidade <= 0) return;

  const estoque = buscarItemEstoque(nome, carregarEstoque());
  const custoUnitario = estoque?.custoUnitario && estoque.custoUnitario > 0 ? estoque.custoUnitario : custoPadrao;
  const estoqueAtual = estoque?.quantidade || 0;
  const existente = lista.find((item) => item.nome === nome && item.unidade === unidade);

  if (existente) {
    existente.quantidade = arredondar(existente.quantidade + quantidade);
    existente.custoTotal = arredondar(existente.quantidade * existente.custoUnitario);
    existente.falta = Math.max(0, arredondar(existente.quantidade - existente.estoqueAtual));
    return;
  }

  lista.push({
    nome,
    quantidade: arredondar(quantidade),
    unidade,
    custoUnitario,
    custoTotal: arredondar(quantidade * custoUnitario),
    estoqueAtual,
    falta: Math.max(0, arredondar(quantidade - estoqueAtual)),
  });
}

export function calcularMateriaisDaObra(obra: Orcamento): MaterialCalculado[] {
  const materiais: MaterialCalculado[] = [];

  obra.itens.forEach((item) => {
    const nome = item.nome.toLowerCase();
    const qtd = Number(item.quantidade || 0);

    if (nome.includes('forro') || nome.includes('liso') || nome.includes('bizotado') || nome.includes('gesso')) {
      adicionarMaterial(materiais, 'Placa de gesso', qtd * 2.8, 'placa', 13 / 2.8);
      adicionarMaterial(materiais, 'Saco de gesso 50kg', Math.ceil(qtd / 22), 'saco', 30);
      adicionarMaterial(materiais, 'Sisal', Math.ceil(qtd / 50), 'un', 0);
      adicionarMaterial(materiais, 'Arame', Math.ceil(qtd / 50), 'kg', 0);
      adicionarMaterial(materiais, 'Fita telada', Math.ceil(qtd / 50), 'rolo', 0);
      return;
    }

    if (nome.includes('sanca') || nome.includes('tabica')) {
      adicionarMaterial(materiais, 'Sanca', qtd, 'm', 1);
      return;
    }

    if (nome.includes('cortineiro')) {
      adicionarMaterial(materiais, 'Cortineiro', qtd, 'm', 3);
      return;
    }

    if (nome.includes('hidrofugado')) {
      adicionarMaterial(materiais, 'Bloco hidrofugado', qtd, 'm²', 30);
      return;
    }

    if (nome.includes('parede') || nome.includes('bloco') || nome.includes('drywall')) {
      adicionarMaterial(materiais, 'Bloco de gesso normal', qtd, 'm²', 17);
      return;
    }

    if (nome.includes('emassa') || nome.includes('massa')) {
      adicionarMaterial(materiais, 'Massa acabamento', Math.ceil(qtd / 35), 'saco', 0);
    }
  });

  return materiais.sort((a, b) => b.custoTotal - a.custoTotal);
}

export function consolidarMateriaisObras(obras: Orcamento[]): MaterialCalculado[] {
  const consolidado: MaterialCalculado[] = [];

  obras.forEach((obra) => {
    calcularMateriaisDaObra(obra).forEach((material) => {
      const existente = consolidado.find((item) => item.nome === material.nome && item.unidade === material.unidade);
      if (existente) {
        existente.quantidade = arredondar(existente.quantidade + material.quantidade);
        existente.custoTotal = arredondar(existente.quantidade * existente.custoUnitario);
        existente.falta = Math.max(0, arredondar(existente.quantidade - existente.estoqueAtual));
      } else {
        consolidado.push({ ...material });
      }
    });
  });

  return consolidado.sort((a, b) => b.falta - a.falta || b.custoTotal - a.custoTotal);
}

export function calcularResumoMaterial(obra: Orcamento) {
  const materiais = calcularMateriaisDaObra(obra);
  const custoTotal = materiais.reduce((soma, item) => soma + item.custoTotal, 0);
  const faltantes = materiais.filter((item) => item.falta > 0);

  return {
    materiais,
    custoTotal: arredondar(custoTotal),
    lucroPrevisto: arredondar(obra.total - custoTotal),
    faltantes,
  };
}
