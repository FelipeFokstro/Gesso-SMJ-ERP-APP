import type { Cliente } from '../types/cliente';

const STORAGE_KEY = 'gesso-smj-clientes';

function getClientes(): Cliente[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveClientes(clientes: Cliente[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

export const clienteService = {
  listar(): Cliente[] {
    return getClientes().sort((a, b) => a.nome.localeCompare(b.nome));
  },

  buscarPorId(id: string): Cliente | undefined {
    return getClientes().find((cliente) => cliente.id === id);
  },

  salvar(cliente: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Cliente {
    const clientes = getClientes();

    const novoCliente: Cliente = {
      ...cliente,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    clientes.push(novoCliente);
    saveClientes(clientes);

    return novoCliente;
  },

  editar(id: string, dados: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>): Cliente | null {
    const clientes = getClientes();

    const index = clientes.findIndex((cliente) => cliente.id === id);

    if (index === -1) {
      return null;
    }

    const clienteAtualizado: Cliente = {
      ...clientes[index],
      ...dados,
      updatedAt: new Date().toISOString(),
    };

    clientes[index] = clienteAtualizado;
    saveClientes(clientes);

    return clienteAtualizado;
  },

  excluir(id: string) {
    const clientes = getClientes().filter((cliente) => cliente.id !== id);
    saveClientes(clientes);
  },

  pesquisar(termo: string): Cliente[] {
    const clientes = getClientes();
    const busca = termo.toLowerCase();

    return clientes.filter((cliente) =>
      cliente.nome.toLowerCase().includes(busca) ||
      cliente.telefone.toLowerCase().includes(busca) ||
      cliente.whatsapp.toLowerCase().includes(busca) ||
      cliente.cidade.toLowerCase().includes(busca) ||
      cliente.bairro.toLowerCase().includes(busca)
    );
  },
};