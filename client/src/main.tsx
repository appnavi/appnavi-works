import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@materializecss/materialize/dist/css/materialize.css';
import '@materializecss/materialize/dist/js/materialize.min';
import 'material-icons/iconfont/material-icons.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
