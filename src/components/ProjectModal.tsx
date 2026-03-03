import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeClass } from '../theme';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  themeColor: string;
}

export default function ProjectModal({ isOpen, onClose, onCreate, themeColor }: ProjectModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel w-full max-w-md rounded-3xl overflow-hidden p-8 border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Create New Project</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <label htmlFor="projectName" className="block text-xs font-bold uppercase tracking-wider text-white/60 ml-1">
                  Project Name
                </label>
                <input
                  type="text"
                  id="projectName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all shadow-inner`}
                  placeholder="My Awesome Site"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className={`px-8 py-3 rounded-xl text-sm font-bold ${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white shadow-lg ${getThemeClass(themeColor, 'shadow')} disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95`}
                >
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
