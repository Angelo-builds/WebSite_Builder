import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Crown } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export function UpgradeModal({ isOpen, onClose, isDarkMode }: UpgradeModalProps) {
  const theme = isDarkMode 
    ? {
        bg: 'bg-[#161618]',
        text: 'text-white',
        textMuted: 'text-gray-400',
        border: 'border-white/10',
        hoverBg: 'hover:bg-white/10'
      }
    : {
        bg: 'bg-white',
        text: 'text-gray-900',
        textMuted: 'text-gray-500',
        border: 'border-gray-200',
        hoverBg: 'hover:bg-gray-100'
      };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col ${theme.bg}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-6 border-b ${theme.border} flex justify-between items-center`}>
            <h2 className={`text-2xl font-bold ${theme.text}`}>Upgrade Your Plan</h2>
            <button onClick={onClose} className={`p-2 rounded-full ${theme.hoverBg} ${theme.textMuted} hover:${theme.text} transition-colors`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Plan */}
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} flex flex-col`}>
                <h3 className={`text-xl font-bold ${theme.text} mb-2`}>Basic</h3>
                <p className={`${theme.textMuted} text-sm mb-4`}>Perfect for small projects and personal sites.</p>
                <div className={`text-3xl font-bold mb-6 ${theme.text}`}>$9<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> 5 Projects</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Basic Templates</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Color Customization</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.textMuted} opacity-50`}><X className="w-4 h-4" /> Premium Templates</li>
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} transition-colors`}>
                  Select Basic
                </button>
              </div>

              {/* Pro Plan */}
              <div className={`p-6 rounded-2xl border-2 border-amber-500 relative flex flex-col ${isDarkMode ? 'bg-amber-500/5' : 'bg-amber-50'}`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-full">Most Popular</div>
                <h3 className={`text-xl font-bold ${theme.text} mb-2 flex items-center gap-2`}><Crown className="w-5 h-5 text-amber-500" /> Pro</h3>
                <p className={`${theme.textMuted} text-sm mb-4`}>For professionals who need more power.</p>
                <div className={`text-3xl font-bold mb-6 ${theme.text}`}>$29<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Unlimited Projects</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Premium Templates</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Advanced UI Customization</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Custom Fonts</li>
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
                  Select Pro
                </button>
              </div>

              {/* Team Plan */}
              <div className={`p-6 rounded-2xl border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} flex flex-col`}>
                <h3 className={`text-xl font-bold ${theme.text} mb-2`}>Team</h3>
                <p className={`${theme.textMuted} text-sm mb-4`}>White-labeling and team collaboration.</p>
                <div className={`text-3xl font-bold mb-6 ${theme.text}`}>$15<span className="text-sm font-normal text-gray-500">/user/mo</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Everything in Pro</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> White-label (Custom Logo)</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Advanced Roles & Permissions</li>
                  <li className={`flex items-center gap-2 text-sm ${theme.text}`}><Check className="w-4 h-4 text-emerald-500" /> Dedicated Support</li>
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'} transition-colors`}>
                  Select Team
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
