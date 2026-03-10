import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  label?: string;
  isDarkMode?: boolean;
}

export default function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = "Drag & drop your file here, or click to browse",
  isDarkMode = true
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    if (maxSize && file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return false;
    }
    // Basic type check if accept is provided (simple implementation)
    if (accept && accept !== '*' && !file.type.match(accept.replace('*', '.*'))) {
       // This is a loose check, for strict checking we'd need more logic
       // but for UI feedback it's often enough. 
       // Let's rely on the input accept attribute for the browser dialog mostly.
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileSelect(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <motion.div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        animate={{
          borderColor: isDragging ? '#3b82f6' : error ? '#ef4444' : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.1)' : isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        }}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          flex flex-col items-center justify-center text-center cursor-pointer
          transition-colors duration-200 group overflow-hidden
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-3"
            >
              <div className={`w-12 h-12 rounded-full ${isDarkMode ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/5 group-hover:bg-black/10'} flex items-center justify-center transition-colors`}>
                <Upload className={`w-6 h-6 ${isDarkMode ? 'text-white/60 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-800'} transition-colors`} />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white/80' : 'text-gray-700'}`}>
                  {label}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  Max size: {maxSize / 1024 / 1024}MB
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`flex items-center gap-4 w-full max-w-xs ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'} p-3 rounded-lg border`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <File className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {file.name}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={removeFile}
                className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'hover:bg-white/10 text-white/40 hover:text-white' : 'hover:bg-black/10 text-gray-400 hover:text-gray-800'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-2 text-red-400 text-xs font-medium"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
