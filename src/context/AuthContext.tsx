'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
export type UserType = { nombre: string; rol: string, email: string }
type AuthContextType = {
  token: string | null;
  user: UserType | null;
  login: (token: string, user?: UserType) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const t = Cookies.get('token') || null;
    const u = Cookies.get('user') ? JSON.parse(Cookies.get('user')!) : null;
    setToken(t);
    setUser(u);
  }, []);

  const login = (t: string, u?: UserType) => {
    setToken(t);
    Cookies.set('token', t);
    if (u) {
      setUser(u);
      Cookies.set('user', JSON.stringify(u));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    Cookies.remove('token');
    Cookies.remove('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
