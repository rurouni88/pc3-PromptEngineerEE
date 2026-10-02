import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyFontScale, loadFontScale } from './engine/font-scale';
import './index.css';

// Apply the user's font size before first paint (rem-based UI scales).
applyFontScale(loadFontScale());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
