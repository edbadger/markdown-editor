import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {
  resolveInsideRoot,
  isMarkdownFile,
  markSelfWrite,
} from '../lib/state.js';

export const filesRouter = Router();

filesRouter.get('/', (req, res, next) => {
  try {
    const rel = (req.query.path ?? '').toString();
    if (!rel) return res.status(400).json({ error: 'path required' });
    const abs = resolveInsideRoot(rel);
    if (!isMarkdownFile(abs)) {
      return res.status(400).json({ error: 'Not a markdown file' });
    }
    const content = fs.readFileSync(abs, 'utf8');
    const stat = fs.statSync(abs);
    res.json({ content, mtime: stat.mtimeMs });
  } catch (err) {
    next(err);
  }
});

filesRouter.put('/', (req, res, next) => {
  try {
    const rel = (req.query.path ?? '').toString();
    if (!rel) return res.status(400).json({ error: 'path required' });
    const abs = resolveInsideRoot(rel);
    if (!isMarkdownFile(abs)) {
      return res.status(400).json({ error: 'Not a markdown file' });
    }
    const content =
      typeof req.body === 'string'
        ? req.body
        : typeof req.body?.content === 'string'
          ? req.body.content
          : null;
    if (content === null) {
      return res.status(400).json({ error: 'content required' });
    }
    markSelfWrite(abs);
    fs.writeFileSync(abs, content, 'utf8');
    const stat = fs.statSync(abs);
    res.json({ ok: true, mtime: stat.mtimeMs });
  } catch (err) {
    next(err);
  }
});

filesRouter.post('/', (req, res, next) => {
  try {
    const rel = (req.body?.path ?? '').toString();
    const content = (req.body?.content ?? '').toString();
    if (!rel) return res.status(400).json({ error: 'path required' });
    const abs = resolveInsideRoot(rel);
    const ext = path.extname(abs).toLowerCase();
    const target = ext ? abs : `${abs}.md`;
    if (!isMarkdownFile(target)) {
      return res.status(400).json({ error: 'Must be a markdown file' });
    }
    if (fs.existsSync(target)) {
      return res.status(409).json({ error: 'File already exists' });
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    markSelfWrite(target);
    fs.writeFileSync(target, content, 'utf8');
    const stat = fs.statSync(target);
    res.status(201).json({ ok: true, mtime: stat.mtimeMs });
  } catch (err) {
    next(err);
  }
});

filesRouter.patch('/', (req, res, next) => {
  try {
    const from = (req.body?.from ?? '').toString();
    const to = (req.body?.to ?? '').toString();
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to required' });
    }
    if (from === to) return res.json({ ok: true, mtime: 0 });
    const fromAbs = resolveInsideRoot(from);
    const toAbs = resolveInsideRoot(to);
    if (!isMarkdownFile(fromAbs) || !isMarkdownFile(toAbs)) {
      return res.status(400).json({ error: 'Must be markdown files' });
    }
    if (!fs.existsSync(fromAbs)) {
      return res.status(404).json({ error: 'Source not found' });
    }
    if (fs.existsSync(toAbs)) {
      return res.status(409).json({ error: 'Target already exists' });
    }
    fs.mkdirSync(path.dirname(toAbs), { recursive: true });
    markSelfWrite(fromAbs);
    markSelfWrite(toAbs);
    fs.renameSync(fromAbs, toAbs);
    const stat = fs.statSync(toAbs);
    res.json({ ok: true, mtime: stat.mtimeMs });
  } catch (err) {
    next(err);
  }
});

filesRouter.delete('/', (req, res, next) => {
  try {
    const rel = (req.query.path ?? '').toString();
    if (!rel) return res.status(400).json({ error: 'path required' });
    const abs = resolveInsideRoot(rel);
    if (!isMarkdownFile(abs)) {
      return res.status(400).json({ error: 'Not a markdown file' });
    }
    markSelfWrite(abs);
    fs.unlinkSync(abs);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
