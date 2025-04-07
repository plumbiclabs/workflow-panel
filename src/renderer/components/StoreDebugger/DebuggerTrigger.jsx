import React, { useState } from 'react';
import StoreDebugger from './index';
import './style.css';

/**
 * 调试器触发器组件
 * 
 * 显示一个悬浮按钮，点击后打开Store调试器
 */
const DebuggerTrigger = () => {
  const [showDebugger, setShowDebugger] = useState(false);

  const toggleDebugger = () => {
    setShowDebugger(!showDebugger);
  };

  return (
    <>
      <div className="debugger-trigger" onClick={toggleDebugger} title="Store调试器">
        {showDebugger ? '×' : '⚙'}
      </div>
      
      <StoreDebugger 
        isOpen={showDebugger}
        onClose={() => setShowDebugger(false)}
      />
    </>
  );
};

export default DebuggerTrigger; 