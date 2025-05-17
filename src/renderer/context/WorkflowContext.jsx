import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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
  const [taskOutputs, setTaskOutputs] = useState({});

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
  
  // 更新工作流排序
  const updateWorkflowsOrder = async (reorderedWorkflows) => {
    try {
      // 保存新的排序到服务端
      await WorkflowService.updateWorkflowsOrder(reorderedWorkflows);
      
      // 更新本地状态
      setWorkflows(reorderedWorkflows);
      
      // 如果有选中的工作流，确保它在新排序中保持选中状态
      if (selectedWorkflow) {
        const updatedSelectedWorkflow = reorderedWorkflows.find(w => w.id === selectedWorkflow.id);
        if (updatedSelectedWorkflow) {
          setSelectedWorkflow(updatedSelectedWorkflow);
        }
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
  const runTask = async (workflowId, taskId, terminalId) => {
    try {
      // 更新任务运行状态
      setTaskRunningStates(prev => ({
        ...prev,
        [`${workflowId}-${taskId}`]: true
      }));
      
      const result = await WorkflowService.runTask(workflowId, taskId, terminalId);
      
      // 存储任务输出结果
      if (result.success && result.output) {
        setTaskOutputs(prev => ({
          ...prev,
          [`${workflowId}-${taskId}`]: result.output
        }));
      }
      
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

  // 新增：获取任务输出
  const getTaskOutput = (workflowId, taskId) => {
    return taskOutputs[`${workflowId}-${taskId}`] || null;
  };

  // 新增：获取当前工作流的所有任务输出
  const getWorkflowTaskOutputs = (workflowId) => {
    const outputs = {};
    
    if (!workflowId || !workflows.length) return outputs;
    
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow || !workflow.tasks || !workflow.tasks.length) return outputs;
    
    workflow.tasks.forEach(task => {
      const output = taskOutputs[`${workflowId}-${task.id}`];
      if (output) {
        outputs[task.id] = {
          taskId: task.id,
          taskName: task.name,
          output
        };
      }
    });
    
    return outputs;
  };

  // 新增：解析参数中的变量引用（前端版本）
  const resolveVariableReferences = (parameters, workflowId) => {
    if (!parameters || !Array.isArray(parameters)) return parameters;

    // 解析后的参数
    const resolvedParams = {};

    // 正则表达式用于匹配变量引用: ${TaskX.output.xyz}
    const variablePattern = /\${([^}]+)}/g;

    // 处理每个参数
    parameters.forEach(param => {
      let value = param.value;
      
      // 检查值是否包含变量引用
      if (typeof value === 'string' && value.includes('${')) {
        // 替换所有变量引用
        value = value.replace(variablePattern, (match, varPath) => {
          try {
            // 解析变量路径，例如 task-1.output.user.name
            const pathParts = varPath.split('.');
            
            // 我们现在的格式是 task-X.output.path.to.value
            if (pathParts.length >= 2 && pathParts[1] === 'output') {
              const taskRef = pathParts[0]; // 例如 "task-1"
              
              // 在缓存中查找任务结果
              const taskOutput = taskOutputs[`${workflowId}-${taskRef.replace('task-', '')}`];
              
              if (!taskOutput) {
                console.warn(`Variable reference not found: ${match} - Task output not in cache`);
                return match; // 如果找不到，保留原始引用
              }
              
              // 递归查找嵌套属性
              let result = taskOutput;
              for (let i = 2; i < pathParts.length; i++) {
                result = result[pathParts[i]];
                
                // 如果路径不存在，返回原始引用
                if (result === undefined) {
                  console.warn(`Variable reference not found: ${match} - Path does not exist`);
                  return match;
                }
              }
              
              return result; // 返回解析的值
            }
            
            console.warn(`Invalid variable reference format: ${match}`);
            return match; // 格式不正确，保留原始引用
          } catch (error) {
            console.error(`Error resolving variable reference ${match}:`, error);
            return match; // 出现错误，保留原始引用
          }
        });
      }
      
      resolvedParams[param.key] = value;
    });
    
    return resolvedParams;
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

  // 监听任务完成事件
  useEffect(() => {
    const unsubscribe = WorkflowService.registerTaskCompletionHandler(result => {
      if (result && result.taskId && result.workflowId && result.success) {
        // 更新任务输出结果
        setTaskOutputs(prev => ({
          ...prev,
          [`${result.workflowId}-${result.taskId}`]: result.output || {}
        }));
        
        // 重置任务运行状态
        setTaskRunningStates(prev => ({
          ...prev,
          [`${result.workflowId}-${result.taskId}`]: false
        }));
      }
    });
    
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  // 创建Context值对象
  const contextValue = {
    workflows,
    selectedWorkflow,
    loading,
    error,
    taskRunningStates,
    taskOutputs,
    selectWorkflow,
    loadWorkflows,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow,
    updateWorkflowsOrder,
    addTask,
    updateTask,
    deleteTask,
    runTask,
    getTaskOutput,
    getWorkflowTaskOutputs,
    resolveVariableReferences,
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
