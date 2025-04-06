import React, { useState, useRef, useEffect } from 'react';
import EditableTitle from '../EditableTitle';
import { useWorkflow } from '../../context/WorkflowContext';
import { Select } from 'antd';
import './styles.css';

/**
 * GenericTask组件
 * 
 * 用于显示和执行通用任务
 */
const GenericTask = ({ task, workflowId, onClose }) => {
  const { 
    updateTask, 
    runTask,
    taskRunningStates
  } = useWorkflow();
  
  const [commands, setCommands] = useState(task.commands || []);
  const [newCommand, setNewCommand] = useState('');
  const [availableTerminals, setAvailableTerminals] = useState([]);
  const [selectedTerminal, setSelectedTerminal] = useState('');
  const inputRef = useRef(null);
  
  // 检查此任务是否正在运行
  const isRunning = taskRunningStates[`${workflowId}-${task.id}`];

  // 加载可用的终端
  useEffect(() => {
    const loadTerminals = async () => {
      try {
        const terminals = await window.electronAPI.terminal.getAvailable();
        setAvailableTerminals(terminals);
        if (terminals.length > 0) {
          setSelectedTerminal(terminals[0].id);
        }
      } catch (error) {
        console.error('Failed to load terminals:', error);
      }
    };

    loadTerminals();
  }, []);

  // 更新任务标题
  const handleTaskNameSave = async (newName) => {
    if (!workflowId) return;

    try {
      await updateTask(workflowId, task.id, { name: newName });
    } catch (error) {
      console.error('Failed to update task name:', error);
    }
  };

  // 更新命令
  const handleCommandChange = async (index, newCommand) => {
    if (!workflowId) return;
    
    const newCommands = [...commands];
    newCommands[index] = newCommand;
    setCommands(newCommands);
    
    try {
      await updateTask(workflowId, task.id, { commands: newCommands });
    } catch (error) {
      console.error('Failed to update command:', error);
    }
  };

  // 添加新命令
  const handleAddCommand = async () => {
    if (!workflowId || !newCommand.trim()) return;

    const newCommands = [...commands, newCommand.trim()];
    setCommands(newCommands);
    setNewCommand('');
    
    try {
      await updateTask(workflowId, task.id, { commands: newCommands });
    } catch (error) {
      console.error('Failed to add command:', error);
    }
  };

  // 删除命令
  const handleDeleteCommand = async (index) => {
    if (!workflowId) return;

    const newCommands = commands.filter((_, i) => i !== index);
    setCommands(newCommands);
    
    try {
      await updateTask(workflowId, task.id, { commands: newCommands });
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

  // 处理运行任务
  const handleRunTask = async () => {
    if (!workflowId || isRunning || !selectedTerminal) return;

    debugger
    
    try {
      const result = await runTask(workflowId, task.id, selectedTerminal);
      
      if (!result.success) {
        console.error('Failed to run task:', result.error);
        alert(`Failed to run task: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error running task:', error);
      alert(`Error running task: ${error.message || 'Unknown error'}`);
    }
  };

  // 自动聚焦到输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [commands.length]);

  return (
    <div className="task-window generic-task">
      <div className="task-header">
        <EditableTitle
          value={task.name}
          onSave={handleTaskNameSave}
          size="small"
          placeholder="Task Name"
          className="task-title-editable"
        />
        <div className="terminal-selector">
          <Select
            value={selectedTerminal}
            onChange={setSelectedTerminal}
            style={{ width: 150 }}
            placeholder="Select terminal"
          >
            {availableTerminals.map(terminal => (
              <Select.Option key={terminal.id} value={terminal.id}>
                <span className="terminal-option">
                  <span className="terminal-icon">{terminal.icon}</span>
                  <span className="terminal-name">{terminal.name}</span>
                </span>
              </Select.Option>
            ))}
          </Select>
        </div>
        <button className="task-close" onClick={() => onClose(task.id)} title="Close task">×</button>
      </div>
      <div className="task-content">
        {commands.map((command, index) => (
          <div key={index} className="task-command">
            <div className="command-prompt">$</div>
            <textarea
              className="command-input"
              value={command}
              onChange={(e) => handleCommandChange(index, e.target.value)}
              placeholder="Type command here"
              rows={1}
            />
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
            ref={inputRef}
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
        className={`task-run ${isRunning ? 'running' : ''}`}
        onClick={handleRunTask}
        title="Run commands"
        disabled={isRunning || commands.length === 0 || !selectedTerminal}
      >
        {isRunning ? '...' : '▶'}
      </button>
    </div>
  );
};

export default GenericTask;