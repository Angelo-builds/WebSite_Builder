import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderOpen, Plus, Globe, Trash2, LogOut, Layout, ExternalLink, User, Settings, ChevronDown, ArrowRight, Sparkles, Search, Filter, Crown } from 'lucide-react';
import { getThemeClass } from '../theme';

export interface Project {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  updatedAt?: string;
}

interface UserProfile {
  name: string;
  surname: string;
  email: string;
  role: string;
  plan?: 'Free' | 'Basic' | 'Pro' | 'Agency';
}

interface UIPreferences {
  sidebarLayout: string;
  uiDensity: string;
  fontFamily: string;
  customLogo: string;
  customCss: string;
}

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  isDarkMode: boolean;
  userProfile: UserProfile;
  themeColor: string;
  onOpenSettings: (tab: 'profile' | 'appearance' | 'settings') => void;
  uiPreferences: UIPreferences;
}

export default function Dashboard({ 
  projects, 
  onSelectProject, 
  onCreateProject, 
  onDeleteProject,
  isDarkMode,
  isLoggedIn,
  onLogin,
  userProfile,
  themeColor,
  onOpenSettings,
  uiPreferences
}: DashboardProps & { isLoggedIn: boolean; onLogin: (status: boolean, isGuest?: boolean) => void }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Blank Project', 'Landing Page', 'Portfolio', 'Corporate'];

  const isGuest = userProfile.role === 'Guest User';

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, name: email.split('@')[0] })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store token if needed
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      onLogin(true, false, data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Theme classes - Enhanced for Liquid Glass
  const theme = {
    bg: 'bg-transparent',
    cardBg: 'bg-[#1c1c1e]/80 backdrop-blur-3xl border border-white/10 shadow-2xl', // Darker, more blur
    text: 'text-white',
    textMuted: 'text-white/60',
    textFaint: 'text-white/40',
    border: 'border-white/10',
    hoverBg: 'hover:bg-white/10',
    inputBg: 'bg-black/20 focus:bg-black/40 border-white/10 focus:border-white/20',
  };

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black">
        {/* Mouse Following Light */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <motion.div 
             className="absolute w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen"
             animate={{ 
               x: mousePosition.x - 400, 
               y: mousePosition.y - 400 
             }}
             transition={{ type: "spring", damping: 30, stiffness: 50, mass: 0.5 }}
           />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="relative z-10 w-full max-w-md p-10 rounded-[2.5rem] bg-[#161618]/60 backdrop-blur-3xl border border-white/10 shadow-2xl ring-1 ring-white/5"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-white/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
              <Layout className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight text-white drop-shadow-sm">Blockra</h1>
            <p className="text-white/60 text-lg font-medium leading-relaxed max-w-[280px]">The next generation of web design. Fluid, fast, and intuitive.</p>
          </div>
          
          <div className="space-y-4">
            {!showEmailForm ? (
              <button 
                onClick={() => setShowEmailForm(true)}
                className="w-full py-4 px-6 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold text-base transition-all shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Sign In to Blockra <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleEmailAuth}
                className="space-y-4 pt-2"
              >
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs font-medium text-center">
                    {error}
                  </div>
                )}
                {isRegistering && (
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} text-white placeholder-white/30 outline-none transition-all`}
                      placeholder="johndoe"
                    />
                  </div>
                )}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">{isRegistering ? 'Email Address' : 'Email or Username'}</label>
                  <input
                    type={isRegistering ? "email" : "text"}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} text-white placeholder-white/30 outline-none transition-all`}
                    placeholder={isRegistering ? "name@example.com" : "name@example.com or username"}
                  />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} text-white placeholder-white/30 outline-none transition-all`}
                    placeholder="••••••••"
                  />
                </div>
                
                {isRegistering && (
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} text-white placeholder-white/30 outline-none transition-all`}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    isRegistering ? 'Create Account' : 'Sign In'
                  )}
                </button>

                <div className="flex justify-between items-center text-xs pt-2 px-1">
                  <button 
                    type="button"
                    onClick={() => { setShowEmailForm(false); setError(''); }}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                    className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                  >
                    {isRegistering ? 'Already have an account?' : 'Need an account?'}
                  </button>
                </div>
              </motion.form>
            )}

            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="px-3 bg-[#161618] text-white/20 rounded-full">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={() => onLogin(true, true)}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> Guest Access
            </button>
          </div>
          
          <p className="mt-10 text-[10px] text-white/20 font-medium tracking-widest uppercase">
            Blockra
          </p>
        </motion.div>
      </div>
    );
  }

  // Apply UI Preferences
  const fontFamilyClass = uiPreferences?.fontFamily === 'Roboto' ? 'font-roboto' : uiPreferences?.fontFamily === 'Montserrat' ? 'font-montserrat' : 'font-sans';
  const densityClass = uiPreferences?.uiDensity === 'compact' ? 'px-4 sm:px-4 py-6' : uiPreferences?.uiDensity === 'spacious' ? 'px-4 sm:px-12 py-16' : 'px-4 sm:px-8 py-12';

  return (
    <div className={`min-h-screen ${fontFamilyClass} bg-black/90`}>
      {/* Header */}
      <header className={`h-20 border-b ${theme.border} bg-[#161618]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50`}>
        <div className="flex items-center gap-4">
          {uiPreferences?.customLogo ? (
            <img src={uiPreferences.customLogo} alt="Logo" className="h-8 object-contain" />
          ) : (
            <>
              <div className={`w-10 h-10 ${getThemeClass(themeColor, 'gradientIcon')} rounded-xl flex items-center justify-center ${getThemeClass(themeColor, 'shadowLg')} ring-1 ring-white/10`}>
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white block leading-none">Blockra</span>
              </div>
            </>
          )}
          {isLoggedIn && userProfile.plan && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${userProfile.plan === 'Pro' || userProfile.plan === 'Agency' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
              {userProfile.plan === 'Pro' || userProfile.plan === 'Agency' ? '👑 ' : ''}{userProfile.plan}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isLoggedIn && userProfile.plan !== 'Agency' && userProfile.plan !== 'Pro' && (
            <button className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
              Upgrade Plan
            </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`flex items-center gap-3 px-4 py-2 rounded-full border ${theme.border} bg-white/5 hover:bg-white/10 transition-all hover:scale-105 active:scale-95`}
            >
              <div className={`w-6 h-6 rounded-full ${getThemeClass(themeColor, 'gradientAvatar')} flex items-center justify-center text-[10px] font-bold`}>
                {userProfile.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-white">Hi, {userProfile.name}</span>
              <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute top-full right-0 mt-3 w-64 rounded-2xl border ${theme.border} bg-[#1c1c1e] shadow-2xl overflow-hidden z-50 ring-1 ring-white/10`}
                >
                  <div className="p-4 border-b border-white/5">
                     <p className="text-sm font-bold text-white">{userProfile.name} {userProfile.surname}</p>
                     <p className="text-xs text-white/40">{userProfile.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => {
                        onOpenSettings('profile');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${theme.hoverBg} transition-colors text-white/80 hover:text-white`}
                    >
                      <User className={`w-4 h-4 ${getThemeClass(themeColor, 'iconColor')}`} />
                      Account
                    </button>
                    <button 
                      onClick={() => {
                        onOpenSettings('settings');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${theme.hoverBg} transition-colors text-white/80 hover:text-white`}
                    >
                      <Settings className={`w-4 h-4 ${getThemeClass(themeColor, 'iconColor')}`} />
                      Settings
                    </button>
                    <button 
                      onClick={() => {
                        onOpenSettings('appearance');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${theme.hoverBg} transition-colors text-white/80 hover:text-white`}
                    >
                      <Layout className={`w-4 h-4 text-${themeColor}-500`} />
                      Customization
                    </button>
                    <div className={`h-px ${theme.border} my-1 mx-2`}></div>
                    <button 
                      onClick={() => onLogin(false)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto ${densityClass}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-white tracking-tight">Your Projects</h2>
            <p className={theme.textMuted}>Manage and publish your websites with ease.</p>
          </div>
          <button 
            onClick={onCreateProject}
            disabled={isGuest}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 ${isGuest ? 'bg-white/5 text-white/40 cursor-not-allowed' : `${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white hover:scale-[1.02] active:scale-[0.98] ${getThemeClass(themeColor, 'shadowLg')}`} rounded-2xl font-bold transition-all ring-1 ring-white/20`}
          >
            {isGuest ? <Crown className="w-5 h-5 text-yellow-500/70" /> : <Plus className="w-5 h-5" />}
            {isGuest ? 'New Project (Pro)' : 'New Project'}
          </button>
        </div>

        {projects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-[#1c1c1e]/60 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all`}
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full bg-[#1c1c1e]/60 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-white focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all appearance-none`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-[#1c1c1e] text-white">{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className={`text-center py-24 border border-dashed ${theme.border} rounded-[2.5rem] bg-white/5 backdrop-blur-sm`}>
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
              <FolderOpen className="w-10 h-10 opacity-30 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">No projects found</h3>
            <p className={`${theme.textMuted} mb-10 max-w-md mx-auto text-lg`}>Get started by creating your first website project. It only takes a few seconds.</p>
            <button 
              onClick={onCreateProject}
              className={`px-8 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-medium transition-colors border border-white/10`}
            >
              Create Project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className={`text-center py-24 border border-dashed ${theme.border} rounded-[2.5rem] bg-white/5 backdrop-blur-sm`}>
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
              <Search className="w-10 h-10 opacity-30 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">No matching projects</h3>
            <p className={`${theme.textMuted} mb-10 max-w-md mx-auto text-lg`}>Try adjusting your search or filter criteria.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className={`px-8 py-3 bg-white/10 text-white hover:bg-white/20 rounded-xl font-medium transition-colors border border-white/10`}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => onSelectProject(project.name)}
                className={`group relative cursor-pointer rounded-[2rem] border ${theme.border} bg-[#1c1c1e]/60 overflow-hidden transition-all hover:shadow-2xl ${getThemeClass(themeColor, 'cardHoverShadow')} ${getThemeClass(themeColor, 'cardHoverBorder')} backdrop-blur-md flex flex-col`}
              >
                {/* Preview Area (Mock) */}
                <div className={`h-48 w-full bg-gradient-to-br from-white/5 to-white/10 relative flex items-center justify-center border-b ${theme.border} ${getThemeClass(themeColor, 'cardPreviewGradient')} transition-colors shrink-0 overflow-hidden`}>
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                  
                  {project.category === 'Blank Project' ? (
                    <div className="absolute inset-4 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center shadow-xl opacity-80 group-hover:opacity-100 transition-opacity">
                      <Layout className={`w-12 h-12 ${theme.textMuted} opacity-20`} />
                    </div>
                  ) : project.category === 'Landing Page' ? (
                    <div className="absolute inset-4 bg-white/5 rounded-lg border border-white/10 p-2 flex flex-col gap-2 shadow-xl opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="h-4 w-full bg-blue-500/50 rounded flex items-center justify-center"><div className="w-1/3 h-1 bg-white/50 rounded"></div></div>
                      <div className="flex-1 bg-white/5 rounded flex flex-col items-center justify-center gap-2">
                        <div className="w-1/2 h-2 bg-white/40 rounded"></div>
                        <div className="w-3/4 h-1 bg-white/20 rounded"></div>
                        <div className="w-1/4 h-3 bg-blue-500/80 rounded-full mt-1"></div>
                      </div>
                      <div className="h-8 w-full flex gap-2">
                        <div className="flex-1 bg-white/5 rounded"></div>
                        <div className="flex-1 bg-white/5 rounded"></div>
                        <div className="flex-1 bg-white/5 rounded"></div>
                      </div>
                    </div>
                  ) : project.category === 'Portfolio' ? (
                    <div className="absolute inset-4 bg-zinc-900/80 rounded-lg border border-white/10 p-4 flex flex-col items-center justify-center gap-3 shadow-xl opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/20"></div>
                      <div className="w-1/2 h-2 bg-white/60 rounded"></div>
                      <div className="w-3/4 h-1 bg-white/30 rounded"></div>
                      <div className="flex gap-2 mt-2">
                        <div className="w-12 h-3 bg-white/80 rounded-sm"></div>
                        <div className="w-12 h-3 border border-white/40 rounded-sm"></div>
                      </div>
                    </div>
                  ) : project.category === 'Corporate' ? (
                    <div className="absolute inset-4 bg-slate-50/90 rounded-lg border border-white/10 flex flex-col shadow-xl opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="h-4 w-full border-b border-black/10 flex justify-between items-center px-2">
                        <div className="w-8 h-1.5 bg-slate-800 rounded"></div>
                        <div className="flex gap-1">
                          <div className="w-4 h-1 bg-slate-400 rounded"></div>
                          <div className="w-4 h-1 bg-slate-400 rounded"></div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-2">
                        <div className="w-2/3 h-3 bg-slate-800 rounded"></div>
                        <div className="w-full h-1 bg-slate-400 rounded"></div>
                        <div className="w-4/5 h-1 bg-slate-400 rounded"></div>
                      </div>
                    </div>
                  ) : (
                    <Layout className={`w-16 h-16 ${theme.textMuted} opacity-20 group-hover:scale-110 group-hover:opacity-30 ${getThemeClass(themeColor, 'cardIconHover')} transition-all duration-500`} />
                  )}
                  
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-10">
                    {!isGuest && (
                      <button 
                        onClick={(e) => onDeleteProject(project.name, e)}
                        className="p-3 bg-black/40 hover:bg-red-500 text-white/60 hover:text-white rounded-xl backdrop-blur-md transition-colors border border-white/10"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-xl truncate pr-4 text-white ${getThemeClass(themeColor, 'cardTitleHover')} transition-colors`}>{project.name}</h3>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-lg ${getThemeClass(themeColor, 'badgeBg')} ${getThemeClass(themeColor, 'badgeText')} border ${getThemeClass(themeColor, 'badgeBorder')} shrink-0`}>
                      {project.category || 'Blank Project'}
                    </span>
                  </div>
                  
                  {project.description && (
                    <p className={`text-sm ${theme.textMuted} mb-4 line-clamp-2 flex-1`}>
                      {project.description}
                    </p>
                  )}
                  
                  <p className={`text-xs ${theme.textFaint} mb-6 flex items-center gap-2 mt-auto`}>
                    <Sparkles className="w-3 h-3 text-yellow-500/70" /> 
                    {project.updatedAt ? `Updated ${new Date(project.updatedAt).toLocaleDateString()}` : 'Last edited recently'}
                  </p>
                  
                  <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${window.location.origin}/sites/${project.name}/dist/index.html`, '_blank');
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-white hover:text-${themeColor}-400`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Live
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-white text-black hover:bg-gray-200 transition-colors shadow-lg shadow-white/5`}>
                      Edit Site <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
