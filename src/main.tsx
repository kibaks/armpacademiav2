import {StrictMode, useState} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PasswordActivation } from './components/PasswordActivation';
import './index.css';

function Root() {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('reset'));
  return token ? <PasswordActivation token={token} onComplete={() => setToken(null)} /> : <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
