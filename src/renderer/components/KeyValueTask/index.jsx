import React, { useState } from 'react';
import EditableTitle from '../EditableTitle';
import { useWorkflow } from '../../context/WorkflowContext';
import './styles.css';

const KeyValueTask = ({ task, workflowId, onClose }) => {
  const { 
    updateTask, 
    runTask,
    taskRunningStates 
  } = useWorkflow();
  
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [scriptPath, setScriptPath] = useState(task.scriptPath || '');
  
  // 检查此任务是否正在运行
  const isRunning = taskRunningStates[`${workflowId}-${task.id}`];
  
  // 获取此任务的参数
  const parameters = task.parameters || [];

  // 更新任务标题
  const handleTaskNameSave = async (newName) => {
    if (!workflowId) return;

    try {
      await updateTask(workflowId, task.id, { name: newName });
    } catch (error) {
      console.error('Failed to update task name:', error);
    }
  };

  // 更新任务脚本路径
  const handleScriptPathChange = async (e) => {
    const newScriptPath = e.target.value;
    setScriptPath(newScriptPath);
    
    try {
      await updateTask(workflowId, task.id, { scriptPath: newScriptPath });
    } catch (error) {
      console.error('Failed to update script path:', error);
    }
  };

  // 添加新参数
  const handleAddParameter = async () => {
    if (!newKey.trim() || !workflowId) return;

    try {
      // 创建参数列表的副本
      const updatedParameters = [...parameters, { key: newKey, value: newValue }];
      
      // 更新任务
      await updateTask(workflowId, task.id, { parameters: updatedParameters });
      
      // 清空输入字段
      setNewKey('');
      setNewValue('');
    } catch (error) {
      console.error('Failed to add parameter:', error);
    }
  };

  // 删除参数
  const handleDeleteParameter = async (index) => {
    if (!workflowId) return;

    try {
      // 创建参数的副本并移除指定索引的项
      const updatedParameters = parameters.filter((_, i) => i !== index);
      
      // 更新任务
      await updateTask(workflowId, task.id, { parameters: updatedParameters });
    } catch (error) {
      console.error('Failed to delete parameter:', error);
    }
  };

  // 编辑已有参数
  const handleEditParameter = async (index, key, value) => {
    if (!workflowId) return;

    try {
      // 创建参数的副本
      const updatedParameters = [...parameters];
      // 更新指定索引的参数
      updatedParameters[index] = { key, value };
      
      // 更新任务
      await updateTask(workflowId, task.id, { parameters: updatedParameters });
    } catch (error) {
      console.error('Failed to edit parameter:', error);
    }
  };

  // 处理表单提交
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleAddParameter();
  };

  // 运行任务
  const handleRunTask = async () => {
    if (!workflowId || isRunning) return;
    
    try {
      const result = await runTask(workflowId, task.id);
      
      if (!result.success) {
        console.error('Failed to run task:', result.error);
        alert(`Failed to run task: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error running task:', error);
      alert(`Error running task: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="task-window key-value-task">
      <div className="task-header">
        <EditableTitle
          value={task.name}
          onSave={handleTaskNameSave}
          size="small"
          placeholder="Task Name"
          className="task-title-editable"
        />
        <button className="task-close" onClick={() => onClose(task.id)} title="Close task">×</button>
      </div>
      
      <div className="task-content">
        {/* 脚本路径输入框 */}
        <div className="script-path-container">
          <label htmlFor={`script-path-${task.id}`}>Script Path:</label>
          <input
            id={`script-path-${task.id}`}
            type="text"
            className="script-path-input"
            placeholder="Leave empty to use default script"
            value={scriptPath}
            onChange={handleScriptPathChange}
          />
          <small className="script-hint">Path to Node.js script that will process these parameters</small>
        </div>
        
        {/* 参数列表 */}
        <div className="parameters-section">
          <h4 className="parameters-header">Parameters</h4>
          <div className="parameters-list">
            {parameters.length > 0 ? (
              parameters.map((param, index) => (
                <div key={index} className="parameter-item">
                  <div className="parameter-key">{param.key}:</div>
                  <div className="parameter-value">{param.value}</div>
                  <button 
                    className="parameter-delete" 
                    onClick={() => handleDeleteParameter(index)}
                    title="Delete parameter"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="no-parameters">
                No parameters added yet. Add parameters below.
              </div>
            )}
          </div>
        </div>
        
        {/* 添加参数表单 */}
        <form className="parameter-form" onSubmit={handleFormSubmit}>
          <div className="parameter-inputs">
            <input
              type="text"
              className="parameter-key-input"
              placeholder="Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
            <input
              type="text"
              className="parameter-value-input"
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
            />
            <button 
              type="submit" 
              className="add-parameter-button"
              disabled={!newKey.trim()}
            >
              Add
            </button>
          </div>
        </form>
      </div>
      
      {/* 运行按钮 */}
      <button 
        className={`task-run ${isRunning ? 'running' : ''}`}
        onClick={handleRunTask}
        title="Run task with parameters"
        disabled={isRunning || parameters.length === 0}
      >
        {isRunning ? '...' : '▶'}
      </button>
    </div>
  );
};

export default KeyValueTask;