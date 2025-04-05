import { useState, useEffect, useMemo, useCallback } from 'react';

function useParameters(task, workflowId, updateTask, selectedScript) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const parameters = task.parameters || [];

  // 检查是否缺少必填参数
  const missingParams = useMemo(() => {
    return selectedScript?.requiredParams?.filter(
      param => !parameters.some(p => p.key === param)
    ) || [];
  }, [selectedScript, parameters]);
  
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
            scriptId: selectedScript.id,
            scriptPath: selectedScript.path
          });
        } catch (error) {
          console.error('Failed to add required parameters:', error);
        }
      }
    };
    
    addRequiredParams();
  }, [selectedScript, missingParams.length, task.id, workflowId, parameters, updateTask]);

  // 检查参数是否是必填项
  const isRequiredParam = useCallback((key) => {
    return selectedScript?.requiredParams?.includes(key) || false;
  }, [selectedScript]);

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
  const handleDeleteParameter = useCallback(async (index) => {
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
  }, [workflowId, parameters, selectedScript, updateTask, task.id]);

  // 更新参数值
  const handleParameterValueChange = useCallback(async (indexOrEvent, optionalValue) => {
    if (!workflowId) return;
    
    // 处理两种调用方式: 
    // 1. (event) 是对象(从输入框onChange事件)，包含 target.value 和 paramIndex
    // 2. 直接传入 (index, newValue) 参数
    
    let index, newValue;
    
    if (typeof indexOrEvent === 'object' && indexOrEvent !== null) {
      // 来自输入框 onChange 的事件对象
      index = indexOrEvent.paramIndex;
      newValue = indexOrEvent.target.value;
    } else {
      // 直接传入 (index, newValue) 的调用方式
      index = indexOrEvent;
      newValue = optionalValue;
    }
    
    // 确保参数有效
    if (index === undefined || newValue === undefined) {
      console.error('Invalid parameters for handleParameterValueChange');
      return;
    }

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
  }, [workflowId, parameters, updateTask, task.id]);

  return {
    parameters,
    newKey,
    setNewKey,
    newValue,
    setNewValue,
    missingParams,
    isRequiredParam,
    handleAddParameter,
    handleDeleteParameter,
    handleParameterValueChange
  };
}

export default useParameters; 