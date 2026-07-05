import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';

import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

type TipoLancamento = 'Entrada' | 'Saída';
type StatusLancamento = 'Pendente' | 'Pago';

interface LancamentoFinanceiro {
  id: number;
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  status: StatusLancamento;
  data: string;
  categoria: string;
}

const lancamentosIniciais: LancamentoFinanceiro[] = [
  {
    id: 1,
    descricao: 'Aluguel',
    valor: 2000,
    tipo: 'Saída',
    status: 'Pendente',
    data: '2026-07-05',
    categoria: 'Fixo',
  },
  {
    id: 2,
    descricao: 'Gasolina',
    valor: 400,
    tipo: 'Saída',
    status: 'Pendente',
    data: '2026-07-05',
    categoria: 'Transporte',
  },
];

export default function Financeiro() {
  const navigate = useNavigate();

  const [lancamentos, setLancamentos] =
    useState<LancamentoFinanceiro[]>(lancamentosIniciais);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [tipo, setTipo] = useState<TipoLancamento>('Entrada');
  const [status, setStatus] = useState<StatusLancamento>('Pendente');
  const [data, setData] = useState('');
  const [categoria, setCategoria] = useState('');

  const orcamentos = carregarOrcamentos();

  const contasReceber = orcamentos.filter(
    (orcamento) => orcamento.status === 'Aprovado'
  );

  const totalReceberOrcamentos = contasReceber.reduce(
    (soma, orcamento) => soma + orcamento.total,
    0
  );

  const totalEntradasManuais = lancamentos
    .filter((item) => item.tipo === 'Entrada')
    .reduce((soma, item) => soma + item.valor, 0);

  const totalSaidas = lancamentos
    .filter((item) => item.tipo === 'Saída')
    .reduce((soma, item) => soma + item.valor, 0);

  const totalReceber = totalReceberOrcamentos + totalEntradasManuais;
  const lucroPrevisto = totalReceber - totalSaidas;

  const pendentes = lancamentos.filter((item) => item.status === 'Pendente');

  function limparFormulario() {
    setDescricao('');
    setValor(0);
    setTipo('Entrada');
    setStatus('Pendente');
    setData('');
    setCategoria('');
  }

  function salvarLancamento() {
    if (!descricao.trim()) {
      alert('Informe a descrição.');
      return;
    }

    if (!valor || valor <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const novoLancamento: LancamentoFinanceiro = {
      id: Date.now(),
      descricao,
      valor,
      tipo,
      status,
      data: data || new Date().toISOString().split('T')[0],
      categoria: categoria || 'Geral',
    };

    setLancamentos((listaAtual) => [novoLancamento, ...listaAtual]);
    limparFormulario();
    setMostrarFormulario(false);
  }

  function excluirLancamento(id: number) {
    const confirmar = confirm('Deseja excluir este lançamento?');

    if (!confirmar) return;

    setLancamentos((listaAtual) =>
      listaAtual.filter((item) => item.id !== id)
    );
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Voltar
          </Button>

          <div>
            <h1 style={styles.titulo}>Financeiro</h1>
            <p style={styles.subtitulo}>
              Controle simples de entradas, saídas e valores a receber.
            </p>
          </div>

          <Button onClick={() => setMostrarFormulario(true)}>
            Novo lançamento
          </Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card title="A receber">
            <strong style={styles.valorVerde}>
              {formatarMoeda(totalReceber)}
            </strong>
            <p style={styles.textoFraco}>
              Orçamentos aprovados + entradas manuais
            </p>
          </Card>

          <Card title="A pagar">
            <strong style={styles.valorVermelho}>
              {formatarMoeda(totalSaidas)}
            </strong>
            <p style={styles.textoFraco}>
              Saídas e despesas cadastradas
            </p>
          </Card>

          <Card title="Lucro previsto">
            <strong
              style={
                lucroPrevisto >= 0
                  ? styles.valorVerde
                  : styles.valorVermelho
              }
            >
              {formatarMoeda(lucroPrevisto)}
            </strong>
            <p style={styles.textoFraco}>
              Receber menos pagar
            </p>
          </Card>

          <Card title="Pendências">
            <strong style={styles.valorAzul}>
              {pendentes.length}
            </strong>
            <p style={styles.textoFraco}>
              Lançamentos pendentes
            </p>
          </Card>
        </div>

        {mostrarFormulario && (
          <Card title="Novo lançamento">
            <div style={styles.grid}>
              <Input
                label="Descrição"
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Ex: material, gasolina, pagamento cliente..."
              />

              <Input
                label="Valor"
                type="number"
                value={valor}
                onChange={(event) => setValor(Number(event.target.value))}
              />

              <div style={styles.campo}>
                <label style={styles.label}>Tipo</label>
                <select
                  style={styles.select}
                  value={tipo}
                  onChange={(event) =>
                    setTipo(event.target.value as TipoLancamento)
                  }
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Saída">Saída</option>
                </select>
              </div>

              <div style={styles.campo}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as StatusLancamento)
                  }
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Pago">Pago</option>
                </select>
              </div>

              <Input
                label="Data"
                type="date"
                value={data}
                onChange={(event) => setData(event.target.value)}
              />

              <Input
                label="Categoria"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                placeholder="Ex: Material, combustível, funcionário..."
              />
            </div>

            <div style={styles.acoes}>
              <Button onClick={salvarLancamento}>
                Salvar lançamento
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  limparFormulario();
                  setMostrarFormulario(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        <Card title="Contas a receber">
          {contasReceber.length === 0 ? (
            <p style={styles.textoFraco}>
              Nenhum orçamento aprovado ainda.
            </p>
          ) : (
            <div style={styles.lista}>
              {contasReceber.map((orcamento) => (
                <div key={orcamento.id} style={styles.item}>
                  <div>
                    <strong>{orcamento.cliente}</strong>
                    <p style={styles.textoFraco}>
                      Orçamento aprovado
                      {orcamento.dataObra
                        ? ` • Obra em ${orcamento.dataObra}`
                        : ''}
                    </p>
                  </div>

                  <strong style={styles.entrada}>
                    {formatarMoeda(orcamento.total)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Lançamentos manuais">
          {lancamentos.length === 0 ? (
            <p style={styles.textoFraco}>
              Nenhum lançamento manual cadastrado.
            </p>
          ) : (
            <div style={styles.lista}>
              {lancamentos.map((item) => (
                <div key={item.id} style={styles.item}>
                  <div>
                    <strong>{item.descricao}</strong>
                    <p style={styles.textoFraco}>
                      {item.categoria} • {item.data} • {item.status}
                    </p>
                  </div>

                  <div style={styles.itemDireita}>
                    <strong
                      style={
                        item.tipo === 'Entrada'
                          ? styles.entrada
                          : styles.saida
                      }
                    >
                      {item.tipo === 'Entrada' ? '+' : '-'}{' '}
                      {formatarMoeda(item.valor)}
                    </strong>

                    <button
                      style={styles.botaoRemover}
                      onClick={() => excluirLancamento(item.id)}
                    >
                      Remover
                    </button>
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

  resumoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },

  valorVerde: {
    color: '#16A34A',
    fontSize: 24,
  },

  valorVermelho: {
    color: '#DC2626',
    fontSize: 24,
  },

  valorAzul: {
    color: '#2563EB',
    fontSize: 28,
  },

  textoFraco: {
    margin: '6px 0 0',
    color: '#64748b',
    fontSize: 14,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },

  campo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
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

  acoes: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 16,
  },

  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },

  item: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
  },

  itemDireita: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },

  entrada: {
    color: '#16A34A',
  },

  saida: {
    color: '#DC2626',
  },

  botaoRemover: {
    border: 'none',
    background: 'transparent',
    color: '#dc2626',
    cursor: 'pointer',
    fontWeight: 600,
  },
};