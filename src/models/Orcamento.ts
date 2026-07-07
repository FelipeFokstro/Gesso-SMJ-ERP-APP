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

export type StatusObra = 'Agendada' | 'Iniciada' | 'Finalizada';

export interface Orcamento {
  id: number;
  numero?: number;
  clienteId?: string;
  cliente: string;
  telefone: string;
  cidade: string;
  bairro?: string;
  endereco?: string;
  referencia?: string;
  itens: ItemOrcamento[];
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  observacoes: string;
  status: StatusOrcamento;
  statusObra?: StatusObra;
  dataObra?: string;
  horaObra?: string;
  equipe?: string;
  observacoesExecucao?: string;
  criadoEm: string;
  atualizadoEm?: string;
}
