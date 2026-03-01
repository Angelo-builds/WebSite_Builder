import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FolderOpen, Plus, Globe, Trash2, LogOut, Layout, ExternalLink, User, Settings, ChevronDown } from 'lucide-react';

interface UserProfile {
  name: string;
  surname: string;
  email: string;
  role: string;
}

interface DashboardProps {
  projects: string[];
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  isDarkMode: boolean;
  userProfile: UserProfile;
  themeColor: string;
  onOpenSettings: (tab: 'profile' | 'appearance' | 'settings') => void;
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
  onOpenSettings
}: DashboardProps & { isLoggedIn: boolean; onLogin: (status: boolean, isGuest?: boolean) => void }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would call the backend API
    console.log('Authenticating with:', { email, password, isRegistering });
    onLogin(true, false);
  };

  // Theme classes
  const theme = {
    bg: isDarkMode ? 'bg-[#0f0f11]' : 'bg-gray-50',
    cardBg: isDarkMode ? 'bg-[#18181b]' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    hoverBg: isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50',
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-4 ${theme.bg} ${theme.text}`}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-2xl border ${theme.border} ${theme.cardBg} shadow-2xl text-center my-auto`}
        >
          <div className={`w-16 h-16 bg-${themeColor}-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-${themeColor}-500/20`}>
            <Layout className={`w-8 h-8 text-${themeColor}-500`} />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Proxmox SiteBuilder</h1>
          <p className={`${theme.textMuted} mb-8`}>Sign in to manage your projects and deployments.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => onLogin(true, false)}
              className={`w-full py-3 px-4 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-${themeColor}-900/20 active:scale-[0.98]`}
            >
              Sign In with Proxmox
            </button>
            
            {!showEmailForm ? (
              <button 
                onClick={() => setShowEmailForm(true)}
                className={`w-full py-2 px-4 text-sm font-medium ${theme.textMuted} hover:${theme.text} transition-colors flex items-center justify-center gap-2 group`}
              >
                Continue with Email
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleEmailAuth}
                className="space-y-3"
              >
                <div className="space-y-1 text-left">
                  <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.bg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-${themeColor}-500 transition-all`}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.bg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-${themeColor}-500 transition-all`}
                    placeholder="••••••••"
                  />
                </div>
                
                {isRegistering && (
                  <div className="space-y-1 text-left">
                    <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.bg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-${themeColor}-500 transition-all`}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  className={`w-full py-3 px-4 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-${themeColor}-900/20 active:scale-[0.98]`}
                >
                  {isRegistering ? 'Create Account' : 'Sign In'}
                </button>

                <div className="flex justify-between items-center text-xs pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className={`${theme.textMuted} hover:${theme.text}`}
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className={`text-${themeColor}-500 hover:underline`}
                  >
                    {isRegistering ? 'Already have an account?' : 'Need an account?'}
                  </button>
                </div>
              </motion.form>
            )}

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${theme.border}`}></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={`px-2 ${theme.cardBg} ${theme.textMuted}`}>Or</span>
              </div>
            </div>

            <button 
              onClick={() => onLogin(true, true)}
              className={`w-full py-3 px-4 ${theme.hoverBg} border ${theme.border} rounded-xl font-medium transition-all text-sm opacity-70 hover:opacity-100`}
            >
              Continue as Guest
            </button>
          </div>
          
          <p className="mt-8 text-xs text-gray-500">
            v2.4.0 • Powered by GrapesJS & React
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans`}>
      {/* Header */}
      <header className={`h-16 border-b ${theme.border} ${theme.cardBg} flex items-center justify-between px-8 sticky top-0 z-10`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 bg-${themeColor}-600 rounded-lg flex items-center justify-center shadow-lg shadow-${themeColor}-900/20`}>
            <Layout className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Proxmox SiteBuilder</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${theme.border} ${theme.bg} hover:border-${themeColor}-500/50 transition-colors`}
            >
              <User className={`w-4 h-4 text-${themeColor}-500`} />
              <span className="text-sm font-medium">Hi, {userProfile.name}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSettingsOpen && (
              <div className={`absolute top-full right-0 mt-2 w-56 rounded-xl border ${theme.border} ${theme.cardBg} shadow-xl overflow-hidden z-20`}>
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => {
                      onOpenSettings('profile');
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${theme.hoverBg} transition-colors`}
                  >
                    <User className={`w-4 h-4 text-${themeColor}-500`} />
                    Account
                  </button>
                  <button 
                    onClick={() => {
                      onOpenSettings('settings');
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${theme.hoverBg} transition-colors`}
                  >
                    <Settings className={`w-4 h-4 text-${themeColor}-500`} />
                    Settings
                  </button>
                  <button 
                    onClick={() => {
                      onOpenSettings('appearance');
                      setIsSettingsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${theme.hoverBg} transition-colors`}
                  >
                    <Layout className={`w-4 h-4 text-${themeColor}-500`} />
                    Customization
                  </button>
                  <div className={`h-px ${theme.border} my-1`}></div>
                  <button 
                    onClick={() => onLogin(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 text-red-500 transition-colors`}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Your Projects</h2>
            <p className={theme.textMuted}>Manage and publish your websites.</p>
          </div>
          <button 
            onClick={onCreateProject}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-${themeColor}-900/20 hover:scale-105 active:scale-95`}
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className={`text-center py-20 border-2 border-dashed ${theme.border} rounded-3xl ${theme.cardBg}`}>
            <div className="w-20 h-20 bg-gray-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 opacity-40" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects found</h3>
            <p className={`${theme.textMuted} mb-8 max-w-md mx-auto`}>Get started by creating your first website project. It only takes a few seconds.</p>
            <button 
              onClick={onCreateProject}
              className={`px-6 py-2.5 bg-${themeColor}-600/10 text-${themeColor}-500 hover:bg-${themeColor}-600/20 rounded-lg font-medium transition-colors`}
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                onClick={() => onSelectProject(project)}
                className={`group relative cursor-pointer rounded-2xl border ${theme.border} ${theme.cardBg} overflow-hidden transition-all hover:shadow-xl hover:border-${themeColor}-500/30`}
              >
                {/* Preview Area (Mock) */}
                <div className={`h-40 w-full ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'} relative flex items-center justify-center`}>
                  <Layout className={`w-12 h-12 ${theme.textMuted} opacity-20 group-hover:scale-110 transition-transform duration-500`} />
                  
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => onDeleteProject(project, e)}
                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg backdrop-blur-sm transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg truncate pr-4">{project}</h3>
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${isDarkMode ? `bg-${themeColor}-500/10 text-${themeColor}-400` : `bg-${themeColor}-100 text-${themeColor}-700`}`}>
                      Active
                    </span>
                  </div>
                  <p className={`text-xs ${theme.textMuted} mb-6`}>Last edited just now</p>
                  
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-500/10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`${window.location.origin}/sites/${project}/dist/index.html`, '_blank');
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium ${theme.hoverBg} border ${theme.border} transition-colors hover:text-${themeColor}-500`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Live
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white transition-colors shadow-lg shadow-${themeColor}-900/20`}>
                      Edit Site
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
