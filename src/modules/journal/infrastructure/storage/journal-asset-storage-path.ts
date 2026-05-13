import { homedir } from 'node:os';
import path from 'node:path';

import type { AppConfigService } from '../../../../app/config/app-config.service';

export function resolveJournalAssetRootDir(config: AppConfigService): string {
  if (config.journalAssetStorageDir !== null) {
    return config.journalAssetStorageDir;
  }

  return path.join(resolveStateHome(), config.appName, 'journal-assets');
}

export function resolveJournalAssetFilePath(
  config: AppConfigService,
  storageKey: string,
): string {
  const safeStorageKey = path.basename(storageKey);

  return path.join(resolveJournalAssetRootDir(config), safeStorageKey);
}

function resolveStateHome() {
  return (
    process.env.XDG_STATE_HOME?.trim() ||
    path.join(homedir(), '.local', 'state')
  );
}
