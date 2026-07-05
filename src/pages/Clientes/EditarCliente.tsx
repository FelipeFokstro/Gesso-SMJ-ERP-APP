import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ClienteForm from '../../components/clientes/ClienteForm';
import { clienteService } from '../../services/clienteService';
import type { Cliente } from '../../types/cliente';

type ClienteFormData = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>;

export default function EditarCliente() {
  const navigate = useNavigate();
  const { id } = useParams();

  const cliente = id ? clienteService.buscarPorId(id) : undefined;

  function handleSubmit(data: ClienteFormData) {
    if (!id) return;

    clienteService.editar(id, data);
    navigate(`/clientes/${id}`);
  }

  if (!cliente) {
    return (
      <MainLayout>
        <h1>Cliente não encontrado</h1>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <h1>Editar Cliente</h1>

      <ClienteForm
        initialData={cliente}
        onSubmit={handleSubmit}
        buttonText="Salvar Alterações"
      />
    </MainLayout>
  );
}