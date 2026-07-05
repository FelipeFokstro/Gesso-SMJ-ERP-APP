export type StatusOrcamento = 'Pendente' | 'Em negociação' | 'Aprovado';

export interface ItemOrcamento {
  id: number;
  servicoId: number;
  nome: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface Orcamento {
  id: number;
  cliente: string;
  telefone: string;
  cidade: string;
  itens: ItemOrcamento[];
  total: number;
  observacoes: string;
  status: StatusOrcamento;
  criadoEm: string;
}