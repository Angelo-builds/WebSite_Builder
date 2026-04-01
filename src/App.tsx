import React, { useEffect, useRef, useState } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsNavbar from 'grapesjs-navbar';
import gjsForms from 'grapesjs-plugin-forms';
import gjsCountdown from 'grapesjs-component-countdown';
import gjsStyleBg from 'grapesjs-style-bg';
import addSmartComponents from './grapesjs-smart-components';
import { FileCode, Save, Globe, FolderOpen, Plus, Layout, Settings, Code, ChevronLeft, ChevronRight, Trash2, Monitor, Smartphone, Tablet, Sun, Moon, Layers, Paintbrush, MousePointerClick, FileText, Upload, Image as ImageIcon, Palette, Sliders, Eye, Copy, Check, ArrowLeft, Undo2, Redo2, RefreshCw, X, Link as LinkIcon, MoreVertical, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeClass } from './theme';
import { account, databases, storage, appwriteConfig, Query, ID, getOwnerPermissions } from './lib/appwrite';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import * as prettier from 'prettier/standalone';
import prettierPluginHtml from 'prettier/plugins/html';
import prettierPluginCss from 'prettier/plugins/postcss';
import prettierPluginBabel from 'prettier/plugins/babel';
import prettierPluginEstree from 'prettier/plugins/estree';
import ProjectModal from './components/ProjectModal';
import CustomAssetManager from './components/CustomAssetManager';
import Dashboard, { Project } from './components/Dashboard';
import ConfirmModal from './components/ConfirmModal';
import Toast, { ToastType } from './components/Toast';
import SettingsModal from './components/SettingsModal';
import { UpgradeModal } from './components/UpgradeModal';

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

import SetupWizard from './components/SetupWizard';

