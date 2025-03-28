import React, { useState } from 'react';
import WorkflowService from '../../renderer/services/workflow.service';
import EditableTitle from '../EditableTitle';
import './styles.css';

const Task = ({ task, workflowId, onClose, onRun }) => {
  const [newCommand, setNewCommand] = useState('');
  const [commands, setCommands] = useState(task.commands || []);

  // 更新任务标题
  const handleTaskNameSave = async (newName) => {
    if (!workflowId) return;

    try {
      const updatedWorkflow = await WorkflowService.updateTask(
        workflowId, 
        task.id, 
        { name: newName }
      );
      
      if (updatedWorkflow) {
        console.log('Task name updated successfully');
      }
    } catch (error) {
      console.error('Failed to update task name:', error);
    }
  };

  // 添加新命令
  const handleAddCommand = async () => {
    if (!newCommand.trim() || !workflowId) return;

    try {
      const updatedWorkflow = await WorkflowService.addCommand(
        workflowId,
        task.id,
        newCommand.trim()
      );

      if (updatedWorkflow) {
        // 查找更新后的任务
        const updatedTask = updatedWorkflow.tasks.find(t => t.id === task.id);
        if (updatedTask) {
          setCommands(updatedTask.commands || []);
        }
        setNewCommand(''); // 清空输入框
      }
    } catch (error) {
      console.error('Failed to add command:', error);
    }
  };

  // 删除命令
  const handleDeleteCommand = async (commandIndex) => {
    if (!workflowId) return;

    try {
      const updatedWorkflow = await WorkflowService.deleteCommand(
        workflowId,
        task.id,
        commandIndex
      );

      if (updatedWorkflow) {
        // 查找更新后的任务
        const updatedTask = updatedWorkflow.tasks.find(t => t.id === task.id);
        if (updatedTask) {
          setCommands(updatedTask.commands || []);
        }
      }
    } catch (error) {
      console.error('Failed to delete command:', error);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddCommand();
    }
  };

  return (
    <div className="task-window">
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
        {commands.map((command, index) => (
          <div key={index} className="task-command">
            {command}
            <button 
              className="command-delete" 
              onClick={() => handleDeleteCommand(index)}
              title="Delete command"
            >
              ×
            </button>
          </div>
        ))}
        <div className="command-input-container">
          <div className="command-prompt">$</div>
          <textarea
            className="command-input"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command and press Enter to add"
            rows={1}
          />
        </div>
      </div>
      <button 
        className="task-run" 
        onClick={() => onRun(task.id)}
        title="Run commands"
      >
        ▶
      </button>
    </div>
  );
};

export default Task;