import React from 'react';
import WorkflowContainer from './containers';
import { WorkflowProvider } from './context/WorkflowContext';
import './app.css';

/**
 * 应用根组件
 * 
 * 提供WorkflowProvider上下文
 * 渲染主工作流容器
 */
function App() {
  return (
    <WorkflowProvider>
      <div className="app">
        <WorkflowContainer />
      </div>
    </WorkflowProvider>
  );
}

export default App;