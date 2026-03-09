import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Database Connection
let db: mysql.Connection | null = null;
let dbReady = false;

const connectDB = async () => {
  try {
    if (!process.env.DB_HOST) {
      console.warn('DB_HOST not set. Running in mock mode (no DB).');
      return;
    }
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sitebuilder',
    });
    console.log('Connected to MySQL/MariaDB Database');

    // Create tables if they don't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        surname VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user'
      )
    `);

    // Ensure username column exists if table was created before
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN username VARCHAR(255) UNIQUE');
      console.log('Added username column to users table');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.log('Username column check:', e.message);
      }
    }

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        data LONGTEXT
      )
    `);
    
    // Ensure data column exists if table was created by schema.sql
    try {
      await connection.execute('ALTER TABLE projects ADD COLUMN data LONGTEXT');
      console.log('Added data column to projects table');
    } catch (e: any) {
      // Ignore error if column already exists (ER_DUP_FIELDNAME)
      if (e.code !== 'ER_DUP_FIELDNAME') {
        console.log('Data column check:', e.message);
      }
    }
    
    console.log('Database tables verified');
    db = connection;
    dbReady = true;

    // Check if we need to create an Example Project
    try {
      const [rows] = await db.execute('SELECT COUNT(*) as count FROM projects');
      if ((rows as any)[0].count === 0) {
        console.log('Database is empty. Creating Example Project...');
        const initialData = JSON.stringify({
          metadata: { description: 'A sample project to test the editor.', category: 'Landing Page', templateHtml: exampleHtml, updatedAt: new Date().toISOString() },
          assets: [],
          styles: [],
          pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
        });
        const projectId = 'Example Project'.toLowerCase().replace(/\s+/g, '-');
        await db.execute('INSERT INTO projects (id, name, data) VALUES (?, ?, ?)', [projectId, 'Example Project', initialData]);
      }
    } catch (e) {
      console.error('Failed to create example project:', e);
    }
  } catch (err) {
    console.error('Database connection failed:', err);
    console.warn('Running in fallback mode.');
    db = null; // Ensure db is null if initialization fails
    dbReady = false;
  }
};

