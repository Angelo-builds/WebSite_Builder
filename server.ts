import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const execAsync = promisify(exec);

// Publish project
app.post('/api/projects/:id/publish', async (req, res) => {
  const { id } = req.params;
  const { pages, html, css } = req.body;
  
  try {
    const projectDir = path.join(__dirname, 'dist', 'sites', id, 'dist');
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    const pagesToPublish = pages || [{ name: 'index', html, css }];

    const blockraBadge = `
      <a href="https://github.com/Angelo-builds/WebSite_Builder" target="_blank" style="position:fixed;bottom:20px;right:20px;background:#111;color:#fff;padding:8px 12px;border-radius:8px;font-family:sans-serif;font-size:12px;font-weight:bold;text-decoration:none;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:6px;transition:transform 0.2s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        Built with Blockra
      </a>
    `;

    pagesToPublish.forEach((page: any) => {
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${id} - ${page.name}</title>
  <style>${page.css}</style>
</head>
<body>
  ${page.html}
  ${blockraBadge}
</body>
</html>`;
      
      const fileName = page.name.endsWith('.html') ? page.name : `${page.name}.html`;
      fs.writeFileSync(path.join(projectDir, fileName), fullHtml);
    });

    res.json({ message: 'Project published successfully', url: `/sites/${id}/dist/index.html` });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ message: 'Failed to publish project' });
  }
});

// Serve published sites
app.use('/sites', express.static(path.join(__dirname, 'dist', 'sites')));

// --- System Update Routes ---
app.get('/api/system/check-update', async (req, res) => {
  try {
    try {
      await execAsync('git rev-parse --is-inside-work-tree');
    } catch (e) {
      return res.json({ isUpdateAvailable: false, message: 'System is up to date (Not a git repository).' });
    }
    try {
      await execAsync('git fetch origin');
    } catch (e) {
      return res.json({ isUpdateAvailable: false, message: 'System is up to date (Cannot fetch from origin).' });
    }
    try {
      const { stdout: localHash } = await execAsync('git rev-parse @');
      const { stdout: remoteHash } = await execAsync('git rev-parse @{u}');
      const isUpdateAvailable = localHash.trim() !== remoteHash.trim();
      res.json({ isUpdateAvailable, message: isUpdateAvailable ? 'An update is available.' : 'System is up to date.' });
    } catch (e) {
      return res.json({ isUpdateAvailable: false, message: 'System is up to date (No upstream branch).' });
    }
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({ isUpdateAvailable: false, error: 'Cannot check for updates.' });
  }
});

app.post('/api/system/update', async (req, res) => {
  try {
    console.log('Starting system update...');
    await execAsync('git stash');
    await execAsync('git pull origin main');
    await execAsync('npm install');
    await execAsync('npm run build');
    console.log('Update completed successfully.');
    res.json({ message: 'Update completed successfully. Please restart the server.' });
  } catch (error) {
    console.error('Update execution error:', error);
    res.status(500).json({ error: 'Failed to apply update. Check server logs.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
