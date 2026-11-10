import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import dotenv from 'dotenv';
import { processCognitionKernel } from './server/ai.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API endpoints
app.post('/api/ai/think', async (req, res) => {
  try {
    const result = await processCognitionKernel(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Server error' });
  }
});

app.get('/api/sysinfo', (_req, res) => {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    res.json({
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      cpuModel: cpus[0]?.model || 'Virtual Core',
      cpuCount: cpus.length,
      totalMemoryBytes: totalMem,
      freeMemoryBytes: freeMem,
      usedMemoryBytes: totalMem - freeMem,
      loadAvg: os.loadavg(),
      nodeVersion: process.version,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

// Serve static frontend assets from dist in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AetherOS Desktop Server running on http://localhost:${PORT}`);
});