export default function App() {
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [device, setDevice] = useState('Desktop');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'styles' | 'traits' | 'layers' | 'templates'>('templates');
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [assetManagerProps, setAssetManagerProps] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor' | 'code'>('dashboard');
  const [codeData, setCodeData] = useState({ html: '', css: '', js: '' });
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [pages, setPages] = useState<{ id: string, name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState<string>('');
  const [linkHref, setLinkHref] = useState('');
  const [linkTarget, setLinkTarget] = useState('_self');
  const [formAction, setFormAction] = useState('');
  const [formMethod, setFormMethod] = useState('POST');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  // Settings State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'profile' | 'appearance' | 'settings' | 'security' | 'plan'>('profile');
  const [themeColor, setThemeColor] = useState('blue');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    name: string;
    surname: string;
    email: string;
    username?: string;
    role: string;
    avatar?: string;
    plan?: 'Free' | 'Basic' | 'Pro' | 'Team';
  }>({
    name: 'Admin',
    surname: 'User',
    email: 'admin@example.com',
    username: 'admin',
    role: 'Administrator',
    plan: 'Pro'
  });

  const [uiPreferences, setUiPreferences] = useState({
    sidebarLayout: 'left',
    uiDensity: 'normal',
    fontFamily: 'Inter',
    customLogo: '',
    customCss: ''
  });

  const handleLogin = (status: boolean, guest: boolean = false, user?: any) => {
    setIsLoggedIn(status);
    setIsGuest(guest);
    
    if (!status) {
      setUserProfile({
        name: '',
        surname: '',
        email: '',
        username: '',
        role: '',
        plan: ''
      });
      return;
    }

    if (guest) {
      setUserProfile({
        name: 'Guest',
        surname: '',
        email: '',
        username: 'guest',
        role: 'Guest User',
        plan: 'Guest'
      });
      // Reset theme to blue if not allowed
      if (!['blue', 'emerald'].includes(themeColor)) {
        setThemeColor('blue');
      }
    } else if (user) {
      setUserProfile({
        name: user.name || 'Admin',
        surname: user.surname || 'User',
        email: user.email || 'admin@example.com',
        username: user.username || 'admin',
        role: user.role || 'Administrator',
        plan: user.plan || 'Pro'
      });
    } else {
      setUserProfile({
        name: 'Admin',
        surname: 'User',
        email: 'admin@example.com',
        username: 'admin',
        role: 'Administrator',
        plan: 'Pro'
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
    confirmText?: string;
    cancelText?: string;
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
    if (isLoggedIn && !isGuest) {
      fetchProjects();
    }
  }, [isLoggedIn, isGuest]);

  useEffect(() => {
    // Check for license key
    const licenseKey = localStorage.getItem('builder_license_key');
    if (licenseKey) {
      setIsActivated(true);
    }

    // Check Appwrite session
    const checkSession = async () => {
      try {
        // Tentativo di recupero sessione
        const user = await account.get();
        
        if (user) {
          handleLogin(true, false, {
            name: user.name?.split(' ')[0] || 'User',
            surname: user.name?.split(' ').slice(1).join(' ') || '',
            email: user.email,
            username: user.prefs?.username || user.name?.toLowerCase().replace(/\s+/g, ''),
            role: user.prefs?.role || 'User',
            plan: user.prefs?.plan || 'Free'
          });
        }
      } catch (e: any) {
        // Gestione silenziosa del 401 (Utente non loggato)
        if (e.code === 401) {
          console.log('User not logged in - showing dashboard/login');
          setIsLoggedIn(false);
        } else if (e.message === 'Failed to fetch') {
          showToast('Cannot connect to Appwrite server. Check your endpoint.', 'error');
        } else {
          console.error('Appwrite checkSession error:', e.message);
        }
      }
    };
    checkSession();

    // Auto-check for updates on mount (once a day)
    const checkUpdate = async () => {
      try {
        const lastCheck = localStorage.getItem('lastUpdateCheck');
        const now = new Date().getTime();
        
        // 86400000 ms = 24 hours
        if (lastCheck && (now - parseInt(lastCheck, 10)) < 86400000) {
          return; // Skip check if done within last 24 hours
        }
        
        const res = await fetch('/api/system/check-update');
        const data = await res.json();
        
        localStorage.setItem('lastUpdateCheck', now.toString());
        
        if (data.isUpdateAvailable) {
          setUpdateAvailable(true);
        }
      } catch (e) {
        console.error('Auto-update check failed', e);
      }
    };
    // Check after a short delay so it doesn't block initial load
    setTimeout(checkUpdate, 5000);
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
      canvas: {
        styles: ['https://cdn.tailwindcss.com'],
        scripts: ['https://cdn.tailwindcss.com']
      },
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
        gjsStyleBg,
        addSmartComponents
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
        [addSmartComponents as any]: {},
      },
      // selectorManager: {
      //   appendTo: '#selector-container',
      // },
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
        custom: {
          open(props: any) {
            setAssetManagerProps(props);
            setIsAssetManagerOpen(true);
          },
          close(props: any) {
            setIsAssetManagerOpen(false);
          }
        }
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
            content: `
              <style>
                .gjs-section {
                  padding: 50px 20px;
                  min-height: 100px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                }
              </style>
              <section class="gjs-section" data-gjs-droppable="true" data-gjs-name="Section">
                <h2 data-gjs-draggable="true">New Section</h2>
              </section>
            `,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>'
          },
          {
            id: 'container',
            label: 'Container',
            category: '1. Fundamentals',
            content: `
              <style>
                .gjs-container {
                  max-width: 1200px;
                  margin: 0 auto;
                  padding: 20px;
                  width: 100%;
                  min-height: 50px;
                }
              </style>
              <div class="gjs-container" data-gjs-droppable="true" data-gjs-name="Container"></div>
            `,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'
          },
          {
            id: 'container-full',
            label: 'Full Width Box',
            category: '1. Fundamentals',
            content: `
              <style>
                .gjs-container-full {
                  width: 100%;
                  height: 100%;
                  min-height: 50px;
                  padding: 20px;
                }
              </style>
              <div class="gjs-container-full" data-gjs-droppable="true" data-gjs-name="Full Box"></div>
            `,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect><path d="M12 2v20"></path><path d="M2 12h20"></path></svg>'
          },
          {
            id: 'grid-2',
            label: 'Grid 1/2',
            category: '1. Fundamentals',
            content: `
              <style>
                .gjs-grid-row {
                  display: flex;
                  gap: 20px;
                  padding: 10px;
                  flex-wrap: wrap;
                }
                .gjs-grid-col {
                  flex: 1;
                  min-width: 250px;
                  padding: 20px;
                  min-height: 100px;
                  background: rgba(0,0,0,0.03);
                  border-radius: 4px;
                }
              </style>
              <div class="gjs-grid-row" data-gjs-droppable="true" data-gjs-name="Row">
                <div class="gjs-grid-col" data-gjs-droppable="true" data-gjs-name="Column"></div>
                <div class="gjs-grid-col" data-gjs-droppable="true" data-gjs-name="Column"></div>
              </div>
            `,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line></svg>'
          },
          {
            id: 'grid-3',
            label: 'Grid 1/3',
            category: '1. Fundamentals',
            content: `
              <style>
                .gjs-grid-row {
                  display: flex;
                  gap: 20px;
                  padding: 10px;
                  flex-wrap: wrap;
                }
                .gjs-grid-col {
                  flex: 1;
                  min-width: 200px;
                  padding: 20px;
                  min-height: 100px;
                  background: rgba(0,0,0,0.03);
                  border-radius: 4px;
                }
              </style>
              <div class="gjs-grid-row" data-gjs-droppable="true" data-gjs-name="Row">
                <div class="gjs-grid-col" data-gjs-droppable="true" data-gjs-name="Column"></div>
                <div class="gjs-grid-col" data-gjs-droppable="true" data-gjs-name="Column"></div>
                <div class="gjs-grid-col" data-gjs-droppable="true" data-gjs-name="Column"></div>
              </div>
            `,
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
            id: 'navbar-pill',
            label: 'Pill Navbar',
            category: '2. Navigation',
            content: `
              <style>
                .navbar-pill {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 10px 30px;
                  background-color: #ffffff;
                  min-height: 60px;
                  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                  border-radius: 50px;
                  margin: 20px;
                }
                .navbar-brand {
                  font-size: 1.2rem;
                  font-weight: bold;
                  color: #333;
                }
                .navbar-menu {
                  display: flex;
                  gap: 15px;
                  align-items: center;
                }
                .navbar-link {
                  text-decoration: none;
                  color: #555;
                  font-weight: 500;
                  padding: 8px 16px;
                  border-radius: 20px;
                  transition: all 0.2s;
                }
                .navbar-link:hover {
                  background-color: rgba(0,0,0,0.05);
                  color: #000;
                }
              </style>
              <nav class="navbar-pill" data-gjs-name="Pill Navbar">
                <div class="navbar-brand" data-gjs-name="Brand">Brand</div>
                <div class="navbar-menu" data-gjs-name="Menu">
                  <a href="#" class="navbar-link" data-gjs-name="Link">Home</a>
                  <a href="#" class="navbar-link" data-gjs-name="Link">About</a>
                  <a href="#" class="navbar-link" data-gjs-name="Link">Contact</a>
                </div>
              </nav>
            `,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="2" y="6" width="20" height="12" rx="6" ry="6"></rect><circle cx="6" cy="12" r="2"></circle><line x1="10" y1="12" x2="20" y2="12"></line></svg>'
          },
          {
            id: 'navbar-custom',
            label: 'Standard Navbar',
            category: '2. Navigation',
            content: `
              <style>
                .navbar-container {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 20px;
                  background-color: #ffffff;
                  min-height: 60px;
                  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                }
                .navbar-brand {
                  font-size: 1.5rem;
                  font-weight: bold;
                  color: #333;
                }
                .navbar-menu {
                  display: flex;
                  gap: 20px;
                  align-items: center;
                }
                .navbar-link {
                  text-decoration: none;
                  color: #555;
                  font-weight: 500;
                  padding: 8px 12px;
                  border-radius: 4px;
                  transition: color 0.2s;
                }
                .navbar-link:hover {
                  color: #000;
                }
              </style>
              <nav class="navbar-container" data-gjs-name="Navbar">
                <div class="navbar-brand" data-gjs-name="Brand">Brand</div>
                <div class="navbar-menu" data-gjs-name="Menu">
                  <a href="#" class="navbar-link" data-gjs-name="Link">Home</a>
                  <a href="#" class="navbar-link" data-gjs-name="Link">About</a>
                  <a href="#" class="navbar-link" data-gjs-name="Link">Services</a>
                  <a href="#" class="navbar-link" data-gjs-name="Link">Contact</a>
                </div>
              </nav>
            `,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line></svg>'
          },
          {
            id: 'navbar-link',
            label: 'Navbar Link',
            category: '2. Navigation',
            content: `<a href="#" class="navbar-link" style="text-decoration: none; color: #555; font-weight: 500; padding: 8px 12px; border-radius: 4px; transition: color 0.2s;" data-gjs-name="Link">New Link</a>`,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'
          },
          {
            id: 'footer-multi',
            label: 'Footer Multi',
            category: '2. Navigation',
            content: `
              <style>
                .footer-multi {
                  background: #1f2937;
                  color: #f3f4f6;
                  padding: 40px 20px;
                }
                .footer-grid {
                  max-width: 1200px;
                  margin: 0 auto;
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 40px;
                }
                .footer-title {
                  color: #fff;
                  margin-bottom: 15px;
                }
                .footer-text {
                  font-size: 0.9rem;
                  color: #9ca3af;
                }
                .footer-list {
                  list-style: none;
                  padding: 0;
                  margin: 0;
                }
                .footer-item {
                  margin-bottom: 8px;
                }
                .footer-link {
                  color: #d1d5db;
                  text-decoration: none;
                }
                .footer-link:hover {
                  color: #fff;
                }
                .footer-copyright {
                  text-align: center;
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 1px solid #374151;
                  font-size: 0.8rem;
                  color: #9ca3af;
                }
              </style>
              <footer class="footer-multi" data-gjs-name="Footer">
                <div class="footer-grid" data-gjs-name="Grid">
                  <div data-gjs-name="Column">
                    <h4 class="footer-title" data-gjs-name="Title">Company</h4>
                    <p class="footer-text" data-gjs-name="Text">Making the world better, one pixel at a time.</p>
                  </div>
                  <div data-gjs-name="Column">
                    <h4 class="footer-title" data-gjs-name="Title">Links</h4>
                    <ul class="footer-list" data-gjs-name="List">
                      <li class="footer-item"><a href="#" class="footer-link" data-gjs-name="Link">Home</a></li>
                      <li class="footer-item"><a href="#" class="footer-link" data-gjs-name="Link">About</a></li>
                      <li class="footer-item"><a href="#" class="footer-link" data-gjs-name="Link">Contact</a></li>
                    </ul>
                  </div>
                  <div data-gjs-name="Column">
                    <h4 class="footer-title" data-gjs-name="Title">Legal</h4>
                    <ul class="footer-list" data-gjs-name="List">
                      <li class="footer-item"><a href="#" class="footer-link" data-gjs-name="Link">Privacy</a></li>
                      <li class="footer-item"><a href="#" class="footer-link" data-gjs-name="Link">Terms</a></li>
                    </ul>
                  </div>
                </div>
                <div class="footer-copyright" data-gjs-name="Copyright">
                  © 2024 Brand Name. All rights reserved.
                </div>
              </footer>
            `,
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
            content: `
              <style>
                .btn-primary {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: #3b82f6;
                  color: white;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  text-align: center;
                  transition: background-color 0.2s;
                }
                .btn-primary:hover {
                  background-color: #2563eb;
                }
              </style>
              <a href="#" class="btn-primary">Click Me</a>
            `,
            media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6"><rect x="3" y="8" width="18" height="8" rx="2" ry="2"></rect><line x1="12" y1="12" x2="12" y2="12"></line></svg>'
          },
          {
            id: 'button-outline',
            label: 'Button Outline',
            category: '5. CTA & Buttons',
            content: `
              <style>
                .btn-outline {
                  display: inline-block;
                  padding: 12px 24px;
                  background-color: transparent;
                  color: #3b82f6;
                  border: 2px solid #3b82f6;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  text-align: center;
                  transition: all 0.2s;
                }
                .btn-outline:hover {
                  background-color: #3b82f6;
                  color: white;
                }
              </style>
              <a href="#" class="btn-outline">Click Me</a>
            `,
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
    const loadAssets = async () => {
      try {
        const response = await storage.listFiles(appwriteConfig.assetsBucketId);
        const assets = response.files.map(file => {
          const fileUrl = storage.getFileView(appwriteConfig.assetsBucketId, file.$id).toString();
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          let type = 'image';
          if (['mp4', 'webm', 'ogg'].includes(ext)) type = 'video';
          if (['mp3', 'wav', 'ogg'].includes(ext)) type = 'audio';
          if (['pdf', 'doc', 'docx'].includes(ext)) type = 'document';
          if (['ttf', 'woff', 'woff2', 'eot'].includes(ext)) type = 'font';
          
          return {
            type,
            src: fileUrl,
            name: file.name,
            fileId: file.$id
          };
        });
        
        const editor = editorInstanceRef.current;
        if (editor) {
          const assetManager = editor.AssetManager || editor.Assets;
          if (assetManager) {
            assetManager.add(assets);
          }
        }
      } catch (err) {
        console.error('Failed to load assets from Appwrite:', err);
      }
    };
    loadAssets();

    // Track selection
    gjsEditor.on('component:selected', () => {
      const selected = gjsEditor.getSelected();
      setSelectedComponent(selected);

      if (selected) {
        const attrs = selected.getAttributes();
        setLinkHref(attrs.href || '');
        setLinkTarget(attrs.target || '_self');
        setFormAction(attrs.action || '');
        setFormMethod(attrs.method || 'POST');

        const toolbar = selected.get('toolbar');
        // Filter out 'tlb-move' (4-way arrow) and 'tlb-up' (up arrow) as per user request
        const newToolbar = toolbar.filter((t: any) => t.command !== 'tlb-move' && t.command !== 'tlb-up');

        // Check if style button already exists to avoid duplicates
        if (!newToolbar.some((t: any) => t.command === 'tlb-style')) {
          newToolbar.unshift({
            command: 'tlb-style',
            label: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>',
            attributes: { title: 'Open Styles' },
          });
        }
        
        selected.set('toolbar', newToolbar);
      }
    });

    // Add command for the style button
    gjsEditor.Commands.add('tlb-style', {
      run(editor) {
        setActiveRightTab('styles');
        // Ensure the right sidebar is open
        setIsRightSidebarOpen(true);
      }
    });

    gjsEditor.on('component:deselected', () => {
      setSelectedComponent(null);
    });

    // Page Manager listeners
    const updatePages = () => {
      const pm = gjsEditor.Pages;
      const allPages = pm.getAll().map((p: any) => ({ id: p.getId(), name: p.getName() || 'Page' }));
      setPages(allPages);
      setCurrentPage(pm.getSelected()?.getId() || '');
    };

    gjsEditor.on('page', updatePages);
    gjsEditor.on('load', () => {
      updatePages();
      
      const bm = gjsEditor.BlockManager;

      // Add Back to Top block
      bm.add('back-to-top', {
        label: 'Back to Top',
        category: 'Basic',
        attributes: { class: 'fa fa-arrow-up' },
        content: `
          <a href="#" class="back-to-top" style="position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px; background-color: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999; transition: all 0.3s ease;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </a>
          <style>
            html { scroll-behavior: smooth; }
            .back-to-top:hover { transform: translateY(-3px); box-shadow: 0 6px 8px rgba(0,0,0,0.15); }
          </style>
        `,
      });

      // Hero Section with Video
      bm.add('hero-video', {
        label: 'Hero Video',
        category: 'Sections',
        attributes: { class: 'fa fa-video-camera' },
        content: `
          <header style="position: relative; height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; text-align: center; color: white;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;">
              <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);"></div>
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt="Background" />
            </div>
            <div style="z-index: 1; max-width: 800px; padding: 20px;">
              <h1 style="font-size: 4rem; margin-bottom: 20px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Build the Future</h1>
              <p style="font-size: 1.5rem; margin-bottom: 30px; opacity: 0.9;">Create stunning websites without writing a single line of code.</p>
              <a href="#" style="display: inline-block; padding: 15px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem; transition: background 0.3s;">Get Started</a>
            </div>
          </header>
        `,
      });

      // Pricing Table
      bm.add('pricing-table', {
        label: 'Pricing Table',
        category: 'Sections',
        attributes: { class: 'fa fa-money' },
        content: `
          <section style="padding: 80px 20px; background-color: #f9fafb; font-family: sans-serif;">
            <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
              <h2 style="font-size: 2.5rem; margin-bottom: 10px; color: #111827;">Simple, transparent pricing</h2>
              <p style="color: #6b7280; margin-bottom: 50px; font-size: 1.1rem;">No hidden fees. No surprise charges.</p>
              <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 30px;">
                
                <!-- Basic Plan -->
                <div style="flex: 1; min-width: 300px; max-width: 350px; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; text-align: left;">
                  <h3 style="font-size: 1.5rem; color: #111827; margin-bottom: 15px;">Basic</h3>
                  <div style="font-size: 3rem; font-weight: bold; color: #111827; margin-bottom: 20px;">$9<span style="font-size: 1rem; color: #6b7280; font-weight: normal;">/mo</span></div>
                  <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; color: #4b5563; line-height: 2;">
                    <li>✓ 1 Project</li>
                    <li>✓ Basic Analytics</li>
                    <li>✓ 24-hour support response time</li>
                  </ul>
                  <a href="#" style="display: block; text-align: center; padding: 12px; background-color: #f3f4f6; color: #111827; text-decoration: none; border-radius: 8px; font-weight: bold; transition: background 0.3s;">Choose Basic</a>
                </div>

                <!-- Pro Plan -->
                <div style="flex: 1; min-width: 300px; max-width: 350px; background: #111827; border-radius: 16px; padding: 40px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: left; position: relative; transform: scale(1.05);">
                  <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Most Popular</div>
                  <h3 style="font-size: 1.5rem; color: white; margin-bottom: 15px;">Pro</h3>
                  <div style="font-size: 3rem; font-weight: bold; color: white; margin-bottom: 20px;">$29<span style="font-size: 1rem; color: #9ca3af; font-weight: normal;">/mo</span></div>
                  <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; color: #d1d5db; line-height: 2;">
                    <li>✓ Unlimited Projects</li>
                    <li>✓ Advanced Analytics</li>
                    <li>✓ 1-hour support response time</li>
                    <li>✓ Custom Domains</li>
                  </ul>
                  <a href="#" style="display: block; text-align: center; padding: 12px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; transition: background 0.3s;">Choose Pro</a>
                </div>

              </div>
            </div>
          </section>
        `,
      });

      // Feature Grid
      bm.add('feature-grid', {
        label: 'Feature Grid',
        category: 'Sections',
        attributes: { class: 'fa fa-th' },
        content: `
          <section style="padding: 80px 20px; background-color: white; font-family: sans-serif;">
            <div style="max-width: 1200px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 60px;">
                <h2 style="font-size: 2.5rem; color: #111827; margin-bottom: 15px;">Everything you need</h2>
                <p style="color: #6b7280; font-size: 1.1rem; max-width: 600px; margin: 0 auto;">A complete toolkit for building modern applications.</p>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px;">
                
                <div style="padding: 20px;">
                  <div style="width: 50px; height: 50px; background: #eff6ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #3b82f6;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Global Payments</h3>
                  <p style="color: #6b7280; line-height: 1.6;">Accept payments from anywhere in the world with our secure infrastructure.</p>
                </div>

                <div style="padding: 20px;">
                  <div style="width: 50px; height: 50px; background: #f0fdf4; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #22c55e;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Bank-grade Security</h3>
                  <p style="color: #6b7280; line-height: 1.6;">Your data is protected by industry-leading encryption and security protocols.</p>
                </div>

                <div style="padding: 20px;">
                  <div style="width: 50px; height: 50px; background: #fef2f2; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #ef4444;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <h3 style="font-size: 1.25rem; color: #111827; margin-bottom: 10px;">Lightning Fast</h3>
                  <p style="color: #6b7280; line-height: 1.6;">Optimized for speed. Deliver content to your users in milliseconds.</p>
                </div>

              </div>
            </div>
          </section>
        `,
      });

      // FAQ Accordion (CSS only)
      bm.add('faq-accordion', {
        label: 'FAQ Accordion',
        category: 'Sections',
        attributes: { class: 'fa fa-question-circle' },
        content: `
          <section style="padding: 80px 20px; background-color: #f9fafb; font-family: sans-serif;">
            <div style="max-width: 800px; margin: 0 auto;">
              <h2 style="font-size: 2.5rem; color: #111827; margin-bottom: 40px; text-align: center;">Frequently Asked Questions</h2>
              <div class="faq-container">
                <details style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer;">
                  <summary style="font-weight: bold; font-size: 1.1rem; color: #111827; outline: none;">What is your refund policy?</summary>
                  <p style="margin-top: 15px; color: #6b7280; line-height: 1.6;">If you're unhappy with your purchase for any reason, email us within 90 days and we'll refund you in full, no questions asked.</p>
                </details>
                <details style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer;">
                  <summary style="font-weight: bold; font-size: 1.1rem; color: #111827; outline: none;">Do you offer technical support?</summary>
                  <p style="margin-top: 15px; color: #6b7280; line-height: 1.6;">Yes, we offer 24/7 technical support for all our Pro and Enterprise customers via email and live chat.</p>
                </details>
                <details style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer;">
                  <summary style="font-weight: bold; font-size: 1.1rem; color: #111827; outline: none;">Can I upgrade my plan later?</summary>
                  <p style="margin-top: 15px; color: #6b7280; line-height: 1.6;">Absolutely! You can upgrade or downgrade your plan at any time from your account dashboard. Prorated charges will be applied automatically.</p>
                </details>
              </div>
              <style>
                details > summary { list-style: none; }
                details > summary::-webkit-details-marker { display: none; }
                details > summary::after { content: '+'; float: right; font-size: 1.5rem; line-height: 1; }
                details[open] > summary::after { content: '-'; }
              </style>
            </div>
          </section>
        `,
      });

      // Testimonials
      bm.add('testimonials', {
        label: 'Testimonials',
        category: 'Sections',
        attributes: { class: 'fa fa-quote-left' },
        content: `
          <section style="padding: 80px 20px; background-color: #111827; color: white; font-family: sans-serif;">
            <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
              <h2 style="font-size: 2.5rem; margin-bottom: 50px;">Loved by creators worldwide</h2>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
                
                <div style="background: #1f2937; padding: 30px; border-radius: 16px; text-align: left;">
                  <div style="color: #fbbf24; margin-bottom: 15px;">★★★★★</div>
                  <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px; color: #d1d5db;">"This platform completely transformed how we build landing pages. It's incredibly fast and intuitive."</p>
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="https://i.pravatar.cc/150?img=32" style="width: 50px; height: 50px; border-radius: 50%;" alt="User" />
                    <div>
                      <div style="font-weight: bold;">Sarah Jenkins</div>
                      <div style="color: #9ca3af; font-size: 0.9rem;">Marketing Director</div>
                    </div>
                  </div>
                </div>

                <div style="background: #1f2937; padding: 30px; border-radius: 16px; text-align: left;">
                  <div style="color: #fbbf24; margin-bottom: 15px;">★★★★★</div>
                  <p style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 20px; color: #d1d5db;">"The best tool I've used this year. The code export feature alone is worth the subscription price."</p>
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="https://i.pravatar.cc/150?img=11" style="width: 50px; height: 50px; border-radius: 50%;" alt="User" />
                    <div>
                      <div style="font-weight: bold;">David Chen</div>
                      <div style="color: #9ca3af; font-size: 0.9rem;">Frontend Developer</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
        `,
      });

      // Newsletter
      bm.add('newsletter', {
        label: 'Newsletter',
        category: 'Sections',
        attributes: { class: 'fa fa-envelope' },
        content: `
          <section style="padding: 80px 20px; background-color: #3b82f6; color: white; font-family: sans-serif; text-align: center;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h2 style="font-size: 2.5rem; margin-bottom: 15px; font-weight: bold;">Subscribe to our newsletter</h2>
              <p style="font-size: 1.1rem; margin-bottom: 30px; opacity: 0.9;">Get the latest updates, articles, and resources sent straight to your inbox every week.</p>
              <form style="display: flex; gap: 10px; max-width: 500px; margin: 0 auto;" onsubmit="event.preventDefault(); alert('Subscribed!');">
                <input type="email" placeholder="Enter your email" required style="flex: 1; padding: 15px 20px; border-radius: 8px; border: none; outline: none; font-size: 1rem;" />
                <button type="submit" style="padding: 15px 30px; background-color: #111827; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer; transition: background 0.3s;">Subscribe</button>
              </form>
              <p style="font-size: 0.8rem; margin-top: 15px; opacity: 0.7;">We care about your data. Read our Privacy Policy.</p>
            </div>
          </section>
        `,
      });

      // Complex Footer
      bm.add('complex-footer', {
        label: 'Complex Footer',
        category: 'Sections',
        attributes: { class: 'fa fa-sitemap' },
        content: `
          <footer style="background-color: #111827; color: #9ca3af; padding: 80px 20px 40px; font-family: sans-serif;">
            <div style="max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; border-bottom: 1px solid #374151; padding-bottom: 40px; margin-bottom: 40px;">
              
              <div>
                <h3 style="color: white; font-size: 1.5rem; font-weight: bold; margin-bottom: 20px;">Blockra</h3>
                <p style="line-height: 1.6; margin-bottom: 20px;">Making web development accessible to everyone, everywhere.</p>
                <div style="display: flex; gap: 15px;">
                  <a href="#" style="color: #9ca3af; text-decoration: none;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
                  <a href="#" style="color: #9ca3af; text-decoration: none;"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
                </div>
              </div>

              <div>
                <h4 style="color: white; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">Solutions</h4>
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.5;">
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Marketing</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Analytics</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Commerce</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Insights</a></li>
                </ul>
              </div>

              <div>
                <h4 style="color: white; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">Support</h4>
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.5;">
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Pricing</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Documentation</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Guides</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">API Status</a></li>
                </ul>
              </div>

              <div>
                <h4 style="color: white; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">Company</h4>
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 2.5;">
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">About</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Blog</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Jobs</a></li>
                  <li><a href="#" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;">Press</a></li>
                </ul>
              </div>

            </div>
            <div style="max-width: 1200px; margin: 0 auto; text-align: center; font-size: 0.9rem;">
              &copy; 2026 Blockra, Inc. All rights reserved.
            </div>
          </footer>
        `,
      });
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

    // Update undo/redo state
    const updateUndoRedo = () => {
      const um = gjsEditor.UndoManager;
      setCanUndo(um.hasUndo());
      setCanRedo(um.hasRedo());
    };
    
    gjsEditor.on('component:update undo redo change:changesCount', updateUndoRedo);
    // Initial state
    updateUndoRedo();

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
        const doc = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.sitesCollectionId,
          currentProject
        );
        
        if (doc && doc.data) {
          const data = JSON.parse(doc.data);
          if (!data || Object.keys(data).length === 0 || (data.pages && data.pages.length === 0)) {
             editor.setComponents('');
             editor.setStyle([]);
          } else {
             editor.loadProjectData(data);
             // If this is a new project with template HTML that hasn't been saved into components yet
             const component = data.pages?.[0]?.frames?.[0]?.component;
             const hasNoComponents = typeof component === 'object' && (!component.components || component.components.length === 0);
             console.log('loadCurrentProject: Checking template', { hasTemplate: !!data.metadata?.templateHtml, hasNoComponents, component });
             if (data.metadata?.templateHtml && hasNoComponents) {
               console.log('loadCurrentProject: Applying template HTML');
               const injectTemplate = () => {
                 editor.setComponents(data.metadata.templateHtml);
                 setTimeout(() => handleSave(true), 500);
               };
               // Ensure editor is ready before setting components
               if (editor.Canvas.getBody()) {
                 injectTemplate();
               } else {
                 editor.on('load', injectTemplate);
               }
             }
          }
          setTimeout(() => {
            editor.UndoManager.clear();
            setCanUndo(false);
            setCanRedo(false);
          }, 150);
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

  async function fetchProjects() {
    try {
      const user = await account.get();
      if (!user) return;

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.sitesCollectionId,
        [
          Query.equal('ownerId', user.$id)
        ]
      );
      
      const formattedProjects = response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        description: doc.description || '',
        category: doc.category || 'Other',
        updatedAt: doc.$updatedAt,
        sharedWith: doc.sharedWith || [],
        publishedUrl: doc.publishedUrl || '',
        status: doc.status || 'draft'
      }));
      
      setProjects(formattedProjects);
    } catch (err: any) {
      console.error('Failed to fetch projects from Appwrite', err);
      if (err.message === 'Failed to fetch') {
        showToast('Cannot connect to Appwrite server. Please check your endpoint and CORS settings.', 'error');
      }
      setProjects([]);
    }
  };

  const handleSave = async (silent = false) => {
    if (!editor || !currentProject) return;
    
    if (isGuest) {
      if (!silent) showToast('Saving is restricted to Pro accounts.', 'warning');
      return;
    }
    
    if (!silent) setIsSaving(true);
    else setIsSaving(true); // Always show saving state, just maybe not toast

    const data = editor.getProjectData();
    
    // Inject metadata
    const currentProjectObj = projects.find(p => p.id === currentProject || p.name === currentProject);
    if (currentProjectObj) {
      data.metadata = {
        description: currentProjectObj.description || '',
        category: currentProjectObj.category || 'Other',
        updatedAt: new Date().toISOString(),
        sharedWith: currentProjectObj.sharedWith || []
      };
    }

    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.sitesCollectionId,
        currentProject,
        {
          data: JSON.stringify(data),
          updatedAt: new Date().toISOString()
        }
      );

      if (!silent) showToast('Project saved successfully!', 'success');
      
      // Update local state to reflect new updatedAt
      if (currentProjectObj) {
        setProjects(prev => prev.map(p => 
          (p.id === currentProject || p.name === currentProject) ? { ...p, updatedAt: new Date().toISOString() } : p
        ));
      }
    } catch (err) {
      if (!silent) showToast('Failed to save project', 'error');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (isGuest) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (!editor || !currentProject) return;

    setIsPublishing(true);
    try {
      // 1. Estraiamo il codice dall'editor
      const html = editor.getHtml();
      const css = editor.getCss();
      
      // 2. Creiamo la pagina HTML completa (con CSS e Badge)
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Published with Blockra</title>
            <style>${css}</style>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
            ${html}
            <div style="position: fixed; bottom: 20px; right: 20px; background: #fff; padding: 10px 20px; border-radius: 50px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); font-family: sans-serif; display: flex; align-items: center; gap: 10px; z-index: 9999;">
               <span style="font-weight: bold; color: #3b82f6;">Built with Blockra</span>
            </div>
        </body>
        </html>
      `;

      // 3. Trasformiamo in un File (Blob)
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const file = new File([blob], "index.html", { type: 'text/html' });

      // 4. Carichiamo nel Bucket
      // Nota: Usiamo l'ID del progetto come ID file per sovrascrivere se esiste già
      try {
          await storage.deleteFile(appwriteConfig.publishedSitesBucketId, currentProject);
      } catch(e) { /* Il file non esisteva ancora, ignoriamo l'errore */ }

      const uploadedFile = await storage.createFile(
        appwriteConfig.publishedSitesBucketId, 
        currentProject, // ID fisso per questo progetto
        file
      );

      // 5. Otteniamo l'URL pubblico (View)
      const publicUrl = storage.getFileView(appwriteConfig.publishedSitesBucketId, uploadedFile.$id);

      // 6. Aggiorniamo il Database (Collezione sites/projects)
      await databases.updateDocument(
        appwriteConfig.databaseId, 
        appwriteConfig.sitesCollectionId, 
        currentProject, 
        {
          publishedUrl: publicUrl.href,
          status: 'published'
        }
      );

      // Aggiorniamo lo stato locale dei progetti
      setProjects(prev => prev.map(p => 
        (p.id || p.name) === currentProject 
          ? { ...p, publishedUrl: publicUrl.href, status: 'published' } 
          : p
      ));

      showToast("Sito pubblicato con successo! 🎉", "success");
      window.open(publicUrl.href, '_blank'); // Apriamo il sito appena creato

    } catch (error: any) {
      console.error("Publishing error:", error);
      showToast("Errore durante la pubblicazione: " + error.message, "error");
    } finally {
      setIsPublishing(false);
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
      const doc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.sitesCollectionId,
        id
      );
      
      if (doc && doc.data) {
        const data = JSON.parse(doc.data);
        editor.loadProjectData(data);
        
        const component = data.pages?.[0]?.frames?.[0]?.component;
        const hasNoComponents = typeof component === 'object' && (!component.components || component.components.length === 0);
        if (data.metadata?.templateHtml && hasNoComponents) {
          const injectTemplate = () => {
            editor.setComponents(data.metadata.templateHtml);
            setTimeout(() => handleSave(true), 500);
          };
          if (editor.Canvas.getBody()) {
            injectTemplate();
          } else {
            editor.on('load', injectTemplate);
          }
        }
        
        setTimeout(() => {
          editor.UndoManager.clear();
          setCanUndo(false);
          setCanRedo(false);
        }, 150);
        setCurrentProject(id);
        setViewMode('editor');
      } else {
        console.error('Project data is empty');
      }
    } catch (err) {
      console.error('Failed to load project from Appwrite', err);
    }
  };

  const updateProjectSharing = async (projectId: string, sharedWith: any[]) => {
    try {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.sitesCollectionId,
        projectId,
        {
          sharedWith: sharedWith
        }
      );
      fetchProjects();
    } catch (err) {
      console.error('Failed to update project sharing in Appwrite', err);
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
          await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.sitesCollectionId,
            id
          );
          
          setProjects(prev => prev.filter(p => (p.id || p.name) !== id));
          if (currentProject === id) {
            setCurrentProject(null);
            setViewMode('dashboard');
          }
          console.log('deleteProject: Deleted successfully');
          showToast('Project deleted successfully', 'success');
        } catch (err) {
          console.error('Failed to delete project from Appwrite', err);
          showToast('Failed to delete project', 'error');
        }
      },
    });
  };

  const handleCreateProject = async (name: string, description: string, category: string) => {
    let templateHtml = '';
    
    if (category === 'Landing Page') {
      templateHtml = `
        <header class="p-12 bg-blue-600 text-white text-center">
          <h1 class="text-5xl font-bold mb-6">Welcome to Our Product</h1>
          <p class="text-xl mb-10 opacity-90 max-w-2xl mx-auto">The best solution for your business needs. Built for scale and performance.</p>
          <a href="#" class="bg-white text-blue-600 px-8 py-4 rounded-full font-bold inline-block hover:bg-blue-50 transition-colors">Get Started Today</a>
        </header>
        <section class="p-16 bg-gray-50 text-center">
          <h2 class="text-3xl font-bold mb-12 text-slate-900">Amazing Features</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-slate-800 hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl">⚡</div>
              <h3 class="font-bold mb-3 text-xl">Lightning Fast</h3>
              <p class="text-slate-600">Optimized for speed and performance out of the box.</p>
            </div>
            <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-slate-800 hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl">🛡️</div>
              <h3 class="font-bold mb-3 text-xl">Highly Secure</h3>
              <p class="text-slate-600">Enterprise-grade security to protect your data.</p>
            </div>
            <div class="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-slate-800 hover:shadow-md transition-shadow">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl">💎</div>
              <h3 class="font-bold mb-3 text-xl">Premium Design</h3>
              <p class="text-slate-600">Beautifully crafted components and layouts.</p>
            </div>
          </div>
        </section>
      `;
    } else if (category === 'Portfolio') {
      templateHtml = `
        <section class="p-12 bg-zinc-900 text-white min-h-screen flex flex-col items-center justify-center text-center">
          <img src="https://picsum.photos/seed/portfolio/200/200" class="w-40 h-40 rounded-full mb-8 object-cover border-4 border-white/10" alt="Profile" />
          <h1 class="text-6xl font-bold mb-6 tracking-tight">Hi, I'm a Designer</h1>
          <p class="text-2xl text-zinc-400 mb-10 max-w-2xl font-light">I create beautiful, functional, and user-centered digital experiences.</p>
          <div class="flex gap-4">
            <a href="#" class="bg-white text-black px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors">View My Work</a>
            <a href="#" class="border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">Contact Me</a>
          </div>
        </section>
      `;
    } else if (category === 'Corporate') {
      templateHtml = `
        <nav class="flex justify-between items-center p-6 bg-white border-b border-gray-100 text-black">
          <div class="text-2xl font-black text-slate-900 tracking-tighter">ACME<span class="text-blue-600">Corp</span></div>
          <div class="flex gap-8">
            <a href="#" class="text-slate-600 hover:text-blue-600 font-medium transition-colors">Services</a>
            <a href="#" class="text-slate-600 hover:text-blue-600 font-medium transition-colors">About Us</a>
            <a href="#" class="text-slate-600 hover:text-blue-600 font-medium transition-colors">Careers</a>
            <a href="#" class="text-slate-600 hover:text-blue-600 font-medium transition-colors">Contact</a>
          </div>
        </nav>
        <section class="p-24 bg-slate-50 text-center text-black min-h-[70vh] flex flex-col justify-center items-center relative overflow-hidden">
          <div class="absolute inset-0 bg-blue-600/5 skew-y-3 transform origin-bottom-left -z-10"></div>
          <h1 class="text-6xl font-bold text-slate-900 mb-8 tracking-tight">Corporate Excellence <br/>for the Modern Age</h1>
          <p class="text-xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed">Delivering outstanding results for global enterprises through innovative solutions, strategic thinking, and unparalleled execution.</p>
          <div class="flex gap-4">
            <a href="#" class="bg-slate-900 text-white px-8 py-4 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg">Our Solutions</a>
            <a href="#" class="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-lg font-bold hover:bg-slate-50 transition-colors">Read Case Studies</a>
          </div>
        </section>
      `;
    }

    // Create a minimal valid project structure
    let initialProjectData: any = {
      metadata: { description, category, templateHtml, updatedAt: new Date().toISOString(), sharedWith: [] },
      assets: [],
      styles: [],
      pages: [{ frames: [{ component: { type: 'wrapper', components: [] } }] }]
    };

    try {
      const user = await account.get();
      
      const documentId = ID.unique();
      const permissions = getOwnerPermissions(user.$id);
      
      const createdProject = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.sitesCollectionId,
        documentId,
        {
          name,
          description,
          category,
          data: JSON.stringify(initialProjectData),
          ownerId: user.$id,
          updatedAt: new Date().toISOString()
        },
        permissions
      );
      
      const projectId = createdProject.$id;

      setCurrentProject(projectId);
      setProjects(prev => [...prev, { id: projectId, name, description, category, updatedAt: new Date().toISOString() }]);
      
      if (viewMode === 'dashboard') {
        setViewMode('editor');
      } else if (editor) {
        editor.loadProjectData(initialProjectData);
        if (templateHtml) {
          const injectTemplate = () => {
            editor.setComponents(templateHtml);
            setTimeout(() => handleSave(true), 500);
          };
          if (editor.Canvas.getBody()) {
            injectTemplate();
          } else {
            editor.on('load', injectTemplate);
          }
        }
        setTimeout(() => {
          editor.UndoManager.clear();
          setCanUndo(false);
          setCanRedo(false);
        }, 150);
      }
    } catch (err) {
      console.error('Failed to create project in Appwrite', err);
      showToast('Failed to create project', 'error');
    }
  };

  const handleDeviceChange = (newDevice: string) => {
    setDevice(newDevice);
    if (editor) {
      editor.setDevice(newDevice);
    }
  };

  const toggleViewMode = async () => {
    if (viewMode === 'editor') {
      // Switch to code
      const currentEditor = editorInstanceRef.current || editor;
      if (currentEditor) {
        // Force a render/update before capturing
        currentEditor.refresh(); 
        
        let html = currentEditor.getHtml() || '';
        let css = currentEditor.getCss() || '';
        let js = currentEditor.getJs() || '';
        
        try {
          html = await prettier.format(html, { parser: 'html', plugins: [prettierPluginHtml] });
          css = await prettier.format(css, { parser: 'css', plugins: [prettierPluginCss] });
          if (js) {
            js = await prettier.format(js, { parser: 'babel', plugins: [prettierPluginBabel, prettierPluginEstree] });
          }
        } catch (e) {
          console.error('Prettier formatting failed:', e);
        }
        
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
    bg: isDarkMode ? 'bg-transparent' : 'bg-gray-50', // Handled by body background in dark mode
    sidebarBg: isDarkMode ? 'glass-panel' : 'bg-white shadow-lg',
    sidebarBorder: isDarkMode ? 'border-white/10' : 'border-gray-200',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textMuted: isDarkMode ? 'text-white/60' : 'text-gray-500',
    textFaint: isDarkMode ? 'text-white/40' : 'text-gray-400',
    hoverBg: isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    activeBg: getThemeClass(themeColor, 'activeBg'),
    headerBg: isDarkMode ? 'glass-panel' : 'bg-white shadow-sm',
    blockBg: isDarkMode ? 'bg-white/5' : 'bg-gray-50',
    blockHoverBg: isDarkMode ? 'bg-white/10' : 'bg-gray-100',
    blockText: isDarkMode ? 'text-white/90' : 'text-gray-700',
    blockBorder: isDarkMode ? 'border-white/10' : 'border-gray-200',
    codeBg: isDarkMode ? 'bg-black/50 backdrop-blur-md' : 'bg-gray-100',
    codeText: isDarkMode ? 'text-gray-300' : 'text-gray-800',
    button: isDarkMode ? 'glass-button text-white' : 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 shadow-sm',
    primaryButton: getThemeClass(themeColor, 'primaryButton'),
  };

  const fontFamilyClass = uiPreferences?.fontFamily === 'Roboto' ? 'font-roboto' : uiPreferences?.fontFamily === 'Montserrat' ? 'font-montserrat' : 'font-sans';

  if (!isActivated) {
    return <SetupWizard onActivated={(key) => {
      setIsActivated(true);
      // We can also trigger a session check here if needed, but SetupWizard handles login
      const checkSession = async () => {
        try {
          const user = await account.get();
          if (user) {
            handleLogin(true, false, {
              name: user.name.split(' ')[0] || 'User',
              surname: user.name.split(' ').slice(1).join(' ') || '',
              email: user.email,
              username: user.prefs?.username || user.name.toLowerCase().replace(/\s+/g, ''),
              role: user.prefs?.role || 'User',
              plan: user.prefs?.plan || 'Free'
            });
          }
        } catch (e) {
          console.log('No active session after activation');
        }
      };
      checkSession();
    }} isDarkMode={isDarkMode} />;
  }

  if (viewMode === 'dashboard') {
    return (
      <div className={`relative h-screen w-full overflow-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} ${fontFamilyClass} selection:bg-blue-500/30 transition-colors duration-300`}>
        {/* Animated Background Elements */}
        {isDarkMode && (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none" style={{ animationDelay: '2s' }}></div>
          </>
        )}
        
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
            onUpdateSharing={updateProjectSharing}
            onUpgrade={() => setIsUpgradeModalOpen(true)}
            isDarkMode={isDarkMode}
            isLoggedIn={isLoggedIn}
            onLogin={handleLogin}
            userProfile={userProfile}
            themeColor={themeColor}
            onOpenSettings={(tab) => {
              setActiveSettingsTab(tab);
              setIsSettingsModalOpen(true);
            }}
            uiPreferences={uiPreferences}
            updateAvailable={updateAvailable}
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
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            isGuest={isGuest}
            uiPreferences={uiPreferences}
            onUpdateUiPreferences={setUiPreferences}
            updateAvailable={updateAvailable}
            onDismissUpdate={() => setUpdateAvailable(false)}
          />
          
          <UpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen w-full overflow-hidden ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'} ${fontFamilyClass} selection:bg-blue-500/30 transition-colors duration-300`}>
      {/* Animated Background Elements */}
      {isDarkMode && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-float opacity-60 pointer-events-none" style={{ animationDelay: '2s' }}></div>
        </>
      )}
      
      {/* Custom Asset Manager Modal */}
      <CustomAssetManager
        isOpen={isAssetManagerOpen}
        onClose={() => {
          setIsAssetManagerOpen(false);
          if (assetManagerProps?.close) assetManagerProps.close();
        }}
        onSelect={(asset) => {
          if (assetManagerProps?.select) {
            assetManagerProps.select(asset, false);
          }
        }}
        editor={editor}
        themeColor={themeColor}
      />

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateProject}
        themeColor={themeColor}
      />
      
      {/* Floating Layout Container */}
      <div className="absolute inset-0 p-4 flex gap-4 z-10">
        
        {/* Open Sidebar Button */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => setIsSidebarOpen(true)}
              className={`absolute top-4 left-4 z-50 p-3 rounded-xl ${themeClasses.sidebarBg} border ${themeClasses.sidebarBorder} shadow-lg text-white hover:bg-white/10 transition-colors`}
              title="Open Sidebar"
            >
              <Layout className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Sidebar */}
        <motion.aside 
          initial={{ width: 280, opacity: 1 }}
          animate={{ 
            width: isSidebarOpen ? 280 : 0, 
            opacity: isSidebarOpen ? 1 : 0,
            x: isSidebarOpen ? 0 : -20
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`${themeClasses.sidebarBg} rounded-3xl flex flex-col h-full overflow-hidden relative z-50 shrink-0`}
        >
        <div className={`p-4 border-b ${themeClasses.sidebarBorder} flex items-center justify-between overflow-hidden whitespace-nowrap`}>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setCurrentProject(null);
                setViewMode('dashboard');
              }}
              className={`p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors`}
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
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
                      key={p.name}
                      onClick={() => loadProject(p.name)}
                      className={`group w-full px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer border border-transparent ${
                        currentProject === p.name 
                          ? `${themeClasses.activeBg} ${getThemeClass(themeColor, 'text')} ${getThemeClass(themeColor, 'badgeBorder')} shadow-sm` 
                          : `${themeClasses.hoverBg} ${themeClasses.textMuted} hover:border-black/5`
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FolderOpen className={`w-4 h-4 flex-shrink-0 ${currentProject === p.name ? getThemeClass(themeColor, 'text') : themeClasses.textFaint}`} />
                        <span className="truncate font-medium">{p.name}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteProject(p.name, e)}
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
      </motion.aside>

      {/* Toggle Sidebar Button (when closed) - MOVED TO HEADER */}
      
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col gap-4 h-full relative z-10 min-w-0">
      {/* Header - Floating Glass Bar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`h-16 mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-2xl border ${themeClasses.sidebarBorder} ${themeClasses.sidebarBg} flex items-center justify-between px-3 sm:px-6 shadow-lg z-50 relative`}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
             <div className={`w-8 h-8 ${getThemeClass(themeColor, 'gradientIcon')} rounded-lg flex items-center justify-center shadow-lg ${getThemeClass(themeColor, 'shadow')} shrink-0`}>
               <Layout className="w-5 h-5 text-white" />
             </div>
             {/* Title and version hidden on smaller screens to save space */}
             <div className="hidden 2xl:flex flex-col">
               <h1 className={`text-sm font-bold tracking-tight ${themeClasses.text}`}>Blockra</h1>
             </div>
          </div>

          <div className={`h-8 w-px ${themeClasses.sidebarBorder} hidden sm:block`}></div>

          <div className="flex items-center gap-2">
             <span className={`text-xs font-bold ${themeClasses.textFaint} uppercase tracking-wider hidden xl:inline`}>Project:</span>
             <span className={`text-xs sm:text-sm font-medium ${themeClasses.text} bg-white/5 px-2 sm:px-3 py-1 rounded-lg border border-white/5 truncate max-w-[80px] sm:max-w-[150px]`}>
               {currentProject || 'Untitled'}
             </span>
             
             {/* Page Selector */}
             {pages.length > 0 && (
               <div className="flex items-center ml-1 sm:ml-2 bg-black/20 rounded-lg border border-white/5 px-2 py-1">
                 <select
                   value={currentPage}
                   onChange={(e) => {
                     if (e.target.value === 'new_page') {
                       const pageName = prompt('Enter new page name (e.g., About, Contact):');
                       if (pageName && editor) {
                         const newPage = editor.Pages.add({ name: pageName, component: '' });
                         editor.Pages.select(newPage);
                       } else {
                         // Reset to current page if cancelled
                         e.target.value = currentPage;
                       }
                     } else if (editor) {
                       editor.Pages.select(e.target.value);
                     }
                   }}
                   className={`bg-transparent text-xs sm:text-sm font-medium ${themeClasses.text} focus:outline-none appearance-none cursor-pointer pr-4`}
                   style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '8px auto' }}
                 >
                   {pages.map(p => (
                     <option key={p.id} value={p.id} className="bg-gray-800 text-white">{p.name}</option>
                   ))}
                   <option value="new_page" className="bg-gray-800 text-blue-400 font-bold">+ New Page</option>
                 </select>
               </div>
             )}

             {isSaving && (
                <span className={`ml-1 sm:ml-2 text-[10px] sm:text-xs font-medium ${getThemeClass(themeColor, 'text')} animate-pulse hidden md:inline`}>
                  Saving...
                </span>
             )}
          </div>
        </div>

        {/* Center - Device Controls */}
        <div className={`hidden lg:flex items-center bg-black/20 rounded-xl p-1 border ${themeClasses.sidebarBorder} shadow-inner absolute left-1/2 -translate-x-1/2`}>
          <button 
            onClick={() => handleDeviceChange('Desktop')} 
            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${device === 'Desktop' ? `bg-white/10 text-white shadow-sm` : `text-white/40 hover:text-white hover:bg-white/5`}`} 
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeviceChange('Tablet')} 
            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${device === 'Tablet' ? `bg-white/10 text-white shadow-sm` : `text-white/40 hover:text-white hover:bg-white/5`}`} 
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeviceChange('Mobile')} 
            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${device === 'Mobile' ? `bg-white/10 text-white shadow-sm` : `text-white/40 hover:text-white hover:bg-white/5`}`} 
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
           {/* Publish Button - Prominent */}
           <button
             onClick={handlePublish}
             disabled={!currentProject || isPublishing || isGuest}
             className={`hidden sm:flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:py-2 ${isGuest ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10' : `${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white shadow-lg ${getThemeClass(themeColor, 'shadow')} hover:scale-105 active:scale-95`} rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wide transition-all disabled:opacity-50`}
             title={isGuest ? "Publishing is restricted to Pro accounts" : "Publish Project"}
           >
             {isPublishing ? (
               <>
                 <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> <span className="hidden sm:inline">Publishing...</span>
               </>
             ) : (
               <>
                 {isGuest ? <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500/70" /> : <Globe className="w-3 h-3 sm:w-4 sm:h-4" />} 
                 <span className="hidden sm:inline">{isGuest ? 'Publish (Pro)' : 'Publish'}</span>
               </>
             )}
           </button>

           <div className={`w-px h-6 ${themeClasses.sidebarBorder} mx-0.5 sm:mx-1 hidden md:block`}></div>

           {/* Desktop Action Buttons */}
           <div className="hidden md:flex items-center gap-0.5 sm:gap-1 bg-black/20 rounded-xl p-0.5 sm:p-1 border border-white/5">
              <button 
                onClick={(e) => { e.preventDefault(); editor?.UndoManager.undo(); }}
                disabled={!canUndo}
                className={`p-1.5 sm:p-2 rounded-lg hover:bg-white/10 ${canUndo ? 'text-white/60 hover:text-white' : 'text-white/20 cursor-not-allowed'} transition-colors`}
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); editor?.UndoManager.redo(); }}
                disabled={!canRedo}
                className={`p-1.5 sm:p-2 rounded-lg hover:bg-white/10 ${canRedo ? 'text-white/60 hover:text-white' : 'text-white/20 cursor-not-allowed'} transition-colors`}
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.preventDefault(); handleSave(); }}
                disabled={!currentProject || isSaving || isGuest}
                className={`p-1.5 sm:p-2 rounded-lg ${isGuest ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 text-white/60 hover:text-white'} transition-colors`}
                title={isGuest ? "Save (Pro Only)" : "Save"}
              >
                {isGuest ? <Crown className="w-4 h-4 text-yellow-500/70" /> : <Save className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => toggleViewMode()}
                className={`p-1.5 sm:p-2 rounded-lg hover:bg-white/10 ${viewMode === 'code' ? `text-${themeColor}-400 bg-${themeColor}-500/10` : 'text-white/60 hover:text-white'} transition-colors`}
                title="Code"
              >
                <Code className="w-4 h-4" />
              </button>
           </div>

           {/* Mobile More Options Menu */}
           <div className="relative md:hidden">
             <button 
               onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
               className={`p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all ${isMoreMenuOpen ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
             >
               <MoreVertical className="w-4 h-4" />
             </button>
             
             <AnimatePresence>
               {isMoreMenuOpen && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.95, y: 10 }}
                   transition={{ duration: 0.15 }}
                   className={`absolute right-0 top-full mt-2 w-48 rounded-xl border ${themeClasses.sidebarBorder} ${themeClasses.sidebarBg} shadow-2xl overflow-hidden z-[100]`}
                 >
                   <div className="p-2 flex flex-col gap-1">
                     <button
                       onClick={() => { handlePublish(); setIsMoreMenuOpen(false); }}
                       disabled={!currentProject || isPublishing || isGuest}
                       className={`w-full flex items-center justify-center gap-2 px-3 py-2 ${isGuest ? 'bg-white/5 text-white/40 cursor-not-allowed' : `${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white shadow-lg`} rounded-lg font-bold text-xs uppercase tracking-wide mb-1 disabled:opacity-50`}
                     >
                       {isGuest ? <Crown className="w-4 h-4 text-yellow-500/70" /> : <Globe className="w-4 h-4" />} 
                       {isGuest ? 'Publish (Pro)' : 'Publish'}
                     </button>
                     <div className="flex justify-between px-2 py-1 mb-1 border-b border-white/10">
                       <button 
                         onClick={(e) => { e.preventDefault(); editor?.UndoManager.undo(); setIsMoreMenuOpen(false); }}
                         disabled={!canUndo}
                         className={`p-2 rounded-lg hover:bg-white/10 ${canUndo ? 'text-white/60 hover:text-white' : 'text-white/20 cursor-not-allowed'} transition-colors`}
                         title="Undo"
                       >
                         <Undo2 className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={(e) => { e.preventDefault(); editor?.UndoManager.redo(); setIsMoreMenuOpen(false); }}
                         disabled={!canRedo}
                         className={`p-2 rounded-lg hover:bg-white/10 ${canRedo ? 'text-white/60 hover:text-white' : 'text-white/20 cursor-not-allowed'} transition-colors`}
                         title="Redo"
                       >
                         <Redo2 className="w-4 h-4" />
                       </button>
                     </div>
                     <button 
                       onClick={(e) => { e.preventDefault(); handleSave(); setIsMoreMenuOpen(false); }}
                       disabled={!currentProject || isSaving || isGuest}
                       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${isGuest ? 'text-white/40 cursor-not-allowed' : 'text-white/80 hover:text-white hover:bg-white/10'} transition-colors`}
                     >
                       {isGuest ? <Crown className="w-4 h-4 text-yellow-500/70" /> : <Save className="w-4 h-4" />} 
                       {isGuest ? 'Save Project (Pro)' : 'Save Project'}
                     </button>
                     <button 
                       onClick={() => { toggleViewMode(); setIsMoreMenuOpen(false); }}
                       className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${viewMode === 'code' ? `text-${themeColor}-400 bg-${themeColor}-500/10` : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                     >
                       <Code className="w-4 h-4" /> {viewMode === 'code' ? 'Editor Mode' : 'Code Mode'}
                     </button>
                     <div className="border-t border-white/10 my-1"></div>
                     <div className="px-3 py-2 text-xs font-bold text-white/40 uppercase tracking-wider">Device</div>
                     <div className="flex justify-between px-2">
                       <button onClick={() => { handleDeviceChange('Desktop'); setIsMoreMenuOpen(false); }} className={`p-2 rounded-lg ${device === 'Desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}><Monitor className="w-4 h-4" /></button>
                       <button onClick={() => { handleDeviceChange('Tablet'); setIsMoreMenuOpen(false); }} className={`p-2 rounded-lg ${device === 'Tablet' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}><Tablet className="w-4 h-4" /></button>
                       <button onClick={() => { handleDeviceChange('Mobile'); setIsMoreMenuOpen(false); }} className={`p-2 rounded-lg ${device === 'Mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}><Smartphone className="w-4 h-4" /></button>
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <button 
             onClick={() => toggleRightSidebar('styles')}
             className={`ml-1 sm:ml-2 p-1.5 sm:p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all hover:scale-105 active:scale-95 ${isRightSidebarOpen ? 'bg-white/10 ring-1 ring-white/20' : ''}`}
           >
             <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
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
                  <div className={`w-full h-full overflow-auto ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
                    <SyntaxHighlighter
                      language={activeCodeTab === 'js' ? 'javascript' : activeCodeTab}
                      style={isDarkMode ? vscDarkPlus : vs}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        background: 'transparent',
                        minHeight: '100%',
                      }}
                      showLineNumbers={true}
                      wrapLines={true}
                    >
                      {activeCodeTab === 'html' ? codeData.html : activeCodeTab === 'css' ? codeData.css : codeData.js}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Right Panel - Always mounted for GrapesJS, hidden via transform */}
      <motion.aside
        initial={{ width: 0, opacity: 0 }}
        animate={{ 
          width: isRightSidebarOpen ? 320 : 0, 
          opacity: isRightSidebarOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`${themeClasses.sidebarBg} rounded-3xl flex flex-col h-full overflow-hidden relative z-50 shrink-0 border-l border-white/5`}
      >
        {/* Right Sidebar Header */}
        {isRightSidebarOpen && (
          <div className={`flex items-center border-b ${themeClasses.sidebarBorder} bg-white/5 shrink-0`}>
            <button 
              onClick={() => setActiveRightTab('styles')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'styles' ? `text-${themeColor}-500 bg-${themeColor}-500/5 border-b-2 border-${themeColor}-500` : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
              title="Styles"
            >
              <Paintbrush className="w-4 h-4 mx-auto mb-1" />
            </button>
            <button 
              onClick={() => setActiveRightTab('traits')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'traits' ? `text-${themeColor}-500 bg-${themeColor}-500/5 border-b-2 border-${themeColor}-500` : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
              title="Settings"
            >
              <Sliders className="w-4 h-4 mx-auto mb-1" />
            </button>
            <button 
              onClick={() => setActiveRightTab('layers')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'layers' ? `text-${themeColor}-500 bg-${themeColor}-500/5 border-b-2 border-${themeColor}-500` : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
              title="Layers"
            >
              <Layers className="w-4 h-4 mx-auto mb-1" />
            </button>
            <button 
              onClick={() => setActiveRightTab('templates')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-center transition-all ${activeRightTab === 'templates' ? `text-${themeColor}-500 bg-${themeColor}-500/5 border-b-2 border-${themeColor}-500` : `${themeClasses.textMuted} hover:${themeClasses.text} hover:bg-white/5`}`}
              title="Themes"
            >
              <Palette className="w-4 h-4 mx-auto mb-1" />
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
          {/* Image Settings (if image selected) */}
          {selectedComponent && selectedComponent.get('type') === 'image' && (activeRightTab === 'styles' || activeRightTab === 'traits') && (
            <div className={`mb-6 p-4 rounded-xl bg-white/5 border ${themeClasses.sidebarBorder}`}>
              <div className={`text-xs font-bold ${themeClasses.textFaint} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                <ImageIcon className="w-3 h-3" /> Image Settings
              </div>
              <button
                onClick={() => {
                  if (editor) {
                    editor.runCommand('open-assets', {
                      target: selectedComponent,
                      onSelect() {
                        editor.Modal.close();
                        editor.AssetManager.close();
                      }
                    });
                  }
                }}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white shadow-lg ${getThemeClass(themeColor, 'shadow')}`}
              >
                <Upload className="w-4 h-4" />
                Change Image
              </button>
              <p className={`text-[10px] mt-3 text-center ${themeClasses.textMuted}`}>
                You can also double-click the image on the canvas to change it.
              </p>
            </div>
          )}

          {/* Link Settings (if link selected) */}
          {selectedComponent && (selectedComponent.is('link') || selectedComponent.get('tagName') === 'a') && (activeRightTab === 'styles' || activeRightTab === 'traits') && (
            <div className={`mb-6 p-4 rounded-xl bg-white/5 border ${themeClasses.sidebarBorder}`}>
              <div className={`text-xs font-bold ${themeClasses.textFaint} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                <LinkIcon className="w-3 h-3" /> Link Settings
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${themeClasses.textMuted} mb-1.5`}>URL Destination</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      className={`flex-1 bg-black/20 border ${themeClasses.sidebarBorder} rounded-lg px-2 py-1.5 text-xs ${themeClasses.text} focus:outline-none focus:border-${themeColor}-500 transition-colors appearance-none`}
                      onChange={(e) => {
                        if (e.target.value) {
                          const val = e.target.value;
                          setLinkHref(val);
                          selectedComponent.addAttributes({ href: val });
                        }
                      }}
                    >
                      <option value="">Link to page...</option>
                      {pages.map(p => {
                        let name = p.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        if (name === 'main' || name === 'page') name = 'index';
                        return <option key={p.id} value={`${name}.html`}>{p.name}</option>;
                      })}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={linkHref}
                    onChange={(e) => {
                      setLinkHref(e.target.value);
                      selectedComponent.addAttributes({ href: e.target.value });
                    }}
                    placeholder="https://example.com or #section"
                    className={`w-full bg-black/20 border ${themeClasses.sidebarBorder} rounded-lg px-3 py-2 text-sm ${themeClasses.text} focus:outline-none focus:border-${themeColor}-500 transition-colors`}
                  />
                </div>
                
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${themeClasses.textMuted} mb-1.5`}>Open In</label>
                  <select
                    value={linkTarget}
                    onChange={(e) => {
                      setLinkTarget(e.target.value);
                      selectedComponent.addAttributes({ target: e.target.value });
                    }}
                    className={`w-full bg-black/20 border ${themeClasses.sidebarBorder} rounded-lg px-3 py-2 text-sm ${themeClasses.text} focus:outline-none focus:border-${themeColor}-500 transition-colors appearance-none`}
                  >
                    <option value="_self">Same Tab</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
              </div>
              <p className={`text-[10px] mt-3 text-center ${themeClasses.textMuted}`}>
                Tip: Use <code className="bg-black/30 px-1 rounded">#id</code> to scroll to a section on this page, or <code className="bg-black/30 px-1 rounded">https://...</code> for external links.
              </p>
            </div>
          )}

          {/* Form Settings (if form selected) */}
          {selectedComponent && selectedComponent.get('tagName') === 'form' && (activeRightTab === 'styles' || activeRightTab === 'traits') && (
            <div className={`mb-6 p-4 rounded-xl bg-white/5 border ${themeClasses.sidebarBorder}`}>
              <div className={`text-xs font-bold ${themeClasses.textFaint} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                <Settings className="w-3 h-3" /> Form Settings
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${themeClasses.textMuted} mb-1.5`}>Action URL</label>
                  <input
                    type="text"
                    value={formAction}
                    onChange={(e) => {
                      setFormAction(e.target.value);
                      selectedComponent.addAttributes({ action: e.target.value });
                    }}
                    placeholder="/api/submit or https://..."
                    className={`w-full bg-black/20 border ${themeClasses.sidebarBorder} rounded-lg px-3 py-2 text-sm ${themeClasses.text} focus:outline-none focus:border-${themeColor}-500 transition-colors`}
                  />
                </div>
                
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider ${themeClasses.textMuted} mb-1.5`}>Method</label>
                  <select
                    value={formMethod}
                    onChange={(e) => {
                      setFormMethod(e.target.value);
                      selectedComponent.addAttributes({ method: e.target.value });
                    }}
                    className={`w-full bg-black/20 border ${themeClasses.sidebarBorder} rounded-lg px-3 py-2 text-sm ${themeClasses.text} focus:outline-none focus:border-${themeColor}-500 transition-colors appearance-none`}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
              </div>
              <p className={`text-[10px] mt-3 text-center ${themeClasses.textMuted}`}>
                Where and how to send the form data when submitted.
              </p>
            </div>
          )}

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

          {/* Selector Manager (Classes) - Hidden as per user request */}
          {/* <div className={`${activeRightTab === 'styles' && selectedComponent ? 'block' : 'absolute opacity-0 pointer-events-none'} mb-6`}>
             <div id="selector-container"></div>
          </div> */}

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
                {TEMPLATES.map((template, index) => (
                  <motion.div 
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`group cursor-pointer rounded-xl border ${themeClasses.sidebarBorder} overflow-hidden transition-colors duration-300 hover:border-${themeColor}-500/50 hover:shadow-lg hover:shadow-${themeColor}-500/10 bg-white/5`}
                  >
                    <div className={`h-20 w-full ${template.preview} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-2 left-3 text-white font-bold text-sm shadow-sm">{template.name}</div>
                    </div>
                    <div className={`p-3 ${isDarkMode ? 'bg-[#27272a]' : 'bg-white'}`}>
                      <p className={`text-xs ${themeClasses.textMuted} leading-relaxed`}>{template.description}</p>
                    </div>
                  </motion.div>
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
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        uiPreferences={uiPreferences}
        onUpdateUiPreferences={setUiPreferences}
        updateAvailable={updateAvailable}
        onDismissUpdate={() => setUpdateAvailable(false)}
      />
      
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
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
        /* Toolbar Modernization */
        .gjs-toolbar {
          background-color: #1e293b !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          top: -40px !important; /* Move it up a bit */
        }
        .gjs-toolbar-item {
          color: #cbd5e1 !important;
          width: 32px !important;
          height: 32px !important;
          min-width: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 6px !important;
          margin: 0 2px !important;
        }
        .gjs-toolbar-item:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
        }

        /* Input Fields Modernization */
        .gjs-field {
          background-color: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 6px !important;
          color: #e2e8f0 !important;
          padding: 4px 8px !important;
        }
        .gjs-field:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        }
        .gjs-field input, .gjs-field select {
          color: #e2e8f0 !important;
          font-size: 12px !important;
        }
        
        /* Select Arrows */
        .gjs-field-select::after {
          border-top-color: #94a3b8 !important;
        }

        /* Labels */
        .gjs-label {
          color: #94a3b8 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 600 !important;
        }

        /* Categories/Sectors */
        .gjs-sm-sector .gjs-sm-title {
          background-color: rgba(255, 255, 255, 0.03) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          color: #e2e8f0 !important;
          font-weight: 600 !important;
          padding: 10px 12px !important;
          display: flex !important;
          align-items: center !important;
        }
        .gjs-sm-sector .gjs-sm-icon {
          margin-right: 8px !important;
        }

        /* Color Pickers */
        .gjs-field-color-picker {
          border-radius: 4px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          overflow: hidden !important;
        }
        
        /* Checkboxes */
        .gjs-chk-icon {
          border-color: rgba(255, 255, 255, 0.3) !important;
        }
        .gjs-chk-icon.active {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }

        /* Radio Buttons */
        .gjs-radio-item input:checked + .gjs-radio-item-label {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        .gjs-radio-item-label {
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: #94a3b8 !important;
        }

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
