// import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App.tsx';
// import './index.css';

console.log('🚀 React app starting...');

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    // Test with simple HTML first
    rootElement.innerHTML = `
      <div style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; font-family: Arial;">
        <h1 style="font-size: 2.5em; margin-bottom: 20px;">✅ React Working!</h1>
        <p style="font-size: 1.2em; margin-bottom: 15px;">🎉 Base setup is functional</p>
        <p style="font-size: 1em; opacity: 0.9;">Server: OK | HTML: OK | Scripts: OK</p>
        <div style="margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
          <p>Debug successful - ready to load full app</p>
        </div>
      </div>
    `;
    console.log('✅ React app rendered successfully!');
  } catch (error) {
    console.error('❌ React render error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    rootElement.innerHTML = '<div style="padding: 20px; color: red;"><h1>React Error</h1><pre>' + errorMessage + '</pre></div>';
  }
} else {
  console.error("Failed to find the root element");
}