import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { html as htmlBeautify, css as cssBeautify, js as jsBeautify } from 'js-beautify';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  css: string;
  js: string;
  isDarkMode: boolean;
}

export default function CodeModal({ isOpen, onClose, html, css, js, isDarkMode }: CodeModalProps) {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);
  const [formattedCode, setFormattedCode] = useState({ html: '', css: '', js: '' });

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setFormattedCode({
        html: htmlBeautify(html, { indent_size: 2, preserve_newlines: false }),
        css: cssBeautify(css, { indent_size: 2 }),
        js: jsBeautify(js, { indent_size: 2 })
      });
    }
  }, [isOpen, html, css, js]);

  const handleCopy = () => {
    const content = activeTab === 'html' ? formattedCode.html : activeTab === 'css' ? formattedCode.css : formattedCode.js;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeClasses = {
    bg: isDarkMode ? 'bg-[#1e1e1e]' : 'bg-white',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
    codeBg: isDarkMode ? 'bg-[#0f0f11]' : 'bg-gray-50',
    tabActive: isDarkMode ? 'bg-[#0f0f11] text-blue-400 border-b-2 border-blue-400' : 'bg-gray-100 text-blue-600 border-b-2 border-blue-600',
    tabInactive: isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`${themeClasses.bg} w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex flex-col border ${themeClasses.border} overflow-hidden`}
          >
            <div className={`flex items-center justify-between p-4 border-b ${themeClasses.border}`}>
              <h2 className={`text-lg font-semibold ${themeClasses.text}`}>Source Code</h2>
              <button onClick={onClose} className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${themeClasses.text}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`flex items-center px-4 border-b ${themeClasses.border}`}>
              <button
                onClick={() => setActiveTab('html')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'html' ? themeClasses.tabActive : themeClasses.tabInactive}`}
              >
                HTML
              </button>
              <button
                onClick={() => setActiveTab('css')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'css' ? themeClasses.tabActive : themeClasses.tabInactive}`}
              >
                CSS
              </button>
              <button
                onClick={() => setActiveTab('js')}
                className={`px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'js' ? themeClasses.tabActive : themeClasses.tabInactive}`}
              >
                JS
              </button>
              <div className="flex-1" />
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className={`flex-1 overflow-auto p-4 ${themeClasses.codeBg}`}>
              <pre className={`font-mono text-sm ${themeClasses.text} whitespace-pre-wrap break-all`}>
                {activeTab === 'html' && formattedCode.html}
                {activeTab === 'css' && formattedCode.css}
                {activeTab === 'js' && formattedCode.js}
              </pre>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
