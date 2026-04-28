import { Router } from 'express';
import { subscribe, getWatchedRoot } from '../lib/watcher.js';

export const watchRouter = Router();

watchRouter.get('/', (req, res) => {
  if (!getWatchedRoot()) {
    return res.status(409).json({ error: 'No folder selected' });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write(': connected\n\n');

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 30000);

  const unsubscribe = subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});
