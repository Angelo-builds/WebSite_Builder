import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, appwriteConfig } from '../lib/appwrite';

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
  login: (status: boolean, guest?: boolean, user?: any) => void;
  logout: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
  checkSession: () => Promise<void>;
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

  const login = (status: boolean, guest: boolean = false, user?: any) => {
    setIsLoggedIn(status);
    setIsGuest(guest);
    
    if (!status) {
      setUserProfile(defaultProfile);
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
    } else if (user) {
      setUserProfile({
        name: user.name || 'Admin',
        surname: user.surname || 'User',
        email: user.email || 'admin@example.com',
        username: user.username || 'admin',
        role: user.role || 'Administrator',
        plan: user.plan || 'Pro'
      });
    } else {
      setUserProfile({
        name: 'Admin',
        surname: 'User',
        email: 'admin@example.com',
        username: 'admin',
        role: 'Administrator',
        plan: 'Pro'
      });
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

  return (
    <AuthContext.Provider value={{ isLoggedIn, isGuest, userProfile, isLoading, login, logout, updateUserProfile: setUserProfile, checkSession }}>
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
