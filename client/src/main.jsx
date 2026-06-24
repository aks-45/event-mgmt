import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { IdCardLayoutProvider } from './context/IdCardLayoutContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <IdCardLayoutProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'text-sm font-medium',
                style: {
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow: '0 8px 30px -8px rgba(0,33,71,0.2)',
                },
                success: {
                  iconTheme: { primary: '#D4AF37', secondary: '#002147' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#fff' },
                },
              }}
            />
          </IdCardLayoutProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
