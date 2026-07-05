import { useMemo, useState } from 'react';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';

import { decorados } from '../../data/decorados';
import { orcamentosIniciais } from '../../data/orcamentos';
import { servicos } from '../../data/servicos';

import type {
  ItemOrcamento,
  Orcamento,
  StatusOrcamento,
} from '../../models/Orcamento';

import type { Servico } from '../../models/Servico';

import { criarItemOrcamento } from '../../services/orcamentoService';
import { formatarMoeda } from '../../utils/formatarMoeda';

export default function Orcamentos() {
  const todosServicos = [...servicos, ...decorados];

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(orcamentosIniciais);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<StatusOrcamento>('Pendente');

  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<number>(
    todosServicos[0]?.id || 1
  );
  const [quantidade, setQuantidade] = useState<number>(1);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  const total = useMemo(() => {
    return itens.reduce((soma, item) => soma + item.subtotal, 0);
  }, [itens]);

  function limparFormulario() {
    setCliente('');
    setTelefone('');
    setCidade('');
    setObservacoes('');
    setStatus('Pendente');
    setServicoSelecionadoId(todosServicos[0]?.id || 1);
    setQuantidade(1);
    setItens([]);
  }

  function adicionarServico() {
    const servico = todosServicos.find(
      (item) => item.id === Number(servicoSelecionadoId)
    );

    if (!servico) return;

    if (!quantidade || quantidade <= 0) {
      alert('Informe uma quantidade válida.');
      return;
    }

    const novoItem = criarItemOrcamento(servico, quantidade);

    setItens((itensAtuais) => [...itensAtuais, novoItem]);
    setQuantidade(1);
  }

  function removerItem(id: number) {
    setItens((itensAtuais) => itensAtuais.filter((item) => item.id !== id));
  }

  function salvarOrcamento() {
    if (!cliente.trim()) {
      alert('Informe o nome do cliente.');
      return;
    }

    if (itens.length === 0) {
      alert('Adicione pelo menos um serviço.');
      return;
    }

    const novoOrcamento: Orcamento = {
      id: Date.now(),
      cliente,
      telefone,
      cidade,
      itens,
      total,
      observacoes,
      status,
      criadoEm: new Date().toISOString().split('T')[0],
    };

    setOrcamentos((listaAtual) => [novoOrcamento, ...listaAtual]);
    limparFormulario();
    setMostrarFormulario(false);

    alert('Orçamento salvo com sucesso.');
  }

  function selecionarServicoAtual(): Servico | undefined {
    return todosServicos.find((item) => item.id === Number(servicoSelecionadoId));
  }

  const servicoAtual = selecionarServicoAtual();

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <div>
            <h1 style={styles.titulo}>Orçamentos</h1>
            <p style={styles.subtitulo}>
              Crie, visualize e simule orçamentos da Gesso SMJ.
            </p>
          </div>

          <Button onClick={() => setMostrarFormulario(true)}>
            Novo orçamento
          </Button>
        </div>

        {mostrarFormulario && (
          <Card>
            <div style={styles.formularioHeader}>
              <div>
                <h2 style={styles.cardTitulo}>Novo orçamento</h2>
                <p style={styles.textoFraco}>
                  A obra futura vai nascer deste orçamento quando ele for aprovado.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario(false);
                }}
              >
                Cancelar
              </Button>
            </div>

            <div style={styles.grid}>
              <Input
                label="Cliente"
                value={cliente}
                onChange={(event) => setCliente(event.target.value)}
                placeholder="Nome do cliente"
              />

              <Input
                label="Telefone"
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
                placeholder="(00) 00000-0000"
              />

              <Input
                label="Cidade"
                value={cidade}
                onChange={(event) => setCidade(event.target.value)}
                placeholder="Cidade"
              />
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Status</label>
              <select
                style={styles.select}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusOrcamento)
                }
              >
                <option value="Pendente">Pendente</option>
                <option value="Em negociação">Em negociação</option>
                <option value="Aprovado">Aprovado</option>
              </select>
            </div>

            <div style={styles.divisor} />

            <h3 style={styles.cardTitulo}>Adicionar serviços</h3>

            <div style={styles.gridServico}>
              <div style={styles.campo}>
                <label style={styles.label}>Serviço</label>
                <select
                  style={styles.select}
                  value={servicoSelecionadoId}
                  onChange={(event) =>
                    setServicoSelecionadoId(Number(event.target.value))
                  }
                >
                  <optgroup label="Serviços">
                    {servicos.map((servico) => (
                      <option key={servico.id} value={servico.id}>
                        {servico.nome} - {formatarMoeda(servico.valorUnitario)}/
                        {servico.unidade}
                      </option>
                    ))}
                  </optgroup>

                  <optgroup label="Decorados">
                    {decorados.map((decorado) => (
                      <option key={decorado.id} value={decorado.id}>
                        {decorado.nome} - {formatarMoeda(decorado.valorUnitario)}/
                        {decorado.unidade}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <Input
                label="Quantidade"
                type="number"
                value={quantidade}
                onChange={(event) => setQuantidade(Number(event.target.value))}
                min="0"
                step="0.01"
              />

              <div style={styles.valorPreview}>
                <span style={styles.label}>Valor unitário</span>
                <strong>
                  {servicoAtual
                    ? `${formatarMoeda(servicoAtual.valorUnitario)} / ${
                        servicoAtual.unidade
                      }`
                    : '-'}
                </strong>
              </div>

              <Button onClick={adicionarServico}>Adicionar</Button>
            </div>

            {itens.length > 0 && (
              <div style={styles.tabelaArea}>
                <h3 style={styles.cardTitulo}>Resumo</h3>

                <div style={styles.listaItens}>
                  {itens.map((item) => (
                    <div key={item.id} style={styles.itemOrcamento}>
                      <div>
                        <strong>{item.nome}</strong>
                        <p style={styles.textoFraco}>
                          {item.quantidade} {item.unidade} ×{' '}
                          {formatarMoeda(item.valorUnitario)}
                        </p>
                      </div>

                      <div style={styles.itemDireita}>
                        <strong>{formatarMoeda(item.subtotal)}</strong>
                        <button
                          style={styles.botaoRemover}
                          onClick={() => removerItem(item.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.totalBox}>
                  <span>Total do orçamento</span>
                  <strong>{formatarMoeda(total)}</strong>
                </div>
              </div>
            )}

            <div style={styles.campo}>
              <label style={styles.label}>Observações</label>
              <textarea
                style={styles.textarea}
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder="Ex: prazo, condições de pagamento, detalhes da obra..."
              />
            </div>

            <div style={styles.acoesFormulario}>
              <Button onClick={salvarOrcamento}>Salvar orçamento</Button>

              <Button
                variant="secondary"
                onClick={() => alert('Compartilhar imagem: em breve.')}
              >
                Compartilhar imagem em breve
              </Button>
            </div>
          </Card>
        )}

        <Card>
          <h2 style={styles.cardTitulo}>Lista de orçamentos</h2>

          {orcamentos.length === 0 ? (
            <p style={styles.textoFraco}>Nenhum orçamento cadastrado.</p>
          ) : (
            <div style={styles.lista}>
              {orcamentos.map((orcamento) => (
                <div key={orcamento.id} style={styles.orcamentoCard}>
                  <div>
                    <div style={styles.orcamentoLinha}>
                      <h3 style={styles.orcamentoCliente}>
                        {orcamento.cliente}
                      </h3>

                      <span
                        style={{
                          ...styles.status,
                          backgroundColor:
                            orcamento.status === 'Aprovado'
                              ? '#dcfce7'
                              : orcamento.status === 'Em negociação'
                              ? '#fef9c3'
                              : '#e0f2fe',
                          color:
                            orcamento.status === 'Aprovado'
                              ? '#166534'
                              : orcamento.status === 'Em negociação'
                              ? '#854d0e'
                              : '#075985',
                        }}
                      >
                        {orcamento.status}
                      </span>
                    </div>

                    <p style={styles.textoFraco}>
                      {orcamento.cidade || 'Cidade não informada'}
                      {orcamento.telefone ? ` • ${orcamento.telefone}` : ''}
                    </p>

                    <p style={styles.textoFraco}>
                      {orcamento.itens.length} serviço(s)
                    </p>
                  </div>

                  <div style={styles.valorOrcamento}>
                    <strong>{formatarMoeda(orcamento.total)}</strong>
                    <small>{orcamento.criadoEm}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  topo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },

  titulo: {
    margin: 0,
    fontSize: 28,
    color: '#0f172a',
  },

  subtitulo: {
    margin: '6px 0 0',
    color: '#64748b',
  },

  cardTitulo: {
    margin: '0 0 12px',
    fontSize: 20,
    color: '#0f172a',
  },

  textoFraco: {
    margin: 0,
    color: '#64748b',
    fontSize: 14,
  },

  formularioHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 16,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },

  gridServico: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr auto',
    gap: 12,
    alignItems: 'end',
  },

  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#334155',
  },

  select: {
    width: '100%',
    minHeight: 44,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    padding: '0 12px',
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#0f172a',
  },

  textarea: {
    width: '100%',
    minHeight: 90,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    padding: 12,
    fontSize: 15,
    resize: 'vertical',
    fontFamily: 'inherit',
  },

  divisor: {
    height: 1,
    backgroundColor: '#e2e8f0',
    margin: '20px 0',
  },

  valorPreview: {
    minHeight: 44,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
  },

  tabelaArea: {
    marginTop: 20,
  },

  listaItens: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  itemOrcamento: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },

  itemDireita: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },

  botaoRemover: {
    border: 'none',
    background: 'transparent',
    color: '#dc2626',
    cursor: 'pointer',
    fontWeight: 600,
  },

  totalBox: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    color: '#fff',
    fontSize: 18,
  },

  acoesFormulario: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 20,
  },

  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  orcamentoCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },

  orcamentoLinha: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },

  orcamentoCliente: {
    margin: 0,
    fontSize: 18,
    color: '#0f172a',
  },

  status: {
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },

  valorOrcamento: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    color: '#0f172a',
  },
};