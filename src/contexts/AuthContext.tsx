import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeToken(token: string): (AuthUser & { exp?: number }) | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    return JSON.parse(json) as AuthUser & { exp?: number };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = localStorage.getItem('token');
    if (!t) return null;
    const d = decodeToken(t);
    return d ? { companyId: d.companyId, email: d.email, name: d.name, role: d.role, currency: d.currency, emissionFactor: d.emissionFactor } : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const d = decodeToken(newToken);
    setUser(d ? { companyId: d.companyId, email: d.email, name: d.name, role: d.role, currency: d.currency, emissionFactor: d.emissionFactor } : null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Validate token expiry on mount
  useEffect(() => {
    if (!token) return;
    const decoded = decodeToken(token);
    if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
      logout();
      return;
    }
    setIsLoading(false);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
