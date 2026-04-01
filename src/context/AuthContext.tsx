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
    const tokenStored = Cookies.get('token') || null;
    const userStored = Cookies.get('user') ? JSON.parse(Cookies.get('user')!) : null;
    setToken(tokenStored);
    setUser(userStored);
  }, []);

  const login = (token: string, user?: UserType) => {
    // Guardar en cookies
    Cookies.set('token', token, { expires: 1 }); // Expira en 1 día
    Cookies.set('user', JSON.stringify(user), { expires: 1 });
    
    // Actualizar estado
    setToken(token);
    if (user) setUser(user);
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

export function useRole() {
  const { user } = useAuth();
  return user?.rol ?? null;
}

export function useHasRole(...roles: string[]): boolean {
  const rol = useRole();
  return rol !== null && roles.includes(rol);
}