connectDB();

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password, name, surname } = req.body;
  
  if (!dbReady || !db) {
    return res.status(201).json({ message: 'User registered (Mock)', token: 'mock-token', user: { email, username, name, role: 'User' } });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (email, username, password, name, surname) VALUES (?, ?, ?, ?, ?)',
      [email, username || email.split('@')[0], hashedPassword, name || 'User', surname || '']
    );
    
    const token = jwt.sign({ id: (result as any).insertId, email, username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.status(201).json({ token, user: { email, username, name, surname, role: 'User' } });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or Username already exists' });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body; // 'email' can be email or username

  if (!dbReady || !db) {
     if (email === 'admin@example.com' && password === 'admin') {
        return res.json({ token: 'mock-admin-token', user: { email, username: 'admin', name: 'Admin', role: 'Administrator' } });
     }
     return res.json({ token: 'mock-user-token', user: { email, username: email, name: 'User', role: 'User' } });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
    const users = rows as any[];

    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { email: user.email, username: user.username, name: user.name, surname: user.surname, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Change Password
app.post('/api/auth/change-password', async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!dbReady || !db) return res.json({ message: 'Password changed (Mock)' });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as any[];
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect old password' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Reset Password (Forgot Password)
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, email, newPassword } = req.body;
  if (!dbReady || !db) return res.json({ message: 'Password reset (Mock)' });

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ? AND email = ?', [username, email]);
    const users = rows as any[];
    if (users.length === 0) return res.status(401).json({ message: 'Invalid Username or Email combination' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, users[0].id]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Proxmox Auth (Proxy to PVE API)
app.post('/api/auth/proxmox', async (req, res) => {
  const { host, username, password, realm } = req.body;
  // This endpoint would typically connect to the Proxmox API
  // https://pve.proxmox.com/wiki/Proxmox_VE_API
  
  try {
    // Example: POST https://<host>:8006/api2/json/access/ticket
    // For now, we mock it or implement a basic check if host is provided
    if (!host) return res.status(400).json({ message: 'Proxmox Host required' });

    // In a real scenario:
    /*
    const response = await axios.post(`https://${host}:8006/api2/json/access/ticket`, {
        username: `${username}@${realm || 'pam'}`,
        password
    }, { httpsAgent: new https.Agent({ rejectUnauthorized: false }) });
    */
    
    // Mock success
    res.json({ 
        token: 'proxmox-mock-ticket', 
        user: { name: username, role: 'Proxmox User', source: 'Proxmox' } 
    });

  } catch (error) {
    console.error('Proxmox Auth Error:', error);
    res.status(401).json({ message: 'Proxmox authentication failed' });
  }
});

import multer from 'multer';

// ... (previous imports)

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'dist', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// ... (existing code)

// --- Project Routes ---

const exampleHtml = `
  <div class="font-sans text-gray-900">
    <header class="px-8 py-24 flex flex-col items-center text-center bg-gradient-to-b from-indigo-50 to-white">
      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 text-gray-900">Welcome to Web Builder</h1>
      <p class="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">This is an example project created automatically to help you get started. Feel free to edit, delete, or publish it!</p>
      <div class="flex gap-4">
        <a href="#" class="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">Start Editing</a>
      </div>
    </header>
    <section class="px-8 py-24 bg-white">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div class="flex flex-col items-center text-center p-6 border border-gray-100 rounded-2xl shadow-sm">
            <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">🖱️</div>
            <h3 class="text-xl font-bold mb-3">Drag & Drop</h3>
            <p class="text-gray-600">Drag elements from the right panel onto the canvas to build your layout.</p>
          </div>
          <div class="flex flex-col items-center text-center p-6 border border-gray-100 rounded-2xl shadow-sm">
            <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">🎨</div>
            <h3 class="text-xl font-bold mb-3">Style Everything</h3>
            <p class="text-gray-600">Select any element and use the Style Manager to customize colors, spacing, and more.</p>
          </div>
          <div class="flex flex-col items-center text-center p-6 border border-gray-100 rounded-2xl shadow-sm">
            <div class="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">📱</div>
            <h3 class="text-xl font-bold mb-3">Responsive</h3>
            <p class="text-gray-600">Use the device icons at the top to ensure your site looks great on mobile and tablet.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
`;

const mockProjects = new Map<string, any>();
mockProjects.set('Example Project', {
  metadata: { description: 'A sample project to test the editor.', category: 'Landing Page', templateHtml: exampleHtml, updatedAt: new Date().toISOString() },
  assets: [],
  styles: [],
  pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
});

// Get all projects
app.get('/api/projects', async (req, res) => {
  if (!dbReady || !db) {
    const projectsList = Array.from(mockProjects.entries()).map(([name, data]) => ({
      name,
      description: data.metadata?.description || '',
      category: data.metadata?.category || 'Blank Project',
      updatedAt: data.metadata?.updatedAt || new Date().toISOString()
    }));
    
    return res.json(projectsList);
  }
  
  try {
    const [rows] = await db.execute('SELECT id, name, data FROM projects');
    const projects = (rows as any[]).map(row => {
      let metadata = { description: '', category: 'Other', updatedAt: new Date().toISOString() };
      try {
        if (row.data) {
          const parsed = JSON.parse(row.data);
          if (parsed.metadata) {
            metadata = { ...metadata, ...parsed.metadata };
          }
        }
      } catch (e) {}
      return {
        id: row.id,
        name: row.name,
        ...metadata
      };
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Get project by ID
app.get('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (!dbReady || !db) {
    const project = mockProjects.get(id) || {
      assets: [],
      styles: [],
      pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
    };
    return res.json(project);
  }
  
  try {
    // Try to find by id or name
    const [rows] = await db.execute('SELECT data FROM projects WHERE id = ? OR name = ?', [id, id]);
    const projects = rows as any[];
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(JSON.parse(projects[0].data || '{}'));
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  const { name, description, category, data } = req.body;
  const id = name.toLowerCase().replace(/\s+/g, '-').substring(0, 30) + '-' + Date.now().toString(36);
  if (!dbReady || !db) {
    mockProjects.set(id, data || {
      metadata: { description: description || '', category: category || 'Blank Project', updatedAt: new Date().toISOString() },
      assets: [],
      styles: [],
      pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
    });
    return res.status(201).json({ message: 'Project created (Mock)', id, name, description, category });
  }
  
  try {
    const initialData = data ? JSON.stringify(data) : JSON.stringify({
      metadata: { description: description || '', category: category || 'Other', updatedAt: new Date().toISOString() },
      assets: [],
      styles: [],
      pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
    });
    
    await db.execute('INSERT INTO projects (id, name, data) VALUES (?, ?, ?)', [id, name, initialData]);
    res.status(201).json({ message: 'Project created', id, name });
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// Update project
app.post('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!dbReady || !db) {
    mockProjects.set(id, data);
    return res.json({ message: 'Project saved (Mock)', id });
  }
  
  try {
    await db.execute('UPDATE projects SET data = ? WHERE id = ? OR name = ?', [JSON.stringify(data), id, id]);
    res.json({ message: 'Project saved', id });
  } catch (error) {
    console.error('Failed to save project:', error);
    res.status(500).json({ message: 'Failed to save project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (!dbReady || !db) {
    mockProjects.delete(id);
    return res.json({ message: 'Project deleted (Mock)', id });
  }
  
  try {
    await db.execute('DELETE FROM projects WHERE id = ? OR name = ?', [id, id]);
    res.json({ message: 'Project deleted', id });
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// Publish project
app.post('/api/projects/:id/publish', async (req, res) => {
  const { id } = req.params;
  const { pages, html, css } = req.body; // Support both old and new format
  
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

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// --- System Update Routes ---
app.get('/api/system/check-update', async (req, res) => {
  try {
    // Check if git is available and we are in a git repo
    try {
      await execAsync('git rev-parse --is-inside-work-tree');
    } catch (e) {
      // Not a git repository or git not installed
      return res.json({ 
        isUpdateAvailable: false, 
        message: 'System is up to date (Not a git repository).' 
      });
    }
    
    // Fetch latest
    try {
      await execAsync('git fetch origin');
    } catch (e) {
      // Might not have an origin or network issue
      return res.json({ 
        isUpdateAvailable: false, 
        message: 'System is up to date (Cannot fetch from origin).' 
      });
    }
    
    // Check local and remote hashes
    try {
      const { stdout: localHash } = await execAsync('git rev-parse @');
      const { stdout: remoteHash } = await execAsync('git rev-parse @{u}');
      
      const isUpdateAvailable = localHash.trim() !== remoteHash.trim();
      
      res.json({ 
        isUpdateAvailable, 
        message: isUpdateAvailable ? 'An update is available.' : 'System is up to date.' 
      });
    } catch (e) {
      // No upstream branch set
      return res.json({ 
        isUpdateAvailable: false, 
        message: 'System is up to date (No upstream branch).' 
      });
    }
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({ 
      isUpdateAvailable: false, 
      error: 'Cannot check for updates.' 
    });
  }
});

app.post('/api/system/update', async (req, res) => {
  try {
    console.log('Starting system update...');
    
    // Stash local changes just in case
    await execAsync('git stash');
    
    // Pull latest changes
    await execAsync('git pull origin main');
    
    // Install dependencies
    await execAsync('npm install');
    
    // Build the application
    await execAsync('npm run build');
    
    console.log('Update completed successfully.');
    res.json({ message: 'Update completed successfully. Please restart the server.' });
    
    // Optional: If running under PM2, we could restart automatically
    // execAsync('pm2 restart all').catch(console.error);
    
  } catch (error) {
    console.error('Update execution error:', error);
    res.status(500).json({ error: 'Failed to apply update. Check server logs.' });
  }
});

// --- Asset Routes ---
const getAssetType = (filename: string) => {
  const ext = path.extname(filename).toLowerCase();
  if (['.mp4', '.webm', '.ogg'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'audio';
  if (['.pdf', '.doc', '.docx'].includes(ext)) return 'document';
  if (['.ttf', '.woff', '.woff2', '.eot'].includes(ext)) return 'font';
  return 'image';
};

app.get('/api/assets', (req, res) => {
  const uploadDir = path.join(__dirname, 'dist', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    return res.json([]);
  }
  
  const files = fs.readdirSync(uploadDir);
  const assets = files.map(file => ({
    type: getAssetType(file),
    src: `/uploads/${file}`,
    name: file
  }));
  res.json(assets);
});

app.post('/api/assets/upload', upload.array('files'), (req, res) => {
  const files = req.files as Express.Multer.File[];
  const assets = files.map(file => ({
    type: getAssetType(file.filename),
    src: `/uploads/${file.filename}`,
    name: file.originalname
  }));
  res.json({ data: assets });
});

// Vite middleware for development
import { createServer as createViteServer } from 'vite';

if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
