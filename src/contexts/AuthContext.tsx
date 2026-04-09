import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, appwriteConfig, teams } from '../lib/appwrite';

export interface Workspace {
  id: string;
  name: string;
  role: 'Owner' | 'Editor' | 'Viewer';
}

export interface UserProfile {
  id?: string;
  name: string;
  surname: string;
  email: string;
  username?: string;
  role: string;
  avatar?: string;
  plan: 'Starter' | 'Basic' | 'Pro' | 'Team' | 'Guest' | 'Free' | 'Agency';
  usedStorage?: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isGuest: boolean;
  userProfile: UserProfile;
  isLoading: boolean;
  workspaces: Workspace[];
  currentWorkspaceId: string;
  login: (status: boolean, guest?: boolean, user?: any) => void;
  logout: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
  checkSession: () => Promise<void>;
  switchWorkspace: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  name: '',
  surname: '',
  email: '',
  username: '',
  role: '',
  plan: 'Free'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('');

  const refreshWorkspaces = async () => {
    if (!isLoggedIn || isGuest) return;
    try {
      const teamsList = await teams.list();
      const fetchedWorkspaces: Workspace[] = teamsList.teams.map(t => ({
        id: t.$id,
        name: t.name,
        role: (t.prefs?.role as any) || 'Owner' // Default to Owner for now, Appwrite doesn't return membership role in teams.list() easily without checking memberships
      }));

      // Add personal workspace
      const personalWorkspace: Workspace = {
        id: userProfile.id || 'personal',
        name: 'My Private Projects',
        role: 'Owner'
      };

      const allWorkspaces = [personalWorkspace, ...fetchedWorkspaces];
      setWorkspaces(allWorkspaces);
      
      if (!currentWorkspaceId || !allWorkspaces.find(w => w.id === currentWorkspaceId)) {
        setCurrentWorkspaceId(personalWorkspace.id);
      }
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  const login = (status: boolean, guest: boolean = false, user?: any) => {
    setIsLoggedIn(status);
    setIsGuest(guest);
    
    if (!status) {
      setUserProfile(defaultProfile);
      setWorkspaces([]);
      setCurrentWorkspaceId('');
      return;
    }

    if (guest) {
      setUserProfile({
        name: 'Guest',
        surname: '',
        email: '',
        username: 'guest',
        role: 'Guest User',
        plan: 'Guest'
      });
      setCurrentWorkspaceId('guest');
    } else if (user) {
      setUserProfile({
        name: user.name || 'Admin',
        surname: user.surname || 'User',
        email: user.email || 'admin@example.com',
        username: user.username || 'admin',
        role: user.role || 'Administrator',
        plan: user.plan || 'Pro',
        id: user.id
      });
      setCurrentWorkspaceId(user.id || 'personal');
    }
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.log("Session already closed or non-existent.");
    } finally {
      login(false);
    }
  };

  const checkSession = async () => {
    try {
      const user = await account.get();
      if (user) {
        let userDoc: any = null;
        try {
          userDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            user.$id
          );
        } catch (docErr) {
          console.warn('Could not fetch user document:', docErr);
        }

        login(true, false, {
          id: user.$id,
          name: userDoc?.name?.split(' ')[0] || user.name?.split(' ')[0] || 'User',
          surname: userDoc?.name?.split(' ').slice(1).join(' ') || user.name?.split(' ').slice(1).join(' ') || '',
          email: user.email,
          username: user.prefs?.username || user.name?.toLowerCase().replace(/\s+/g, ''),
          role: userDoc?.role || user.prefs?.role || 'User',
          plan: userDoc?.plan || user.prefs?.plan || 'Starter',
          usedStorage: userDoc?.usedStorage || 0
        });
      }
    } catch (e: any) {
      if (e.code === 401) {
        console.log('User not logged in - showing dashboard/login');
        setIsLoggedIn(false);
      } else {
        console.error('Appwrite checkSession error:', e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (isLoggedIn && !isGuest) {
      refreshWorkspaces();
    }
  }, [isLoggedIn, isGuest, userProfile.id]);

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      isGuest, 
      userProfile, 
      isLoading, 
      workspaces,
      currentWorkspaceId,
      login, 
      logout, 
      updateUserProfile: setUserProfile, 
      checkSession,
      switchWorkspace: setCurrentWorkspaceId,
      refreshWorkspaces
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
