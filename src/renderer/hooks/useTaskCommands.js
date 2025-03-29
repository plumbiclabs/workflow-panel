import { useState } from 'react';
import { useWorkflow } from '../context/WorkflowContext';

/**
 * 用于管理任务命令的自定义Hook
 * 
 * @param {string} workflowId - 工作流ID
 * @param {string} taskId - 任务ID
 * @returns {Object} 包含命令管理状态和方法
 */
const useTaskCommands = (workflowId, taskId) => {
  const { addCommand, deleteCommand } = useWorkflow();
  const [newCommand, setNewCommand] = useState('');
  
  const handleAddCommand = async () => {
    if (!newCommand.trim() || !workflowId) return;

    try {
      await addCommand(workflowId, taskId, newCommand.trim());
      setNewCommand(''); // 清空输入框
      return true;
    } catch (error) {
      console.error('Failed to add command:', error);
      return false;
    }
  };

  const handleDeleteCommand = async (commandIndex) => {
    if (!workflowId) return;

    try {
      await deleteCommand(workflowId, taskId, commandIndex);
      return true;
    } catch (error) {
      console.error('Failed to delete command:', error);
      return false;
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddCommand();
    }
  };

  return {
    newCommand,
    setNewCommand,
    handleAddCommand,
    handleDeleteCommand,
    handleKeyDown
  };
};

export default useTaskCommands;