import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Input from '../../components/Input';
import MainLayout from '../../layouts/MainLayout';
import { baixarItensEstoque } from '../../services/estoqueService';
import { calcularResumoMaterial } from '../../services/materialService';
import {
  baixarListaMaterialObra,
  carregarMaterialPersonalizado,
  limparMaterialPersonalizado,
  materialCalculadoParaEditavel,
  recalcularMaterial,
  salvarMaterialPersonalizado,
  type MaterialObraEditavel,
} from '../../services/materialObraService';
import { carregarOrcamentos, salvarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';
import type { Orcamento, StatusObra } from '../../models/Orcamento';

function definirStatus(obra: Orcamento) {
  if (obra.statusObra === 'Finalizada') return { label: 'Finalizada', color: '#1d4ed8', bg: '#dbeafe' };
  if (obra.statusObra === 'Iniciada') return { label: 'Iniciada', color: '#166534', bg: '#dcfce7' };
  if (!obra.dataObra) return { label: 'Sem data', color: '#64748b', bg: '#f1f5f9' };

  const hoje = new Date().toISOString().split('T')[0];
  if (obra.dataObra < hoje) return { label: 'Atrasada', color: '#991b1b', bg: '#fee2e2' };
  if (obra.dataObra === hoje) return { label: 'Hoje', color: '#166534', bg: '#dcfce7' };

  const data = new Date(`${obra.dataObra}T00:00:00`);
  const agora = new Date(`${hoje}T00:00:00`);
  const dias = Math.ceil((data.getTime() - agora.getTime()) / 86400000);
  if (dias <= 7) return { label: 'Perto de iniciar', color: '#92400e', bg: '#fef3c7' };

  return { label: 'Agendada', color: '#1d4ed8', bg: '#dbeafe' };
}

function totalMaterial(materiais: MaterialObraEditavel[]) {
  return materiais.reduce((soma, item) => soma + Number(item.custoTotal || 0), 0);
}

function novoMaterial(): MaterialObraEditavel {
  return {
    id: Date.now(),
    nome: '',
    quantidade: 0,
    unidade: 'un',
    custoUnitario: 0,
    custoTotal: 0,
    estoqueAtual: 0,
    falta: 0,
  };
}

export default function Obras() {
  const navigate = useNavigate();
  const [atualizacao, setAtualizacao] = useState(0);
  const [obraMaterial, setObraMaterial] = useState<Orcamento | null>(null);
  const [materiaisEditando, setMateriaisEditando] = useState<MaterialObraEditavel[]>([]);

  const orcamentos = useMemo(() => carregarOrcamentos(), [atualizacao]);
  const obras = useMemo(() => {
    return orcamentos
      .filter((orcamento) => orcamento.status === 'Aprovado')
      .sort((a, b) => String(a.dataObra || '9999').localeCompare(String(b.dataObra || '9999')));
  }, [orcamentos]);

  const totalCustoMaterial = obras.reduce((soma, obra) => soma + totalMaterial(materiaisDaObra(obra)), 0);
  const totalObras = obras.reduce((soma, obra) => soma + obra.total, 0);
  const lucroPrevisto = totalObras - totalCustoMaterial;

  function materiaisDaObra(obra: Orcamento) {
    const personalizado = carregarMaterialPersonalizado(obra.id);
    if (personalizado) return personalizado;
    return materialCalculadoParaEditavel(calcularResumoMaterial(obra).materiais);
  }

  function atualizarStatusObra(obraId: number, statusObra: StatusObra) {
    const novaLista = orcamentos.map((obra) =>
      obra.id === obraId
        ? { ...obra, statusObra, atualizadoEm: new Date().toISOString().split('T')[0] }
        : obra
    );

    salvarOrcamentos(novaLista);
    setAtualizacao((valor) => valor + 1);
  }

  function abrirMaterial(obra: Orcamento) {
    setObraMaterial(obra);
    setMateriaisEditando(materiaisDaObra(obra));
  }

  function alterarMaterial(id: number, campo: keyof MaterialObraEditavel, valor: string) {
    setMateriaisEditando((lista) =>
      lista.map((item) => {
        if (item.id !== id) return item;

        const atualizado = {
          ...item,
          [campo]: ['quantidade', 'custoUnitario', 'estoqueAtual'].includes(campo)
            ? Number(valor || 0)
            : valor,
        } as MaterialObraEditavel;

        return recalcularMaterial(atualizado);
      })
    );
  }

  function adicionarMaterial() {
    setMateriaisEditando((lista) => [...lista, novoMaterial()]);
  }

  function removerMaterial(id: number) {
    setMateriaisEditando((lista) => lista.filter((item) => item.id !== id));
  }

  function salvarMaterial() {
    if (!obraMaterial) return;
    const filtrados = materiaisEditando.filter((item) => item.nome.trim() && item.quantidade > 0);
    salvarMaterialPersonalizado(obraMaterial.id, filtrados);
    setAtualizacao((valor) => valor + 1);
    alert('Lista de material salva para esta obra.');
  }

  function restaurarMaterialCalculado() {
    if (!obraMaterial) return;
    if (!confirm('Deseja voltar para a lista calculada automaticamente pelo orçamento?')) return;
    limparMaterialPersonalizado(obraMaterial.id);
    const lista = materialCalculadoParaEditavel(calcularResumoMaterial(obraMaterial).materiais);
    setMateriaisEditando(lista);
    setAtualizacao((valor) => valor + 1);
  }

  function baixarMaterialDaObra(obraId: number) {
    const obra = obras.find((item) => item.id === obraId);
    if (!obra) return;

    const materiais = materiaisDaObra(obra);
    if (materiais.length === 0) return alert('Não encontrei materiais calculados para esta obra.');

    const confirmar = confirm('Deseja baixar do estoque os materiais desta obra?');
    if (!confirmar) return;

    baixarItensEstoque(materiais.map((material) => ({ nome: material.nome, quantidade: material.quantidade })));
    setAtualizacao((valor) => valor + 1);
    alert('Material baixado do estoque. Confira a tela Estoque para ver os saldos.');
  }

  async function baixarLista(obra: Orcamento) {
    const materiais = materiaisDaObra(obra);
    if (materiais.length === 0) return alert('Não há material para baixar nesta obra.');

    try {
      const mensagem = await baixarListaMaterialObra({ obraNome: obra.cliente, obraNumero: obra.numero, materiais });
      alert(mensagem);
    } catch {
      alert('Não foi possível baixar a lista neste aparelho.');
    }
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <div>
            <h1 style={styles.titulo}>Obras</h1>
            <p style={styles.subtitulo}>Controle execução, status e material das obras aprovadas.</p>
          </div>
          <Button onClick={() => navigate('/orcamentos')}>Novo orçamento</Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card><span style={styles.label}>Obras agendadas</span><strong style={styles.numero}>{obras.length}</strong></Card>
          <Card><span style={styles.label}>Valor das obras</span><strong style={styles.numero}>{formatarMoeda(totalObras)}</strong></Card>
          <Card><span style={styles.label}>Custo material</span><strong style={styles.numeroAlerta}>{formatarMoeda(totalCustoMaterial)}</strong></Card>
          <Card><span style={styles.label}>Lucro previsto</span><strong style={lucroPrevisto >= 0 ? styles.numeroVerde : styles.numeroAlerta}>{formatarMoeda(lucroPrevisto)}</strong></Card>
        </div>

        {obras.length === 0 ? (
          <Card title="Nenhuma obra ainda">
            <p style={styles.textoFraco}>Aprove um orçamento e informe a data da obra para ela aparecer aqui.</p>
          </Card>
        ) : (
          <div style={styles.lista}>
            {obras.map((obra) => {
              const status = definirStatus(obra);
              const materiais = materiaisDaObra(obra);
              const custoMaterial = totalMaterial(materiais);
              const faltantes = materiais.filter((item) => item.falta > 0);
              return (
                <Card key={obra.id}>
                  <div style={styles.cardTopo}>
                    <div>
                      <h2 style={styles.cardTitulo}>{obra.cliente}</h2>
                      <p style={styles.textoFraco}>{obra.numero ? `ORÇ-${String(obra.numero).padStart(4, '0')} • ` : ''}{obra.cidade || 'Cidade não informada'} {obra.bairro ? `• ${obra.bairro}` : ''}</p>
                    </div>
                    <span style={{ ...styles.status, background: status.bg, color: status.color }}>{status.label}</span>
                  </div>

                  <div style={styles.infoGrid}>
                    <p><strong>Data:</strong> {obra.dataObra || 'Sem data'}</p>
                    <p><strong>Hora:</strong> {obra.horaObra || 'Sem hora'}</p>
                    <p><strong>Equipe:</strong> {obra.equipe || 'Não informada'}</p>
                    <p><strong>Total:</strong> {formatarMoeda(obra.total)}</p>
                  </div>

                  <div style={styles.materialBox}>
                    <div>
                      <span style={styles.label}>Material da obra</span>
                      <strong style={styles.materialValor}>{formatarMoeda(custoMaterial)}</strong>
                      <p style={styles.textoFraco}>Lucro previsto: {formatarMoeda(obra.total - custoMaterial)}</p>
                    </div>
                    <div style={styles.materialTags}>
                      {faltantes.length > 0 ? (
                        <span style={styles.falta}>{faltantes.length} item(ns) faltando</span>
                      ) : (
                        <span style={styles.ok}>Estoque OK</span>
                      )}
                    </div>
                  </div>

                  {materiais.length > 0 && (
                    <div style={styles.materialLista}>
                      {materiais.slice(0, 5).map((material) => (
                        <div key={`${obra.id}-${material.id}-${material.nome}`} style={styles.materialLinha}>
                          <span>{material.nome}</span>
                          <strong>{material.quantidade} {material.unidade}</strong>
                        </div>
                      ))}
                      {materiais.length > 5 && <p style={styles.textoFraco}>+ {materiais.length - 5} material(is) na lista completa.</p>}
                    </div>
                  )}

                  {obra.observacoesExecucao && <p style={styles.textoFraco}>{obra.observacoesExecucao}</p>}

                  <div style={styles.acoes}>
                    {obra.statusObra !== 'Iniciada' && obra.statusObra !== 'Finalizada' && (
                      <Button size="sm" onClick={() => atualizarStatusObra(obra.id, 'Iniciada')}>Marcar iniciada</Button>
                    )}
                    {obra.statusObra === 'Iniciada' && (
                      <Button size="sm" variant="secondary" onClick={() => atualizarStatusObra(obra.id, 'Finalizada')}>Finalizar obra</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => abrirMaterial(obra)}>Ver material</Button>
                    <Button size="sm" variant="outline" onClick={() => baixarLista(obra)}>Baixar lista</Button>
                    <Button size="sm" variant="secondary" onClick={() => baixarMaterialDaObra(obra.id)}>Baixar estoque</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>Orçamento</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {obraMaterial && (
        <div style={styles.modalOverlay} onClick={() => setObraMaterial(null)}>
          <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalTopo}>
              <div>
                <h2 style={styles.modalTitulo}>Material da obra</h2>
                <p style={styles.textoFraco}>{obraMaterial.cliente} • {formatarMoeda(totalMaterial(materiaisEditando))}</p>
              </div>
              <button style={styles.fechar} onClick={() => setObraMaterial(null)}>×</button>
            </div>

            <div style={styles.editorLista}>
              {materiaisEditando.map((material) => (
                <div key={material.id} style={styles.editorItem}>
                  <Input label="Material" value={material.nome} onChange={(e) => alterarMaterial(material.id, 'nome', e.target.value)} />
                  <div style={styles.editorGrid}>
                    <Input label="Qtd." type="number" value={String(material.quantidade)} onChange={(e) => alterarMaterial(material.id, 'quantidade', e.target.value)} />
                    <Input label="Un." value={material.unidade} onChange={(e) => alterarMaterial(material.id, 'unidade', e.target.value)} />
                    <Input label="Custo un." type="number" value={String(material.custoUnitario)} onChange={(e) => alterarMaterial(material.id, 'custoUnitario', e.target.value)} />
                    <Input label="Estoque" type="number" value={String(material.estoqueAtual)} onChange={(e) => alterarMaterial(material.id, 'estoqueAtual', e.target.value)} />
                  </div>
                  <div style={styles.editorRodape}>
                    <span>Total: <strong>{formatarMoeda(material.custoTotal)}</strong></span>
                    {material.falta > 0 && <span style={styles.falta}>Falta {material.falta} {material.unidade}</span>}
                    <Button size="sm" variant="danger" onClick={() => removerMaterial(material.id)}>Remover</Button>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalAcoes}>
              <Button variant="outline" onClick={adicionarMaterial}>Adicionar material</Button>
              <Button onClick={salvarMaterial}>Salvar lista</Button>
              <Button variant="secondary" onClick={() => obraMaterial && baixarLista(obraMaterial)}>Baixar lista</Button>
              <Button variant="outline" onClick={restaurarMaterialCalculado}>Recalcular automático</Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  topo: { display: 'grid', gridTemplateColumns: '1fr', gap: 12 },
  titulo: { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: -1, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.4 },
  resumoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 10 },
  label: { display: 'block', color: '#64748b', fontSize: 13, marginBottom: 6, fontWeight: 800 },
  numero: { fontSize: 22, color: '#0f172a', letterSpacing: -0.7 },
  numeroAlerta: { fontSize: 22, color: '#dc2626', letterSpacing: -0.7 },
  numeroVerde: { fontSize: 22, color: '#16a34a', letterSpacing: -0.7 },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  cardTopo: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  cardTitulo: { margin: 0, fontSize: 21, color: '#0f172a', letterSpacing: -0.5 },
  textoFraco: { margin: '6px 0', color: '#64748b', fontSize: 13, lineHeight: 1.35 },
  status: { padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 12, color: '#334155', fontSize: 14 },
  materialBox: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginTop: 12, padding: 14, borderRadius: 24, background: '#f8fafc', border: '1px solid #e2e8f0' },
  materialValor: { display: 'block', fontSize: 22, color: '#0f172a', letterSpacing: -0.8 },
  materialTags: { display: 'flex', justifyContent: 'flex-end' },
  falta: { fontSize: 12, color: '#b91c1c', fontWeight: 900, background: '#fee2e2', padding: '4px 8px', borderRadius: 999 },
  ok: { fontSize: 12, color: '#166534', fontWeight: 900, background: '#dcfce7', padding: '4px 8px', borderRadius: 999 },
  materialLista: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 },
  materialLinha: { display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '8px 0', borderBottom: '1px solid #e2e8f0', color: '#334155' },
  acoes: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 },
  modalOverlay: { position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12 },
  modal: { width: '100%', maxWidth: 720, maxHeight: '88vh', overflow: 'auto', background: '#fff', borderRadius: 28, padding: 18, boxShadow: '0 20px 60px rgba(15,23,42,.22)' },
  modalTopo: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 12 },
  modalTitulo: { margin: 0, fontSize: 24, color: '#0f172a', letterSpacing: -0.7 },
  fechar: { border: 0, background: '#f1f5f9', color: '#0f172a', width: 42, height: 42, borderRadius: 999, fontSize: 26, fontWeight: 800, cursor: 'pointer' },
  editorLista: { display: 'flex', flexDirection: 'column', gap: 12 },
  editorItem: { border: '1px solid #e2e8f0', borderRadius: 22, padding: 12, background: '#f8fafc' },
  editorGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  editorRodape: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 10, color: '#334155', fontSize: 13 },
  modalAcoes: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 14 },
};
