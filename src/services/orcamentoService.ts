import type { ItemOrcamento } from '../models/Orcamento';
import type { Servico } from '../models/Servico';

export function calcularSubtotal(
  quantidade: number,
  valorUnitario: number
): number {
  return quantidade * valorUnitario;
}

export function calcularTotal(itens: ItemOrcamento[]): number {
  return itens.reduce((total, item) => total + item.subtotal, 0);
}

export function criarItemOrcamento(
  servico: Servico,
  quantidade: number
): ItemOrcamento {
  return {
    id: Date.now(),
    servicoId: servico.id,
    nome: servico.nome,
    unidade: servico.unidade,
    quantidade,
    valorUnitario: servico.valorUnitario,
    subtotal: calcularSubtotal(
      quantidade,
      servico.valorUnitario
    ),
  };
}