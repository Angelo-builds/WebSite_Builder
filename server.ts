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
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        surname VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user'
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        data LONGTEXT
      )
    `);
    console.log('Database tables verified');
    db = connection;
    dbReady = true;
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
  const { email, password, name, surname } = req.body;
  
  if (!dbReady || !db) {
    return res.status(201).json({ message: 'User registered (Mock)', token: 'mock-token', user: { email, name, role: 'User' } });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, surname) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name || 'User', surname || '']
    );
    
    const token = jwt.sign({ id: (result as any).insertId, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.status(201).json({ token, user: { email, name, surname, role: 'User' } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!dbReady || !db) {
     if (email === 'admin@example.com' && password === 'admin') {
        return res.json({ token: 'mock-admin-token', user: { email, name: 'Admin', role: 'Administrator' } });
     }
     return res.json({ token: 'mock-user-token', user: { email, name: 'User', role: 'User' } });
  }

  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as any[];

    if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.json({ token, user: { email: user.email, name: user.name, surname: user.surname, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed' });
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

// Get all projects
app.get('/api/projects', async (req, res) => {
  if (!dbReady || !db) {
    return res.json([
      { name: 'My First Site', description: 'A simple landing page', category: 'Landing Page', updatedAt: new Date().toISOString() },
      { name: 'Portfolio', description: 'My personal portfolio', category: 'Portfolio', updatedAt: new Date().toISOString() },
      { name: 'E-commerce', description: 'Online store', category: 'E-commerce', updatedAt: new Date().toISOString() }
    ]);
  }
  
  try {
    const [rows] = await db.execute('SELECT name, data FROM projects');
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
    return res.json({
      assets: [],
      styles: [],
      pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
    });
  }
  
  try {
    const [rows] = await db.execute('SELECT data FROM projects WHERE name = ?', [id]);
    const projects = rows as any[];
    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(JSON.parse(projects[0].data || '{}'));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  const { name, description, category } = req.body;
  if (!dbReady || !db) {
    return res.status(201).json({ message: 'Project created (Mock)', name, description, category });
  }
  
  try {
    const initialData = JSON.stringify({
      metadata: { description: description || '', category: category || 'Other', updatedAt: new Date().toISOString() },
      assets: [],
      styles: [],
      pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
    });
    await db.execute('INSERT INTO projects (id, name, data) VALUES (?, ?, ?)', [name.toLowerCase().replace(/\s+/g, '-'), name, initialData]);
    res.status(201).json({ message: 'Project created', name });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// Update project
app.post('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!dbReady || !db) {
    return res.json({ message: 'Project saved (Mock)', id });
  }
  
  try {
    await db.execute('UPDATE projects SET data = ? WHERE name = ?', [JSON.stringify(data), id]);
    res.json({ message: 'Project saved', id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (!dbReady || !db) {
    return res.json({ message: 'Project deleted (Mock)', id });
  }
  
  try {
    await db.execute('DELETE FROM projects WHERE name = ?', [id]);
    res.json({ message: 'Project deleted', id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// Publish project
app.post('/api/projects/:id/publish', async (req, res) => {
  const { id } = req.params;
  const { html, css } = req.body;
  
  try {
    const projectDir = path.join(__dirname, 'dist', 'sites', id, 'dist');
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${id}</title>
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;
    
    fs.writeFileSync(path.join(projectDir, 'index.html'), fullHtml);
    res.json({ message: 'Project published successfully', url: `/sites/${id}/dist/index.html` });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ message: 'Failed to publish project' });
  }
});

// Serve published sites
app.use('/sites', express.static(path.join(__dirname, 'dist', 'sites')));

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
