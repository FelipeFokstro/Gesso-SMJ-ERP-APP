import { orcamentosIniciais } from '../data/orcamentos';
import { decorados } from '../data/decorados';
import { servicos } from '../data/servicos';
import type { Orcamento } from '../models/Orcamento';
import type { Servico } from '../models/Servico';

const ORCAMENTOS_KEY = 'gesso-smj-orcamentos';
const PRECOS_KEY = 'gesso-smj-precos';

export function numerarOrcamentos(orcamentos: Orcamento[]): Orcamento[] {
  const usados = new Set<number>();

  orcamentos.forEach((orcamento) => {
    if (typeof orcamento.numero === 'number' && orcamento.numero > 0) {
      usados.add(orcamento.numero);
    }
  });

  let proximo = 1;

  return orcamentos.map((orcamento) => {
    if (typeof orcamento.numero === 'number' && orcamento.numero > 0) {
      return orcamento;
    }

    while (usados.has(proximo)) proximo += 1;
    usados.add(proximo);

    return {
      ...orcamento,
      numero: proximo,
    };
  });
}

export function proximoNumeroOrcamento(orcamentos: Orcamento[]): number {
  const maiorNumero = orcamentos.reduce((maior, orcamento) => {
    const numero = orcamento.numero || 0;
    return numero > maior ? numero : maior;
  }, 0);

  return maiorNumero + 1;
}

export function carregarOrcamentos(): Orcamento[] {
  const dados = localStorage.getItem(ORCAMENTOS_KEY);

  if (!dados) {
    const iniciaisNumerados = numerarOrcamentos(orcamentosIniciais);
    salvarOrcamentos(iniciaisNumerados);
    return iniciaisNumerados;
  }

  const orcamentos = numerarOrcamentos(JSON.parse(dados));
  salvarOrcamentos(orcamentos);
  return orcamentos;
}

export function salvarOrcamentos(orcamentos: Orcamento[]) {
  localStorage.setItem(ORCAMENTOS_KEY, JSON.stringify(numerarOrcamentos(orcamentos)));
}

export function carregarTabelaPrecos(): Servico[] {
  const dados = localStorage.getItem(PRECOS_KEY);

  if (!dados) {
    const tabela = [...servicos, ...decorados];
    salvarTabelaPrecos(tabela);
    return tabela;
  }

  return JSON.parse(dados);
}

export function salvarTabelaPrecos(servicosAtualizados: Servico[]) {
  localStorage.setItem(PRECOS_KEY, JSON.stringify(servicosAtualizados));
}
