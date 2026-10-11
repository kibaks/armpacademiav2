import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { MfaChallengeDialog } from './components/MfaChallengeDialog';
import { MediaSessionBridge } from './components/MediaSessionBridge';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <MfaChallengeDialog />
    <MediaSessionBridge />
  </StrictMode>,
);
