import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MinimalistLoader from './components/common/MinimalistLoader';
import JoyPreloader from './components/common/JoyPreloader';
import { NetworkErrorProvider } from './context/NetworkErrorContext';
import { AuthProvider } from './context/AuthContext';
import NetworkErrorNotification from './components/common/NetworkErrorNotification';
import { silentTokenRefresh } from './lib/auth';

// Lazy load route pages for hyper-optimized lazy loading on slower internet connections
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const TicketPage = lazy(() => import('./pages/TicketPage'));

// Lazy load Chatbot since it contains markdown renderers, chat bubbles and can be heavy
const Chatbot = lazy(() => import('./components/user/Chatbot').then(m => ({ default: m.Chatbot })));

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    // 1. Intercept context menu (right-click) to prevent inspecting elements easily
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    // 2. Disable common shortcuts to open DevTools or view page source
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+Shift+I / Cmd+Opt+I (Inspect), Ctrl+Shift+J / Cmd+Opt+J (Console), Ctrl+Shift+C (Element picker)
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+U / Cmd+Opt+U (View Source Code)
      if (isCmdOrCtrl && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }
      // Prevent Ctrl+S / Cmd+S (Save webpage file)
      if (isCmdOrCtrl && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // 3. Clear/override standard console logs in deployment or non-localhost to block hacker scraping
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalHost) {
      const emptyFunc = () => {};
      const originalLog = console.log;
      
      console.log = emptyFunc;
      console.info = emptyFunc;
      console.warn = emptyFunc;
      
      // Print clean, non-revealing warning inside developer console if opened
      setTimeout(() => {
        originalLog("%c🔒 Joy Water Sports - Secure Environment 🔒", "color: #0284c7; font-size: 24px; font-weight: bold; text-shadow: 1px 1px 1px #000;");
        originalLog("%cThe browser console is protected & restricted for your safety. To prevent cyber threats, credential hijackers or cross-site scripting (XSS), do not paste any scripts or keys here.", "color: #ef4444; font-size: 13px; font-weight: 500;");
      }, 1200);
    }

    // 4. Perform silent token refresh on app startup using httpOnly refresh cookie
    silentTokenRefresh().catch(() => {});

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AuthProvider>
      <NetworkErrorProvider>
        {showPreloader && (
          <JoyPreloader
            brandName="JOYWATERSPORTS"
            subText="LOADING OCEAN EXPERIENCE..."
            durationMs={2800}
            onComplete={() => setShowPreloader(false)}
          />
        )}
        <BrowserRouter>
          <NetworkErrorNotification />
          <Suspense fallback={<MinimalistLoader message="Loading" />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Navigate to="/?login=true" replace />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/activity/:id" element={<ActivityPage />} />
              <Route path="/ticket/:id" element={<TicketPage />} />
              <Route path="/ticket/manual/:id" element={<TicketPage />} />
            </Routes>
          </Suspense>
          
          {/* Floating Chatbot Assistant wrapped separately without blocking page routes */}
          <Suspense fallback={null}>
            <Chatbot />
          </Suspense>
        </BrowserRouter>
      </NetworkErrorProvider>
    </AuthProvider>
  );
}

