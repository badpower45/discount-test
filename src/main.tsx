import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 React app starting...');

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ React app rendered successfully!');
  } catch (error) {
    console.error('❌ React render error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red;"><h1>React Error</h1><pre>' + errorMessage + '</pre></div>';
  }
} else {
  console.error("Failed to find the root element");
}