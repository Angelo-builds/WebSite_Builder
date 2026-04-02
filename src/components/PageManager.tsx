import React, { useState } from 'react';
import { Plus, Trash2, FileText, Settings, Check, X } from 'lucide-react';

interface Page {
  id: string;
  name: string;
  html?: string;
  css?: string;
}

interface PageManagerProps {
  pages: Page[];
  currentPageId: string;
  onAddPage: (name: string) => void;
  onDeletePage: (id: string) => void;
  onSwitchPage: (id: string) => void;
  onUpdatePageName: (id: string, newName: string) => void;
  themeColor: string;
  isDarkMode: boolean;
}

export default function PageManager({
  pages,
  currentPageId,
  onAddPage,
  onDeletePage,
  onSwitchPage,
  onUpdatePageName,
  themeColor,
  isDarkMode
}: PageManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const themeClasses = {
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textMuted: isDarkMode ? 'text-white/60' : 'text-gray-500',
    textFaint: isDarkMode ? 'text-white/40' : 'text-gray-400',
    hoverBg: isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50',
    activeBg: isDarkMode ? 'bg-white/10' : 'bg-gray-100',
    inputBg: isDarkMode ? 'bg-black/20' : 'bg-white',
    border: isDarkMode ? 'border-white/10' : 'border-gray-200',
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPageName.trim()) {
      onAddPage(newPageName.trim());
      setNewPageName('');
      setIsAdding(false);
    }
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdatePageName(id, editName.trim());
    }
    setEditingPageId(null);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className={`text-xs uppercase tracking-widest ${themeClasses.textFaint} font-bold`}>Pages</h3>
        <button 
          onClick={() => setIsAdding(true)} 
          className={`p-1.5 bg-${themeColor}-500/10 hover:bg-${themeColor}-500/20 text-${themeColor}-500 rounded-md transition-all`}
          title="Add New Page"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        {pages.map(page => (
          <div key={page.id}>
            {editingPageId === page.id ? (
              <div className={`flex items-center gap-2 px-2 py-2 rounded-lg ${themeClasses.activeBg}`}>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`flex-1 min-w-0 text-sm bg-transparent border-none focus:ring-0 ${themeClasses.text} px-1 outline-none`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(page.id);
                    if (e.key === 'Escape') setEditingPageId(null);
                  }}
                />
                <button onClick={() => handleSaveEdit(page.id)} className={`text-${themeColor}-500 hover:text-${themeColor}-400`}>
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingPageId(null)} className={`${themeClasses.textMuted} hover:${themeClasses.text}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => onSwitchPage(page.id)}
                className={`group w-full px-3 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer border border-transparent ${
                  currentPageId === page.id 
                    ? `${themeClasses.activeBg} text-${themeColor}-500 border-${themeColor}-500/20 shadow-sm` 
                    : `${themeClasses.hoverBg} ${themeClasses.textMuted} hover:border-black/5`
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className={`w-4 h-4 flex-shrink-0 ${currentPageId === page.id ? `text-${themeColor}-500` : themeClasses.textFaint}`} />
                  <span className="truncate font-medium">{page.name}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditName(page.name);
                      setEditingPageId(page.id);
                    }}
                    className={`p-1.5 ${themeClasses.textMuted} hover:${themeClasses.text} rounded transition-all`}
                    title="Page Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  {page.id !== 'index' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(page.id);
                      }}
                      className="p-1.5 text-red-400/60 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isAdding && (
          <form onSubmit={handleAdd} className={`flex items-center gap-2 px-2 py-2 rounded-lg ${themeClasses.activeBg} mt-2`}>
            <input
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              placeholder="Page name..."
              className={`flex-1 min-w-0 text-sm bg-transparent border-none focus:ring-0 ${themeClasses.text} px-1 outline-none`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsAdding(false);
              }}
            />
            <button type="submit" className={`text-${themeColor}-500 hover:text-${themeColor}-400`}>
              <Check className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => setIsAdding(false)} className={`${themeClasses.textMuted} hover:${themeClasses.text}`}>
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
      <div className={`h-px ${themeClasses.border} w-full mt-6`}></div>
    </div>
  );
}
