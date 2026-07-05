import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { clienteService } from '../../services/clienteService';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

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

  const clienteAtual = cliente;

  const orcamentosCliente = carregarOrcamentos().filter(
    (orcamento) => orcamento.clienteId === clienteAtual.id || orcamento.cliente === clienteAtual.nome
  );

  const totalAprovado = orcamentosCliente
    .filter((orcamento) => orcamento.status === 'Aprovado')
    .reduce((soma, orcamento) => soma + orcamento.total, 0);

  function abrirWhatsApp() {
    const numero = clienteAtual.whatsapp || clienteAtual.telefone;
    if (!numero) {
      alert('Este cliente não possui WhatsApp cadastrado.');
      return;
    }
    const numeroLimpo = numero.replace(/\D/g, '');
    window.open(`https://wa.me/55${numeroLimpo}`, '_blank');
  }

  function abrirMapa() {
    const endereco = `${clienteAtual.endereco}, ${clienteAtual.bairro}, ${clienteAtual.cidade}`;
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
      <h1>{clienteAtual.nome}</h1>

      <Card title="Dados do Cliente">
        <p><strong>Telefone:</strong> {clienteAtual.telefone || '-'}</p>
        <p><strong>WhatsApp:</strong> {clienteAtual.whatsapp || '-'}</p>
        <p><strong>E-mail:</strong> {clienteAtual.email || '-'}</p>
        <p><strong>CPF/CNPJ:</strong> {clienteAtual.cpfCnpj || '-'}</p>
        <p><strong>Endereço:</strong> {clienteAtual.endereco || '-'}</p>
        <p><strong>Bairro:</strong> {clienteAtual.bairro || '-'}</p>
        <p><strong>Cidade:</strong> {clienteAtual.cidade || '-'}</p>
        <p><strong>CEP:</strong> {clienteAtual.cep || '-'}</p>
        <p><strong>Complemento:</strong> {clienteAtual.complemento || '-'}</p>
        <p><strong>Observações:</strong> {clienteAtual.observacoes || '-'}</p>
      </Card>

      <Card title="Ações rápidas">
        <div style={styles.acoes}>
          <Button onClick={() => navigate(`/clientes/${clienteAtual.id}/editar`)}>Editar Cliente</Button>
          <Button onClick={abrirWhatsApp}>Abrir WhatsApp</Button>
          <Button onClick={abrirMapa}>Abrir Localização</Button>
          <Button onClick={() => navigate(`/orcamentos?clienteId=${clienteAtual.id}`)}>Novo Orçamento</Button>
          <Button variant="danger" onClick={excluirCliente}>Excluir Cliente</Button>
        </div>
      </Card>

      <Card title="Resumo financeiro">
        <strong style={styles.valor}>{formatarMoeda(totalAprovado)}</strong>
        <p style={styles.textoFraco}>Total em orçamentos aprovados desse cliente.</p>
      </Card>

      <Card title="Orçamentos do cliente">
        {orcamentosCliente.length === 0 ? (
          <p style={styles.textoFraco}>Nenhum orçamento vinculado ainda.</p>
        ) : (
          <div style={styles.lista}>
            {orcamentosCliente.map((orcamento) => (
              <div key={orcamento.id} style={styles.item}>
                <div>
                  <strong>{orcamento.status}</strong>
                  <p style={styles.textoFraco}>{orcamento.criadoEm} • {orcamento.itens.length} serviço(s)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>{formatarMoeda(orcamento.total)}</strong>
                  <div style={{ marginTop: 8 }}>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/orcamentos?editar=${orcamento.id}`)}>Editar</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  acoes: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  valor: { color: '#16A34A', fontSize: 26 },
  textoFraco: { margin: '6px 0 0', color: '#64748b', fontSize: 14 },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  item: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' },
};
