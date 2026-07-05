import type { Orcamento } from '../models/Orcamento';

export const orcamentosIniciais: Orcamento[] = [
  {
    id: 1,
    cliente: 'Farmácia Fred',
    telefone: '',
    cidade: 'Santa Maria de Jetibá',
    itens: [
      {
        id: 1,
        servicoId: 1,
        nome: 'Forro Liso',
        unidade: 'm²',
        quantidade: 100,
        valorUnitario: 48,
        subtotal: 4800,
      },
      {
        id: 2,
        servicoId: 103,
        nome: 'Nicho',
        unidade: 'un',
        quantidade: 2,
        valorUnitario: 1000,
        subtotal: 2000,
      },
    ],
    total: 14600,
    observacoes: '',
    status: 'Em negociação',
    criadoEm: '2026-07-05',
  },
];

export const orcamentos = orcamentosIniciais;