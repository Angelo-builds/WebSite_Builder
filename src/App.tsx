import React, { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsNavbar from 'grapesjs-navbar';
import gjsForms from 'grapesjs-plugin-forms';
import gjsCountdown from 'grapesjs-component-countdown';
import gjsStyleBg from 'grapesjs-style-bg';
import { FileCode, Save, Globe, FolderOpen, Plus, Layout, Settings, Code, ChevronLeft, ChevronRight, Trash2, Monitor, Smartphone, Tablet, Sun, Moon, Layers, Paintbrush, MousePointerClick, FileText, Upload, Image as ImageIcon, Palette, Sliders, Eye, Copy, Check, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeClass } from './theme';
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
      storageManager: {
        type: 'remote',
        autosave: false, // We handle autosave manually
        autoload: false, // We handle loading manually
        stepsBeforeSave: 1,
        storeComponents: true,
        storeStyles: true,
        storeHtml: true,
        storeCss: true,
      } as any,
      panels: { defaults: [] }, // We use custom UI
      plugins: [
        gjsBlocksBasic,
        gjsNavbar,
        gjsForms,
        gjsCountdown,
        gjsStyleBg
      ],
      pluginsOpts: {
        [gjsBlocksBasic as any]: {
          flexGrid: true,
          stylePrefix: 'gjs-',
        },
        [gjsNavbar as any]: {
          defaultStyle: true, 
          labelNavbar: 'Navbar',
          labelBurger: 'Burger',
          labelMenuLink: 'Menu Link',
        },
        [gjsForms as any]: {},
        [gjsCountdown as any]: {},
        [gjsStyleBg as any]: {},
      },
      selectorManager: {
        appendTo: '#selector-container',
      },
      styleManager: {
        appendTo: '#styles-container',
        sectors: [
          {
            name: 'Layout',
            open: true,
            buildProps: ['display', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'gap'],
            properties: [
              { name: 'Display', property: 'display', type: 'select', defaults: 'block', list: [{ value: 'block', id: 'block' }, { value: 'inline-block', id: 'inline-block' }, { value: 'flex', id: 'flex' }, { value: 'grid', id: 'grid' }, { value: 'none', id: 'none' }] },
              { name: 'Direction', property: 'flex-direction', type: 'select', defaults: 'row', list: [{ value: 'row', id: 'row' }, { value: 'row-reverse', id: 'row-reverse' }, { value: 'column', id: 'column' }, { value: 'column-reverse', id: 'column-reverse' }] },
              { name: 'Wrap', property: 'flex-wrap', type: 'select', defaults: 'nowrap', list: [{ value: 'nowrap', id: 'nowrap' }, { value: 'wrap', id: 'wrap' }, { value: 'wrap-reverse', id: 'wrap-reverse' }] },
              { name: 'Justify', property: 'justify-content', type: 'select', defaults: 'flex-start', list: [{ value: 'flex-start', id: 'flex-start' }, { value: 'flex-end', id: 'flex-end' }, { value: 'center', id: 'center' }, { value: 'space-between', id: 'space-between' }, { value: 'space-around', id: 'space-around' }, { value: 'space-evenly', id: 'space-evenly' }] },
              { name: 'Align Items', property: 'align-items', type: 'select', defaults: 'stretch', list: [{ value: 'stretch', id: 'stretch' }, { value: 'flex-start', id: 'flex-start' }, { value: 'flex-end', id: 'flex-end' }, { value: 'center', id: 'center' }, { value: 'baseline', id: 'baseline' }] },
              { name: 'Gap', property: 'gap', type: 'integer', units: ['px', 'rem', '%'], defaults: '0', min: 0 },
            ]
          },
          {
            name: 'Dimensions',
            open: false,
            buildProps: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'],
            properties: [
              { name: 'Width', property: 'width', type: 'integer', units: ['px', '%', 'vw', 'rem', 'auto'], defaults: 'auto', min: 0 },
              { name: 'Height', property: 'height', type: 'integer', units: ['px', '%', 'vh', 'rem', 'auto'], defaults: 'auto', min: 0 },
              { name: 'Max Width', property: 'max-width', type: 'integer', units: ['px', '%', 'rem', 'none'], defaults: 'none', min: 0 },
              { name: 'Min Height', property: 'min-height', type: 'integer', units: ['px', '%', 'vh', 'rem'], defaults: '0', min: 0 },
              { name: 'Margin', property: 'margin', type: 'composite', properties: [{ name: 'Top', property: 'margin-top' }, { name: 'Right', property: 'margin-right' }, { name: 'Bottom', property: 'margin-bottom' }, { name: 'Left', property: 'margin-left' }] },
              { name: 'Padding', property: 'padding', type: 'composite', properties: [{ name: 'Top', property: 'padding-top' }, { name: 'Right', property: 'padding-right' }, { name: 'Bottom', property: 'padding-bottom' }, { name: 'Left', property: 'padding-left' }] },
            ]
          },
          {
            name: 'Typography',
            open: false,
            buildProps: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-transform'],
            properties: [
              { name: 'Font', property: 'font-family', type: 'font', defaults: 'Arial, Helvetica, sans-serif' },
              { name: 'Size', property: 'font-size', type: 'integer', units: ['px', 'rem', 'em'], defaults: '16px', min: 0 },
              { name: 'Weight', property: 'font-weight', type: 'select', defaults: '400', list: [{ value: '100', name: 'Thin', id: '100' }, { value: '300', name: 'Light', id: '300' }, { value: '400', name: 'Normal', id: '400' }, { value: '500', name: 'Medium', id: '500' }, { value: '700', name: 'Bold', id: '700' }, { value: '900', name: 'Black', id: '900' }] },
              { name: 'Color', property: 'color', type: 'color', defaults: 'black' },
              { name: 'Align', property: 'text-align', type: 'radio', defaults: 'left', list: [{ value: 'left', name: 'Left', id: 'left' }, { value: 'center', name: 'Center', id: 'center' }, { value: 'right', name: 'Right', id: 'right' }, { value: 'justify', name: 'Justify', id: 'justify' }] },
              { name: 'Decoration', property: 'text-decoration', type: 'radio', defaults: 'none', list: [{ value: 'none', name: 'None', id: 'none' }, { value: 'underline', name: 'Underline', id: 'underline' }, { value: 'line-through', name: 'Strike', id: 'line-through' }] },
              { name: 'Transform', property: 'text-transform', type: 'radio', defaults: 'none', list: [{ value: 'none', name: 'None', id: 'none' }, { value: 'uppercase', name: 'UPPER', id: 'uppercase' }, { value: 'lowercase', name: 'lower', id: 'lowercase' }, { value: 'capitalize', name: 'Cap', id: 'capitalize' }] },
            ]
          },
          {
            name: 'Decorations',
            open: false,
            buildProps: ['background-color', 'background-image', 'border-radius', 'border', 'box-shadow', 'opacity', 'cursor'],
            properties: [
              { name: 'Background', property: 'background-color', type: 'color' },
              { name: 'Image', property: 'background-image', type: 'file' },
              { name: 'Radius', property: 'border-radius', type: 'composite', properties: [{ name: 'Top-L', property: 'border-top-left-radius' }, { name: 'Top-R', property: 'border-top-right-radius' }, { name: 'Btm-L', property: 'border-bottom-left-radius' }, { name: 'Btm-R', property: 'border-bottom-right-radius' }] },
              { name: 'Border', property: 'border', type: 'composite', properties: [{ name: 'Width', property: 'border-width', type: 'integer', units: ['px', 'em'] }, { name: 'Style', property: 'border-style', type: 'select', list: [{ value: 'none', id: 'none' }, { value: 'solid', id: 'solid' }, { value: 'dashed', id: 'dashed' }, { value: 'dotted', id: 'dotted' }] }, { name: 'Color', property: 'border-color', type: 'color' }] },
              { name: 'Shadow', property: 'box-shadow', type: 'stack', preview: true },
              { name: 'Opacity', property: 'opacity', type: 'slider', min: 0, max: 1, step: 0.01, defaults: '1' },
              { name: 'Cursor', property: 'cursor', type: 'select', defaults: 'auto', list: [{ value: 'auto', id: 'auto' }, { value: 'pointer', id: 'pointer' }, { value: 'text', id: 'text' }, { value: 'move', id: 'move' }, { value: 'not-allowed', id: 'not-allowed' }] },
            ]
          },
        ],
      },
      traitManager: {
        appendTo: '#traits-container',
      },
      layerManager: {
        appendTo: '#layers-container',
      },
      assetManager: {
        upload: '/api/assets/upload',
        uploadName: 'files',
        multiUpload: true,
        autoAdd: true,
        embedAsBase64: false,
        assets: [], // Will be populated by fetch
      },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '320px', widthMedia: '480px' },
        ],
      },
      blockManager: {
        appendTo: '#blocks',
        blocks: [
          // --- 1. FUNDAMENTALS (Layout & Structure) ---
          {
            id: 'section',
            label: 'Section',
            category: '1. Fundamentals',
            content: `<section class="gjs-section" style="padding: 50px 20px; min-height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center;" data-gjs-droppable="true" data-gjs-name="Section">
              <h2 data-gjs-draggable="true">New Section</h2>
            </section>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>'
          },
          {
            id: 'container',
            label: 'Container',
            category: '1. Fundamentals',
            content: `<div class="gjs-container" style="max-width: 1200px; margin: 0 auto; padding: 20px; width: 100%; min-height: 50px;" data-gjs-droppable="true" data-gjs-name="Container"></div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'
          },
          {
            id: 'grid-2',
            label: 'Grid 1/2',
            category: '1. Fundamentals',
            content: `<div class="gjs-grid-row" style="display:flex; gap: 20px; padding: 10px; flex-wrap: wrap;" data-gjs-droppable="true" data-gjs-name="Row">
              <div class="gjs-grid-col" style="flex:1; min-width: 250px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.03); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column"></div>
              <div class="gjs-grid-col" style="flex:1; min-width: 250px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.03); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column"></div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>'
          },
          {
            id: 'grid-3',
            label: 'Grid 1/3',
            category: '1. Fundamentals',
            content: `<div class="gjs-grid-row" style="display:flex; gap: 20px; padding: 10px; flex-wrap: wrap;" data-gjs-droppable="true" data-gjs-name="Row">
              <div class="gjs-grid-col" style="flex:1; min-width: 200px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.03); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column"></div>
              <div class="gjs-grid-col" style="flex:1; min-width: 200px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.03); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column"></div>
              <div class="gjs-grid-col" style="flex:1; min-width: 200px; padding: 20px; min-height: 100px; background: rgba(0,0,0,0.03); border-radius: 4px;" data-gjs-droppable="true" data-gjs-name="Column"></div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 3v18"/><path d="M15 3v18"/></svg>'
          },
          {
            id: 'divider',
            label: 'Divider',
            category: '1. Fundamentals',
            content: '<hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><line x1="3" y1="12" x2="21" y2="12"></line></svg>'
          },
          {
            id: 'spacer',
            label: 'Spacer',
            category: '1. Fundamentals',
            content: '<div style="height: 50px; width: 100%;" data-gjs-name="Spacer"></div>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M8 3v18"/><path d="M16 3v18"/><path d="M3 8h18"/><path d="M3 16h18"/></svg>'
          },

          // --- 2. NAVIGATION ---
          {
            id: 'navbar-custom',
            label: 'Navbar Custom',
            category: '2. Navigation',
            content: `<nav class="navbar-container" style="display: flex; justify-content: space-between; align-items: center; padding: 20px; background-color: #ffffff; min-height: 60px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" data-gjs-name="Navbar">
              <div class="navbar-brand" style="font-size: 1.5rem; font-weight: bold; color: #333;" data-gjs-name="Brand">Brand</div>
              <div class="navbar-menu" style="display: flex; gap: 20px; align-items: center;" data-gjs-name="Menu">
                <a href="#" class="navbar-link" style="text-decoration: none; color: #555; font-weight: 500; padding: 8px 12px; border-radius: 4px; transition: color 0.2s;" data-gjs-name="Link">Home</a>
                <a href="#" class="navbar-link" style="text-decoration: none; color: #555; font-weight: 500; padding: 8px 12px; border-radius: 4px; transition: color 0.2s;" data-gjs-name="Link">About</a>
                <a href="#" class="navbar-link" style="text-decoration: none; color: #555; font-weight: 500; padding: 8px 12px; border-radius: 4px; transition: color 0.2s;" data-gjs-name="Link">Services</a>
                <a href="#" class="navbar-link" style="text-decoration: none; color: #555; font-weight: 500; padding: 8px 12px; border-radius: 4px; transition: color 0.2s;" data-gjs-name="Link">Contact</a>
              </div>
            </nav>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>'
          },
          {
            id: 'footer-multi',
            label: 'Footer Multi',
            category: '2. Navigation',
            content: `<footer style="background: #1f2937; color: #f3f4f6; padding: 40px 20px;" data-gjs-name="Footer">
              <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px;" data-gjs-name="Grid">
                <div data-gjs-name="Column">
                  <h4 style="color: #fff; margin-bottom: 15px;" data-gjs-name="Title">Company</h4>
                  <p style="font-size: 0.9rem; color: #9ca3af;" data-gjs-name="Text">Making the world better, one pixel at a time.</p>
                </div>
                <div data-gjs-name="Column">
                  <h4 style="color: #fff; margin-bottom: 15px;" data-gjs-name="Title">Links</h4>
                  <ul style="list-style: none; padding: 0; margin: 0;" data-gjs-name="List">
                    <li style="margin-bottom: 8px;"><a href="#" style="color: #d1d5db; text-decoration: none;" data-gjs-name="Link">Home</a></li>
                    <li style="margin-bottom: 8px;"><a href="#" style="color: #d1d5db; text-decoration: none;" data-gjs-name="Link">About</a></li>
                    <li style="margin-bottom: 8px;"><a href="#" style="color: #d1d5db; text-decoration: none;" data-gjs-name="Link">Contact</a></li>
                  </ul>
                </div>
                <div data-gjs-name="Column">
                  <h4 style="color: #fff; margin-bottom: 15px;" data-gjs-name="Title">Legal</h4>
                  <ul style="list-style: none; padding: 0; margin: 0;" data-gjs-name="List">
                    <li style="margin-bottom: 8px;"><a href="#" style="color: #d1d5db; text-decoration: none;" data-gjs-name="Link">Privacy</a></li>
                    <li style="margin-bottom: 8px;"><a href="#" style="color: #d1d5db; text-decoration: none;" data-gjs-name="Link">Terms</a></li>
                  </ul>
                </div>
              </div>
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #374151; font-size: 0.8rem; color: #9ca3af;" data-gjs-name="Copyright">
                © 2024 Brand Name. All rights reserved.
              </div>
            </footer>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="15" x2="21" y2="15"></line></svg>'
          },

          // --- 3. TYPOGRAPHY ---
          {
            id: 'heading',
            label: 'Heading',
            category: '3. Typography',
            content: '<h2>Insert Heading</h2>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M6 4v16"></path><path d="M18 4v16"></path><path d="M6 12h12"></path></svg>'
          },
          {
            id: 'text',
            label: 'Text',
            category: '3. Typography',
            content: '<p style="line-height: 1.6;">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M17 6.1H3"></path><path d="M21 12.1H3"></path><path d="M15.1 18H3"></path></svg>'
          },
          {
            id: 'quote',
            label: 'Quote',
            category: '3. Typography',
            content: `<blockquote class="quote-block" style="border-left: 4px solid #10b981; padding-left: 20px; margin: 20px 0; font-style: italic; color: #555;" data-gjs-name="Quote">
              "The only way to do great work is to love what you do."
            </blockquote>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path></svg>'
          },
          {
            id: 'list',
            label: 'List',
            category: '3. Typography',
            content: `<ul>
              <li>List item one</li>
              <li>List item two</li>
              <li>List item three</li>
            </ul>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>'
          },
          {
            id: 'icon-box',
            label: 'Icon Box',
            category: '3. Typography',
            content: `<div style="text-align: center; padding: 20px;" data-gjs-name="Icon Box">
              <div style="font-size: 2rem; margin-bottom: 10px;" data-gjs-name="Icon">★</div>
              <h3 style="margin-bottom: 10px;" data-gjs-name="Title">Feature Title</h3>
              <p style="color: #666;" data-gjs-name="Text">Short description of the feature goes here.</p>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>'
          },

          // --- 4. MEDIA & VISUAL ---
          {
            id: 'image',
            label: 'Image',
            category: '4. Media',
            select: true,
            content: { type: 'image' },
            activate: true,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
          },
          {
            id: 'video',
            label: 'Video',
            category: '4. Media',
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
            category: '4. Media',
            content: {
              type: 'map',
              style: { height: '350px' }
            },
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>'
          },
          {
            id: 'gallery',
            label: 'Gallery',
            category: '4. Media',
            content: `<div class="gjs-gallery" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; padding: 10px;">
              <img src="https://via.placeholder.com/150" style="width: 100%; height: auto; border-radius: 4px;" />
              <img src="https://via.placeholder.com/150" style="width: 100%; height: auto; border-radius: 4px;" />
              <img src="https://via.placeholder.com/150" style="width: 100%; height: auto; border-radius: 4px;" />
              <img src="https://via.placeholder.com/150" style="width: 100%; height: auto; border-radius: 4px;" />
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
          },
          {
            id: 'pdf-viewer',
            label: 'PDF Viewer',
            category: '4. Media',
            content: '<iframe src="" style="width: 100%; height: 500px; border: 1px solid #ccc;" title="PDF Viewer"></iframe>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
          },
          {
            id: 'file-link',
            label: 'File Link',
            category: '4. Media',
            content: `<a href="#" class="file-link" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; text-decoration: none; color: #374151; font-weight: 500;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              <span>Download File</span>
            </a>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>'
          },

          // --- 5. CTA & BUTTONS ---
          {
            id: 'button',
            label: 'Button',
            category: '5. CTA & Buttons',
            content: '<a href="#" class="btn-primary" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; transition: background-color 0.2s;">Click Me</a>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="8" width="18" height="8" rx="2" ry="2"></rect><line x1="12" y1="12" x2="12" y2="12"></line></svg>'
          },
          {
            id: 'button-outline',
            label: 'Button Outline',
            category: '5. CTA & Buttons',
            content: '<a href="#" class="btn-outline" style="display: inline-block; padding: 12px 24px; background-color: transparent; color: #3b82f6; border: 2px solid #3b82f6; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center; transition: all 0.2s;">Click Me</a>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="8" width="18" height="8" rx="2" ry="2"></rect></svg>'
          },
          {
            id: 'button-group',
            label: 'Dual Buttons',
            category: '5. CTA & Buttons',
            content: `<div style="display: flex; gap: 10px;">
              <button style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Primary</button>
              <button style="padding: 10px 20px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer;">Secondary</button>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect><rect x="3" y="11" width="18" height="10" rx="2" ry="2" transform="translate(5, -5)"></rect></svg>'
          },

          // --- 6. FORMS ---
          {
            id: 'form',
            label: 'Form',
            category: '6. Forms',
            content: `<form style="padding: 20px; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px;" data-gjs-name="Form">
              <div style="margin-bottom: 15px;" data-gjs-name="Group">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;" data-gjs-name="Label">Email</label>
                <input type="email" placeholder="Enter your email" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" data-gjs-name="Input"/>
              </div>
              <button type="submit" class="btn-primary" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;" data-gjs-name="Button">Submit</button>
            </form>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>'
          },
          {
            id: 'input',
            label: 'Input',
            category: '6. Forms',
            content: '<input type="text" placeholder="Input text" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%;" />',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="8" y1="12" x2="16" y2="12"></line></svg>'
          },
          {
            id: 'textarea',
            label: 'Textarea',
            category: '6. Forms',
            content: '<textarea placeholder="Type here..." style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 100%; min-height: 80px;"></textarea>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
          },
          {
            id: 'checkbox',
            label: 'Checkbox',
            category: '6. Forms',
            content: '<div style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" id="check1" /><label for="check1">Checkbox</label></div>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>'
          },

          // --- 7. MARKETING ---
          {
            id: 'pricing',
            label: 'Pricing Table',
            category: '7. Marketing',
            content: `<div style="display: flex; gap: 20px; flex-wrap: wrap;" data-gjs-name="Pricing Wrapper">
              <div style="flex: 1; min-width: 250px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px; text-align: center;" data-gjs-name="Pricing Card">
                <h3 style="margin-bottom: 10px;" data-gjs-name="Plan Name">Basic</h3>
                <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 20px;" data-gjs-name="Price">$19</div>
                <ul style="list-style: none; padding: 0; margin-bottom: 30px; color: #6b7280;" data-gjs-name="Features List">
                  <li style="margin-bottom: 10px;" data-gjs-name="Feature">Feature One</li>
                  <li style="margin-bottom: 10px;" data-gjs-name="Feature">Feature Two</li>
                </ul>
                <a href="#" class="btn-outline" style="display: block; width: 100%; padding: 12px; background: #f3f4f6; color: #374151; text-decoration: none; border-radius: 4px; font-weight: 600;" data-gjs-name="Button">Choose</a>
              </div>
              <div style="flex: 1; min-width: 250px; border: 2px solid #10b981; border-radius: 8px; padding: 30px; text-align: center; position: relative;" data-gjs-name="Pricing Card Pro">
                <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #10b981; color: white; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-weight: 600;" data-gjs-name="Badge">POPULAR</div>
                <h3 style="margin-bottom: 10px;" data-gjs-name="Plan Name">Pro</h3>
                <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 20px;" data-gjs-name="Price">$49</div>
                <ul style="list-style: none; padding: 0; margin-bottom: 30px; color: #6b7280;" data-gjs-name="Features List">
                  <li style="margin-bottom: 10px;" data-gjs-name="Feature">Feature One</li>
                  <li style="margin-bottom: 10px;" data-gjs-name="Feature">Feature Two</li>
                  <li style="margin-bottom: 10px;" data-gjs-name="Feature">Feature Three</li>
                </ul>
                <a href="#" class="btn-primary" style="display: block; width: 100%; padding: 12px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; font-weight: 600;" data-gjs-name="Button">Choose</a>
              </div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="12" y1="4" x2="12" y2="20"></line></svg>'
          },
          {
            id: 'testimonial',
            label: 'Testimonial',
            category: '7. Marketing',
            content: `<div style="text-align: center; padding: 40px; background: #f9fafb; border-radius: 8px;" data-gjs-name="Testimonial Card">
              <img src="https://via.placeholder.com/60" style="width: 60px; height: 60px; border-radius: 50%; margin-bottom: 15px;" data-gjs-name="Avatar" />
              <p style="font-size: 1.1rem; font-style: italic; color: #374151; margin-bottom: 20px;" data-gjs-name="Quote">"This product completely changed how we work. Highly recommended!"</p>
              <div style="font-weight: bold;" data-gjs-name="Author">Jane Doe</div>
              <div style="font-size: 0.9rem; color: #6b7280;" data-gjs-name="Role">CEO, TechCorp</div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>'
          },

          // --- 8. E-COMMERCE ---
          {
            id: 'product-card',
            label: 'Product Card',
            category: '8. E-commerce',
            content: `<div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; max-width: 300px;" data-gjs-name="Product Card">
              <div style="height: 200px; background: #f3f4f6; display: flex; align-items: center; justify-content: center;" data-gjs-name="Image Placeholder">Product Image</div>
              <div style="padding: 15px;" data-gjs-name="Content">
                <h4 style="margin: 0 0 5px;" data-gjs-name="Product Name">Product Name</h4>
                <div style="color: #10b981; font-weight: bold; margin-bottom: 10px;" data-gjs-name="Price">$99.00</div>
                <a href="#" class="btn-primary" style="display: block; width: 100%; padding: 8px; background: #1f2937; color: white; text-decoration: none; text-align: center; border-radius: 4px;" data-gjs-name="Button">Add to Cart</a>
              </div>
            </div>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>'
          },

          // --- 9. UTILITY ---
          {
            id: 'custom-code',
            label: 'Custom Code',
            category: '9. Utility',
            content: '<div data-gjs-type="text">Custom HTML/JS</div>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
          },
          {
            id: 'iframe',
            label: 'Iframe',
            category: '9. Utility',
            content: '<iframe src="https://example.com" style="width: 100%; height: 400px; border: none;"></iframe>',
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="2"></circle></svg>'
          }
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
    bg: 'bg-transparent', // Handled by body background
    sidebarBg: 'glass-panel',
    sidebarBorder: 'border-white/10',
    text: 'text-white',
    textMuted: 'text-white/60',
    textFaint: 'text-white/40',
    hoverBg: 'hover:bg-white/10',
    activeBg: getThemeClass(themeColor, 'activeBg'),
    headerBg: 'glass-panel',
    blockBg: 'bg-white/5',
    blockHoverBg: 'bg-white/10',
    blockText: 'text-white/90',
    blockBorder: 'border-white/10',
    codeBg: 'bg-black/50 backdrop-blur-md',
    codeText: 'text-gray-300',
    button: 'glass-button text-white',
    primaryButton: getThemeClass(themeColor, 'primaryButton'),
  };

  if (viewMode === 'dashboard') {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-black text-white font-sans selection:bg-blue-500/30">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 h-full overflow-y-auto custom-scrollbar">
          <ProjectModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onCreate={handleCreateProject}
            themeColor={themeColor}
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
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black text-white font-sans selection:bg-blue-500/30">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none" style={{ animationDelay: '2s' }}></div>
      
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateProject}
        themeColor={themeColor}
      />
      
      {/* Floating Layout Container */}
      <div className="absolute inset-0 p-4 flex gap-4 z-10">
        
        {/* Floating Sidebar */}
        <motion.aside 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1, width: isSidebarOpen ? 280 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`${themeClasses.sidebarBg} rounded-3xl flex flex-col h-full overflow-hidden relative z-50`}
        >
        <div className={`p-4 border-b ${themeClasses.sidebarBorder} flex items-center justify-between overflow-hidden whitespace-nowrap`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${getThemeClass(themeColor, 'bg')} rounded-lg flex items-center justify-center shadow-lg ${getThemeClass(themeColor, 'shadowLg')}`}>
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
                    className={`p-1.5 ${getThemeClass(themeColor, 'badgeBg')} hover:bg-opacity-20 ${getThemeClass(themeColor, 'text')} rounded-md transition-all hover:scale-105 active:scale-95`}
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
                          ? `${themeClasses.activeBg} ${getThemeClass(themeColor, 'text')} ${getThemeClass(themeColor, 'badgeBorder')} shadow-sm` 
                          : `${themeClasses.hoverBg} ${themeClasses.textMuted} hover:border-black/5`
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FolderOpen className={`w-4 h-4 flex-shrink-0 ${currentProject === p ? getThemeClass(themeColor, 'text') : themeClasses.textFaint}`} />
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

            {/* Assets Section - Always visible */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className={`text-xs uppercase tracking-widest ${themeClasses.textFaint} font-bold`}>Assets</h3>
                <button 
                  onClick={() => editor?.runCommand('open-assets')} 
                  className={`p-1.5 bg-${themeColor}-500/10 hover:bg-${themeColor}-500/20 text-${themeColor}-500 rounded-md transition-all hover:scale-105 active:scale-95`}
                  title="Manage Assets"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              <div className={`text-xs ${themeClasses.textFaint} px-1 italic`}>
                Upload images, PDFs, and other files here.
              </div>
            </div>

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
      <div className="flex-1 flex flex-col gap-4 h-full relative z-10 min-w-0">
      {/* Header - Floating Glass Bar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`h-16 mx-4 mt-4 rounded-2xl border ${themeClasses.border} ${themeClasses.sidebarBg} flex items-center justify-between px-6 shadow-lg z-50 relative`}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 ${getThemeClass(themeColor, 'gradientIcon')} rounded-lg flex items-center justify-center shadow-lg ${getThemeClass(themeColor, 'shadow')}`}>
               <Layout className="w-5 h-5 text-white" />
             </div>
             <div className="flex flex-col">
               <h1 className={`text-sm font-bold tracking-tight ${themeClasses.text}`}>Proxmox SiteBuilder</h1>
               <span className={`text-[10px] font-medium ${themeClasses.textMuted} uppercase tracking-wider`}>v2.4.0</span>
             </div>
          </div>

          <div className={`h-8 w-px ${themeClasses.sidebarBorder}`}></div>

          <div className="flex items-center gap-2">
             <span className={`text-xs font-bold ${themeClasses.textFaint} uppercase tracking-wider`}>Project:</span>
             <span className={`text-sm font-medium ${themeClasses.text} bg-white/5 px-3 py-1 rounded-lg border border-white/5`}>
               {currentProject || 'Untitled'}
             </span>
          </div>
        </div>

        {/* Center - Device Controls */}
        <div className={`hidden md:flex items-center bg-black/20 rounded-xl p-1 border ${themeClasses.sidebarBorder} shadow-inner`}>
          <button 
            onClick={() => setDevice('Desktop')} 
            className={`p-2 rounded-lg transition-all duration-200 ${device === 'Desktop' ? `bg-white/10 text-white shadow-sm` : `text-white/40 hover:text-white hover:bg-white/5`}`} 
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('Tablet')} 
            className={`p-2 rounded-lg transition-all duration-200 ${device === 'Tablet' ? `bg-white/10 text-white shadow-sm` : `text-white/40 hover:text-white hover:bg-white/5`}`} 
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setDevice('Mobile')} 
            className={`p-2 rounded-lg transition-all duration-200 ${device === 'Mobile' ? `bg-white/10 text-white shadow-sm` : `text-white/40 hover:text-white hover:bg-white/5`}`} 
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
           {/* Publish Button - Prominent */}
           <button
             onClick={handlePublish}
             disabled={!currentProject || isPublishing}
             className={`hidden sm:flex items-center gap-2 px-4 py-2 ${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg ${getThemeClass(themeColor, 'shadow')} transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
           >
             {isPublishing ? (
               <>
                 <RefreshCw className="w-3 h-3 animate-spin" /> Publishing...
               </>
             ) : (
               <>
                 <Globe className="w-3 h-3" /> Publish
               </>
             )}
           </button>

           <div className={`w-px h-6 ${themeClasses.sidebarBorder} mx-1 hidden sm:block`}></div>

           <div className="flex items-center gap-1 bg-black/20 rounded-xl p-1 border border-white/5">
              <button 
                onClick={(e) => { e.preventDefault(); handleSave(); }}
                disabled={!currentProject || isSaving}
                className={`p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors`}
                title="Save"
              >
                <Save className="w-4 h-4" />
              </button>
              <button 
                onClick={() => toggleViewMode()}
                className={`p-2 rounded-lg hover:bg-white/10 ${viewMode === 'code' ? 'text-blue-400 bg-blue-500/10' : 'text-white/60 hover:text-white'} transition-colors`}
                title="Code"
              >
                <Code className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors`}
                title="Theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
           </div>
           
           <button 
             onClick={() => toggleRightSidebar('styles')}
             className={`ml-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all hover:scale-105 active:scale-95 ${isRightSidebarOpen ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
           >
             <Sliders className="w-5 h-5" />
           </button>
        </div>
      </motion.header>
        
        <main className="flex-1 rounded-3xl bg-[#000000]/20 backdrop-blur-sm border border-white/5 shadow-inner overflow-hidden relative group mx-1">
          {/* Editor View - Always rendered but hidden when not active */}
          <div className="h-full w-full rounded-2xl overflow-hidden relative" style={{ display: viewMode === 'editor' ? 'block' : 'none' }}>
            {!currentProject && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-10">
                <div className="text-center p-10 max-w-md border border-white/10 rounded-3xl glass-panel shadow-2xl">
                  <div className={`w-20 h-20 ${getThemeClass(themeColor, 'gradientIcon')} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${getThemeClass(themeColor, 'shadow')}`}>
                    <Layout className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">No Project Selected</h2>
                  <p className="text-white/60 mb-8 leading-relaxed">Select a project from the sidebar or create a new one to start building your next big idea.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className={`px-8 py-3 ${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white rounded-xl font-semibold transition-all shadow-lg ${getThemeClass(themeColor, 'shadowLg')} hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    Create New Project
                  </button>
                </div>
              </div>
            )}
            {/* Canvas Container with Device Frame Effect */}
            <div className={`h-full transition-all duration-300 ${device === 'Mobile' ? 'max-w-[375px] mx-auto my-4 rounded-[3rem] border-8 border-[#1a1a1a] shadow-2xl overflow-hidden bg-white' : device === 'Tablet' ? 'max-w-[768px] mx-auto my-4 rounded-[2rem] border-8 border-[#1a1a1a] shadow-2xl overflow-hidden bg-white' : 'w-full h-full bg-[#1e1e1e]'}`}>
               <div ref={editorRef} className="h-full w-full bg-[#1e1e1e]"></div>
            </div>
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
        </main>
      </div>

      {/* Floating Right Panel - Always mounted for GrapesJS, hidden via transform */}
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ 
          x: isRightSidebarOpen ? 0 : '100%', 
          opacity: isRightSidebarOpen ? 1 : 0,
          pointerEvents: isRightSidebarOpen ? 'auto' : 'none'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`${themeClasses.sidebarBg} rounded-3xl flex flex-col h-full overflow-hidden relative z-50 w-80 shrink-0 border-l border-white/5`}
        style={{ position: 'absolute', right: '1rem', top: '1rem', bottom: '1rem', height: 'auto' }}
      >
        {/* Internal Tabs for Styles/Settings only */}
        {(activeRightTab === 'styles' || activeRightTab === 'traits') && (
          <div className={`flex items-center border-b ${themeClasses.sidebarBorder} bg-white/5 shrink-0`}>
            <button 
              onClick={() => setActiveRightTab('styles')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'styles' ? `text-${themeColor}-500 bg-${themeColor}-500/5 border-b-2 border-${themeColor}-500` : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
            >
              Styles
            </button>
            <button 
              onClick={() => setActiveRightTab('traits')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'traits' ? `text-${themeColor}-500 bg-${themeColor}-500/5 border-b-2 border-${themeColor}-500` : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
            >
              Settings
            </button>
          </div>
        )}
        
        {/* Header for Layers/Themes */}
        {activeRightTab === 'layers' && (
          <div className={`p-4 border-b ${themeClasses.sidebarBorder} font-bold text-sm uppercase tracking-wider ${themeClasses.text} shrink-0`}>
            Layers
          </div>
        )}
        {activeRightTab === 'templates' && (
          <div className={`p-4 border-b ${themeClasses.sidebarBorder} font-bold text-sm uppercase tracking-wider ${themeClasses.text} shrink-0`}>
            Themes
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative">
          {/* Empty State for Styles/Traits */}
          {(!selectedComponent && (activeRightTab === 'styles' || activeRightTab === 'traits')) && (
            <div className={`flex flex-col items-center justify-center h-full text-center ${themeClasses.textMuted} py-12 absolute inset-0 pointer-events-none`}>
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 ring-1 ring-white/10">
                <MousePointerClick className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-semibold mb-1">No Element Selected</p>
              <p className="text-xs opacity-60 max-w-[200px] leading-relaxed">Select an element on the canvas to edit its properties.</p>
            </div>
          )}

          {/* Selector Manager (Classes) */}
          <div className={`${activeRightTab === 'styles' && selectedComponent ? 'block' : 'absolute opacity-0 pointer-events-none'} mb-6`}>
             <div id="selector-container"></div>
          </div>

          {/* Style Manager */}
          <div id="styles-container" className={activeRightTab === 'styles' && selectedComponent ? 'block' : 'absolute opacity-0 pointer-events-none'}></div>

          {/* Trait Manager */}
          <div id="traits-container" className={activeRightTab === 'traits' && selectedComponent ? 'block' : 'absolute opacity-0 pointer-events-none'}></div>

          {/* Layer Manager */}
          <div id="layers-container" className={activeRightTab === 'layers' ? 'block' : 'absolute opacity-0 pointer-events-none'}></div>

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
                    className={`group cursor-pointer rounded-xl border ${themeClasses.sidebarBorder} overflow-hidden transition-all duration-300 hover:border-${themeColor}-500/50 hover:shadow-lg hover:shadow-${themeColor}-500/10 hover:-translate-y-1 bg-white/5`}
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
      
      </div> {/* Close Floating Layout Container */}

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
        
        /* Selector Manager */
        .gjs-clm-tags {
          font-size: 12px;
          color: ${isDarkMode ? '#e4e4e7' : '#111827'} !important;
        }
        .gjs-clm-tag {
          color: #fff !important;
          background-color: #3b82f6 !important;
          border: none !important;
          border-radius: 4px !important;
          padding: 2px 6px !important;
        }
        .gjs-clm-sel {
          margin-bottom: 8px !important;
        }
        .gjs-clm-label {
          color: ${isDarkMode ? '#a1a1aa' : '#4b5563'} !important;
          font-size: 11px !important;
          margin-bottom: 4px !important;
        }
        .gjs-clm-new {
           color: ${isDarkMode ? '#fff' : '#000'} !important;
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
