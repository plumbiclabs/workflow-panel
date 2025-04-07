import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import WorkflowService from '../../services/workflow.service';
import './style.css';

const StoreDebugger = ({ isOpen, onClose }) => {
  const { 
    workflows, 
    selectedWorkflow, 
    taskRunningStates, 
    taskOutputs 
  } = useWorkflow();
  
  const [activeTab, setActiveTab] = useState('workflows');
  const [mainProcessData, setMainProcessData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 从主进程获取存储数据
  const fetchMainProcessData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 假设我们添加了一个API来获取主进程的存储数据
      const data = await WorkflowService.getDebugData();
      setMainProcessData(data);
    } catch (err) {
      console.error('Failed to fetch main process data:', err);
      setError(err.message || '获取主进程数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 组件挂载和打开时获取数据
  useEffect(() => {
    if (isOpen && activeTab === 'mainProcess') {
      fetchMainProcessData();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'workflows':
        return (
          <div className="tab-content">
            <h3>Workflows ({workflows.length})</h3>
            <pre>{JSON.stringify(workflows, null, 2)}</pre>
          </div>
        );
      case 'selectedWorkflow':
        return (
          <div className="tab-content">
            <h3>Selected Workflow</h3>
            <pre>{selectedWorkflow ? JSON.stringify(selectedWorkflow, null, 2) : 'No workflow selected'}</pre>
          </div>
        );
      case 'taskRunningStates':
        return (
          <div className="tab-content">
            <h3>Task Running States</h3>
            <pre>{JSON.stringify(taskRunningStates, null, 2)}</pre>
          </div>
        );
      case 'taskOutputs':
        return (
          <div className="tab-content">
            <h3>Task Outputs</h3>
            <pre>{JSON.stringify(taskOutputs, null, 2)}</pre>
          </div>
        );
      case 'mainProcess':
        return (
          <div className="tab-content">
            <div className="tab-header">
              <h3>Main Process Store Data</h3>
              <button 
                className="refresh-button" 
                onClick={fetchMainProcessData}
                disabled={isLoading}
              >
                {isLoading ? '加载中...' : '刷新'}
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            {isLoading ? (
              <div className="loading">加载中...</div>
            ) : (
              <pre>{mainProcessData ? JSON.stringify(mainProcessData, null, 2) : '暂无数据'}</pre>
            )}
          </div>
        );
      default:
        return <div>选择一个选项卡查看数据</div>;
    }
  };

  return (
    <div className="store-debugger">
      <div className="debugger-header">
        <h2>Store 调试器</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="debugger-tabs">
        <button 
          className={activeTab === 'workflows' ? 'active' : ''} 
          onClick={() => setActiveTab('workflows')}
        >
          工作流列表
        </button>
        <button 
          className={activeTab === 'selectedWorkflow' ? 'active' : ''} 
          onClick={() => setActiveTab('selectedWorkflow')}
        >
          当前工作流
        </button>
        <button 
          className={activeTab === 'taskRunningStates' ? 'active' : ''} 
          onClick={() => setActiveTab('taskRunningStates')}
        >
          任务运行状态
        </button>
        <button 
          className={activeTab === 'taskOutputs' ? 'active' : ''} 
          onClick={() => setActiveTab('taskOutputs')}
        >
          任务输出
        </button>
        <button 
          className={activeTab === 'mainProcess' ? 'active' : ''} 
          onClick={() => setActiveTab('mainProcess')}
        >
          主进程存储
        </button>
      </div>
      
      {renderTabContent()}
    </div>
  );
};

export default StoreDebugger; 