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
      <a href="https://github.com/Angelo-builds/WebSite_Builder" target="_blank" style="position:fixed;bottom:20px;right:20px;background:#121212;color:#fff;padding:8px 14px;border-radius:10px;font-family:'Montserrat', sans-serif;font-size:11px;font-weight:700;text-decoration:none;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);border:1px solid rgba(255,255,255,0.1);text-transform:uppercase;letter-spacing:1px;" onmouseover="this.style.transform='translateY(-2px)';this.style.borderColor='rgba(0,128,128,0.5)'" onmouseout="this.style.transform='translateY(0)';this.style.borderColor='rgba(255,255,255,0.1)'">
        <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 20L80 35L50 50L20 35L50 20Z" fill="#008080" fill-opacity="0.2" stroke="#008080" stroke-width="4"/>
          <path d="M20 35V65L50 80V50L20 35Z" fill="#008080" fill-opacity="0.3" stroke="#008080" stroke-width="4"/>
          <path d="M50 50V80L80 65V35" stroke="#008080" stroke-width="4"/>
          <path d="M65 57.5H95" stroke="#008080" stroke-width="6"/>
        </svg>
        Built with Blokra
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
