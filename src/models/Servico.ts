export type UnidadeServico = 'm²' | 'm' | 'un';

export interface Servico {
  id: number;
  nome: string;
  valorUnitario: number;
  unidade: UnidadeServico;
  categoria: 'Serviço' | 'Decorado';
}