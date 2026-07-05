export interface ItemEstoque {
  id: number;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  minimo: number;
  custoUnitario: number;
  observacoes: string;
}

export const ESTOQUE_STORAGE_KEY = 'gesso-smj-estoque';

const itensIniciais: ItemEstoque[] = [
  { id: 1, nome: 'Placa de gesso', categoria: 'Forro', quantidade: 0, unidade: 'placa', minimo: 50, custoUnitario: 13 / 2.8, observacoes: 'Base: 1 m² = 2,8 placas' },
  { id: 2, nome: 'Saco de gesso 50kg', categoria: 'Material', quantidade: 0, unidade: 'saco', minimo: 5, custoUnitario: 30, observacoes: 'Rendimento médio usado: 22 m² por saco' },
  { id: 3, nome: 'Sisal', categoria: 'Material', quantidade: 0, unidade: 'un', minimo: 2, custoUnitario: 0, observacoes: '' },
  { id: 4, nome: 'Arame', categoria: 'Material', quantidade: 0, unidade: 'kg', minimo: 2, custoUnitario: 0, observacoes: '' },
  { id: 5, nome: 'Fita telada', categoria: 'Acabamento', quantidade: 0, unidade: 'rolo', minimo: 2, custoUnitario: 0, observacoes: '' },
  { id: 6, nome: 'Sanca', categoria: 'Acabamento', quantidade: 0, unidade: 'm', minimo: 20, custoUnitario: 1, observacoes: 'Custo base salvo: R$ 1,00 por metro' },
  { id: 7, nome: 'Cortineiro', categoria: 'Acabamento', quantidade: 0, unidade: 'm', minimo: 10, custoUnitario: 3, observacoes: 'Custo base salvo: R$ 3,00 por metro' },
  { id: 8, nome: 'Bloco de gesso normal', categoria: 'Parede', quantidade: 0, unidade: 'm²', minimo: 10, custoUnitario: 17, observacoes: 'Custo base salvo: R$ 17,00 por m²' },
  { id: 9, nome: 'Bloco hidrofugado', categoria: 'Parede', quantidade: 0, unidade: 'm²', minimo: 5, custoUnitario: 30, observacoes: 'Custo base salvo: R$ 30,00 por m²' },
  { id: 10, nome: 'Massa acabamento', categoria: 'Acabamento', quantidade: 0, unidade: 'saco', minimo: 3, custoUnitario: 0, observacoes: '' },
];

function normalizarItem(item: Partial<ItemEstoque>): ItemEstoque {
  return {
    id: Number(item.id || Date.now()),
    nome: String(item.nome || ''),
    categoria: String(item.categoria || 'Material'),
    quantidade: Number(item.quantidade || 0),
    unidade: String(item.unidade || 'un'),
    minimo: Number(item.minimo || 0),
    custoUnitario: Number(item.custoUnitario || 0),
    observacoes: String(item.observacoes || ''),
  };
}

export function carregarEstoque(): ItemEstoque[] {
  const dados = localStorage.getItem(ESTOQUE_STORAGE_KEY);

  if (!dados) {
    localStorage.setItem(ESTOQUE_STORAGE_KEY, JSON.stringify(itensIniciais));
    return itensIniciais;
  }

  try {
    const itens = JSON.parse(dados) as Partial<ItemEstoque>[];
    return itens.map(normalizarItem);
  } catch {
    localStorage.setItem(ESTOQUE_STORAGE_KEY, JSON.stringify(itensIniciais));
    return itensIniciais;
  }
}

export function salvarEstoque(itens: ItemEstoque[]) {
  localStorage.setItem(ESTOQUE_STORAGE_KEY, JSON.stringify(itens));
}

export function buscarItemEstoque(nome: string, itens = carregarEstoque()) {
  const alvo = nome.toLowerCase();
  return itens.find((item) => item.nome.toLowerCase() === alvo || item.nome.toLowerCase().includes(alvo));
}

export function baixarItensEstoque(consumo: { nome: string; quantidade: number }[]) {
  const itens = carregarEstoque();

  const novaLista = itens.map((item) => {
    const totalConsumir = consumo
      .filter((material) => item.nome.toLowerCase().includes(material.nome.toLowerCase()) || material.nome.toLowerCase().includes(item.nome.toLowerCase()))
      .reduce((soma, material) => soma + material.quantidade, 0);

    if (!totalConsumir) return item;

    return {
      ...item,
      quantidade: Math.max(0, Number((item.quantidade - totalConsumir).toFixed(2))),
    };
  });

  salvarEstoque(novaLista);
  return novaLista;
}
