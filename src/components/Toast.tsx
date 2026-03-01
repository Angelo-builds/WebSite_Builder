import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const colors = {
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
    error: 'border-red-500/20 bg-red-500/10 text-red-500',
    warning: 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500',
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-500',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border bg-white dark:bg-[#18181b] shadow-2xl backdrop-blur-md"
        >
          <div className={`p-2 rounded-lg ${colors[type]}`}>
            {icons[type]}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 pr-4">
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
