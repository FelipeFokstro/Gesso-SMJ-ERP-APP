import { useNavigate } from 'react-router-dom';
import Card from '../Card';
import Button from '../Button';
import type { Cliente } from '../../types/cliente';

interface ClienteCardProps {
  cliente: Cliente;
}

export default function ClienteCard({ cliente }: ClienteCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <h3>{cliente.nome}</h3>

      {cliente.telefone && <p>Telefone: {cliente.telefone}</p>}
      {cliente.whatsapp && <p>WhatsApp: {cliente.whatsapp}</p>}
      {cliente.cidade && <p>Cidade: {cliente.cidade}</p>}

      <Button onClick={() => navigate(`/clientes/${cliente.id}`)}>
        Ver Cliente
      </Button>
    </Card>
  );
}