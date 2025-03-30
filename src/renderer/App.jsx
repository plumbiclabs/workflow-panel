import React, { useEffect } from 'react';
import WorkflowContainer from './containers';
import { WorkflowProvider } from './context/WorkflowContext';
import './app.css';
import ScriptService from './services/script.service';

/**
 * 应用根组件
 * 
 * 提供WorkflowProvider上下文
 * 渲染主工作流容器
 */
function App() {
  useEffect(() => {
    // 在应用启动时预加载脚本列表
    const loadScripts = async () => {
      try {
        await ScriptService.getAllScripts();
        console.log('Scripts loaded');
      } catch (error) {
        console.error('Failed to preload scripts:', error);
      }
    };
    
    loadScripts();
  }, []);

  return (
    <WorkflowProvider>
      <div className="app">
        <WorkflowContainer />
      </div>
    </WorkflowProvider>
  );
}

export default App;