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

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
ReactDOM.createRoot(document.getElementById('root')!).render(
 <React.StrictMode>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>

    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AuthModalProvider>
            <BrowserRouter>
              <App />
              <AuthModal />
            </BrowserRouter>
          </AuthModalProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
        </GoogleOAuthProvider>

  </React.StrictMode>
);