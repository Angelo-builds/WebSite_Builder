import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Palette, Settings as SettingsIcon, Check, Save } from 'lucide-react';

interface UserProfile {
  name: string;
  surname: string;
  email: string;
  role: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'profile' | 'appearance' | 'settings';
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

  if (!isOpen) return null;

  const theme = {
    bg: isDarkMode ? 'bg-[#18181b]' : 'bg-white',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    inputBg: isDarkMode ? 'bg-[#27272a]' : 'bg-gray-50',
    hoverBg: isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-100',
  };

  // Dynamic color classes based on selection (for the save button)
  const getButtonColor = (color: string) => {
    const map: Record<string, string> = {
      blue: 'bg-blue-600 hover:bg-blue-500',
      emerald: 'bg-emerald-600 hover:bg-emerald-500',
      violet: 'bg-violet-600 hover:bg-violet-500',
      rose: 'bg-rose-600 hover:bg-rose-500',
      amber: 'bg-amber-600 hover:bg-amber-500',
      cyan: 'bg-cyan-600 hover:bg-cyan-500',
    };
    return map[color] || map.blue;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row ${theme.bg} ${theme.text} border ${theme.border}`}
        >
          {/* Sidebar */}
          <div className={`w-full md:w-64 p-4 border-b md:border-b-0 md:border-r ${theme.border} ${isDarkMode ? 'bg-white/5' : 'bg-gray-50/50'}`}>
            <h2 className="text-lg font-bold mb-6 px-2">Settings</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? `${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} ${theme.text}` : `${theme.textMuted} ${theme.hoverBg}`}`}
              >
                <User className="w-4 h-4" />
                Account
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? `${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} ${theme.text}` : `${theme.textMuted} ${theme.hoverBg}`}`}
              >
                <SettingsIcon className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'appearance' ? `${isDarkMode ? 'bg-white/10' : 'bg-gray-200'} ${theme.text}` : `${theme.textMuted} ${theme.hoverBg}`}`}
              >
                <Palette className="w-4 h-4" />
                Customization
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {activeTab === 'profile' && 'Edit Profile'}
                {activeTab === 'appearance' && 'Customization'}
                {activeTab === 'settings' && 'Settings'}
              </h3>
              <button onClick={onClose} className={`p-2 rounded-lg ${theme.hoverBg} transition-colors`}>
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
                <form onSubmit={handleSaveProfile} className="space-y-4">
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
                          className={`group relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${themeColor === color.id ? `border-${color.id}-500 bg-${color.id}-500/10` : `border-transparent ${isAllowed ? theme.hoverBg : 'opacity-40 cursor-not-allowed'}`}`}
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
