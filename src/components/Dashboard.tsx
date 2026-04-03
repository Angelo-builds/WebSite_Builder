import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderOpen, Plus, Globe, Trash2, LogOut, Layout, ExternalLink, User, Settings, ChevronDown, ArrowRight, Sparkles, Search, Filter, Crown, X, Check, AlertCircle, Share2, FlaskConical, Database } from 'lucide-react';
import { getThemeClass } from '../theme';
import { account } from '../lib/appwrite';
import { ID } from 'appwrite';
import { ShareModal } from './ShareModal';
import { UserProfile } from '../contexts/AuthContext';

export interface Project {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  updatedAt?: string;
  sharedWith?: { email: string, role: 'creator' | 'modifier' | 'contributor' | 'editor' }[];
  owner?: string;
  publishedUrl?: string;
  status?: string;
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
  isLoadingProjects?: boolean;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  isDarkMode: boolean;
  userProfile: UserProfile;
  themeColor: string;
  onOpenSettings: (tab: 'profile' | 'appearance' | 'settings' | 'plan') => void;
  uiPreferences: UIPreferences;
  updateAvailable?: boolean;
  onUpdateSharing?: (projectName: string, sharedWith: any[]) => void;
  onUpgrade: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function Dashboard({ 
  projects, 
  isLoadingProjects = false,
  onSelectProject, 
  onCreateProject, 
  onDeleteProject,
  isDarkMode,
  isLoggedIn,
  onLogin,
  userProfile,
  themeColor,
  onOpenSettings,
  uiPreferences,
  updateAvailable,
  onUpdateSharing,
  onUpgrade,
  showToast
}: DashboardProps & { isLoggedIn: boolean; onLogin: (status: boolean, isGuest?: boolean, user?: any) => void }) {
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
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [shareModalProject, setShareModalProject] = useState<string | null>(null);

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

    if (!isRegistering && !email.includes('@')) {
      if (showToast) {
        showToast('Currently, only Email is supported for login. Please use your email address.', 'warning');
      } else {
        setError('Currently, only Email is supported for login. Please use your email address.');
      }
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        // Create user in Appwrite
        const user = await account.create(
          ID.unique(),
          email,
          password,
          username || email.split('@')[0]
        );
        
        // Log them in immediately after registration
        await account.createEmailPasswordSession(email, password);
        
        // Update prefs with default role and plan
        await account.updatePrefs({
          username: username || email.split('@')[0],
          role: 'User',
          plan: 'Free'
        });

        onLogin(true, false, {
          name: user.name,
          email: user.email,
          username: username || email.split('@')[0],
          role: 'User',
          plan: 'Free'
        });
      } else {
        // Login with Appwrite
        await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        
        onLogin(true, false, {
          name: user.name.split(' ')[0] || 'User',
          surname: user.name.split(' ').slice(1).join(' ') || '',
          email: user.email,
          username: user.prefs?.username || user.name.toLowerCase().replace(/\s+/g, ''),
          role: user.prefs?.role || 'User',
          plan: user.prefs?.plan || 'Free'
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let errorMessage = 'An error occurred during authentication';
      
      if (err.type === 'user_invalid_credentials' || err.code === 401) {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (err.type === 'user_already_exists') {
        errorMessage = 'An account with this email already exists. Redirecting to login...';
        setTimeout(() => {
          setIsRegistering(false);
          setError('');
          setIsLoading(false);
        }, 2500);
      } else if (err.type === 'password_recently_used' || err.type === 'password_personal_data') {
        errorMessage = 'Please choose a stronger password.';
      } else if (err.type === 'user_blocked') {
        errorMessage = 'This account has been blocked. Please contact support.';
      } else if (err.message === 'Failed to fetch' || err.code === 503 || err.code === 500) {
        errorMessage = 'Cannot connect to the server. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (showToast && err.type !== 'user_already_exists') {
        showToast(errorMessage, 'error');
      } else {
        setError(errorMessage);
      }
      
      if (err.type === 'user_already_exists') {
        return; // Prevent setting isLoading to false immediately
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSharing = (projectName: string, newSharedWith: any[]) => {
    if (onUpdateSharing) {
      onUpdateSharing(projectName, newSharedWith);
    }
  };

  const handleLogout = async () => {
    try {
        // Proviamo a chiudere la sessione
        await account.deleteSession('current');
    } catch (error) {
        // Se fallisce (es. sessione già scaduta), non mostrare errori brutti
    } finally {
        // In ogni caso, puliamo lo stato del frontend
        onLogin(false);
    }
  };

  // Theme classes - Enhanced for Liquid Glass
  const theme = {
    bg: isDarkMode ? 'bg-black/90' : 'bg-gray-50',
    headerBg: isDarkMode ? 'bg-[#161618]/80' : 'bg-white/80',
    cardBg: isDarkMode ? 'bg-[#1c1c1e]/60' : 'bg-white/60',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textMuted: isDarkMode ? 'text-white/60' : 'text-gray-500',
    textFaint: isDarkMode ? 'text-white/40' : 'text-gray-400',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    hoverBg: isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100',
    inputBg: isDarkMode ? 'bg-black/20 focus:bg-black/40 border-white/10 focus:border-white/20' : 'bg-gray-100 focus:bg-white border-gray-200 focus:border-gray-300',
    dropdownBg: isDarkMode ? 'bg-[#1c1c1e]' : 'bg-white',
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
             className="absolute w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"
             style={{ animationDuration: '4s' }}
             animate={{ 
               x: mousePosition.x - 400, 
               y: mousePosition.y - 400 
             }}
             transition={{ type: "spring", damping: 30, stiffness: 50, mass: 0.5 }}
           />
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
                  <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} text-white placeholder-white/30 outline-none transition-all`}
                    placeholder="name@example.com"
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
    <div className={`min-h-screen ${fontFamilyClass} ${theme.bg} transition-colors duration-300`}>
      {/* Header */}
      <header className={`h-20 border-b ${theme.border} ${theme.headerBg} backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50 transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          {uiPreferences?.customLogo ? (
            <img src={uiPreferences.customLogo} alt="Logo" className="h-8 object-contain" />
          ) : (
            <>
              <div className={`w-10 h-10 ${getThemeClass(themeColor, 'gradientIcon')} rounded-xl flex items-center justify-center ${getThemeClass(themeColor, 'shadowLg')} ring-1 ring-white/10`}>
                <Layout className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className={`font-bold text-lg tracking-tight ${theme.text} block leading-none`}>Blockra</span>
              </div>
            </>
          )}
          {isLoggedIn && userProfile.plan && (
            <div className="flex items-center gap-2 ml-2">
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${userProfile.plan === 'Pro' || userProfile.plan === 'Team' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                {userProfile.plan === 'Pro' || userProfile.plan === 'Team' ? '👑 ' : ''}{userProfile.plan}
              </span>
              {userProfile.role?.toLowerCase() === 'beta tester' && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <FlaskConical className="w-3 h-3" /> Beta Tester
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`flex items-center gap-3 px-4 py-2 rounded-full border ${theme.border} ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'} transition-all hover:scale-105 active:scale-95 relative`}
            >
              {updateAvailable && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
              )}
              <div className={`w-6 h-6 rounded-full ${getThemeClass(themeColor, 'gradientAvatar')} flex items-center justify-center text-[10px] font-bold text-white`}>
                {(userProfile.username || userProfile.name || userProfile.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className={`text-sm font-medium ${theme.text}`}>Hi, {userProfile.username || userProfile.name || userProfile.email.split('@')[0]}</span>
              <ChevronDown className={`w-3 h-3 ${theme.textFaint} transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute top-full right-0 mt-3 w-64 rounded-2xl border ${theme.border} ${theme.dropdownBg} shadow-2xl overflow-hidden z-50 ring-1 ${isDarkMode ? 'ring-white/10' : 'ring-black/5'}`}
                >
                  <div className={`p-4 border-b ${theme.border}`}>
                     <p className={`text-sm font-bold ${theme.text}`}>
                       {userProfile.name || userProfile.surname ? `${userProfile.name} ${userProfile.surname}`.trim() : userProfile.username || userProfile.email.split('@')[0]}
                     </p>
                     <p className={`text-xs ${theme.textFaint}`}>{userProfile.email}</p>
                   </div>
                   <div className="p-2 space-y-1">
                    {updateAvailable && (
                      <button 
                        onClick={() => {
                          onOpenSettings('settings');
                          setIsSettingsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium`}
                      >
                        <AlertCircle className="w-4 h-4" />
                        Update Available
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        onOpenSettings('profile');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${theme.hoverBg} transition-colors ${theme.textMuted} hover:${theme.text}`}
                    >
                      <User className={`w-4 h-4 ${getThemeClass(themeColor, 'iconColor')}`} />
                      Account
                    </button>
                    <button 
                      onClick={() => {
                        onOpenSettings('settings');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${theme.hoverBg} transition-colors ${theme.textMuted} hover:${theme.text} relative`}
                    >
                      <Settings className={`w-4 h-4 ${getThemeClass(themeColor, 'iconColor')}`} />
                      Settings
                      {updateAvailable && (
                        <span className="absolute right-3 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                    <button 
                      onClick={() => {
                        onOpenSettings('appearance');
                        setIsSettingsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${theme.hoverBg} transition-colors ${theme.textMuted} hover:${theme.text}`}
                    >
                      <Layout className={`w-4 h-4 text-${themeColor}-500`} />
                      Customization
                    </button>
                    <div className={`h-px ${theme.border} my-1 mx-2`}></div>
                    <button 
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-red-500/10 text-red-500 transition-colors`}
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
        {isLoggedIn && userProfile.plan && userProfile.plan !== 'Team' && isBannerVisible && (
          <div className={`mb-8 p-4 sm:p-6 rounded-2xl border ${isDarkMode ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'} flex flex-col sm:flex-row items-start sm:items-center justify-start gap-6 relative`}>
            <button 
              onClick={() => setIsBannerVisible(false)}
              className={`absolute top-2 right-2 p-1.5 rounded-full ${isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-blue-100 text-blue-400 hover:text-blue-600'} transition-colors`}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="pr-6 flex-1">
              <h3 className={`text-lg font-bold ${theme.text} flex items-center gap-2`}>
                Current Plan: <span className="text-blue-500">{userProfile.plan}</span>
                {userProfile.plan === 'Pro' && <Crown className="w-4 h-4 text-amber-500" />}
              </h3>
              <p className={`text-sm ${theme.textMuted} mt-1`}>
                {isGuest ? (
                  "You are exploring as a Guest. Create an account to save projects and unlock features."
                ) : userProfile.role?.toLowerCase() === 'beta tester' || userProfile.plan?.toLowerCase() === 'beta tester' ? (
                  "You are a Beta Tester! You can switch between different plans in your Account Settings to test features."
                ) : (
                  <>
                    {userProfile.plan === 'Free' && "You are on the Free plan. Upgrade to unlock advanced customization and unlimited projects."}
                    {userProfile.plan === 'Basic' && "You are on the Basic plan. Upgrade to Pro for premium templates and advanced UI settings."}
                    {userProfile.plan === 'Pro' && "You are on the Pro plan. Enjoy all premium features! Upgrade to Team for collaboration."}
                  </>
                )}
              </p>
            </div>
            {isGuest ? (
              <button 
                onClick={onUpgrade}
                className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 mt-4 sm:mt-0 mr-8 flex items-center gap-2`}
              >
                Create Account
              </button>
            ) : userProfile.role?.toLowerCase() === 'beta tester' || userProfile.plan?.toLowerCase() === 'beta tester' ? (
              <button 
                onClick={() => {
                  onOpenSettings('plan');
                  setIsSettingsOpen(false);
                }}
                className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 mt-4 sm:mt-0 mr-8 flex items-center gap-2`}
              >
                <FlaskConical className="w-4 h-4" /> Change Plan
              </button>
            ) : (
              <>
                {userProfile.plan !== 'Pro' && (
                  <button 
                    onClick={onUpgrade}
                    className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 mt-4 sm:mt-0 mr-8`}
                  >
                    Upgrade to {userProfile.plan === 'Free' ? 'Basic' : 'Pro'}
                  </button>
                )}
                {userProfile.plan === 'Pro' && (
                  <button 
                    onClick={onUpgrade}
                    className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm'} transition-all mt-4 sm:mt-0 mr-8`}
                  >
                    View Team Plans
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {isLoggedIn && userProfile.plan && (
          <div className={`mb-8 p-6 rounded-3xl border ${theme.border} ${theme.cardBg} backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-6`}>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className={`w-12 h-12 rounded-2xl ${getThemeClass(themeColor, 'bg')} bg-opacity-10 flex items-center justify-center text-${themeColor}-500`}>
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${theme.text}`}>Storage Usage</h3>
                <p className={`text-sm ${theme.textMuted}`}>Your current plan: <span className={`text-${themeColor}-500 font-bold`}>{userProfile.plan}</span></p>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-md">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${theme.text}`}>
                  {((userProfile.usedStorage || 0) / (1024 * 1024)).toFixed(1)} MB used
                </span>
                <span className={`text-sm font-medium ${theme.textFaint}`}>
                  of {
                    userProfile.plan === 'Starter' ? '100 MB' :
                    userProfile.plan === 'Basic' ? '1 GB' :
                    userProfile.plan === 'Pro' ? '5 GB' :
                    userProfile.plan === 'Team' ? '10 GB' : '100 MB'
                  }
                </span>
              </div>
              <div className={`w-full h-3 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} overflow-hidden shadow-inner`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((userProfile.usedStorage || 0) / (
                    userProfile.plan === 'Starter' ? 100 * 1024 * 1024 :
                    userProfile.plan === 'Basic' ? 1024 * 1024 * 1024 :
                    userProfile.plan === 'Pro' ? 5 * 1024 * 1024 * 1024 :
                    userProfile.plan === 'Team' ? 10 * 1024 * 1024 * 1024 : 100 * 1024 * 1024
                  )) * 100)}%` }}
                  className={`h-full rounded-full ${getThemeClass(themeColor, 'gradientPrimary')} shadow-lg`}
                />
              </div>
            </div>
            
            <button 
              onClick={onUpgrade}
              className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold ${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white shadow-lg transition-all hover:scale-105 active:scale-95`}
            >
              Upgrade Storage
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-6">
          <div>
            <h2 className={`text-3xl sm:text-4xl font-bold mb-3 ${theme.text} tracking-tight`}>Your Projects</h2>
            <p className={theme.textMuted}>Manage and publish your websites with ease.</p>
          </div>
          <button 
            onClick={() => {
              if (isGuest) {
                onUpgrade();
              } else {
                onCreateProject();
              }
            }}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 ${isGuest ? 'bg-white/5 text-white/40 hover:bg-white/10' : `${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white hover:scale-[1.02] active:scale-[0.98] ${getThemeClass(themeColor, 'shadowLg')}`} rounded-2xl font-bold transition-all ring-1 ring-white/20`}
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
                className={`w-full ${theme.cardBg} border ${theme.border} rounded-2xl pl-12 pr-4 py-3 ${theme.text} placeholder-${theme.textMuted} focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all`}
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textFaint}`} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full ${theme.cardBg} border ${theme.border} rounded-2xl pl-12 pr-10 py-3 ${theme.text} focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all appearance-none`}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className={`${theme.dropdownBg} ${theme.text}`}>{cat}</option>
                ))}
              </select>
              <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textFaint} pointer-events-none`} />
            </div>
          </div>
        )}

        {isLoadingProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`p-6 rounded-[2rem] border ${theme.border} ${isDarkMode ? 'bg-white/5' : 'bg-white'} animate-pulse`}>
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                  <div className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                </div>
                <div className={`h-6 w-3/4 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} mb-3`}></div>
                <div className={`h-4 w-1/2 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} mb-8`}></div>
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-dashed border-white/10">
                  <div className={`h-4 w-1/3 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                  <div className={`h-8 w-24 rounded-xl ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className={`text-center py-24 border border-dashed ${theme.border} rounded-[2.5rem] ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} backdrop-blur-sm`}>
            <div className={`w-24 h-24 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ${isDarkMode ? 'ring-white/10' : 'ring-gray-200'}`}>
              <FolderOpen className={`w-10 h-10 opacity-30 ${theme.text}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${theme.text}`}>No projects found</h3>
            <p className={`${theme.textMuted} mb-10 max-w-md mx-auto text-lg`}>Get started by creating your first website project. It only takes a few seconds.</p>
            <button 
              onClick={() => {
                if (isGuest) {
                  onUpgrade();
                } else {
                  onCreateProject();
                }
              }}
              className={`px-8 py-3 ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} ${theme.text} rounded-xl font-medium transition-colors border ${theme.border}`}
            >
              Create Project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className={`text-center py-24 border border-dashed ${theme.border} rounded-[2.5rem] ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} backdrop-blur-sm`}>
            <div className={`w-24 h-24 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ${isDarkMode ? 'ring-white/10' : 'ring-gray-200'}`}>
              <Search className={`w-10 h-10 opacity-30 ${theme.text}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${theme.text}`}>No matching projects</h3>
            <p className={`${theme.textMuted} mb-10 max-w-md mx-auto text-lg`}>Try adjusting your search or filter criteria.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className={`px-8 py-3 ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} ${theme.text} rounded-xl font-medium transition-colors border ${theme.border}`}
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
                className={`group relative cursor-pointer rounded-[2rem] border ${theme.border} ${theme.cardBg} overflow-hidden transition-all hover:shadow-2xl ${getThemeClass(themeColor, 'cardHoverShadow')} ${getThemeClass(themeColor, 'cardHoverBorder')} backdrop-blur-md flex flex-col`}
              >
                {/* Preview Area (Mock) */}
                <div className={`h-48 w-full ${isDarkMode ? 'bg-gradient-to-br from-white/5 to-white/10' : 'bg-gradient-to-br from-gray-100 to-gray-200'} relative flex items-center justify-center border-b ${theme.border} ${getThemeClass(themeColor, 'cardPreviewGradient')} transition-colors shrink-0 overflow-hidden`}>
                  
                  {project.category === 'Blank Project' ? (
                    <div className={`absolute inset-4 border-2 border-dashed ${isDarkMode ? 'border-white/20' : 'border-gray-300'} rounded-lg flex items-center justify-center shadow-xl opacity-80 group-hover:opacity-100 transition-opacity`}>
                      <Layout className={`w-12 h-12 ${theme.textMuted} opacity-20`} />
                    </div>
                  ) : project.category === 'Landing Page' ? (
                    <div className={`absolute inset-4 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} rounded-lg border p-2 flex flex-col gap-2 shadow-xl opacity-80 group-hover:opacity-100 transition-opacity`}>
                      <div className="h-4 w-full bg-blue-500/50 rounded flex items-center justify-center"><div className={`w-1/3 h-1 ${isDarkMode ? 'bg-white/50' : 'bg-gray-300'} rounded`}></div></div>
                      <div className={`flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded flex flex-col items-center justify-center gap-2`}>
                        <div className={`w-1/2 h-2 ${isDarkMode ? 'bg-white/40' : 'bg-gray-300'} rounded`}></div>
                        <div className={`w-3/4 h-1 ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'} rounded`}></div>
                        <div className="w-1/4 h-3 bg-blue-500/80 rounded-full mt-1"></div>
                      </div>
                      <div className="h-8 w-full flex gap-2">
                        <div className={`flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} rounded`}></div>
                        <div className={`flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} rounded`}></div>
                        <div className={`flex-1 ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'} rounded`}></div>
                      </div>
                    </div>
                  ) : project.category === 'Portfolio' ? (
                    <div className={`absolute inset-4 ${isDarkMode ? 'bg-zinc-900/80 border-white/10' : 'bg-zinc-800 border-gray-700'} rounded-lg border p-4 flex flex-col items-center justify-center gap-3 shadow-xl opacity-80 group-hover:opacity-100 transition-opacity`}>
                      <div className="w-12 h-12 rounded-full bg-white/20"></div>
                      <div className="w-1/2 h-2 bg-white/60 rounded"></div>
                      <div className="w-3/4 h-1 bg-white/30 rounded"></div>
                      <div className="flex gap-2 mt-2">
                        <div className="w-12 h-3 bg-white/80 rounded-sm"></div>
                        <div className="w-12 h-3 border border-white/40 rounded-sm"></div>
                      </div>
                    </div>
                  ) : project.category === 'Corporate' ? (
                    <div className={`absolute inset-4 ${isDarkMode ? 'bg-slate-50/90 border-white/10' : 'bg-white border-gray-200'} rounded-lg border flex flex-col shadow-xl opacity-80 group-hover:opacity-100 transition-opacity`}>
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
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShareModalProject(project.name);
                          }}
                          className={`p-3 ${isDarkMode ? 'bg-black/40 text-white/60 hover:text-white border-white/10' : 'bg-white/80 text-gray-500 hover:text-blue-500 border-gray-200'} hover:bg-blue-500 rounded-xl backdrop-blur-md transition-colors border`}
                          title="Share Project"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => onDeleteProject(project.name, e)}
                          className={`p-3 ${isDarkMode ? 'bg-black/40 text-white/60 hover:text-white border-white/10' : 'bg-white/80 text-gray-500 hover:text-red-500 border-gray-200'} hover:bg-red-500 rounded-xl backdrop-blur-md transition-colors border`}
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-bold text-xl truncate pr-4 ${theme.text} ${getThemeClass(themeColor, 'cardTitleHover')} transition-colors`}>{project.name}</h3>
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
                  
                  <div className={`flex items-center gap-3 pt-5 border-t ${theme.border}`}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (project.publishedUrl) {
                          window.open(project.publishedUrl, '_blank');
                        } else {
                          window.open(`${window.location.origin}/sites/${project.name}/dist/index.html`, '_blank');
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/5 text-white' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'} border transition-colors hover:text-${themeColor}-500`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Live
                    </button>
                    <button className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold ${isDarkMode ? 'bg-white text-black hover:bg-gray-200 shadow-white/5' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-black/5'} transition-colors shadow-lg`}>
                      Edit Site <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {shareModalProject && (
        <ShareModal
          isOpen={true}
          onClose={() => setShareModalProject(null)}
          projectName={shareModalProject}
          sharedWith={projects.find(p => p.name === shareModalProject)?.sharedWith || []}
          onUpdateSharing={handleUpdateSharing}
          isDarkMode={isDarkMode}
          themeColor={themeColor}
          userPlan={userProfile.plan || 'Free'}
          onUpgrade={() => {
            setShareModalProject(null);
            onUpgrade();
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
