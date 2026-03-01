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

const connectDB = async () => {
  try {
    if (!process.env.DB_HOST) {
      console.warn('DB_HOST not set. Running in mock mode (no DB).');
      return;
    }
    db = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sitebuilder',
    });
    console.log('Connected to MySQL Database');
  } catch (err) {
    console.error('Database connection failed:', err);
    console.warn('Running in fallback mode.');
  }
};

connectDB();

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, surname } = req.body;
  
  if (!db) {
    // Mock response for preview environment
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

  if (!db) {
     // Mock response for preview environment
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

// --- Project Routes ---

// Get all projects
app.get('/api/projects', async (req, res) => {
  if (!db) {
    // Mock projects
    return res.json(['My First Site', 'Portfolio', 'Landing Page']);
  }
  try {
    const [rows] = await db.execute('SELECT name FROM projects');
    const projects = (rows as any[]).map(row => row.name);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Create project
app.post('/api/projects', async (req, res) => {
  const { name } = req.body;
  if (!db) {
    return res.status(201).json({ message: 'Project created (Mock)', name });
  }
  try {
    await db.execute('INSERT INTO projects (id, name) VALUES (?, ?)', [name.toLowerCase().replace(/\s+/g, '-'), name]);
    res.status(201).json({ message: 'Project created', name });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project' });
  }
});

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  if (!db) {
    return res.json({ message: 'Project deleted (Mock)', id });
  }
  try {
    await db.execute('DELETE FROM projects WHERE name = ?', [id]);
    res.json({ message: 'Project deleted', id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

// --- Asset Routes ---
app.get('/api/assets', (req, res) => {
  res.json([]);
});

app.post('/api/assets/upload', (req, res) => {
  res.json({ data: [] });
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
