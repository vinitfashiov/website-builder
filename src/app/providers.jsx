"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem(USER_STORAGE_KEY) : null;

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }

    setInitializing(false);
  }, []);

  useEffect(() => {
    if (initializing) return;

    if (!user && pathname?.startsWith('/dashboard')) {
      router.replace('/login');
    }

    if (user?.role !== 'admin' && pathname?.startsWith('/admin')) {
      router.replace('/dashboard');
    }
  }, [initializing, pathname, router, user]);

  const setSession = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);

    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      localStorage.setItem(AUTH_STORAGE_KEY, nextToken);
    }
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      setSession,
      clearSession
    }),
    [user, token, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

