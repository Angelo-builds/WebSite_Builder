import React, { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { FileCode, Save, Globe, FolderOpen, Plus, Layout, Settings, Code, ChevronLeft, ChevronRight, Trash2, Monitor, Smartphone, Tablet, Sun, Moon, Layers, Paintbrush, MousePointerClick, FileText, Upload, Image as ImageIcon, Palette, Sliders, Eye, Copy, Check, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import ProjectModal from './components/ProjectModal';
import Dashboard from './components/Dashboard';
import ConfirmModal from './components/ConfirmModal';
import Toast, { ToastType } from './components/Toast';
import SettingsModal from './components/SettingsModal';

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    description: 'Clean, whitespace-heavy, sans-serif.',
    preview: 'bg-white border-gray-200',
    styles: {
      'font-family': "'Inter', sans-serif",
      'background-color': '#ffffff',
      'color': '#111827',
      'line-height': '1.6',
    }
  },
  {
    id: 'tech',
    name: 'Cyber Tech',
    description: 'Dark mode, neon accents, monospace.',
    preview: 'bg-black border-green-500',
    styles: {
      'font-family': "'JetBrains Mono', monospace",
      'background-color': '#0a0a0a',
      'color': '#00ff41',
      'line-height': '1.5',
    }
  },
  {
    id: 'asiatic',
    name: 'Asiatic Zen',
    description: 'Serene, natural colors, serif fonts.',
    preview: 'bg-[#f0f4f0] border-[#8b4513]',
    styles: {
      'font-family': "'Noto Serif', serif",
      'background-color': '#f4f7f4',
      'color': '#2c3e50',
      'line-height': '1.8',
    }
  },
  {
    id: 'space',
    name: 'Deep Space',
    description: 'Dark blue gradients, futuristic.',
    preview: 'bg-[#0b0d17] border-blue-500',
    styles: {
      'font-family': "'Orbitron', sans-serif",
      'background-color': '#0b0d17',
      'color': '#e0e7ff',
      'line-height': '1.6',
    }
  }
];

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'styles' | 'traits' | 'layers' | 'templates'>('templates');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor' | 'code'>('dashboard');
  const [codeData, setCodeData] = useState({ html: '', css: '', js: '' });
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Settings State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'appearance' | 'settings'>('profile');
  const [themeColor, setThemeColor] = useState('blue');
  const [userProfile, setUserProfile] = useState({
    name: 'Admin',
    surname: 'User',
    email: 'admin@example.com',
    role: 'Administrator'
  });

  const handleLogin = (status: boolean, guest: boolean = false) => {
    setIsLoggedIn(status);
    setIsGuest(guest);
    if (guest) {
      setUserProfile({
        name: 'Guest',
        surname: '',
        email: '',
        role: 'Guest User'
      });
      // Reset theme to blue if not allowed
      if (!['blue', 'emerald'].includes(themeColor)) {
        setThemeColor('blue');
      }
    } else {
      setUserProfile({
        name: 'Admin',
        surname: 'User',
        email: 'admin@example.com',
        role: 'Administrator'
      });
    }
  };

  // Modal & Toast State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: ToastType;
  }>({
    isVisible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    // 1. Handle Dashboard Mode: Cleanup if needed
    if (viewMode === 'dashboard') {
      if (editorInstanceRef.current) {
        console.log('Switching to dashboard, destroying editor');
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
        setEditor(null);
      }
      return;
    }

    // 2. Handle Code Mode: Do nothing (keep editor alive)
    if (viewMode === 'code') {
      return;
    }

    // 3. Handle Editor Mode: Initialize if missing
    // If editor instance already exists, just refresh and return
    if (editorInstanceRef.current) {
      console.log('Editor already initialized, refreshing');
      editorInstanceRef.current.refresh();
      return;
    }
    
    // If ref is not ready, skip (should not happen in editor mode)
    if (!editorRef.current) {
      console.log('Editor ref not ready');
      return;
    }

    console.log('Initializing GrapesJS...');

    // Clear any existing blocks/panels to prevent duplicates
    const blocksContainer = document.getElementById('blocks');
    if (blocksContainer) blocksContainer.innerHTML = '';
    
    // Clear container just in case
    editorRef.current.innerHTML = '';

    const gjsEditor = grapesjs.init({
      container: editorRef.current,
      height: '100vh',
      width: 'auto',
      storageManager: false,
      panels: { defaults: [] }, // We use custom UI
      selectorManager: {
        appendTo: '#selector-container',
      },
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: 'Typography',
            open: true,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow'],
          },
          {
            name: 'Decorations',
            open: false,
            buildProps: ['background-color', 'border', 'border-radius', 'box-shadow', 'opacity'],
          },
          {
            name: 'Dimensions',
            open: false,
            buildProps: ['width', 'height', 'min-width', 'min-height', 'padding', 'margin'],
          },
          {
            name: 'Layout',
            open: false,
            buildProps: ['display', 'flex-direction', 'justify-content', 'align-items', 'position', 'top', 'left', 'right', 'bottom'],
          },
        ],
      },
      traitManager: {
        appendTo: '#traits-container',
      },
      layerManager: {
        appendTo: '#layers-container',
      },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '320px', widthMedia: '480px' },
        ],
      },
      assetManager: {
        upload: '/api/assets/upload',
        uploadName: 'files',
        autoAdd: true,
        embedAsBase64: false,
        assets: [], // Will be fetched
      },
      blockManager: {
        appendTo: '#blocks',
        blocks: [
          // --- LAYOUT ---
          {
            id: 'section',
            label: 'Section',
            category: 'Layout',
            content: `<section style="padding: 50px 20px; min-height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center;" data-gjs-droppable="true" data-gjs-name="Section" data-gjs-resizable="true">
              <h2 data-gjs-draggable="true">New Section</h2>
            </section>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>'
          },
          {
            id: 'container',
            label: 'Container',
            category: 'Layout',
            content: `<div style="max-width: 1200px; margin: 0 auto; padding: 20px; width: 100%; min-height: 50px;" data-gjs-droppable="true" data-gjs-name="Container" data-gjs-resizable="true"></div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'
          },
          {
            id: 'column2',
            label: '2 Columns',
            category: 'Layout',
            content: `<div style="display:flex; gap: 20px; padding: 10px; flex-wrap: wrap;" data-gjs-droppable="true" data-gjs-name="Row">
              <div style="flex:1; min-width: 250px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.05); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column" data-gjs-resizable="true"></div>
              <div style="flex:1; min-width: 250px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.05); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column" data-gjs-resizable="true"></div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>'
          },
          {
            id: 'column3',
            label: '3 Columns',
            category: 'Layout',
            content: `<div style="display:flex; gap: 20px; padding: 10px; flex-wrap: wrap;" data-gjs-droppable="true" data-gjs-name="Row">
              <div style="flex:1; min-width: 200px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.05); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column" data-gjs-resizable="true"></div>
              <div style="flex:1; min-width: 200px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.05); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column" data-gjs-resizable="true"></div>
              <div style="flex:1; min-width: 200px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.05); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column" data-gjs-resizable="true"></div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18"/><path d="M15 3v18"/></svg>'
          },
          {
            id: 'card',
            label: 'Card',
            category: 'Layout',
            content: `<div style="border: 1px solid rgba(0,0,0,0.1); border-radius: 16px; overflow: hidden; max-width: 100%; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);" data-gjs-droppable="true" data-gjs-name="Card" data-gjs-resizable="true">
              <div style="height: 200px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af;" data-gjs-droppable="true" data-gjs-name="Card Image">Image</div>
              <div style="padding: 24px;" data-gjs-droppable="true" data-gjs-name="Card Body">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.5rem; font-weight: 600;">Card Title</h3>
                <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.5;">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
                <a href="#" style="display: inline-block; padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 9999px; font-weight: 500; transition: all 0.2s;">Go somewhere</a>
              </div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="14" x2="21" y2="14"></line></svg>'
          },

          // --- TYPOGRAPHY ---
          {
            id: 'heading',
            label: 'Heading',
            category: 'Typography',
            content: '<h2>Insert Heading</h2>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M6 4v16"></path><path d="M18 4v16"></path><path d="M6 12h12"></path></svg>'
          },
          {
            id: 'text',
            label: 'Text',
            category: 'Typography',
            content: '<p style="line-height: 1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M17 6.1H3"></path><path d="M21 12.1H3"></path><path d="M15.1 18H3"></path></svg>'
          },
          {
            id: 'quote',
            label: 'Quote',
            category: 'Typography',
            content: `<blockquote class="quote-block" style="border-left: 4px solid #10b981; padding-left: 20px; margin: 20px 0; font-style: italic; color: #555;">
              "The only way to do great work is to love what you do."
            </blockquote>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>'
          },
          {
            id: 'list',
            label: 'List',
            category: 'Typography',
            content: `<ul>
              <li>List item one</li>
              <li>List item two</li>
              <li>List item three</li>
            </ul>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
          },
          {
            id: 'link',
            label: 'Link',
            category: 'Typography',
            content: '<a href="#" style="color: #10b981; text-decoration: underline;">Link Text</a>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'
          },

          // --- FORMS ---
          {
            id: 'form',
            label: 'Form',
            category: 'Forms',
            content: `<form style="padding: 20px; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px;">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email</label>
                <input type="email" placeholder="Enter your email" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"/>
              </div>
              <button type="submit" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
            </form>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>'
          },
          {
            id: 'input',
            label: 'Input',
            category: 'Forms',
            content: '<input type="text" placeholder="Input text" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%;" />',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>'
          },
          {
            id: 'textarea',
            label: 'Textarea',
            category: 'Forms',
            content: '<textarea placeholder="Type here..." style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; min-height: 80px;"></textarea>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
          },
          {
            id: 'button',
            label: 'Button',
            category: 'Forms',
            content: '<button style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Click Me</button>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><circle cx="12" cy="16" r="1"></circle></svg>'
          },
          {
            id: 'checkbox',
            label: 'Checkbox',
            category: 'Forms',
            content: '<div style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" id="check1" /><label for="check1">Checkbox</label></div>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
          },

          // --- MEDIA & FILES ---
          {
            id: 'image',
            label: 'Image',
            category: 'Media',
            select: true,
            content: { type: 'image' },
            activate: true,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
          },
          {
            id: 'video',
            label: 'Video',
            category: 'Media',
            content: {
              type: 'video',
              src: 'img/video2.webm',
              style: {
                height: '350px',
                width: '100%',
              }
            },
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>'
          },
          {
            id: 'map',
            label: 'Map',
            category: 'Media',
            content: {
              type: 'map',
              style: { height: '350px' }
            },
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>'
          },
          {
            id: 'file-link',
            label: 'File Link',
            category: 'Media',
            content: `<a href="#" class="file-link" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; text-decoration: none; color: #374151; font-weight: 500;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span>Download File</span>
            </a>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
          },

          // --- MODULES ---
          {
            id: 'hero',
            label: 'Hero',
            category: 'Modules',
            content: `<header style="background-color: #f3f4f6; padding: 100px 20px; text-align: center;">
              <h1 style="font-size: 3rem; margin-bottom: 20px; color: #111827;">Welcome to My Site</h1>
              <p style="font-size: 1.25rem; color: #4b5563; margin-bottom: 30px;">This is a hero section description.</p>
              <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Get Started</a>
            </header>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>'
          },
          {
            id: 'navbar',
            label: 'Navbar',
            category: 'Modules',
            content: `<nav style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <div style="font-weight: bold; font-size: 1.2rem;">Brand</div>
              <div style="display: flex; gap: 20px;">
                <a href="#" style="text-decoration: none; color: #333;">Home</a>
                <a href="#" style="text-decoration: none; color: #333;">About</a>
                <a href="#" style="text-decoration: none; color: #333;">Contact</a>
              </div>
            </nav>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>'
          },
        ],
      },
    });

    // Fetch assets on load
    fetch('/api/assets')
      .then(res => res.json())
      .then(assets => {
        const editor = editorInstanceRef.current;
        if (editor) {
          // Try both AssetManager (older) and Assets (newer)
          const assetManager = editor.AssetManager || editor.Assets;
          if (assetManager) {
            assetManager.add(assets);
          }
        }
      })
      .catch(err => console.error('Failed to load assets:', err));

    // Track selection
    gjsEditor.on('component:selected', () => {
      setSelectedComponent(gjsEditor.getSelected());
    });
    gjsEditor.on('component:deselected', () => {
      setSelectedComponent(null);
    });

    // Auto-save listener
    gjsEditor.on('update', () => {
      if (autoSaveEnabled && currentProject) {
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = setTimeout(() => {
          handleSave(true); // Silent save
        }, 2000); // 2 second debounce
      }
    });

    setEditor(gjsEditor);
    editorInstanceRef.current = gjsEditor;

    // No cleanup function here - we handle destruction explicitly when switching to dashboard
    return () => {};
  }, [viewMode]); // Re-run when viewMode changes

  // Effect to load project data when currentProject changes
  useEffect(() => {
    if (!editor || !currentProject) return;
    
    const loadCurrentProject = async () => {
      try {
        const res = await fetch(`/api/projects/${currentProject}`);
        if (res.ok) {
          const data = await res.json();
          if (!data || Object.keys(data).length === 0 || (data.pages && data.pages.length === 0)) {
             editor.setComponents('');
             editor.setStyle([]);
          } else {
             editor.loadProjectData(data);
          }
        }
      } catch (err) {
        console.error('Failed to load project', err);
      }
    };
    
    loadCurrentProject();
  }, [currentProject, editor]);

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    if (!editor) return;
    
    // Apply styles to body
    const wrapper = editor.getWrapper();
    if (wrapper) {
      wrapper.addStyle(template.styles);
    }
    
    // Optional: Add fonts to canvas head
    if (template.id === 'modern') {
      // Inter is already there usually, but good to ensure
    } else if (template.id === 'tech') {
      const head = editor.Canvas.getDocument().head;
      if (!head.querySelector('#font-tech')) {
        const link = document.createElement('link');
        link.id = 'font-tech';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap';
        head.appendChild(link);
      }
    } else if (template.id === 'asiatic') {
      const head = editor.Canvas.getDocument().head;
      if (!head.querySelector('#font-asiatic')) {
        const link = document.createElement('link');
        link.id = 'font-asiatic';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap';
        head.appendChild(link);
      }
    } else if (template.id === 'space') {
      const head = editor.Canvas.getDocument().head;
      if (!head.querySelector('#font-space')) {
        const link = document.createElement('link');
        link.id = 'font-space';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
        head.appendChild(link);
      }
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const handleSave = async (silent = false) => {
    if (!editor || !currentProject) return;
    
    if (!silent) setIsSaving(true);
    else setIsSaving(true); // Always show saving state, just maybe not toast

    const data = editor.getProjectData();
    try {
      await fetch(`/api/projects/${currentProject}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!silent) showToast('Project saved successfully!', 'success');
    } catch (err) {
      if (!silent) showToast('Failed to save project', 'error');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    console.log('handlePublish: Starting...');
    const editorInstance = editorInstanceRef.current || editor;
    if (!editorInstance) {
      console.error('handlePublish: Editor instance missing');
      showToast('Editor not initialized. Please try reloading.', 'error');
      return;
    }
    if (!currentProject) {
      console.error('handlePublish: No current project');
      showToast('No project selected.', 'warning');
      return;
    }

    console.log('handlePublish: Getting HTML/CSS...');
    const html = editorInstance.getHtml();
    const css = editorInstance.getCss();
    console.log(`handlePublish: HTML length: ${html.length}, CSS length: ${css.length}`);

    try {
      console.log('handlePublish: Sending fetch request...');
      const response = await fetch(`/api/projects/${currentProject}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, css }),
      });
      
      console.log('handlePublish: Fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const url = `${window.location.origin}/sites/${currentProject}/dist/index.html`;
      console.log('handlePublish: Success! URL:', url);
      
      setConfirmModal({
        isOpen: true,
        title: 'Project Published',
        message: `Your project has been published successfully!\n\nView live site at:\n${url}\n\nOpen in new tab?`,
        confirmText: 'Open Site',
        cancelText: 'Close',
        onConfirm: () => window.open(url, '_blank'),
      });
    } catch (err) {
      console.error('handlePublish: Error:', err);
      showToast(`Failed to publish project: ${err}`, 'error');
    }
  };

  const loadProject = async (id: string) => {
    // If editor is not initialized (e.g. in code mode), just set current project
    // The useEffect will handle loading when switching back to editor
    if (!editor) {
      setCurrentProject(id);
      setViewMode('editor');
      return;
    }
    
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        editor.loadProjectData(data);
        setCurrentProject(id);
        setViewMode('editor');
      } else {
        console.error('Project not found');
      }
    } catch (err) {
      console.error('Failed to load project', err);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('deleteProject: Attempting to delete', id);
    
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project',
      message: `Are you sure you want to delete project "${id}"? This action cannot be undone.`,
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete');
          
          setProjects(prev => prev.filter(p => p !== id));
          if (currentProject === id) {
            setCurrentProject(null);
            if (editor) {
              editor.setComponents('');
              editor.setStyle([]);
            }
          }
          console.log('deleteProject: Deleted successfully');
          showToast('Project deleted successfully', 'success');
        } catch (err) {
          console.error('Failed to delete project', err);
          showToast('Failed to delete project', 'error');
        }
      },
    });
  };

  const handleCreateProject = async (name: string) => {
    setCurrentProject(name);
    // If we are in dashboard, switch to editor first
    if (viewMode === 'dashboard') {
      setViewMode('editor');
      try {
        // Create a minimal valid project structure
        const emptyProject = {
          assets: [],
          styles: [],
          pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
        };
        
        await fetch(`/api/projects/${name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emptyProject),
        });
        setProjects([...projects, name]);
      } catch (err) {
        console.error('Failed to create project', err);
      }
      return;
    }

    if (editor) {
      editor.setComponents('');
      // Save immediately to persist
      try {
        const data = editor.getProjectData();
        await fetch(`/api/projects/${name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        setProjects([...projects, name]);
      } catch (err) {
        console.error('Failed to create project', err);
        alert('Failed to create project');
      }
    }
  };

  const setDevice = (device: string) => {
    if (editor) {
      editor.setDevice(device);
    }
  };

  const toggleViewMode = () => {
    if (viewMode === 'editor') {
      // Switch to code
      const currentEditor = editorInstanceRef.current || editor;
      if (currentEditor) {
        // Force a render/update before capturing
        currentEditor.refresh(); 
        
        const html = currentEditor.getHtml() || '';
        const css = currentEditor.getCss() || '';
        const js = currentEditor.getJs() || '';
        
        console.log('toggleViewMode: Capturing code data:', { htmlLength: html.length, cssLength: css.length });
        
        setCodeData({ html, css, js });
        setViewMode('code');
      } else {
        console.error('Cannot switch to code view: Editor instance not found');
        showToast('Editor not ready. Please wait or reload.', 'error');
      }
    } else {
      // Switch to editor
      setViewMode('editor');
      // Editor is kept alive, so we just switch visibility
      setTimeout(() => {
        const currentEditor = editorInstanceRef.current || editor;
        if (currentEditor) currentEditor.refresh();
      }, 100);
    }
  };

  const handleCopyCode = () => {
    const content = activeCodeTab === 'html' ? codeData.html : activeCodeTab === 'css' ? codeData.css : codeData.js;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleRightSidebar = (tab: 'styles' | 'traits' | 'layers' | 'templates') => {
    if (isRightSidebarOpen && activeRightTab === tab) {
      setIsRightSidebarOpen(false);
    } else {
      setActiveRightTab(tab);
      setIsRightSidebarOpen(true);
    }
  };

  // Theme-based classes
  const themeClasses = {
    bg: isDarkMode ? 'bg-[#0f0f11]' : 'bg-gray-50',
    sidebarBg: isDarkMode ? 'bg-[#18181b]/80 backdrop-blur-xl border-r border-white/5' : 'bg-white/80 backdrop-blur-xl border-r border-gray-200',
    sidebarBorder: isDarkMode ? 'border-white/5' : 'border-gray-200',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    textFaint: isDarkMode ? 'text-gray-600' : 'text-gray-400',
    hoverBg: isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    activeBg: isDarkMode ? `bg-${themeColor}-500/20 text-${themeColor}-400` : `bg-${themeColor}-50 text-${themeColor}-600`,
    headerBg: isDarkMode ? 'bg-[#18181b]/80 backdrop-blur-xl border-b border-white/5' : 'bg-white/80 backdrop-blur-xl border-b border-gray-200',
    blockBg: isDarkMode ? '#27272a' : '#ffffff',
    blockHoverBg: isDarkMode ? '#3f3f46' : '#f9fafb',
    blockText: isDarkMode ? 'rgba(255,255,255,0.9)' : '#1f2937',
    blockBorder: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    codeBg: isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white',
    codeText: isDarkMode ? 'text-gray-300' : 'text-gray-800',
    button: isDarkMode 
      ? 'bg-white/5 hover:bg-white/10 text-white border border-white/5' 
      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm',
    primaryButton: `bg-gradient-to-r from-${themeColor}-500 to-${themeColor === 'blue' ? 'indigo' : themeColor}-500 hover:from-${themeColor}-400 hover:to-${themeColor === 'blue' ? 'indigo' : themeColor}-400 text-white shadow-lg shadow-${themeColor}-500/20 border-0`,
  };

  if (viewMode === 'dashboard') {
    return (
      <>
        <ProjectModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onCreate={handleCreateProject} 
        />
        <Dashboard 
          projects={projects}
          onSelectProject={loadProject}
          onCreateProject={() => setIsModalOpen(true)}
          onDeleteProject={deleteProject}
          isDarkMode={isDarkMode}
          isLoggedIn={isLoggedIn}
          onLogin={handleLogin}
          userProfile={userProfile}
          themeColor={themeColor}
          onOpenSettings={(tab) => {
            setActiveSettingsTab(tab);
            setIsSettingsModalOpen(true);
          }}
        />
        
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          isDestructive={confirmModal.isDestructive}
          confirmText={confirmModal.confirmText}
        />
        
        <Toast
          isVisible={toast.isVisible}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          activeTab={activeSettingsTab}
          userProfile={userProfile}
          onUpdateProfile={setUserProfile}
          themeColor={themeColor}
          onUpdateThemeColor={setThemeColor}
          isDarkMode={isDarkMode}
          isGuest={isGuest}
        />
      </>
    );
  }

  return (
    <div className={`flex h-screen ${themeClasses.bg} ${themeClasses.text} overflow-hidden font-sans transition-colors duration-200`}>
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateProject} 
      />
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 0 }}
        className={`${themeClasses.sidebarBg} border-r ${themeClasses.sidebarBorder} flex flex-col fixed md:relative z-40 h-full shadow-xl overflow-hidden`}
      >
        <div className={`p-4 border-b ${themeClasses.sidebarBorder} flex items-center justify-between overflow-hidden whitespace-nowrap`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">SiteBuilder</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className={`p-1.5 ${themeClasses.hoverBg} rounded-md transition-colors ${themeClasses.textMuted} hover:${themeClasses.text}`}>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-6">
            {/* Projects Section - Only show when NO project is selected */}
            {!currentProject && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className={`text-xs uppercase tracking-widest ${themeClasses.textFaint} font-bold`}>Projects</h3>
                  <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-md transition-all hover:scale-105 active:scale-95"
                    title="Create New Project"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {projects.length === 0 && (
                    <div className={`text-center py-8 ${themeClasses.textFaint} text-sm italic`}>
                      No projects yet. Create one!
                    </div>
                  )}
                  {projects.map(p => (
                    <div
                      key={p}
                      onClick={() => loadProject(p)}
                      className={`group w-full px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer border border-transparent ${
                        currentProject === p 
                          ? `${themeClasses.activeBg} text-emerald-600 border-emerald-500/20 shadow-sm` 
                          : `${themeClasses.hoverBg} ${themeClasses.textMuted} hover:border-black/5`
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FolderOpen className={`w-4 h-4 flex-shrink-0 ${currentProject === p ? 'text-emerald-500' : themeClasses.textFaint}`} />
                        <span className="truncate font-medium">{p}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteProject(p, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 text-red-400/60 hover:text-red-500 rounded transition-all"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className={`h-px ${isDarkMode ? 'bg-white/5' : 'bg-gray-200'} w-full mt-6`}></div>
              </div>
            )}

            {/* Blocks Section */}
            <div>
              {/* Removed manual header to avoid duplication with GrapesJS categories */}
              <div id="blocks" className="grid grid-cols-1 gap-2"></div>
            </div>
          </div>
        </div>

        <div className={`p-4 border-t ${themeClasses.sidebarBorder} space-y-2`}>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Publish button clicked');
              handlePublish();
            }}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] ${!currentProject ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Globe className="w-4 h-4" /> Publish Site
          </button>
        </div>
      </motion.aside>

      {/* Toggle Sidebar Button (when closed) - MOVED TO HEADER */}
      
      {/* Main Editor Area */}
      <main className={`flex-1 relative flex flex-col ${themeClasses.bg}`}>
        <header className={`h-14 ${themeClasses.headerBg} border-b ${themeClasses.sidebarBorder} flex items-center justify-between px-6 shadow-sm z-50`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`p-1.5 ${themeClasses.hoverBg} rounded-md transition-colors ${themeClasses.textMuted} hover:${themeClasses.text}`}
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className={`p-1.5 ${themeClasses.hoverBg} rounded-md transition-colors ${themeClasses.textMuted} hover:${themeClasses.text}`}
                title="Open Sidebar"
              >
                <Layout className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-col">
              <span className={`text-xs font-bold ${themeClasses.textFaint} uppercase tracking-wider`}>Current Project</span>
              <span className={`text-sm font-medium ${themeClasses.text}`}>
                {currentProject || 'No project selected'}
              </span>
            </div>
          </div>

          {/* Device Controls */}
          <div className={`flex items-center ${themeClasses.bg} rounded-lg p-1 border ${themeClasses.sidebarBorder}`}>
            <button onClick={() => setDevice('Desktop')} className={`p-2 ${themeClasses.hoverBg} rounded ${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`} title="Desktop">
              <Monitor className="w-4 h-4" />
            </button>
            <button onClick={() => setDevice('Tablet')} className={`p-2 ${themeClasses.hoverBg} rounded ${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`} title="Tablet">
              <Tablet className="w-4 h-4" />
            </button>
            <button onClick={() => setDevice('Mobile')} className={`p-2 ${themeClasses.hoverBg} rounded ${themeClasses.textMuted} hover:${themeClasses.text} transition-colors`} title="Mobile">
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${themeClasses.sidebarBorder} ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <span className={`text-xs font-medium ${themeClasses.textMuted}`}>Auto-save</span>
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${autoSaveEnabled ? `bg-${themeColor}-500` : 'bg-gray-400'}`}
                title={autoSaveEnabled ? 'Disable Auto-save' : 'Enable Auto-save'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoSaveEnabled ? 'translate-x-4.5' : 'translate-x-1'}`}
                />
              </button>
              {isSaving && <span className={`text-xs text-${themeColor}-500 animate-pulse ml-1`}>Saving...</span>}
            </div>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              disabled={!currentProject || isSaving}
              className={`p-2 rounded-lg ${themeClasses.hoverBg} ${themeClasses.textMuted} hover:${themeClasses.text} transition-colors border border-transparent hover:${themeClasses.sidebarBorder}`}
              title="Save Manually"
            >
              <Save className="w-4 h-4" />
            </button>

            <div className={`w-px h-4 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} mx-1`}></div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 ${themeClasses.hoverBg} rounded-lg ${themeClasses.textMuted} hover:${themeClasses.text} transition-colors border border-transparent hover:${themeClasses.sidebarBorder}`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className={`w-px h-4 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} mx-1`}></div>
            
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleViewMode();
              }}
              className={`p-2 ${themeClasses.hoverBg} rounded-lg ${viewMode === 'code' ? `text-${themeColor}-500 bg-${themeColor}-500/10` : themeClasses.textMuted} hover:${themeClasses.text} transition-colors border border-transparent hover:${themeClasses.sidebarBorder}`}
              title="View Code"
            >
              {viewMode === 'code' ? <Eye className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            </button>
            
            <div className={`w-px h-4 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} mx-1`}></div>

            <button 
              onClick={() => toggleRightSidebar('styles')}
              className={`p-2 ${themeClasses.hoverBg} rounded-lg ${isRightSidebarOpen && (activeRightTab === 'styles' || activeRightTab === 'traits') ? `text-${themeColor}-500 bg-${themeColor}-500/10` : themeClasses.textMuted} hover:${themeClasses.text} transition-colors border border-transparent hover:${themeClasses.sidebarBorder}`}
              title="Styles & Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button 
              onClick={() => toggleRightSidebar('layers')}
              className={`p-2 ${themeClasses.hoverBg} rounded-lg ${isRightSidebarOpen && activeRightTab === 'layers' ? `text-${themeColor}-500 bg-${themeColor}-500/10` : themeClasses.textMuted} hover:${themeClasses.text} transition-colors border border-transparent hover:${themeClasses.sidebarBorder}`}
              title="Layers"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button 
              onClick={() => toggleRightSidebar('templates')}
              className={`p-2 ${themeClasses.hoverBg} rounded-lg ${isRightSidebarOpen && activeRightTab === 'templates' ? `text-${themeColor}-500 bg-${themeColor}-500/10` : themeClasses.textMuted} hover:${themeClasses.text} transition-colors border border-transparent hover:${themeClasses.sidebarBorder}`}
              title="Themes"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>
        </header>
        
        <div className={`flex-1 relative overflow-hidden ${isDarkMode ? 'bg-[#09090b]' : 'bg-gray-100'}`}>
          {/* Editor View - Always rendered but hidden when not active */}
          <div className="h-full relative" style={{ display: viewMode === 'editor' ? 'block' : 'none' }}>
            {!currentProject && (
              <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-[#09090b]/90' : 'bg-white/90'} backdrop-blur-sm z-10`}>
                <div className="text-center p-10 max-w-md border border-white/5 rounded-2xl bg-white/5 shadow-2xl backdrop-blur-xl">
                  <div className={`w-20 h-20 ${isDarkMode ? `bg-gradient-to-br from-${themeColor}-500/20 to-${themeColor}-900/20` : `bg-${themeColor}-50`} rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10`}>
                    <Layout className={`w-10 h-10 ${isDarkMode ? `text-${themeColor}-400` : `text-${themeColor}-600`}`} />
                  </div>
                  <h2 className={`text-2xl font-bold ${themeClasses.text} mb-3 tracking-tight`}>No Project Selected</h2>
                  <p className={`${themeClasses.textMuted} mb-8 leading-relaxed`}>Select a project from the sidebar or create a new one to start building your next big idea.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className={`px-8 py-3 bg-gradient-to-r from-${themeColor}-600 to-${themeColor}-500 hover:from-${themeColor}-500 hover:to-${themeColor}-400 text-white rounded-xl font-semibold transition-all shadow-lg shadow-${themeColor}-900/20 hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    Create New Project
                  </button>
                </div>
              </div>
            )}
            <div ref={editorRef} className="h-full"></div>
          </div>

          {/* Code View - Rendered only when active */}
          {viewMode === 'code' && (
            <div className={`h-full flex ${themeClasses.codeBg}`}>
              {/* Code Sidebar */}
              <div className={`w-64 flex-shrink-0 border-r ${themeClasses.sidebarBorder} flex flex-col`}>
                <div className={`p-4 border-b ${themeClasses.sidebarBorder}`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${themeClasses.textFaint}`}>Files</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <button
                    onClick={() => setActiveCodeTab('html')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeCodeTab === 'html' ? `bg-${themeColor}-500/10 text-${themeColor}-500 font-medium` : `${themeClasses.textMuted} hover:${themeClasses.hoverBg} hover:${themeClasses.text}`}`}
                  >
                    <FileCode className="w-4 h-4" />
                    <span>index.html</span>
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('css')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeCodeTab === 'css' ? `bg-${themeColor}-500/10 text-${themeColor}-500 font-medium` : `${themeClasses.textMuted} hover:${themeClasses.hoverBg} hover:${themeClasses.text}`}`}
                  >
                    <FileCode className="w-4 h-4" />
                    <span>style.css</span>
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('js')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${activeCodeTab === 'js' ? `bg-${themeColor}-500/10 text-${themeColor}-500 font-medium` : `${themeClasses.textMuted} hover:${themeClasses.hoverBg} hover:${themeClasses.text}`}`}
                  >
                    <FileCode className="w-4 h-4" />
                    <span>script.js</span>
                  </button>
                </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className={`h-12 border-b ${themeClasses.sidebarBorder} flex items-center justify-between px-6 bg-white/5`}>
                  <div className="flex items-center gap-3">
                     <span className={`text-sm font-medium ${themeClasses.text}`}>
                       {activeCodeTab === 'html' ? 'index.html' : activeCodeTab === 'css' ? 'style.css' : 'script.js'}
                     </span>
                     <span className={`text-xs ${themeClasses.textFaint} px-2 py-0.5 rounded-full border ${themeClasses.sidebarBorder}`}>
                       {codeData[activeCodeTab]?.length || 0} chars
                     </span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                
                <div className="flex-1 relative overflow-hidden group">
                  <textarea
                    readOnly
                    value={activeCodeTab === 'html' ? codeData.html : activeCodeTab === 'css' ? codeData.css : codeData.js}
                    className={`w-full h-full p-6 font-mono text-sm bg-transparent resize-none focus:outline-none ${themeClasses.codeText} leading-relaxed`}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT SIDEBAR: Styles, Traits, Layers */}
      <motion.aside 
        initial={false}
        animate={{ width: isRightSidebarOpen ? 320 : 0 }}
        className={`${themeClasses.sidebarBg} border-l ${themeClasses.sidebarBorder} flex flex-col fixed md:relative right-0 z-40 h-full shadow-2xl overflow-hidden backdrop-blur-xl`}
      >
        {/* Internal Tabs for Styles/Settings only */}
        {(activeRightTab === 'styles' || activeRightTab === 'traits') && (
          <div className={`flex items-center border-b ${themeClasses.sidebarBorder} bg-white/5`}>
            <button 
              onClick={() => setActiveRightTab('styles')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'styles' ? 'text-emerald-500 bg-emerald-500/5 border-b-2 border-emerald-500' : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
            >
              Styles
            </button>
            <button 
              onClick={() => setActiveRightTab('traits')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'traits' ? 'text-emerald-500 bg-emerald-500/5 border-b-2 border-emerald-500' : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
            >
              Settings
            </button>
          </div>
        )}
        
        {/* Header for Layers/Themes */}
        {activeRightTab === 'layers' && (
          <div className={`p-4 border-b ${themeClasses.sidebarBorder} font-bold text-sm uppercase tracking-wider ${themeClasses.text}`}>
            Layers
          </div>
        )}
        {activeRightTab === 'templates' && (
          <div className={`p-4 border-b ${themeClasses.sidebarBorder} font-bold text-sm uppercase tracking-wider ${themeClasses.text}`}>
            Themes
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {/* Empty State for Styles/Traits */}
          {(!selectedComponent && (activeRightTab === 'styles' || activeRightTab === 'traits')) && (
            <div className={`flex flex-col items-center justify-center h-full text-center ${themeClasses.textMuted} py-12`}>
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 ring-1 ring-white/10">
                <MousePointerClick className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No Element Selected</p>
              <p className="text-xs opacity-60 max-w-[200px] leading-relaxed">Select an element on the canvas to edit its properties.</p>
            </div>
          )}

          {/* Selector Manager (Classes) */}
          <div className={`${activeRightTab === 'styles' && selectedComponent ? 'block' : 'hidden'} mb-6`}>
             <div id="selector-container"></div>
          </div>

          {/* Style Manager */}
          <div id="styles-container" className={activeRightTab === 'styles' && selectedComponent ? 'block' : 'hidden'}></div>

          {/* Trait Manager */}
          <div id="traits-container" className={activeRightTab === 'traits' && selectedComponent ? 'block' : 'hidden'}></div>

          {/* Layer Manager */}
          <div id="layers-container" className={activeRightTab === 'layers' ? 'block' : 'hidden'}></div>

          {/* Templates Manager */}
          <div className={activeRightTab === 'templates' ? 'block' : 'hidden'}>
            <div className="space-y-4">
              <div className={`text-xs font-bold ${themeClasses.textFaint} uppercase tracking-wider mb-2 flex items-center gap-2`}>
                <Palette className="w-3 h-3" /> Select a Theme
              </div>
              <div className="grid grid-cols-1 gap-3">
                {TEMPLATES.map((template) => (
                  <div 
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className={`group cursor-pointer rounded-xl border ${themeClasses.sidebarBorder} overflow-hidden transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 bg-white/5`}
                  >
                    <div className={`h-20 w-full ${template.preview} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-2 left-3 text-white font-bold text-sm shadow-sm">{template.name}</div>
                    </div>
                    <div className={`p-3 ${isDarkMode ? 'bg-[#27272a]' : 'bg-white'}`}>
                      <p className={`text-xs ${themeClasses.textMuted} leading-relaxed`}>{template.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        activeTab={activeSettingsTab}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        themeColor={themeColor}
        onUpdateThemeColor={setThemeColor}
        isDarkMode={isDarkMode}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        confirmText={confirmModal.confirmText}
      />
      
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />

      <style>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
        }

        /* GrapesJS Overrides */
        /* Color Picker Fixes - Global */
        .gjs-one-bg, .gjs-color-picker, .sp-container {
          z-index: 99999 !important;
        }
        
        .sp-container {
          position: fixed !important;
        }

        .gjs-cv-canvas {
          top: 0;
          width: 100%;
          height: 100%;
          background-color: ${isDarkMode ? '#09090b' : '#f3f4f6'};
        }
        
        /* Block Manager Styling */
        .gjs-blocks-c {
          gap: 12px !important;
          padding: 0 16px 24px 16px !important;
        }
        
        /* Only apply grid when category is OPEN */
        .gjs-block-category.gjs-open .gjs-blocks-c {
          display: grid !important;
          grid-template-columns: repeat(2, 1fr) !important;
        }
        
        .gjs-block {
          width: 100% !important;
          min-height: 90px !important;
          padding: 16px !important;
          background-color: ${themeClasses.blockBg} !important;
          color: ${themeClasses.blockText} !important;
          border: 1px solid ${themeClasses.blockBorder} !important;
          border-radius: 16px !important;
          margin: 0 !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          cursor: grab !important;
        }
        
        .gjs-block:hover {
          background-color: ${themeClasses.blockHoverBg} !important;
          color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(59, 130, 246, 0.15) !important;
        }

        /* Fix Icon Colors & Shapes */
        .gjs-block svg {
          width: 28px !important;
          height: 28px !important;
          color: ${isDarkMode ? 'rgba(255,255,255,0.7)' : '#6b7280'} !important;
          transition: color 0.2s ease !important;
          fill: none !important;
          stroke-width: 1.5px !important;
        }
        
        /* Force all SVG children to have no fill to prevent "black squares" */
        .gjs-block svg * {
          fill: none !important;
          stroke: currentColor !important;
        }

        .gjs-block:hover svg {
          color: #3b82f6 !important;
        }

        .gjs-block-label {
          font-size: 10px !important;
          font-weight: 600 !important;
          letter-spacing: 0.02em !important;
          text-align: center !important;
          line-height: 1.2 !important;
        }

        /* Category Headers */
        .gjs-block-category .gjs-title {
          background-color: transparent !important;
          border: none !important;
          color: ${isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          font-weight: 800 !important;
          padding: 20px 4px 10px 4px !important;
        }
        
        .gjs-block-category {
          border: none !important;
          background-color: transparent !important;
        }

        /* Style Manager & Trait Manager Customization */
        .gjs-sm-sectors, .gjs-sm-sector, .gjs-sm-properties, .gjs-sm-property,
        .gjs-tr-sectors, .gjs-tr-sector, .gjs-tr-traits, .gjs-tr-trait {
          border: none !important;
          background: transparent !important;
        }
        
        .gjs-sm-sector-title, .gjs-tr-sector-title {
          background: transparent !important;
          border: none !important;
          color: ${isDarkMode ? '#e4e4e7' : '#18181b'} !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 16px 0 8px 0 !important;
          border-bottom: 1px solid ${themeClasses.sidebarBorder} !important;
          margin-bottom: 8px !important;
        }

        .gjs-sm-field, .gjs-tr-trait-input {
          background-color: ${isDarkMode ? '#27272a' : '#fff'} !important;
          border: 1px solid ${themeClasses.sidebarBorder} !important;
          border-radius: 12px !important;
          color: ${isDarkMode ? '#fff' : '#000'} !important;
          transition: all 0.2s ease !important;
        }
        
        .gjs-sm-field:focus-within, .gjs-tr-trait-input:focus-within {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
        }

        .gjs-sm-input-holder input, .gjs-sm-input-holder select,
        .gjs-tr-trait-input input, .gjs-tr-trait-input select {
          color: ${isDarkMode ? '#fff' : '#000'} !important;
          background-color: transparent !important;
          border: none !important;
          font-size: 12px !important;
        }

        .gjs-label {
          color: ${isDarkMode ? 'rgba(255,255,255,0.5)' : '#4b5563'} !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          margin-bottom: 4px !important;
        }
        
        /* Layer Manager */
        .gjs-layer-name {
          color: ${isDarkMode ? '#e4e4e7' : '#111827'} !important;
          font-size: 12px !important;
          font-weight: 500 !important;
        }
        
        .gjs-layer-vis {
          filter: ${isDarkMode ? 'invert(1)' : 'none'};
          opacity: 0.5 !important;
        }
        
        .gjs-layer-vis:hover {
          opacity: 1 !important;
        }
        
        /* Light Mode Specific Fixes */
        ${!isDarkMode ? `
          .gjs-sm-field, .gjs-tr-trait-input {
            background-color: #ffffff !important;
            border-color: #e5e7eb !important;
            color: #111827 !important;
          }
          .gjs-sm-input-holder input, .gjs-sm-input-holder select,
          .gjs-tr-trait-input input, .gjs-tr-trait-input select {
            color: #111827 !important;
          }
          .gjs-sm-sector-title, .gjs-tr-sector-title {
            color: #111827 !important;
            background-color: #f9fafb !important;
            border-bottom-color: #e5e7eb !important;
          }
          .gjs-block {
            background-color: #ffffff !important;
            border-color: #e5e7eb !important;
            color: #374151 !important;
          }
          .gjs-block:hover {
            background-color: #f9fafb !important;
            border-color: #10b981 !important;
            color: #10b981 !important;
          }
          .gjs-block-category .gjs-title {
            color: #111827 !important;
            font-weight: 700 !important;
            opacity: 1 !important;
            background-color: #f3f4f6 !important;
            border-bottom: 1px solid #e5e7eb !important;
            border-top: 1px solid #e5e7eb !important;
          }
          .gjs-block-category {
             background-color: transparent !important;
          }
          .gjs-field {
             background-color: #fff !important;
             color: #000 !important;
             border: 1px solid #e5e7eb !important;
          }
          .gjs-field-arrow {
             border-top-color: #374151 !important;
          }
          .gjs-d-s-arrow {
             border-top-color: #374151 !important;
          }
          .gjs-input-holder {
             color: #111827 !important;
          }
          /* Fix for Labels in Light Mode */
          .gjs-label, 
          .gjs-sm-label, 
          .gjs-sm-property__name,
          .gjs-sm-layer__name {
            color: #374151 !important;
            font-weight: 600 !important;
            opacity: 1 !important;
          }
          .gjs-sm-clear {
            display: none !important; /* Hide clear button if it overlaps or looks bad */
          }
          .gjs-sm-icon {
            color: #4b5563 !important;
          }
          

        ` : ''}
      `}</style>
    </div>
  );
}
