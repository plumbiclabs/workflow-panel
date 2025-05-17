import React, { useState, useRef, useEffect } from 'react';
import EditableTitle from '../EditableTitle';
import { useWorkflow } from '../../context/WorkflowContext';
import { Select, Tooltip } from 'antd';
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
  const [selectedTerminal, setSelectedTerminal] = useState(task.terminalId || '');
  const [dragIndex, setDragIndex] = useState(null);
  const inputRef = useRef(null);
  
  // 检查此任务是否正在运行
  const isRunning = taskRunningStates[`${workflowId}-${task.id}`];

  // 加载可用的终端
  useEffect(() => {
    const loadTerminals = async () => {
      try {
        const terminals = await window.electronAPI.terminal.getAvailable();
        setAvailableTerminals(terminals);
        
        // 如果任务有保存的终端ID，优先使用它
        if (task.terminalId) {
          // 检查保存的终端是否仍然可用
          const terminalExists = terminals.some(t => t.id === task.terminalId);
          if (terminalExists) {
            setSelectedTerminal(task.terminalId);
          } else if (terminals.length > 0) {
            // 如果保存的终端不存在，使用第一个可用的终端并更新任务
            setSelectedTerminal(terminals[0].id);
            updateTerminalSelection(terminals[0].id);
          }
        } else if (terminals.length > 0) {
          // 如果任务没有保存终端ID，使用第一个并保存
          setSelectedTerminal(terminals[0].id);
          updateTerminalSelection(terminals[0].id);
        }
      } catch (error) {
        console.error('Failed to load terminals:', error);
      }
    };

    loadTerminals();
  }, [task.terminalId, workflowId, task.id]);

  // 更新终端选择
  const updateTerminalSelection = async (terminalId) => {
    if (!workflowId) return;
    
    try {
      await updateTask(workflowId, task.id, { terminalId });
    } catch (error) {
      console.error('Failed to update terminal selection:', error);
    }
  };

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

  // 拖动开始事件处理
  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  // 拖动结束事件处理
  const handleDragEnd = () => {
    setDragIndex(null);
  };

  // 拖动放置处理
  const handleDrop = async (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    
    // 创建命令的新顺序
    const newCommands = [...commands];
    const [movedCommand] = newCommands.splice(dragIndex, 1);
    newCommands.splice(dropIndex, 0, movedCommand);
    
    setCommands(newCommands);
    
    try {
      await updateTask(workflowId, task.id, { commands: newCommands });
    } catch (error) {
      console.error('Failed to reorder commands:', error);
    }
  };

  // 拖动经过处理
  const handleDragOver = (e, index) => {
    e.preventDefault(); // 允许放置
    if (dragIndex !== null && dragIndex !== index) {
      e.currentTarget.classList.add('drag-over');
    }
  };

  // 拖动离开处理
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
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

  const handleTerminalChange = (value) => {
    setSelectedTerminal(value);
    updateTerminalSelection(value);
  };

  // 命令上移一位
  const handleMoveUp = async (index) => {
    if (index === 0) return; // 已经是第一位
    
    const newCommands = [...commands];
    [newCommands[index-1], newCommands[index]] = [newCommands[index], newCommands[index-1]];
    
    setCommands(newCommands);
    
    try {
      await updateTask(workflowId, task.id, { commands: newCommands });
    } catch (error) {
      console.error('Failed to move command up:', error);
    }
  };
  
  // 命令下移一位
  const handleMoveDown = async (index) => {
    if (index === commands.length - 1) return; // 已经是最后一位
    
    const newCommands = [...commands];
    [newCommands[index], newCommands[index+1]] = [newCommands[index+1], newCommands[index]];
    
    setCommands(newCommands);
    
    try {
      await updateTask(workflowId, task.id, { commands: newCommands });
    } catch (error) {
      console.error('Failed to move command down:', error);
    }
  };

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
            onChange={handleTerminalChange}
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
          <div 
            key={index} 
            className={`task-command ${dragIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnd={handleDragEnd}
            onDrop={() => handleDrop(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
          >
            <div className="command-drag-handle" title="拖动调整顺序">⋮</div>
            <div className="command-prompt">$</div>
            <textarea
              className="command-input"
              value={command}
              onChange={(e) => handleCommandChange(index, e.target.value)}
              placeholder="Type command here"
              rows={1}
            />
            <div className="command-actions">
              <Tooltip title="上移" placement="top">
                <button 
                  className="command-action" 
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  ↑
                </button>
              </Tooltip>
              <Tooltip title="下移" placement="top">
                <button 
                  className="command-action" 
                  onClick={() => handleMoveDown(index)}
                  disabled={index === commands.length - 1}
                >
                  ↓
                </button>
              </Tooltip>
              <Tooltip title="删除" placement="top">
                <button 
                  className="command-delete" 
                  onClick={() => handleDeleteCommand(index)}
                >
                  ×
                </button>
              </Tooltip>
            </div>
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