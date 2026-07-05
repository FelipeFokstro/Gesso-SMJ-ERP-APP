import { orcamentosIniciais } from '../data/orcamentos';
import { decorados } from '../data/decorados';
import { servicos } from '../data/servicos';
import type { Orcamento } from '../models/Orcamento';
import type { Servico } from '../models/Servico';

const ORCAMENTOS_KEY = 'gesso-smj-orcamentos';
const PRECOS_KEY = 'gesso-smj-precos';

export function carregarOrcamentos(): Orcamento[] {
  const dados = localStorage.getItem(ORCAMENTOS_KEY);

  if (!dados) {
    salvarOrcamentos(orcamentosIniciais);
    return orcamentosIniciais;
  }

  return JSON.parse(dados);
}

export function salvarOrcamentos(orcamentos: Orcamento[]) {
  localStorage.setItem(ORCAMENTOS_KEY, JSON.stringify(orcamentos));
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