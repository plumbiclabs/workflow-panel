import React, { useState, useEffect } from 'react';
import EditableTitle from '../EditableTitle';
import { useWorkflow } from '../../context/WorkflowContext';
import ScriptService from '../../services/script.service';
import './styles.css';

const KeyValueTask = ({ task, workflowId, onClose }) => {
  const { 
    updateTask, 
    runTask,
    taskRunningStates 
  } = useWorkflow();
  
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  
  // 脚本列表状态
  const [scriptOptions, setScriptOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 获取当前选择的脚本ID
  const [selectedScriptId, setSelectedScriptId] = useState(
    task.scriptId || 'default'
  );
  
  // 检查此任务是否正在运行
  const isRunning = taskRunningStates[`${workflowId}-${task.id}`];
  
  // 获取此任务的参数
  const parameters = task.parameters || [];
  
  // 获取当前选择的脚本
  const [selectedScript, setSelectedScript] = useState(null);
  
  // 加载脚本选项
  useEffect(() => {
    async function loadScripts() {
      setLoading(true);
      try {
        const scripts = await ScriptService.getAllScripts();
        setScriptOptions(scripts);
        
        // 设置当前选择的脚本
        const current = scripts.find(s => s.id === selectedScriptId) || scripts[0];
        setSelectedScript(current);
      } catch (error) {
        console.error('Failed to load scripts:', error);
        // 使用本地定义作为备用
        const localScripts = ScriptService.getLocalScriptDefinitions();
        setScriptOptions(localScripts);
        setSelectedScript(localScripts.find(s => s.id === selectedScriptId) || localScripts[0]);
      } finally {
        setLoading(false);
      }
    }
    
    loadScripts();
  }, []);
  
  // 当选择的脚本ID变更时，更新选中的脚本对象
  useEffect(() => {
    const script = scriptOptions.find(s => s.id === selectedScriptId);
    if (script) {
      setSelectedScript(script);
    }
  }, [selectedScriptId, scriptOptions]);
  
  // 检查是否缺少必填参数
  const missingParams = selectedScript?.requiredParams?.filter(
    param => !parameters.some(p => p.key === param)
  ) || [];
  
  // 当脚本变更时，自动添加必填参数
  useEffect(() => {
    const addRequiredParams = async () => {
      if (selectedScript && missingParams.length > 0 && workflowId) {
        // 创建参数列表的副本
        const updatedParameters = [...parameters];
        
        // 添加缺少的必填参数
        missingParams.forEach(param => {
          if (!updatedParameters.some(p => p.key === param)) {
            updatedParameters.push({ key: param, value: '' });
          }
        });
        
        // 更新任务
        try {
          await updateTask(workflowId, task.id, { 
            parameters: updatedParameters,
            scriptId: selectedScriptId,
            scriptPath: selectedScript.path
          });
        } catch (error) {
          console.error('Failed to add required parameters:', error);
        }
      }
    };
    
    addRequiredParams();
  }, [selectedScript, missingParams.length]);

  // 更新任务标题
  const handleTaskNameSave = async (newName) => {
    if (!workflowId) return;

    try {
      await updateTask(workflowId, task.id, { name: newName });
    } catch (error) {
      console.error('Failed to update task name:', error);
    }
  };

  // 更新任务脚本
  const handleScriptChange = async (e) => {
    const newScriptId = e.target.value;
    setSelectedScriptId(newScriptId);
    
    const newScript = scriptOptions.find(s => s.id === newScriptId) || scriptOptions[0];
    
    try {
      await updateTask(workflowId, task.id, { 
        scriptId: newScriptId,
        scriptPath: newScript.path
      });
    } catch (error) {
      console.error('Failed to update script:', error);
    }
  };

  // 添加新参数
  const handleAddParameter = async () => {
    if (!newKey.trim() || !workflowId) return;

    // 检查参数名是否已存在
    if (parameters.some(p => p.key === newKey)) {
      alert(`Parameter with key "${newKey}" already exists. Please use a different name.`);
      return;
    }

    // 检查是否是保留的必填参数名
    if (selectedScript?.requiredParams?.includes(newKey)) {
      alert(`"${newKey}" is a reserved parameter name for this script. Please use a different name.`);
      return;
    }

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
    
    const paramToDelete = parameters[index];
    
    // 检查是否是必填参数
    if (selectedScript?.requiredParams?.includes(paramToDelete.key)) {
      alert(`Cannot delete required parameter: ${paramToDelete.key}`);
      return;
    }

    try {
      // 创建参数的副本并移除指定索引的项
      const updatedParameters = parameters.filter((_, i) => i !== index);
      
      // 更新任务
      await updateTask(workflowId, task.id, { parameters: updatedParameters });
    } catch (error) {
      console.error('Failed to delete parameter:', error);
    }
  };

  // 更新参数值
  const handleParameterValueChange = async (index, newValue) => {
    if (!workflowId) return;

    try {
      // 创建参数的副本
      const updatedParameters = [...parameters];
      // 只更新值，保持键不变
      updatedParameters[index] = { 
        ...updatedParameters[index], 
        value: newValue 
      };
      
      // 更新任务
      await updateTask(workflowId, task.id, { parameters: updatedParameters });
    } catch (error) {
      console.error('Failed to update parameter value:', error);
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
    
    // 验证必填参数
    if (missingParams.length > 0) {
      alert(`Missing required parameters: ${missingParams.join(', ')}`);
      return;
    }
    
    // 验证必填参数有值
    const emptyRequiredParams = selectedScript?.requiredParams?.filter(param => {
      const paramObj = parameters.find(p => p.key === param);
      return !paramObj || !paramObj.value.trim();
    }) || [];
    
    if (emptyRequiredParams.length > 0) {
      alert(`Required parameters cannot be empty: ${emptyRequiredParams.join(', ')}`);
      return;
    }
    
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

  // 检查参数是否是必填项
  const isRequiredParam = (key) => {
    return selectedScript?.requiredParams?.includes(key) || false;
  };

  // 渲染单个参数项
  const renderParameterItem = (param, index) => {
    const required = isRequiredParam(param.key);
    
    return (
      <div 
        key={index} 
        className={`parameter-item ${required ? 'required' : ''}`}
      >
        <div className="parameter-key">
          {param.key}
          {required && <span className="required-badge">Required</span>}
        </div>
        <input
          type="text"
          className="parameter-value-input-inline"
          value={param.value}
          onChange={(e) => handleParameterValueChange(index, e.target.value)}
          placeholder={`Enter value for ${param.key}`}
        />
        {!required && (
          <button 
            className="parameter-delete" 
            onClick={() => handleDeleteParameter(index)}
            title="Delete parameter"
          >
            ×
          </button>
        )}
      </div>
    );
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
        {/* 脚本选择下拉框 */}
        <div className="script-selector-container">
          <label htmlFor={`script-select-${task.id}`}>Script:</label>
          {loading ? (
            <div className="loading-scripts">Loading scripts...</div>
          ) : (
            <>
              <select
                id={`script-select-${task.id}`}
                className="script-select"
                value={selectedScriptId}
                onChange={handleScriptChange}
                disabled={loading}
              >
                {scriptOptions.map(script => (
                  <option key={script.id} value={script.id}>
                    {script.name}
                  </option>
                ))}
              </select>
              {selectedScript && (
                <p className="script-description">{selectedScript.description}</p>
              )}
            </>
          )}
        </div>
        
        {/* 参数列表 */}
        <div className="parameters-section">
          <h4 className="parameters-header">Parameters</h4>
          <div className="parameters-list">
            {parameters.length > 0 ? (
              parameters.map((param, index) => renderParameterItem(param, index))
            ) : (
              <div className="no-parameters">
                {loading 
                  ? 'Loading parameters...' 
                  : 'No parameters added yet. Add parameters below.'}
              </div>
            )}
          </div>
        </div>
        
        {/* 添加自定义参数表单 */}
        <form className="parameter-form" onSubmit={handleFormSubmit}>
          <h4 className="parameters-header">Add Custom Parameter</h4>
          <div className="parameter-inputs">
            <input
              type="text"
              className="parameter-key-input"
              placeholder="Key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              disabled={loading}
            />
            <input
              type="text"
              className="parameter-value-input"
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="add-parameter-button"
              disabled={
                loading || 
                !newKey.trim() || 
                (selectedScript?.requiredParams?.includes(newKey) || false) ||
                parameters.some(p => p.key === newKey)
              }
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
        disabled={
          isRunning || 
          missingParams.length > 0 || 
          loading || 
          parameters.length === 0
        }
      >
        {isRunning ? '...' : '▶'}
      </button>
    </div>
  );
};

export default KeyValueTask;