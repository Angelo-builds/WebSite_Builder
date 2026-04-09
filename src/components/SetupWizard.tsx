import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Logo from './Logo';
import { account, databases, appwriteConfig, ID } from '../lib/appwrite';

interface SetupWizardProps {
  onActivated: (licenseKey: string) => void;
  isDarkMode: boolean;
}

export default function SetupWizard({ onActivated, isDarkMode }: SetupWizardProps) {
  const [mode, setMode] = useState<'welcome' | 'login' | 'register'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const user = await account.get();
        if (user) {
          await checkLicense(user.$id);
        }
      } catch (err) {
        // No active session, stay on welcome screen
      }
    };
    checkExistingSession();
  }, []);

  const checkLicense = async (userId: string) => {
    try {
      const userDoc = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        userId
      );
      
      if (userDoc.licenseKey) {
        localStorage.setItem('builder_license_key', userDoc.licenseKey);
        onActivated(userDoc.licenseKey);
      } else {
        // Wait a bit for the Appwrite function to create the document
        setTimeout(async () => {
          try {
            const retryDoc = await databases.getDocument(
              appwriteConfig.databaseId,
              appwriteConfig.usersCollectionId,
              userId
            );
            if (retryDoc.licenseKey) {
              localStorage.setItem('builder_license_key', retryDoc.licenseKey);
              onActivated(retryDoc.licenseKey);
            } else {
              setError('License key not found. Please contact support.');
              setIsLoading(false);
            }
          } catch (err) {
            setError('Failed to fetch user profile. Please try again.');
            setIsLoading(false);
          }
        }, 3000);
      }
    } catch (err) {
      // Document might not exist yet, wait and retry
      setTimeout(async () => {
        try {
          const retryDoc = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            userId
          );
          if (retryDoc.licenseKey) {
            localStorage.setItem('builder_license_key', retryDoc.licenseKey);
            onActivated(retryDoc.licenseKey);
          } else {
            setError('License key not found. Please contact support.');
            setIsLoading(false);
          }
        } catch (err) {
          setError('Failed to fetch user profile. Please try again.');
          setIsLoading(false);
        }
      }, 3000);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      try {
        await account.createEmailPasswordSession(email, password);
      } catch (sessionErr: any) {
        // If already logged in, ignore the error and proceed
        if (sessionErr.code !== 401 && sessionErr.type !== 'user_session_already_exists') {
          throw sessionErr;
        }
      }
      const user = await account.get();
      await checkLicense(user.$id);
    } catch (err: any) {
      if (err.type === 'user_invalid_credentials') {
        setError('Invalid email or password. Please try again.');
      } else if (err.type === 'user_blocked') {
        setError('This account has been blocked. Please contact support.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await account.create(ID.unique(), email, password, name);
      try {
        await account.createEmailPasswordSession(email, password);
      } catch (sessionErr: any) {
        if (sessionErr.type !== 'user_session_already_exists') {
          throw sessionErr;
        }
      }
      await checkLicense(user.$id);
    } catch (err: any) {
      if (err.type === 'user_already_exists') {
        setError('An account with this email already exists. Redirecting to login...');
        setTimeout(() => {
          setMode('login');
          setError('');
          setIsLoading(false);
        }, 2500);
        return; // Prevent setting isLoading to false immediately
      } else if (err.type === 'password_recently_used' || err.type === 'password_personal_data') {
        setError('Please choose a stronger password.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="relative z-10 w-full max-w-md p-10 rounded-[2.5rem] bg-[#161618]/60 backdrop-blur-3xl border border-white/10 shadow-2xl ring-1 ring-white/5"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Logo iconSize={80} showText={false} className="mb-6" />
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-white drop-shadow-sm">
            {mode === 'welcome' ? 'Blokra' : mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-white/60 text-base font-medium leading-relaxed max-w-[280px]">
            {mode === 'welcome' ? 'Sign in to access your workspace.' : mode === 'login' ? 'Enter your details to continue.' : 'Join us to start building.'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 font-medium">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button
                onClick={() => setMode('login')}
                className="w-full py-4 px-6 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold text-base transition-all shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setMode('register')}
                className="w-full py-4 px-6 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Create New Account
              </button>
            </motion.div>
          )}

          {mode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold text-base transition-all shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
              <p className="text-center text-sm text-white/40 mt-6 font-medium">
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('register')} className="text-white hover:underline">
                  Register
                </button>
              </p>
            </motion.form>
          )}

          {mode === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="name@example.com"
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-white/40 ml-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 bg-white text-black hover:bg-gray-100 rounded-2xl font-bold text-base transition-all shadow-xl shadow-white/5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>
              <p className="text-center text-sm text-white/40 mt-6 font-medium">
                Already have an account?{' '}
                <button type="button" onClick={() => setMode('login')} className="text-white hover:underline">
                  Sign In
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
