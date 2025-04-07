import React, { useEffect, useState } from 'react';
import WorkflowContainer from './components/container';
import DebuggerTrigger from './components/StoreDebugger/DebuggerTrigger';
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
  // 添加开发模式状态
  const [isDevMode, setIsDevMode] = useState(false);

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

    // 检查是否处于开发模式
    setIsDevMode(process.env.NODE_ENV === 'development' || localStorage.getItem('devMode') === 'true');

    // 监听开发者模式的快捷键: Ctrl+Shift+D
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        setIsDevMode(prevMode => {
          const newMode = !prevMode;
          localStorage.setItem('devMode', newMode.toString());
          return newMode;
        });
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <WorkflowProvider>
      <div className="app">
        <WorkflowContainer />
        {isDevMode && <DebuggerTrigger />}
      </div>
    </WorkflowProvider>
  );
}

export default App;