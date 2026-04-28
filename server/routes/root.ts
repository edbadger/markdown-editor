import { Router } from 'express';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { getRoot, setRoot } from '../lib/state.js';
import { resetWatcher } from '../lib/watcher.js';

export const rootRouter = Router();

rootRouter.get('/', (_req, res) => {
  res.json({ path: getRoot() });
});

rootRouter.post('/', (req, res) => {
  const raw = (req.body?.path ?? '').toString().trim();
  if (!raw) {
    return res.status(400).json({ error: 'path required' });
  }
  const expanded = raw.startsWith('~')
    ? path.join(os.homedir(), raw.slice(1))
    : raw;
  try {
    const stat = fs.statSync(expanded);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Not a directory' });
    }
    const abs = setRoot(expanded);
    resetWatcher(abs);
    res.json({ path: abs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});
