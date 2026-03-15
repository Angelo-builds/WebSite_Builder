import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus, Shield, Trash2, Check } from 'lucide-react';
import { getThemeClass } from '../theme';

interface SharedUser {
  email: string;
  role: 'creator' | 'modifier' | 'contributor' | 'editor';
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  sharedWith: SharedUser[];
  onUpdateSharing: (projectName: string, newSharedWith: SharedUser[]) => void;
  isDarkMode: boolean;
  themeColor: string;
  userPlan: string;
  onUpgrade: () => void;
}

export function ShareModal({
  isOpen,
  onClose,
  projectName,
  sharedWith,
  onUpdateSharing,
  isDarkMode,
  themeColor,
  userPlan,
  onUpgrade
}: ShareModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<'creator' | 'modifier' | 'contributor' | 'editor'>('editor');
  const [currentSharedWith, setCurrentSharedWith] = useState<SharedUser[]>(sharedWith || []);

  const theme = isDarkMode 
    ? {
        bg: 'bg-[#1a1a1a]',
        text: 'text-white',
        textMuted: 'text-gray-400',
        border: 'border-white/10',
        inputBg: 'bg-black/50',
        cardBg: 'bg-white/5'
      }
    : {
        bg: 'bg-white',
        text: 'text-gray-900',
        textMuted: 'text-gray-500',
        border: 'border-gray-200',
        inputBg: 'bg-gray-50',
        cardBg: 'bg-gray-50'
      };

  const handleAddUser = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    
    // Check if user is already added
    if (currentSharedWith.some(u => u.email === emailInput)) {
      alert('User is already added to this project.');
      return;
    }

    const newUser: SharedUser = {
      email: emailInput,
      role: roleInput
    };

    const updated = [...currentSharedWith, newUser];
    setCurrentSharedWith(updated);
    setEmailInput('');
  };

  const handleRemoveUser = (email: string) => {
    const updated = currentSharedWith.filter(u => u.email !== email);
    setCurrentSharedWith(updated);
  };

  const handleRoleChange = (email: string, newRole: 'creator' | 'modifier' | 'contributor' | 'editor') => {
    if (!isTeamPlan && (newRole === 'creator' || newRole === 'modifier' || newRole === 'contributor')) {
      onUpgrade();
      return;
    }
    const updated = currentSharedWith.map(u => 
      u.email === email ? { ...u, role: newRole } : u
    );
    setCurrentSharedWith(updated);
  };

  const handleRoleInputSelect = (newRole: 'creator' | 'modifier' | 'contributor' | 'editor') => {
    if (!isTeamPlan && (newRole === 'creator' || newRole === 'modifier' || newRole === 'contributor')) {
      onUpgrade();
      return;
    }
    setRoleInput(newRole);
  };

  const handleSave = () => {
    onUpdateSharing(projectName, currentSharedWith);
    onClose();
  };

  if (!isOpen) return null;

  const isTeamPlan = userPlan === 'Team';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-2xl ${theme.bg} rounded-2xl shadow-2xl overflow-hidden border ${theme.border} flex flex-col max-h-[90vh]`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${theme.border} flex items-center justify-between shrink-0`}>
            <div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Share Project</h2>
              <p className={`text-sm ${theme.textMuted} mt-1`}>
                Invite others to collaborate on "{projectName}"
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${theme.textMuted}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {!isTeamPlan && (
              <div className={`mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3`}>
                <Shield className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-500">Upgrade to Team Plan</h4>
                  <p className={`text-sm ${theme.textMuted} mt-1`}>
                    You are currently on the {userPlan} plan. To use advanced roles (Creator, Modifier, Contributor) and collaborate with a team, you need to upgrade to the Team plan.
                  </p>
                </div>
              </div>
            )}

            {/* Add User */}
            <div className="flex gap-3 mb-8">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter email address..."
                  className={`w-full pl-4 pr-4 py-3 rounded-xl ${theme.inputBg} border ${theme.border} ${theme.text} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
                />
              </div>
              
              <select
                value={roleInput}
                onChange={(e) => handleRoleInputSelect(e.target.value as any)}
                className={`px-4 py-3 rounded-xl ${theme.inputBg} border ${theme.border} ${theme.text} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer`}
              >
                <option value="editor">Editor</option>
                <option value="contributor">Contributor {!isTeamPlan ? '(Team)' : ''}</option>
                <option value="modifier">Modifier {!isTeamPlan ? '(Team)' : ''}</option>
                <option value="creator">Creator {!isTeamPlan ? '(Team)' : ''}</option>
              </select>

              <button
                onClick={handleAddUser}
                disabled={!emailInput.trim() || !emailInput.includes('@')}
                className={`px-6 py-3 rounded-xl font-medium text-white ${getThemeClass(themeColor, 'bg')} ${getThemeClass(themeColor, 'hoverBg')} transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <UserPlus className="w-4 h-4" />
                Invite
              </button>
            </div>

            {/* Shared Users List */}
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.textMuted} mb-4`}>
                People with access
              </h3>
              
              <div className="space-y-3">
                {currentSharedWith.length === 0 ? (
                  <div className={`p-8 text-center border-2 border-dashed ${theme.border} rounded-xl`}>
                    <p className={theme.textMuted}>This project isn't shared with anyone yet.</p>
                  </div>
                ) : (
                  currentSharedWith.map((user, index) => (
                    <div key={index} className={`flex items-center justify-between p-4 rounded-xl ${theme.cardBg} border ${theme.border}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${getThemeClass(themeColor, 'bg')} bg-opacity-20 flex items-center justify-center text-lg font-bold ${getThemeClass(themeColor, 'text')}`}>
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-medium ${theme.text}`}>{user.email}</p>
                          <p className={`text-xs ${theme.textMuted} capitalize`}>{user.role}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.email, e.target.value as any)}
                          className={`px-3 py-1.5 text-sm rounded-lg ${theme.inputBg} border ${theme.border} ${theme.text} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer`}
                        >
                          <option value="editor">Editor</option>
                          <option value="contributor">Contributor {!isTeamPlan ? '(Team)' : ''}</option>
                          <option value="modifier">Modifier {!isTeamPlan ? '(Team)' : ''}</option>
                          <option value="creator">Creator {!isTeamPlan ? '(Team)' : ''}</option>
                        </select>
                        
                        <button
                          onClick={() => handleRemoveUser(user.email)}
                          className={`p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors`}
                          title="Remove Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`p-6 border-t ${theme.border} flex justify-end gap-3 shrink-0`}>
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-medium ${theme.text} hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2.5 rounded-xl font-medium text-white ${getThemeClass(themeColor, 'bg')} ${getThemeClass(themeColor, 'hoverBg')} transition-colors flex items-center gap-2`}
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
