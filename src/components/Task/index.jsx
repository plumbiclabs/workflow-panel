import React from 'react';
import './styles.css';

const Task = ({ task, onClose, onRun }) => {
  return (
    <div className="task-window">
      <div className="task-header">
        <span className="task-title">{task.name}</span>
        <button className="task-close" onClick={() => onClose(task.id)}>×</button>
      </div>
      <div className="task-content">
        {task.commands.map((command, index) => (
          <div key={index} className="task-command">{command}</div>
        ))}
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