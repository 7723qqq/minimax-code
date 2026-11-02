import { mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { atomicWriteFile } from '@mavis/shared';

export class ReviewPreferencesService {
  readonly rulesPath: string;

  constructor(dataDir: string) {
    this.rulesPath = join(dataDir, 'review-rules', 'global.md');
  }

  async get(): Promise<string> {
    try {
      return await readFile(this.rulesPath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
      throw error;
    }
  }

  async update(rules: string): Promise<string> {
    if (!rules.trim()) {
      await rm(this.rulesPath, { force: true });
      return '';
    }
    const parent = dirname(this.rulesPath);
    await mkdir(parent, { recursive: true });
    await atomicWriteFile(this.rulesPath, rules, { ensureDirectory: false });
    return rules;
  }
}
