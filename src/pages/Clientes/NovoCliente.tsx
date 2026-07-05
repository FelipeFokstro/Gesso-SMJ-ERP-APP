import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import ClienteForm from '../../components/clientes/ClienteForm';
import { clienteService } from '../../services/clienteService';
import type { Cliente } from '../../types/cliente';

type ClienteFormData = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>;

export default function NovoCliente() {
  const navigate = useNavigate();

  function handleSubmit(data: ClienteFormData) {
    const cliente = clienteService.salvar(data);
    navigate(`/clientes/${cliente.id}`);
  }

  return (
    <MainLayout>
      <h1>Novo Cliente</h1>

      <ClienteForm onSubmit={handleSubmit} buttonText="Cadastrar Cliente" />
    </MainLayout>
  );
}