import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Palette, Settings as SettingsIcon, Check, Save, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import { getThemeClass } from '../theme';
import FileUpload from './FileUpload';

interface UserProfile {
  name: string;
  surname: string;
  email: string;
  username?: string;
  role: string;
  avatar?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'profile' | 'appearance' | 'settings' | 'security';
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  themeColor: string;
  onUpdateThemeColor: (color: string) => void;
  isDarkMode: boolean;
  isGuest?: boolean;
}

const COLORS = [
  { id: 'blue', name: 'Ocean Blue', class: 'bg-blue-500' },
  { id: 'emerald', name: 'Emerald Green', class: 'bg-emerald-500' },
  { id: 'violet', name: 'Royal Purple', class: 'bg-violet-500' },
  { id: 'rose', name: 'Rose Red', class: 'bg-rose-500' },
  { id: 'amber', name: 'Amber Gold', class: 'bg-amber-500' },
  { id: 'cyan', name: 'Cyan Sky', class: 'bg-cyan-500' },
];

export default function SettingsModal({
  isOpen,
  onClose,
  activeTab: initialTab,
  userProfile,
  onUpdateProfile,
  themeColor,
  onUpdateThemeColor,
  isDarkMode,
  isGuest = false
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState(userProfile);
  
  // Security State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });
  
  // Update state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{available: boolean, message: string} | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setFormData(userProfile);
  }, [userProfile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    // Optional: Show success message inside modal or close it
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMessage({ type: '', text: '' });

    if (newPassword !== confirmNewPassword) {
      setSecurityMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      const endpoint = forgotPasswordMode ? '/api/auth/reset-password' : '/api/auth/change-password';
      const payload = forgotPasswordMode 
        ? { username: resetUsername, email: resetEmail, newPassword }
        : { email: userProfile.email, oldPassword, newPassword };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSecurityMessage({ type: 'success', text: data.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      if (forgotPasswordMode) setForgotPasswordMode(false);
    } catch (err: any) {
      setSecurityMessage({ type: 'error', text: err.message || 'An error occurred' });
    }
  };

  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const res = await fetch('/api/system/check-update');
      const data = await res.json();
      setUpdateStatus({ available: data.isUpdateAvailable, message: data.message || data.error });
    } catch (err) {
      setUpdateStatus({ available: false, message: 'Failed to check for updates. Ensure you are connected to the internet.' });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const applyUpdate = async () => {
    setIsUpdating(true);
    setUpdateStatus({ available: true, message: 'Updating system... Please wait, this may take a minute.' });
    try {
      const res = await fetch('/api/system/update', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setUpdateStatus({ available: true, message: 'Update successful! Reloading application...' });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setUpdateStatus({ available: true, message: 'Update failed: ' + (data.error || 'Unknown error') });
      }
    } catch (err) {
      setUpdateStatus({ available: true, message: 'Failed to apply update. See console for details.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  // Liquid Glass Theme
  const theme = {
    bg: 'glass-panel',
    text: 'text-white',
    textMuted: 'text-white/60',
    border: 'border-white/10',
    inputBg: 'bg-black/20 focus:bg-black/40 border-white/10 focus:border-white/20',
    hoverBg: 'hover:bg-white/5',
  };

  // Dynamic color classes based on selection (for the save button)
  const getButtonColor = (color: string) => {
    return `${getThemeClass(color, 'bg')} ${getThemeClass(color, 'bgHover')}`;
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row ${theme.bg}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sidebar */}
          <div className={`w-full md:w-64 p-6 border-b md:border-b-0 md:border-r ${theme.border} bg-white/5`}>
            <h2 className="text-lg font-bold mb-6 px-2 text-white tracking-tight">Settings</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? `bg-white/10 text-white shadow-sm ring-1 ring-white/10` : `${theme.textMuted} ${theme.hoverBg} hover:text-white`}`}
              >
                <User className="w-4 h-4" />
                Account
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'settings' ? `bg-white/10 text-white shadow-sm ring-1 ring-white/10` : `${theme.textMuted} ${theme.hoverBg} hover:text-white`}`}
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'security' ? `bg-white/10 text-white shadow-sm ring-1 ring-white/10` : `${theme.textMuted} ${theme.hoverBg} hover:text-white`}`}
              >
                <Shield className="w-4 h-4" />
                Security
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'appearance' ? `bg-white/10 text-white shadow-sm ring-1 ring-white/10` : `${theme.textMuted} ${theme.hoverBg} hover:text-white`}`}
              >
                <Palette className="w-4 h-4" />
                Customization
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {activeTab === 'profile' && 'Edit Profile'}
                {activeTab === 'appearance' && 'Customization'}
                {activeTab === 'settings' && 'Settings'}
                {activeTab === 'security' && 'Security'}
              </h3>
              <button onClick={onClose} className={`p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeTab === 'profile' && (
              isGuest ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className={`w-16 h-16 ${theme.textMuted} mb-4 opacity-50`} />
                  <h3 className="text-lg font-bold mb-2">Guest Account</h3>
                  <p className={`${theme.textMuted} mb-6 max-w-xs`}>Sign in with a Proxmox account to manage your profile details.</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all active:scale-95 ${getButtonColor(themeColor)}`}
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 overflow-hidden relative group">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-white/40" />
                      )}
                    </div>
                    <div className="w-full max-w-xs">
                      <FileUpload 
                        label="Upload Profile Picture" 
                        accept="image/*"
                        onFileSelect={(file) => {
                          // Create a fake URL for preview
                          const url = URL.createObjectURL(file);
                          setFormData({ ...formData, avatar: url });
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>First Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Last Name</label>
                      <input
                        type="text"
                        value={formData.surname}
                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Username</label>
                      <input
                        type="text"
                        value={formData.username || ''}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                        placeholder="johndoe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Role / Job Title</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                      placeholder="Administrator"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all active:scale-95 ${getButtonColor(themeColor)}`}
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              )
            )}

            {activeTab === 'security' && (
              isGuest ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className={`w-16 h-16 ${theme.textMuted} mb-4 opacity-50`} />
                  <h3 className="text-lg font-bold mb-2">Security Locked</h3>
                  <p className={`${theme.textMuted} mb-6 max-w-xs`}>Sign in to manage your password and security settings.</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all active:scale-95 ${getButtonColor(themeColor)}`}
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSecuritySubmit} className="space-y-6">
                  {securityMessage.text && (
                    <div className={`p-3 rounded-xl text-sm font-medium text-center ${securityMessage.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'}`}>
                      {securityMessage.text}
                    </div>
                  )}

                  {!forgotPasswordMode ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Current Password</label>
                          <button type="button" onClick={() => setForgotPasswordMode(true)} className="text-xs text-blue-400 hover:text-blue-300 hover:underline">Forgot password?</button>
                        </div>
                        <input
                          type="password"
                          required
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                          placeholder="••••••••"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 mb-4">
                        <p className="text-sm text-blue-200">Enter your Username and Email to reset your password.</p>
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Username</label>
                        <input
                          type="text"
                          required
                          value={resetUsername}
                          onChange={(e) => setResetUsername(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                          placeholder="johndoe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Email Address</label>
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                          placeholder="john@example.com"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted}`}>Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 transition-all`}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-4 flex justify-between items-center">
                    {forgotPasswordMode ? (
                      <button type="button" onClick={() => setForgotPasswordMode(false)} className="text-sm text-white/60 hover:text-white">Back to Change Password</button>
                    ) : <div></div>}
                    <button
                      type="submit"
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all active:scale-95 ${getButtonColor(themeColor)}`}
                    >
                      <Save className="w-4 h-4" />
                      {forgotPasswordMode ? 'Reset Password' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className={`text-sm font-medium ${theme.textMuted}`}>Accent Color</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {COLORS.map((color) => {
                      const isAllowed = !isGuest || ['blue', 'emerald'].includes(color.id);
                      return (
                        <button
                          key={color.id}
                          onClick={() => isAllowed && onUpdateThemeColor(color.id)}
                          disabled={!isAllowed}
                          className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${themeColor === color.id ? `${getThemeClass(color.id, 'border')} ${getThemeClass(color.id, 'badgeBg')}` : `border-transparent ${isAllowed ? theme.hoverBg : 'opacity-40 cursor-not-allowed'}`}`}
                          title={!isAllowed ? "Sign in to unlock more colors" : ""}
                        >
                          <div className={`w-10 h-10 rounded-full ${color.class} shadow-lg ${isAllowed ? 'group-hover:scale-110' : ''} transition-transform flex items-center justify-center`}>
                            {themeColor === color.id && <Check className="w-5 h-5 text-white" />}
                          </div>
                          <span className="text-xs font-medium">{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-4 rounded-xl border border-dashed border-gray-500/20 bg-gray-500/5">
                  <p className={`text-sm text-center ${theme.textMuted}`}>More customization options coming soon.</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              isGuest ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <SettingsIcon className={`w-16 h-16 ${theme.textMuted} mb-4 opacity-50`} />
                  <h3 className="text-lg font-bold mb-2">Settings Locked</h3>
                  <p className={`${theme.textMuted} mb-6 max-w-xs`}>Sign in to configure application settings and preferences.</p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all active:scale-95 ${getButtonColor(themeColor)}`}
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-500/10 bg-gray-500/5">
                    <div>
                      <h4 className="font-medium">Language</h4>
                      <p className={`text-xs ${theme.textMuted}`}>Select your preferred language</p>
                    </div>
                    <select className={`px-3 py-1.5 rounded-lg border ${theme.border} ${theme.inputBg} text-sm focus:outline-none`}>
                      <option>English</option>
                      <option>Italiano</option>
                      <option>Español</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-500/10 bg-gray-500/5">
                    <div>
                      <h4 className="font-medium">Notifications</h4>
                      <p className={`text-xs ${theme.textMuted}`}>Receive email updates</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer">
                      <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        System Updates
                      </h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md bg-white/10 ${theme.textMuted}`}>
                        Version 2.4.0
                      </span>
                    </div>
                    <div className="p-5 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col gap-4">
                      <p className={`text-sm ${theme.textMuted}`}>
                        Check for new features and bug fixes. Updating will <strong>NOT</strong> delete your existing projects or database.
                      </p>
                      
                      {updateStatus && (
                        <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${updateStatus.available ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' : 'bg-white/5 text-white/70 border border-white/10'}`}>
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{updateStatus.message}</span>
                        </div>
                      )}

                      <div className="flex gap-3 mt-2">
                        <button 
                          onClick={checkForUpdates}
                          disabled={isCheckingUpdate || isUpdating}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {isCheckingUpdate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Check for Updates
                        </button>
                        
                        {updateStatus?.available && !isUpdating && updateStatus.message !== 'Update successful! Reloading application...' && (
                          <button 
                            onClick={applyUpdate}
                            disabled={isUpdating}
                            className={`px-4 py-2 ${getButtonColor(themeColor)} text-white rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center gap-2`}
                          >
                            Apply Update Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
