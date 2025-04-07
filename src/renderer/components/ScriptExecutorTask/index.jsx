import React, { useCallback, useMemo } from 'react';
import EditableTitle from '../EditableTitle';
import { useWorkflow } from '../../context/WorkflowContext';
import './styles.css';

// 导入子组件
import ScriptSelector from './components/ScriptSelector';
import ParametersList from './components/ParametersList';
import AddParameterForm from './components/AddParameterForm';

// 导入自定义hooks
import useScriptOptions from './hooks/useScriptOptions';
import useParameters from './hooks/useParameters';

const ScriptExecutorTask = ({ task, workflowId, onClose }) => {
  const { 
    updateTask, 
    runTask,
    taskRunningStates 
  } = useWorkflow();
  
  // 使用自定义hook管理脚本选项
  const {
    scriptOptions,
    loading,
    selectedScriptId,
    setSelectedScriptId,
    selectedScript
  } = useScriptOptions(task.scriptId);
  
  // 使用自定义hook管理参数
  const {
    parameters,
    newKey,
    setNewKey,
    newValue,
    setNewValue,
    missingParams,
    isRequiredParam,
    handleAddParameter,
    handleDeleteParameter,
    handleParameterValueChange,
    validateTaskParameters
  } = useParameters(task, workflowId, updateTask, selectedScript);
  
  // 检查此任务是否正在运行
  const isRunning = taskRunningStates[`${workflowId}-${task.id}`];

  // 更新任务标题
  const handleTaskNameSave = useCallback(async (newName) => {
    if (!workflowId) return;

    try {
      await updateTask(workflowId, task.id, { name: newName });
    } catch (error) {
      console.error('Failed to update task name:', error);
    }
  }, [workflowId, task.id, updateTask]);

  // 更新任务脚本
  const handleScriptChange = useCallback(async (e) => {
    const newScriptId = e.target.value;
    setSelectedScriptId(newScriptId);
    
    const newScript = scriptOptions.find(s => s.id === newScriptId);
    
    try {
      await updateTask(workflowId, task.id, { 
        scriptId: newScriptId,
        scriptPath: newScript.path
      });
    } catch (error) {
      console.error('Failed to update script:', error);
    }
  }, [scriptOptions, workflowId, task.id, updateTask, setSelectedScriptId]);

  // 处理表单提交
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    handleAddParameter();
  }, [handleAddParameter]);

  // 运行任务
  const handleRunTask = useCallback(async () => {
    if (!workflowId || isRunning) return;
    
    // 使用集中的验证函数检查参数
    const validation = validateTaskParameters();
    if (!validation.isValid) {
      alert(validation.error);
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
  }, [workflowId, isRunning, validateTaskParameters, runTask, task.id]);

  // 计算表单禁用状态
  const formDisabled = useMemo(() => {
    return loading || 
      !newKey.trim() || 
      (selectedScript?.requiredParams?.includes(newKey) || false) ||
      parameters.some(p => p.key === newKey);
  }, [loading, newKey, selectedScript, parameters]);

  // 运行按钮禁用状态 - 简化逻辑
  const runDisabled = useMemo(() => {
    // 如果正在加载或运行中，禁用按钮
    if (loading || isRunning) return true;
    
    // 使用集中的验证函数检查是否可以运行
    return !validateTaskParameters().isValid;
  }, [loading, isRunning, validateTaskParameters]);

  return (
    <div className="task-window script-executor-task">
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
        {/* 脚本选择器 */}
        <ScriptSelector
          taskId={task.id}
          selectedScriptId={selectedScriptId}
          scriptOptions={scriptOptions}
          loading={loading}
          onScriptChange={handleScriptChange}
          selectedScript={selectedScript}
        />
        
        {/* 参数列表 */}
        <ParametersList
          parameters={parameters}
          loading={loading}
          isRequiredParam={isRequiredParam}
          onValueChange={handleParameterValueChange}
          onDelete={handleDeleteParameter}
          workflowId={workflowId}
          taskId={task.id}
        />
        
        {/* 添加参数表单 */}
        <AddParameterForm
          newKey={newKey}
          newValue={newValue}
          loading={loading}
          onKeyChange={(e) => setNewKey(e.target.value)}
          onValueChange={(e) => setNewValue(e.target.value)}
          onSubmit={handleFormSubmit}
          disableAdd={formDisabled}
        />
      </div>
      
      {/* 运行按钮 */}
      <button 
        className={`task-run ${isRunning ? 'running' : ''}`}
        onClick={handleRunTask}
        title="Run task with parameters"
        disabled={runDisabled}
      >
        {isRunning ? '...' : '▶'}
      </button>
    </div>
  );
};

export default ScriptExecutorTask;