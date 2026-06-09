import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './styles/globals.css';

// Note: StrictMode is intentionally omitted. The canvas ritual and Web Audio
// graph are imperative, single-run effects; StrictMode's double-invocation in
// dev would re-trigger the ritual and audio unlock. Behaviour matches the
// original prototype.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.Fragment>
    <App />
  </React.Fragment>,
);
