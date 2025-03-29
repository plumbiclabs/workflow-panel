import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css';

/**
 * 渲染进程入口文件
 * 
 * 将App组件挂载到DOM
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);