import React, { createContext, useState, useContext, useEffect } from 'react';
import WorkflowService from '../services/workflow.service';

// 创建Context
export const WorkflowContext = createContext();

// 创建Provider组件
export const WorkflowProvider = ({ children }) => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [taskRunningStates, setTaskRunningStates] = useState({});

  // 加载所有工作流
  const loadWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await WorkflowService.getAllWorkflows();
      setWorkflows(data || []);
      
      // 如果存在选中的工作流，更新它
      if (selectedWorkflow) {
        const updatedSelectedWorkflow = data.find(w => w.id === selectedWorkflow.id);
        setSelectedWorkflow(updatedSelectedWorkflow || null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadWorkflows();
  }, []);

  // 选择工作流
  const selectWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
  };

  // 添加工作流
  const addWorkflow = async (workflow) => {
    try {
      const newWorkflow = await WorkflowService.addWorkflow(workflow);
      setWorkflows([...workflows, newWorkflow]);
      return newWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 更新工作流
  const updateWorkflow = async (id, workflowData) => {
    try {
      const updatedWorkflow = await WorkflowService.updateWorkflow(id, workflowData);
      setWorkflows(workflows.map(w => w.id === id ? updatedWorkflow : w));
      
      // 如果正在更新选中的工作流，同时更新selectedWorkflow
      if (selectedWorkflow && selectedWorkflow.id === id) {
        setSelectedWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 删除工作流
  const deleteWorkflow = async (id) => {
    try {
      await WorkflowService.deleteWorkflow(id);
      setWorkflows(workflows.filter(w => w.id !== id));
      
      // 如果删除的是选中的工作流，清除选择
      if (selectedWorkflow && selectedWorkflow.id === id) {
        setSelectedWorkflow(null);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 添加任务
  const addTask = async (workflowId, task) => {
    try {
      const updatedWorkflow = await WorkflowService.addTask(workflowId, task);
      
      // 更新工作流列表
      setWorkflows(workflows.map(w => w.id === workflowId ? updatedWorkflow : w));
      
      // 更新选中的工作流（如果需要）
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 更新任务
  const updateTask = async (workflowId, taskId, taskData) => {
    try {
      const updatedWorkflow = await WorkflowService.updateTask(workflowId, taskId, taskData);
      
      // 更新工作流列表
      setWorkflows(workflows.map(w => w.id === workflowId ? updatedWorkflow : w));
      
      // 更新选中的工作流（如果需要）
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 删除任务
  const deleteTask = async (workflowId, taskId) => {
    try {
      const updatedWorkflow = await WorkflowService.deleteTask(workflowId, taskId);
      
      // 更新工作流列表
      setWorkflows(workflows.map(w => w.id === workflowId ? updatedWorkflow : w));
      
      // 更新选中的工作流（如果需要）
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 运行任务
  const runTask = async (workflowId, taskId) => {
    try {
      // 更新任务运行状态
      setTaskRunningStates(prev => ({
        ...prev,
        [`${workflowId}-${taskId}`]: true
      }));
      
      const result = await WorkflowService.runTask(workflowId, taskId);
      
      // 重置任务运行状态
      setTaskRunningStates(prev => ({
        ...prev,
        [`${workflowId}-${taskId}`]: false
      }));
      
      return result;
    } catch (err) {
      // 重置任务运行状态
      setTaskRunningStates(prev => ({
        ...prev,
        [`${workflowId}-${taskId}`]: false
      }));
      
      setError(err.message);
      throw err;
    }
  };

  // 添加命令
  const addCommand = async (workflowId, taskId, command) => {
    try {
      const updatedWorkflow = await WorkflowService.addCommand(workflowId, taskId, command);
      
      // 更新工作流列表
      setWorkflows(workflows.map(w => w.id === workflowId ? updatedWorkflow : w));
      
      // 更新选中的工作流（如果需要）
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 删除命令
  const deleteCommand = async (workflowId, taskId, commandIndex) => {
    try {
      const updatedWorkflow = await WorkflowService.deleteCommand(workflowId, taskId, commandIndex);
      
      // 更新工作流列表
      setWorkflows(workflows.map(w => w.id === workflowId ? updatedWorkflow : w));
      
      // 更新选中的工作流（如果需要）
      if (selectedWorkflow && selectedWorkflow.id === workflowId) {
        setSelectedWorkflow(updatedWorkflow);
      }
      
      return updatedWorkflow;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // 创建Context值对象
  const contextValue = {
    workflows,
    selectedWorkflow,
    loading,
    error,
    taskRunningStates,
    selectWorkflow,
    loadWorkflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    addTask,
    updateTask,
    deleteTask,
    runTask,
    addCommand,
    deleteCommand
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

// 创建自定义Hook以简化Context的使用
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
