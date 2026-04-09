import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Save, Lock, Shield, Settings, Info } from 'lucide-react';
import { getThemeClass } from '../theme';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onUpdateProject: (id: string, data: any) => Promise<void>;
  isDarkMode: boolean;
  themeColor: string;
  userPlan: string;
  onUpgrade: () => void;
}

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  isDarkMode,
  themeColor,
  userPlan,
  onUpgrade
}: ProjectSettingsModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customDomain: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        customDomain: project.customDomain || ''
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSaving(true);
    try {
      await onUpdateProject(project.id, formData);
      onClose();
    } catch (err) {
      console.error('Failed to update project settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !project) return null;

  const isPro = userPlan === 'Pro' || userPlan === 'Team' || userPlan === 'Agency';

  const theme = {
    bg: isDarkMode ? 'bg-[#1c1c1e]/95' : 'bg-white/95',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textMuted: isDarkMode ? 'text-white/60' : 'text-gray-500',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    inputBg: isDarkMode ? 'bg-black/20 focus:bg-black/40 border-white/10 focus:border-white/20' : 'bg-gray-50 focus:bg-white border-gray-200 focus:border-gray-300',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${theme.bg} border ${theme.border}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${getThemeClass(themeColor, 'bg')} bg-opacity-10 flex items-center justify-center text-${themeColor}-500`}>
                <Settings className="w-5 h-5" />
              </div>
              <h3 className={`text-xl font-bold ${theme.text}`}>Project Settings</h3>
            </div>
            <button onClick={onClose} className={`p-2 rounded-full hover:bg-white/5 ${theme.textMuted} transition-colors`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Project Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/50 transition-all`}
                placeholder="My Awesome Site"
              />
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/50 transition-all min-h-[100px] resize-none`}
                placeholder="A brief description of your project..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-widest ${theme.textMuted} flex items-center gap-2`}>
                  <Globe className="w-3.5 h-3.5" /> Custom Domain
                </label>
                {!isPro && (
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-500 rounded-lg border border-amber-500/30">
                    Premium
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  disabled={!isPro}
                  value={formData.customDomain}
                  onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border ${theme.border} ${theme.inputBg} ${theme.text} focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/50 transition-all ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="www.yourdomain.com"
                />
                {!isPro && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-xl group cursor-pointer" onClick={onUpgrade}>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-lg transform group-hover:scale-105 transition-transform">
                      <Lock className="w-3 h-3" /> Upgrade to unlock
                    </div>
                  </div>
                )}
              </div>
              <p className={`text-[10px] ${theme.textMuted} flex items-start gap-1.5`}>
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Connect your own domain to your website. This feature is available for Pro and Team plans.
              </p>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl font-bold text-sm ${theme.textMuted} hover:${theme.text} hover:bg-white/5 transition-all`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${getThemeClass(themeColor, 'gradientPrimary')} shadow-lg shadow-${themeColor}-500/20 transition-all active:scale-95 disabled:opacity-50`}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
