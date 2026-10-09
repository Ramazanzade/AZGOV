import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/auth';
import { getMe, logout as apiLogout } from '../services/authApi';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: () => {},
  logout: async () => {},
  refresh: async () => {}
  
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
     try {
    const u = await getMe();
    setUser(u);
  } catch {
    setUser(null);
  } finally {
    setLoading(false);      
  }
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      setUser,
      logout,
      refresh
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);