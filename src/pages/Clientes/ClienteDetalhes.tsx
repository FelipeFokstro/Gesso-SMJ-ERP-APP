import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { clienteService } from '../../services/clienteService';

export default function ClienteDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();

  const cliente = id ? clienteService.buscarPorId(id) : undefined;

  if (!cliente) {
    return (
      <MainLayout>
        <h1>Cliente não encontrado</h1>
        <Button onClick={() => navigate('/clientes')}>Voltar</Button>
      </MainLayout>
    );
  }

  function abrirWhatsApp() {
    const numero = cliente.whatsapp || cliente.telefone;

    if (!numero) {
      alert('Este cliente não possui WhatsApp cadastrado.');
      return;
    }

    const numeroLimpo = numero.replace(/\D/g, '');
    window.open(`https://wa.me/55${numeroLimpo}`, '_blank');
  }

  function abrirMapa() {
    const endereco = `${cliente.endereco}, ${cliente.bairro}, ${cliente.cidade}`;
    window.open(`https://maps.google.com/?q=${encodeURIComponent(endereco)}`, '_blank');
  }

  function excluirCliente() {
    const confirmar = confirm('Tem certeza que deseja excluir este cliente?');

    if (!confirmar || !id) return;

    clienteService.excluir(id);
    navigate('/clientes');
  }

  return (
    <MainLayout>
      <h1>{cliente.nome}</h1>

      <Card>
        <h2>Dados do Cliente</h2>

        <p><strong>Telefone:</strong> {cliente.telefone || '-'}</p>
        <p><strong>WhatsApp:</strong> {cliente.whatsapp || '-'}</p>
        <p><strong>E-mail:</strong> {cliente.email || '-'}</p>
        <p><strong>CPF/CNPJ:</strong> {cliente.cpfCnpj || '-'}</p>
        <p><strong>Endereço:</strong> {cliente.endereco || '-'}</p>
        <p><strong>Bairro:</strong> {cliente.bairro || '-'}</p>
        <p><strong>Cidade:</strong> {cliente.cidade || '-'}</p>
        <p><strong>CEP:</strong> {cliente.cep || '-'}</p>
        <p><strong>Complemento:</strong> {cliente.complemento || '-'}</p>
        <p><strong>Observações:</strong> {cliente.observacoes || '-'}</p>
      </Card>

      <Card>
        <h2>Ações</h2>

        <Button onClick={() => navigate(`/clientes/${cliente.id}/editar`)}>
          Editar Cliente
        </Button>

        <Button onClick={abrirWhatsApp}>
          Abrir WhatsApp
        </Button>

        <Button onClick={abrirMapa}>
          Abrir Localização
        </Button>

        <Button onClick={() => navigate('/orcamentos/novo')}>
          Novo Orçamento
        </Button>

        <Button onClick={excluirCliente}>
          Excluir Cliente
        </Button>
      </Card>

      <Card>
        <h2>Orçamentos</h2>
        <p>Integração com orçamentos será feita no próximo pacote.</p>
      </Card>

      <Card>
        <h2>Obras</h2>
        <p>Integração com obras será feita na FASE 5.</p>
      </Card>

      <Card>
        <h2>Financeiro</h2>
        <p>Integração com financeiro será feita na FASE 7.</p>
      </Card>
    </MainLayout>
  );
}