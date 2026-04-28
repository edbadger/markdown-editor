import express from 'express';
import cors from 'cors';
import { rootRouter } from './routes/root.js';
import { foldersRouter } from './routes/folders.js';
import { filesRouter } from './routes/files.js';
import { watchRouter } from './routes/watch.js';

const app = express();
// The Vite dev server (port 5173) proxies /api here. Some preview launchers
// set PORT in env, so we deliberately ignore it and use a fixed backend port.
// 47821 is unusual enough to avoid conflicts with other Vite/dev projects.
const PORT = Number(process.env.MD_EDITOR_PORT ?? 47821);

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.text({ type: 'text/markdown', limit: '5mb' }));
app.use(express.text({ type: 'text/plain', limit: '5mb' }));

app.use('/api/root', rootRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/files', filesRouter);
app.use('/api/watch', watchRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Markdown editor server listening on http://127.0.0.1:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[markdown-editor] Port ${PORT} is already in use. Set MD_EDITOR_PORT to a different port and restart.\n`
    );
  } else {
    console.error('[markdown-editor] Server error:', err);
  }
  process.exit(1);
});
