const BACKUP_VERSION = '1.0';
const BACKUP_PREFIX = 'gesso-smj-';

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

export function baixarBackup() {
  const backup = gerarBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const data = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `backup-gesso-smj-${data}.json`;
  link.click();
  URL.revokeObjectURL(url);
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
