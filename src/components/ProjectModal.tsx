import React, { useState } from 'react';
import { X, SquareDashed, LayoutTemplate, Briefcase, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeClass } from '../theme';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, category: string) => void;
  themeColor: string;
}

export default function ProjectModal({ isOpen, onClose, onCreate, themeColor }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Blank Project');

  const templates = [
    { id: 'Blank Project', name: 'Blank Project', description: 'Start from scratch with an empty canvas.', icon: <SquareDashed className="w-6 h-6" /> },
    { id: 'Landing Page', name: 'Landing Page', description: 'A high-converting single page template.', icon: <LayoutTemplate className="w-6 h-6" /> },
    { id: 'Portfolio', name: 'Portfolio', description: 'Showcase your work and skills.', icon: <Briefcase className="w-6 h-6" /> },
    { id: 'Corporate', name: 'Corporate', description: 'Professional business website.', icon: <Building2 className="w-6 h-6" /> }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim(), category);
      setName('');
      setDescription('');
      setCategory('Landing Page');
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
            className="glass-panel w-full max-w-4xl rounded-3xl overflow-hidden p-8 border border-white/10 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between mb-8 shrink-0">
              <h2 className="text-2xl font-bold text-white tracking-tight">Create New Project</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-y-auto custom-scrollbar pb-4">
                {/* Left Side: Details */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="projectName" className="block text-xs font-bold uppercase tracking-wider text-white/60 ml-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      id="projectName"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all shadow-inner`}
                      placeholder="My Awesome Site"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="projectDescription" className="block text-xs font-bold uppercase tracking-wider text-white/60 ml-1">
                      Description (Optional)
                    </label>
                    <textarea
                      id="projectDescription"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all shadow-inner resize-none h-32`}
                      placeholder="A brief description of your project..."
                    />
                  </div>
                </div>

                {/* Right Side: Templates */}
                <div className="flex-[1.5] space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 ml-1">
                    Select Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {templates.map(template => (
                      <div 
                        key={template.id}
                        onClick={() => setCategory(template.id)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden group ${
                          category === template.id 
                            ? `bg-white/10 ${getThemeClass(themeColor, 'border')} shadow-lg` 
                            : 'bg-black/20 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {template.id === 'Blank Project' && (
                          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none p-3">
                            <div className="h-full w-full border-2 border-dashed border-white/50 rounded-xl flex items-center justify-center">
                              <div className="text-white/50 text-2xl font-bold">+</div>
                            </div>
                          </div>
                        )}
                        {template.id === 'Landing Page' && (
                          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <div className="h-full w-full flex flex-col gap-1.5 p-3">
                              <div className="h-3 w-full bg-blue-500 rounded-md"></div>
                              <div className="flex-1 bg-white rounded-md"></div>
                              <div className="h-6 w-full flex gap-1.5"><div className="flex-1 bg-white rounded-md"></div><div className="flex-1 bg-white rounded-md"></div></div>
                            </div>
                          </div>
                        )}
                        {template.id === 'Portfolio' && (
                          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <div className="h-full w-full flex flex-col items-center justify-center gap-2 p-3">
                              <div className="w-10 h-10 rounded-full bg-white"></div>
                              <div className="w-1/2 h-1.5 bg-white rounded-full"></div>
                              <div className="w-3/4 h-1.5 bg-white rounded-full"></div>
                            </div>
                          </div>
                        )}
                        {template.id === 'Corporate' && (
                          <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <div className="h-full w-full flex flex-col p-3">
                              <div className="h-2 w-full border-b border-white flex justify-between px-1 pb-1"><div className="w-4 h-1 bg-white rounded-full"></div></div>
                              <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
                                <div className="w-2/3 h-3 bg-white rounded-md"></div>
                                <div className="w-full h-1.5 bg-white rounded-full"></div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="relative z-10 flex flex-col h-full">
                          <div className={`mb-3 p-2 rounded-xl inline-flex w-fit ${category === template.id ? getThemeClass(themeColor, 'bg') : 'bg-white/10'}`}>
                            {template.icon}
                          </div>
                          <div className="font-bold text-base text-white mb-1">{template.name}</div>
                          <div className="text-xs text-white/50 line-clamp-2">{template.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-white/10 shrink-0">
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
