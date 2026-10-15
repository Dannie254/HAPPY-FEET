import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './utils/query-provider';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <App />
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
