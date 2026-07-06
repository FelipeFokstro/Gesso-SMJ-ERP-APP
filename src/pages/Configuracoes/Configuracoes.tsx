import { useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';
import { baixarBackup, importarBackup } from '../../services/backupService';

export default function Configuracoes() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mensagem, setMensagem] = useState('');

  async function handleImportar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmar = confirm('Importar este backup vai substituir/adicionar os dados salvos neste aparelho. Deseja continuar?');
    if (!confirmar) return;

    try {
      const backup = await importarBackup(file);
      setMensagem(`Backup importado com sucesso. Data do backup: ${new Date(backup.createdAt).toLocaleString('pt-BR')}.`);
      alert('Backup importado. O app será recarregado para atualizar os dados.');
      window.location.reload();
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : 'Não foi possível importar o backup.');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <div>
          <h1 style={styles.titulo}>Backup</h1>
          <p style={styles.subtitulo}>Salve o backup no celular ou compartilhe com o sócio para importar no aparelho dele.</p>
        </div>

        <Card title="Backup manual" subtitle="O backup agora é salvo como arquivo no aparelho e também pode ser enviado pelo compartilhamento do Android.">
          <div style={styles.gridAcoes}>
            <Button onClick={async () => {
              try {
                const resultado = await baixarBackup();
                setMensagem(resultado);
              } catch (error) {
                setMensagem(error instanceof Error ? error.message : 'Não foi possível salvar o backup neste aparelho.');
              }
            }}>Exportar backup</Button>
            <Button variant="outline" onClick={() => inputRef.current?.click()}>Importar backup</Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportar}
            style={{ display: 'none' }}
          />

          {mensagem && <p style={styles.mensagem}>{mensagem}</p>}
        </Card>

        <Card title="Como usar com o Vitor">
          <ol style={styles.lista}>
            <li>No seu app, toque em <strong>Exportar backup</strong>.</li>
            <li>Envie o arquivo pelo WhatsApp para o Vitor.</li>
            <li>No celular dele, ele abre o app e toca em <strong>Importar backup</strong>.</li>
            <li>Depois de importar, o app recarrega com orçamentos, estoque, financeiro, catálogo e obras.</li>
          </ol>
        </Card>
      </div>
    </MainLayout>
  );
}

const styles: Record<string, CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 16 },
  titulo: { margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: -1, color: '#0f172a' },
  subtitulo: { margin: '6px 0 0', color: '#64748b', fontSize: 14, lineHeight: 1.4 },
  gridAcoes: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 },
  mensagem: { margin: '14px 0 0', color: '#166534', fontSize: 14, fontWeight: 800, lineHeight: 1.4 },
  lista: { margin: 0, paddingLeft: 20, color: '#334155', fontSize: 14, lineHeight: 1.65 },
};
