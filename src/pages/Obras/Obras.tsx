import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';
import { baixarItensEstoque } from '../../services/estoqueService';
import { calcularResumoMaterial } from '../../services/materialService';
import { carregarOrcamentos } from '../../services/orcamentoStorage';
import { formatarMoeda } from '../../utils/formatarMoeda';

function definirStatus(dataObra?: string) {
  if (!dataObra) return { label: 'Sem data', color: '#64748b', bg: '#f1f5f9' };
  const hoje = new Date().toISOString().split('T')[0];
  if (dataObra < hoje) return { label: 'Atenção', color: '#b45309', bg: '#fef3c7' };
  if (dataObra === hoje) return { label: 'Hoje', color: '#166534', bg: '#dcfce7' };
  return { label: 'Agendada', color: '#1d4ed8', bg: '#dbeafe' };
}

export default function Obras() {
  const navigate = useNavigate();
  const [atualizacao, setAtualizacao] = useState(0);

  const obras = useMemo(() => {
    return carregarOrcamentos()
      .filter((orcamento) => orcamento.status === 'Aprovado')
      .sort((a, b) => String(a.dataObra || '9999').localeCompare(String(b.dataObra || '9999')));
  }, [atualizacao]);

  const totalMaterial = obras.reduce((soma, obra) => soma + calcularResumoMaterial(obra).custoTotal, 0);
  const totalObras = obras.reduce((soma, obra) => soma + obra.total, 0);
  const lucroPrevisto = totalObras - totalMaterial;

  function baixarMaterialDaObra(obraId: number) {
    const obra = obras.find((item) => item.id === obraId);
    if (!obra) return;

    const resumo = calcularResumoMaterial(obra);
    if (resumo.materiais.length === 0) return alert('Não encontrei materiais calculados para esta obra.');

    const confirmar = confirm('Deseja baixar do estoque os materiais calculados para esta obra?');
    if (!confirmar) return;

    baixarItensEstoque(resumo.materiais.map((material) => ({ nome: material.nome, quantidade: material.quantidade })));
    setAtualizacao((valor) => valor + 1);
    alert('Material baixado do estoque. Confira a tela Estoque para ver os saldos.');
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div style={styles.topo}>
          <div>
            <h1 style={styles.titulo}>Obras</h1>
            <p style={styles.subtitulo}>Obras aprovadas com custo de material calculado automaticamente.</p>
          </div>
          <Button onClick={() => navigate('/orcamentos')}>Novo orçamento</Button>
        </div>

        <div style={styles.resumoGrid}>
          <Card><span style={styles.label}>Obras agendadas</span><strong style={styles.numero}>{obras.length}</strong></Card>
          <Card><span style={styles.label}>Valor das obras</span><strong style={styles.numero}>{formatarMoeda(totalObras)}</strong></Card>
          <Card><span style={styles.label}>Custo material</span><strong style={styles.numeroAlerta}>{formatarMoeda(totalMaterial)}</strong></Card>
          <Card><span style={styles.label}>Lucro previsto</span><strong style={lucroPrevisto >= 0 ? styles.numeroVerde : styles.numeroAlerta}>{formatarMoeda(lucroPrevisto)}</strong></Card>
        </div>

        {obras.length === 0 ? (
          <Card title="Nenhuma obra ainda">
            <p style={styles.textoFraco}>Aprove um orçamento e informe a data da obra para ela aparecer aqui.</p>
          </Card>
        ) : (
          <div style={styles.lista}>
            {obras.map((obra) => {
              const status = definirStatus(obra.dataObra);
              const resumoMaterial = calcularResumoMaterial(obra);
              return (
                <Card key={obra.id}>
                  <div style={styles.cardTopo}>
                    <div>
                      <h2 style={styles.cardTitulo}>{obra.cliente}</h2>
                      <p style={styles.textoFraco}>{obra.cidade || 'Cidade não informada'} {obra.bairro ? `• ${obra.bairro}` : ''}</p>
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
                      <strong style={styles.materialValor}>{formatarMoeda(resumoMaterial.custoTotal)}</strong>
                      <p style={styles.textoFraco}>Lucro previsto: {formatarMoeda(resumoMaterial.lucroPrevisto)}</p>
                    </div>
                    <div style={styles.materialTags}>
                      {resumoMaterial.faltantes.length > 0 ? (
                        <span style={styles.falta}>{resumoMaterial.faltantes.length} item(ns) faltando</span>
                      ) : (
                        <span style={styles.ok}>Estoque OK</span>
                      )}
                    </div>
                  </div>

                  {resumoMaterial.materiais.length > 0 && (
                    <div style={styles.materialLista}>
                      {resumoMaterial.materiais.slice(0, 5).map((material) => (
                        <div key={`${obra.id}-${material.nome}`} style={styles.materialLinha}>
                          <span>{material.nome}</span>
                          <strong>{material.quantidade} {material.unidade}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {obra.observacoesExecucao && <p style={styles.textoFraco}>{obra.observacoesExecucao}</p>}

                  <div style={styles.acoes}>
                    <Button size="sm" onClick={() => navigate(`/orcamentos?editar=${obra.id}`)}>Abrir orçamento</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate('/estoque')}>Ver estoque</Button>
                    <Button size="sm" variant="secondary" onClick={() => baixarMaterialDaObra(obra.id)}>Baixar material</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate('/agenda')}>Ver agenda</Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
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
};
