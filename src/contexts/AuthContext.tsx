import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  loginDemo: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    // Check for demo mode
    const demoMode = localStorage.getItem('demoMode');
    if (demoMode === 'true') {
      return {
        _id: 'demo-user',
        name: 'Demo User',
        email: 'demo@runher.com'
      };
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    const demoMode = localStorage.getItem('demoMode');
    if (demoMode === 'true') {
      return 'demo-token';
    }
    return localStorage.getItem('token');
  });

  useEffect(() => {
    if (token) {
      // Set token in both common headers and defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
      delete api.defaults.headers['Authorization'];
    }
  }, [token]);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('demoMode'); // Clear demo mode if logging in normally
  };

  const loginDemo = () => {
    const demoUser = {
      _id: 'demo-user',
      name: 'Demo User',
      email: 'demo@runher.com'
    };
    setToken('demo-token');
    setUser(demoUser);
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify(demoUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('demoMode');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      loginDemo,
      logout,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
