import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import AuthModal from './components/auth/AuthModal';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const MAX_AGE = 60 * 60 * 1000; // 1 saat

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      gcTime: MAX_AGE, // persist üçün maxAge-dən kiçik olmamalıdır
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'azdatam_rq_cache',
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: MAX_AGE,
        dehydrateOptions: {
          // yalnız siyahı/statistika kimi kiçik sorğuları saxla,
          // məzmun (content) və PDF presigned URL-ləri yox
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' &&
            query.queryKey[0] !== 'content',
        },
      }}
    >
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider>
          <LanguageProvider>
            <BrowserRouter>
              <AuthProvider>
                <AuthModalProvider>
                  <App />
                  <AuthModal />
                </AuthModalProvider>
              </AuthProvider>
            </BrowserRouter>
          </LanguageProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </PersistQueryClientProvider>
  </React.StrictMode>
);