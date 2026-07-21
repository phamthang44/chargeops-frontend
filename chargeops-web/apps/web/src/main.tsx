import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import { App } from './App';

// Resolve theme before first paint — avoids a flash of the wrong theme.
// ThemeProvider (theme.tsx) picks this up as its initial state.
const storedTheme = localStorage.getItem('chargeops.theme');
document.documentElement.dataset.theme =
  storedTheme === 'dark' || storedTheme === 'light'
    ? storedTheme
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
