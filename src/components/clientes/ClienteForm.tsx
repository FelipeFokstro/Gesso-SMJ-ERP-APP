import { useState } from 'react';
import type { Cliente } from '../../types/cliente';
import Button from '../Button';
import Input from '../Input';
import Card from '../Card';

type ClienteFormData = Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>;

interface ClienteFormProps {
  initialData?: Cliente;
  onSubmit: (data: ClienteFormData) => void;
  buttonText?: string;
}

const emptyForm: ClienteFormData = {
  nome: '',
  telefone: '',
  whatsapp: '',
  email: '',
  cpfCnpj: '',
  endereco: '',
  bairro: '',
  cidade: '',
  cep: '',
  complemento: '',
  observacoes: '',
};

export default function ClienteForm({
  initialData,
  onSubmit,
  buttonText = 'Salvar Cliente',
}: ClienteFormProps) {
  const [form, setForm] = useState<ClienteFormData>(
    initialData
      ? {
          nome: initialData.nome,
          telefone: initialData.telefone,
          whatsapp: initialData.whatsapp,
          email: initialData.email,
          cpfCnpj: initialData.cpfCnpj,
          endereco: initialData.endereco,
          bairro: initialData.bairro,
          cidade: initialData.cidade,
          cep: initialData.cep,
          complemento: initialData.complemento,
          observacoes: initialData.observacoes,
        }
      : emptyForm
  );

  function handleChange(field: keyof ClienteFormData, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    onSubmit(form);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Input
          label="Nome do cliente"
          value={form.nome}
          onChange={(e) => handleChange('nome', e.target.value)}
        />

        <Input
          label="Telefone"
          value={form.telefone}
          onChange={(e) => handleChange('telefone', e.target.value)}
        />

        <Input
          label="WhatsApp"
          value={form.whatsapp}
          onChange={(e) => handleChange('whatsapp', e.target.value)}
        />

        <Input
          label="E-mail"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />

        <Input
          label="CPF/CNPJ"
          value={form.cpfCnpj}
          onChange={(e) => handleChange('cpfCnpj', e.target.value)}
        />

        <Input
          label="Endereço"
          value={form.endereco}
          onChange={(e) => handleChange('endereco', e.target.value)}
        />

        <Input
          label="Bairro"
          value={form.bairro}
          onChange={(e) => handleChange('bairro', e.target.value)}
        />

        <Input
          label="Cidade"
          value={form.cidade}
          onChange={(e) => handleChange('cidade', e.target.value)}
        />

        <Input
          label="CEP"
          value={form.cep}
          onChange={(e) => handleChange('cep', e.target.value)}
        />

        <Input
          label="Complemento"
          value={form.complemento}
          onChange={(e) => handleChange('complemento', e.target.value)}
        />

        <Input
          label="Observações"
          value={form.observacoes}
          onChange={(e) => handleChange('observacoes', e.target.value)}
        />

        <Button type="submit">{buttonText}</Button>
      </form>
    </Card>
  );
}