import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const BACKUP_VERSION = '1.0';
const BACKUP_PREFIX = 'gesso-smj-';

function isAndroidApp() {
  return Capacitor.isNativePlatform();
}

export interface BackupGessoSMJ {
  app: 'Gesso SMJ ERP';
  version: string;
  createdAt: string;
  storage: Record<string, string>;
}

export function gerarBackup(): BackupGessoSMJ {
  const storage: Record<string, string> = {};

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    if (key.startsWith(BACKUP_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value !== null) storage[key] = value;
    }
  }

  return {
    app: 'Gesso SMJ ERP',
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    storage,
  };
}

function gerarNomeArquivo() {
  const data = new Date().toISOString().slice(0, 10);
  const hora = new Date().toTimeString().slice(0, 5).replace(':', '-');
  return `backup-gesso-smj-${data}-${hora}.json`;
}

function baixarBackupWeb(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function salvarBackupAndroid(conteudo: string, nomeArquivo: string) {
  const caminho = `GessoSMJ/${nomeArquivo}`;

  await Filesystem.mkdir({
    path: 'GessoSMJ',
    directory: Directory.Documents,
    recursive: true,
  }).catch(() => {
    // A pasta pode já existir.
  });

  await Filesystem.writeFile({
    path: caminho,
    data: conteudo,
    directory: Directory.Documents,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  const arquivo = await Filesystem.getUri({
    path: caminho,
    directory: Directory.Documents,
  });

  try {
    await Share.share({
      title: 'Backup Gesso SMJ ERP',
      text: 'Backup dos dados do Gesso SMJ ERP.',
      url: arquivo.uri,
      dialogTitle: 'Salvar ou enviar backup',
    });
  } catch {
    // Mesmo se o compartilhamento falhar, o arquivo já foi salvo no aparelho.
  }

  return `Backup salvo no aparelho: ${nomeArquivo}`;
}

export async function baixarBackup() {
  const backup = gerarBackup();
  const conteudo = JSON.stringify(backup, null, 2);
  const nomeArquivo = gerarNomeArquivo();

  if (isAndroidApp()) {
    return salvarBackupAndroid(conteudo, nomeArquivo);
  }

  baixarBackupWeb(conteudo, nomeArquivo);
  return `Backup baixado: ${nomeArquivo}`;
}

export async function importarBackup(file: File) {
  const texto = await file.text();
  const backup = JSON.parse(texto) as BackupGessoSMJ;

  if (!backup || backup.app !== 'Gesso SMJ ERP' || !backup.storage) {
    throw new Error('Arquivo de backup inválido.');
  }

  Object.entries(backup.storage).forEach(([key, value]) => {
    if (key.startsWith(BACKUP_PREFIX)) {
      localStorage.setItem(key, value);
    }
  });

  return backup;
}
