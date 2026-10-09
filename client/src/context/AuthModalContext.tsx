import { createContext, useContext, useState, ReactNode } from 'react';

export type AuthMode = 'signin' | 'signup' | null;

interface Ctx {
  mode: AuthMode;
  open: (mode: 'signin' | 'signup') => void;
  close: () => void;
  switchMode: (mode: 'signin' | 'signup') => void;
}

const AuthModalCtx = createContext<Ctx>({
  mode: null,
  open: () => {},
  close: () => {},
  switchMode: () => {}
});

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AuthMode>(null);

  return (
    <AuthModalCtx.Provider
      value={{
        mode,
        open: (m) => setMode(m),
        close: () => setMode(null),
        switchMode: (m) => setMode(m)
      }}
    >
      {children}
    </AuthModalCtx.Provider>
  );
};

export const useAuthModal = () => useContext(AuthModalCtx);