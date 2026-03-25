import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Search, Filter, Image as ImageIcon, Video, FileAudio, FileText, Type, Trash2, Check } from 'lucide-react';
import { getThemeClass } from '../theme';
import { storage, appwriteConfig, ID } from '../lib/appwrite';

interface CustomAssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: any) => void;
  editor: any;
  themeColor: string;
}

export default function CustomAssetManager({ isOpen, onClose, onSelect, editor, themeColor }: CustomAssetManagerProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && editor) {
      const am = editor.AssetManager;
      setAssets(am.getAll().models);
    }
  }, [isOpen, editor]);

  const getAssetType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    if (['pdf', 'doc', 'docx'].includes(ext)) return 'document';
    if (['ttf', 'woff', 'woff2', 'eot'].includes(ext)) return 'font';
    return 'image';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);

    try {
      const uploadedAssets = await Promise.all(
        files.map(async (file) => {
          const response = await storage.createFile(
            appwriteConfig.assetsBucketId,
            ID.unique(),
            file
          );
          
          const fileUrl = storage.getFileView(appwriteConfig.assetsBucketId, response.$id).toString();
          
          return {
            type: getAssetType(file.name),
            src: fileUrl,
            name: file.name,
            fileId: response.$id
          };
        })
      );

      editor.AssetManager.add(uploadedAssets);
      setAssets(editor.AssetManager.getAll().models);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload assets. Please check if the assets bucket exists in Appwrite.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (asset: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const fileId = asset.get('fileId');
    if (fileId) {
      try {
        await storage.deleteFile(appwriteConfig.assetsBucketId, fileId);
      } catch (err) {
        console.error('Failed to delete from Appwrite storage', err);
      }
    }
    
    editor.AssetManager.remove(asset);
    setAssets(editor.AssetManager.getAll().models);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-8 h-8 opacity-50" />;
      case 'audio': return <FileAudio className="w-8 h-8 opacity-50" />;
      case 'document': return <FileText className="w-8 h-8 opacity-50" />;
      case 'font': return <Type className="w-8 h-8 opacity-50" />;
      default: return <ImageIcon className="w-8 h-8 opacity-50" />;
    }
  };

  const filteredAssets = assets.filter(a => {
    const type = a.get('type') || 'image';
    const src = a.get('src') || '';
    const name = a.get('name') || src.split('/').pop() || '';
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Basic sorting (assuming newer assets are added at the end)
  if (sortBy === 'newest') {
    filteredAssets.reverse();
  } else if (sortBy === 'name') {
    filteredAssets.sort((a, b) => {
      const nameA = a.get('name') || a.get('src') || '';
      const nameB = b.get('name') || b.get('src') || '';
      return nameA.localeCompare(nameB);
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-5xl h-full max-h-[85vh] flex flex-col bg-[#161618] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Asset Manager</h2>
                <p className="text-sm text-white/40 mt-1">Manage images, videos, fonts, and documents.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all`}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={`bg-black/40 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all appearance-none`}
                  >
                    <option value="all">All Types</option>
                    <option value="image">Images</option>
                    <option value="video">Videos</option>
                    <option value="audio">Audio</option>
                    <option value="font">Fonts</option>
                    <option value="document">Documents</option>
                  </select>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 ${getThemeClass(themeColor, 'focusRing')} ${getThemeClass(themeColor, 'focusBorder')} transition-all appearance-none`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              <div className="w-full sm:w-auto">
                <input 
                  type="file" 
                  multiple 
                  ref={fileInputRef} 
                  onChange={handleUpload} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 ${getThemeClass(themeColor, 'gradientPrimary')} ${getThemeClass(themeColor, 'gradientHover')} text-white rounded-xl font-bold text-sm transition-all shadow-lg ${getThemeClass(themeColor, 'shadow')} disabled:opacity-50`}
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Files
                </button>
              </div>
            </div>

            {/* Asset Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {filteredAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/40">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No assets found</p>
                  <p className="text-sm mt-1">Upload some files to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredAssets.map((asset, idx) => {
                    const type = asset.get('type') || 'image';
                    const src = asset.get('src');
                    const name = asset.get('name') || src.split('/').pop();
                    
                    return (
                      <div 
                        key={idx}
                        onClick={() => {
                          onSelect(asset);
                          onClose();
                        }}
                        className="group relative bg-[#1c1c1e] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-all hover:shadow-xl"
                      >
                        <div className="aspect-square bg-black/40 flex items-center justify-center relative overflow-hidden">
                          {type === 'image' ? (
                            <img src={src} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : type === 'video' ? (
                            <video src={src} className="w-full h-full object-cover opacity-80" muted loop onMouseOver={e => (e.target as HTMLVideoElement).play()} onMouseOut={e => (e.target as HTMLVideoElement).pause()} />
                          ) : (
                            getIconForType(type)
                          )}
                          
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                              <div className={`p-3 rounded-full ${getThemeClass(themeColor, 'bg')} text-white shadow-lg`}>
                                <Check className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 flex items-center justify-between">
                          <div className="truncate pr-2">
                            <p className="text-xs font-medium text-white truncate" title={name}>{name}</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">{type}</p>
                          </div>
                          <button 
                            onClick={(e) => handleDelete(asset, e)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
