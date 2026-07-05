import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Button from '../../components/Button';
import Input from '../../components/Input';
import ClienteCard from '../../components/clientes/ClienteCard';
import type { Cliente } from '../../types/cliente';
import { clienteService } from '../../services/clienteService';

export default function Clientes() {
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pesquisa, setPesquisa] = useState('');

  useEffect(() => {
    setClientes(clienteService.listar());
  }, []);

  useEffect(() => {
    if (!pesquisa.trim()) {
      setClientes(clienteService.listar());
      return;
    }

    setClientes(clienteService.pesquisar(pesquisa));
  }, [pesquisa]);

  return (
    <MainLayout>
      <h1>Clientes</h1>

      <Button onClick={() => navigate('/clientes/novo')}>
        Novo Cliente
      </Button>

      <Input
        label="Pesquisar cliente"
        value={pesquisa}
        onChange={(e) => setPesquisa(e.target.value)}
      />

      {clientes.length === 0 ? (
        <p>Nenhum cliente encontrado.</p>
      ) : (
        clientes.map((cliente) => (
          <ClienteCard key={cliente.id} cliente={cliente} />
        ))
      )}
    </MainLayout>
  );
}