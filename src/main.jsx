import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './estilos/global.css';
import App from './App.jsx';
import { iniciarTema } from './utilitarios/tema.js';
import { aplicarPreferencias } from './utilitarios/preferencias.js';

iniciarTema();
aplicarPreferencias();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
