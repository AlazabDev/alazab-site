import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPublicAgentTools } from './lib/publicAgentTools';

const routeRecoveryCallback = (): void => {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(window.location.search);

  const isRecoveryCallback =
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery';

  if (isRecoveryCallback && window.location.pathname !== '/auth/reset-password') {
    const nextUrl = `/auth/reset-password${window.location.search}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }
};

routeRecoveryCallback();

void registerPublicAgentTools().catch((error: unknown) => console.warn('WebMCP registration unavailable', error));

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
