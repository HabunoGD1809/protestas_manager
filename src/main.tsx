// import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './styles/theme';
import './styles/global.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('No se encontró el elemento con id "root"');
}

const root = createRoot(container);

root.render(
  // <React.StrictMode>
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </Router>
  // </React.StrictMode>
);
