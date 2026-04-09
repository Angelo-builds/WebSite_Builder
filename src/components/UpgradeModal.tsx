import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Crown, Sparkles } from 'lucide-react';

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
          <div className="p-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              {/* Starter Plan */}
              <motion.div 
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`p-6 rounded-[2rem] border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} flex flex-col transition-all hover:shadow-xl opacity-80 hover:opacity-100 h-[420px]`}
              >
                <div className="mb-6">
                  <h3 className={`text-lg font-bold ${theme.text} mb-1`}>Starter</h3>
                  <p className={`${theme.textMuted} text-[10px]`}>Perfect for exploration.</p>
                </div>
                <div className={`text-3xl font-bold mb-6 ${theme.text}`}>$0<span className="text-xs font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className={`flex items-center gap-2.5 text-xs ${theme.text}`}><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 1 Project</li>
                  <li className={`flex items-center gap-2.5 text-xs ${theme.text}`}><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 3 Pages</li>
                  <li className={`flex items-center gap-2.5 text-xs ${theme.text}`}><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 100MB Storage</li>
                  <li className={`flex items-center gap-2.5 text-xs ${theme.text}`}><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 'Built with Blokra' Badge</li>
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold text-xs ${isDarkMode ? 'bg-white/10 text-white/40 cursor-default' : 'bg-gray-200 text-gray-400 cursor-default'} transition-colors`}>
                  Current Plan
                </button>
              </motion.div>

              {/* Basic Plan */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className={`p-7 rounded-[2.5rem] border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'} flex flex-col transition-all hover:shadow-2xl shadow-sm h-[460px] relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-8 -mt-8 rounded-full blur-2xl" />
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${theme.text} mb-1`}>Basic</h3>
                  <p className={`${theme.textMuted} text-xs`}>For personal projects.</p>
                </div>
                <div className={`text-4xl font-bold mb-6 ${theme.text}`}>$8.99<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-blue-500 shrink-0" /> 5 Projects</li>
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-blue-500 shrink-0" /> Unlimited Pages</li>
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-blue-500 shrink-0" /> 1GB Storage</li>
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-blue-500 shrink-0" /> No Badge</li>
                </ul>
                <button className={`w-full py-3.5 rounded-2xl font-bold bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all active:scale-95`}>
                  Select Basic
                </button>
              </motion.div>

              {/* Pro Plan */}
              <motion.div 
                whileHover={{ y: -12, scale: 1.05, transition: { duration: 0.2 } }}
                className={`p-8 rounded-[3rem] border-2 border-amber-500 relative flex flex-col ${isDarkMode ? 'bg-amber-500/10' : 'bg-amber-50'} shadow-2xl shadow-amber-500/20 z-10 h-[520px]`}
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-xl flex items-center gap-2 whitespace-nowrap ring-4 ring-white dark:ring-[#161618]">
                  <Sparkles className="w-3.5 h-3.5" /> Most Popular
                </div>
                <div className="mb-6">
                  <h3 className={`text-2xl font-black ${theme.text} mb-1 flex items-center gap-2`}>
                    Pro <Crown className="w-6 h-6 text-amber-500" />
                  </h3>
                  <p className="text-amber-600/80 dark:text-amber-400/80 text-xs font-bold">For power users & creators.</p>
                </div>
                <div className={`text-5xl font-black mb-6 ${theme.text}`}>$18.99<span className="text-sm font-normal text-gray-500">/mo</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className={`flex items-center gap-3 text-sm font-bold ${theme.text}`}><Check className="w-4 h-4 text-amber-500 shrink-0" /> Unlimited Projects</li>
                  <li className={`flex items-center gap-3 text-sm font-bold ${theme.text}`}><Check className="w-4 h-4 text-amber-500 shrink-0" /> 5GB Storage</li>
                  <li className={`flex items-center gap-3 text-sm font-bold ${theme.text}`}><Check className="w-4 h-4 text-amber-500 shrink-0" /> Custom Fonts</li>
                  <li className={`flex items-center gap-3 text-sm font-bold ${theme.text}`}><Check className="w-4 h-4 text-amber-500 shrink-0" /> Custom Domain</li>
                </ul>
                <button className={`w-full py-4 rounded-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/40 hover:shadow-amber-500/60 transition-all active:scale-95 text-lg`}>
                  Go Pro Now
                </button>
              </motion.div>

              {/* Team Plan */}
              <motion.div 
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
                className={`p-7 rounded-[2.5rem] border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'} flex flex-col transition-all hover:shadow-2xl h-[460px] relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 -mr-8 -mt-8 rounded-full blur-2xl" />
                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${theme.text} mb-1`}>Team</h3>
                  <p className={`${theme.textMuted} text-xs`}>For collaboration.</p>
                </div>
                <div className={`text-4xl font-bold mb-6 ${theme.text}`}>$14.99<span className="text-sm font-normal text-gray-500">/user</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-purple-500 shrink-0" /> White-labeling</li>
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-purple-500 shrink-0" /> Shared Workspace</li>
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-purple-500 shrink-0" /> Team RBAC</li>
                  <li className={`flex items-center gap-3 text-sm ${theme.text}`}><Check className="w-4 h-4 text-purple-500 shrink-0" /> 10GB Shared</li>
                </ul>
                <button className={`w-full py-3.5 rounded-2xl font-bold ${isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-900 text-white hover:bg-gray-800'} transition-all active:scale-95 shadow-lg`}>
                  Select Team
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
