const BACKUP_VERSION = '1.0';
const BACKUP_PREFIX = 'gesso-smj-';

function isAndroidApp() {
  const capacitor = (window as any).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

async function carregarCapacitor() {
  const importar = new Function('nome', 'return import(nome)') as (nome: string) => Promise<any>;
  const filesystem = await importar('@capacitor/filesystem');
  const share = await importar('@capacitor/share');

  return {
    Filesystem: filesystem.Filesystem,
    Directory: filesystem.Directory,
    Encoding: filesystem.Encoding,
    Share: share.Share,
  };
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

async function compartilharBackupAndroid(conteudo: string, nomeArquivo: string) {
  const { Filesystem, Directory, Encoding, Share } = await carregarCapacitor();
  const caminho = `backups/${nomeArquivo}`;

  await Filesystem.mkdir({
    path: 'backups',
    directory: Directory.Cache,
    recursive: true,
  }).catch(() => {
    // A pasta pode já existir.
  });

  await Filesystem.writeFile({
    path: caminho,
    data: conteudo,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  const arquivo = await Filesystem.getUri({
    path: caminho,
    directory: Directory.Cache,
  });

  await Share.share({
    title: 'Backup Gesso SMJ ERP',
    text: 'Backup dos dados do Gesso SMJ ERP.',
    url: arquivo.uri,
    dialogTitle: 'Enviar backup',
  });
}

export async function baixarBackup() {
  const backup = gerarBackup();
  const conteudo = JSON.stringify(backup, null, 2);
  const nomeArquivo = gerarNomeArquivo();

  if (isAndroidApp()) {
    await compartilharBackupAndroid(conteudo, nomeArquivo);
    return;
  }

  baixarBackupWeb(conteudo, nomeArquivo);
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
