import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';

import type {
  ItemOrcamento,
  Orcamento,
  StatusOrcamento,
} from '../../models/Orcamento';

import type { Servico } from '../../models/Servico';

import { formatarMoeda } from '../../utils/formatarMoeda';
import {
  carregarOrcamentos,
  salvarOrcamentos,
  carregarTabelaPrecos,
} from '../../services/orcamentoStorage';

export default function Orcamentos() {
  const navigate = useNavigate();

  const [tabelaPrecos] = useState<Servico[]>(carregarTabelaPrecos());
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(carregarOrcamentos());

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [cliente, setCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [endereco, setEndereco] = useState('');
  const [referencia, setReferencia] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const [status, setStatus] = useState<StatusOrcamento>('Pendente');
  const [dataObra, setDataObra] = useState('');
  const [horaObra, setHoraObra] = useState('');
  const [equipe, setEquipe] = useState('');
  const [observacoesExecucao, setObservacoesExecucao] = useState('');

  const [servicoSelecionadoId, setServicoSelecionadoId] = useState<number>(
    tabelaPrecos[0]?.id || 1
  );

  const servicoAtual = tabelaPrecos.find(
    (item) => item.id === Number(servicoSelecionadoId)
  );

  const [quantidade, setQuantidade] = useState<number>(1);
  const [valorUnitario, setValorUnitario] = useState<number>(
    servicoAtual?.valorUnitario || 0
  );

  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [acrescimo, setAcrescimo] = useState(0);

  useEffect(() => {
    if (servicoAtual) {
      setValorUnitario(servicoAtual.valorUnitario);
    }
  }, [servicoSelecionadoId]);

  const subtotal = useMemo(() => {
    return itens.reduce((soma, item) => soma + item.subtotal, 0);
  }, [itens]);

  const total = subtotal - desconto + acrescimo;

  function limparFormulario() {
    setCliente('');
    setTelefone('');
    setCidade('');
    setBairro('');
    setEndereco('');
    setReferencia('');
    setObservacoes('');
    setStatus('Pendente');
    setDataObra('');
    setHoraObra('');
    setEquipe('');
    setObservacoesExecucao('');
    setServicoSelecionadoId(tabelaPrecos[0]?.id || 1);
    setQuantidade(1);
    setValorUnitario(tabelaPrecos[0]?.valorUnitario || 0);
    setItens([]);
    setDesconto(0);
    setAcrescimo(0);
  }

  function adicionarServico() {
    if (!servicoAtual) return;

    if (!quantidade || quantidade <= 0) {
      alert('Informe uma quantidade válida.');
      return;
    }

    if (!valorUnitario || valorUnitario <= 0) {
      alert('Informe um valor unitário válido.');
      return;
    }

    const novoItem: ItemOrcamento = {
      id: Date.now(),
      servicoId: servicoAtual.id,
      nome: servicoAtual.nome,
      unidade: servicoAtual.unidade,
      quantidade,
      valorUnitario,
      subtotal: quantidade * valorUnitario,
    };

    setItens((listaAtual) => [...listaAtual, novoItem]);
    setQuantidade(1);
  }

  function removerItem(id: number) {
    setItens((listaAtual) => listaAtual.filter((item) => item.id !== id));
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

    if (status === 'Aprovado' && !dataObra) {
      alert('Orçamento aprovado precisa ter data da obra.');
      return;
    }

    const novoOrcamento: Orcamento = {
      id: Date.now(),
      cliente,
      telefone,
      cidade,
      bairro,
      endereco,
      referencia,
      itens,
      subtotal,
      desconto,
      acrescimo,
      total,
      observacoes,
      status,
      dataObra: status === 'Aprovado' ? dataObra : '',
      horaObra: status === 'Aprovado' ? horaObra : '',
      equipe: status === 'Aprovado' ? equipe : '',
      observacoesExecucao: status === 'Aprovado' ? observacoesExecucao : '',
      criadoEm: new Date().toISOString().split('T')[0],
    };

    const novaLista = [novoOrcamento, ...orcamentos];

    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);

    limparFormulario();
    setMostrarFormulario(false);

    alert('Orçamento salvo com sucesso.');
  }

  function excluirOrcamento(id: number) {
    const confirmar = confirm('Deseja excluir este orçamento?');

    if (!confirmar) return;

    const novaLista = orcamentos.filter((orcamento) => orcamento.id !== id);

    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
  }

  function aprovarOrcamento(id: number) {
    const data = prompt('Informe a data da obra. Exemplo: 2026-07-10');

    if (!data) return;

    const novaLista = orcamentos.map((orcamento) => {
      if (orcamento.id !== id) return orcamento;

      return {
        ...orcamento,
        status: 'Aprovado' as StatusOrcamento,
        dataObra: data,
      };
    });

    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
  }

  function duplicarOrcamento(orcamento: Orcamento) {
    const novo: Orcamento = {
      ...orcamento,
      id: Date.now(),
      cliente: `${orcamento.cliente} - cópia`,
      status: 'Pendente',
      dataObra: '',
      horaObra: '',
      criadoEm: new Date().toISOString().split('T')[0],
    };

    const novaLista = [novo, ...orcamentos];

    setOrcamentos(novaLista);
    salvarOrcamentos(novaLista);
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Voltar
          </Button>

          <div>
            <h1 style={styles.titulo}>Orçamentos</h1>
            <p style={styles.subtitulo}>
              Orçamentos, aprovação e agendamento das obras.
            </p>
          </div>

          <Button onClick={() => setMostrarFormulario(true)}>
            Novo orçamento
          </Button>
        </div>

        {mostrarFormulario && (
          <Card>
            <h2 style={styles.cardTitulo}>Novo orçamento</h2>

            <div style={styles.grid}>
              <Input label="Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
              <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              <Input label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
              <Input label="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
              <Input label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
              <Input label="Referência" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>

            <div style={styles.divisor} />

            <h3 style={styles.cardTitulo}>Serviços</h3>

            <div style={styles.gridServico}>
              <div style={styles.campo}>
                <label style={styles.label}>Serviço</label>
                <select
                  style={styles.select}
                  value={servicoSelecionadoId}
                  onChange={(e) => setServicoSelecionadoId(Number(e.target.value))}
                >
                  {tabelaPrecos.map((servico) => (
                    <option key={servico.id} value={servico.id}>
                      {servico.nome} - {formatarMoeda(servico.valorUnitario)}/{servico.unidade}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Quantidade"
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
              />

              <Input
                label="Valor unitário"
                type="number"
                value={valorUnitario}
                onChange={(e) => setValorUnitario(Number(e.target.value))}
              />

              <Button onClick={adicionarServico}>Adicionar</Button>
            </div>

            {itens.length > 0 && (
              <div style={styles.listaItens}>
                {itens.map((item) => (
                  <div key={item.id} style={styles.itemOrcamento}>
                    <div>
                      <strong>{item.nome}</strong>
                      <p style={styles.textoFraco}>
                        {item.quantidade} {item.unidade} × {formatarMoeda(item.valorUnitario)}
                      </p>
                    </div>

                    <div style={styles.itemDireita}>
                      <strong>{formatarMoeda(item.subtotal)}</strong>
                      <button style={styles.botaoRemover} onClick={() => removerItem(item.id)}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={styles.grid}>
              <Input
                label="Desconto"
                type="number"
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
              />

              <Input
                label="Acréscimo"
                type="number"
                value={acrescimo}
                onChange={(e) => setAcrescimo(Number(e.target.value))}
              />
            </div>

            <div style={styles.totalBox}>
              <span>Total</span>
              <strong>{formatarMoeda(total)}</strong>
            </div>

            <div style={styles.campo}>
              <label style={styles.label}>Status</label>
              <select
                style={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusOrcamento)}
              >
                <option value="Pendente">Pendente</option>
                <option value="Em negociação">Em negociação</option>
                <option value="Aprovado">Aprovado</option>
              </select>
            </div>

            {status === 'Aprovado' && (
              <div style={styles.grid}>
                <Input label="Data da obra" type="date" value={dataObra} onChange={(e) => setDataObra(e.target.value)} />
                <Input label="Hora" type="time" value={horaObra} onChange={(e) => setHoraObra(e.target.value)} />
                <Input label="Equipe" value={equipe} onChange={(e) => setEquipe(e.target.value)} />
              </div>
            )}

            <div style={styles.campo}>
              <label style={styles.label}>Observações</label>
              <textarea
                style={styles.textarea}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            {status === 'Aprovado' && (
              <div style={styles.campo}>
                <label style={styles.label}>Observações da execução</label>
                <textarea
                  style={styles.textarea}
                  value={observacoesExecucao}
                  onChange={(e) => setObservacoesExecucao(e.target.value)}
                />
              </div>
            )}

            <div style={styles.acoesFormulario}>
              <Button onClick={salvarOrcamento}>Salvar orçamento</Button>
              <Button variant="secondary" onClick={() => alert('Compartilhar imagem: em breve.')}>
                Compartilhar imagem em breve
              </Button>
              <Button variant="outline" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        <Card>
          <h2 style={styles.cardTitulo}>Lista de orçamentos</h2>

          <div style={styles.lista}>
            {orcamentos.map((orcamento) => (
              <div key={orcamento.id} style={styles.orcamentoCard}>
                <div>
                  <h3 style={styles.orcamentoCliente}>{orcamento.cliente}</h3>
                  <p style={styles.textoFraco}>{orcamento.cidade || 'Cidade não informada'}</p>
                  <p style={styles.textoFraco}>{orcamento.itens.length} serviço(s)</p>

                  {orcamento.dataObra && (
                    <p style={styles.textoFraco}>
                      Obra: {orcamento.dataObra} {orcamento.horaObra || ''}
                    </p>
                  )}

                  <span style={styles.status}>{orcamento.status}</span>
                </div>

                <div style={styles.valorOrcamento}>
                  <strong>{formatarMoeda(orcamento.total)}</strong>

                  <div style={styles.botoesCard}>
                    {orcamento.status !== 'Aprovado' && (
                      <Button size="sm" onClick={() => aprovarOrcamento(orcamento.id)}>
                        Aprovar
                      </Button>
                    )}

                    <Button size="sm" variant="secondary" onClick={() => duplicarOrcamento(orcamento)}>
                      Duplicar
                    </Button>

                    <Button size="sm" variant="danger" onClick={() => excluirOrcamento(orcamento.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  topo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  titulo: { margin: 0, fontSize: 28, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b' },
  cardTitulo: { margin: '0 0 12px', fontSize: 20, color: '#0f172a' },
  textoFraco: { margin: '4px 0', color: '#64748b', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  gridServico: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' },
  campo: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 },
  label: { fontSize: 14, fontWeight: 600, color: '#334155' },
  select: { width: '100%', minHeight: 44, borderRadius: 10, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 15 },
  textarea: { width: '100%', minHeight: 90, borderRadius: 10, border: '1px solid #cbd5e1', padding: 12, fontSize: 15 },
  divisor: { height: 1, backgroundColor: '#e2e8f0', margin: '20px 0' },
  listaItens: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 },
  itemOrcamento: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  itemDireita: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  botaoRemover: { border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 600 },
  totalBox: { display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: '#0f172a', color: '#fff', fontSize: 18 },
  acoesFormulario: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20 },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  orcamentoCard: { display: 'flex', justifyContent: 'space-between', gap: 16, padding: 14, borderRadius: 14, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' },
  orcamentoCliente: { margin: 0, fontSize: 18, color: '#0f172a' },
  status: { display: 'inline-block', marginTop: 8, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: '#e0f2fe', color: '#075985' },
  valorOrcamento: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, color: '#0f172a' },
  botoesCard: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' },
};