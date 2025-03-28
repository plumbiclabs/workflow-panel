import React, { useState } from 'react';
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

const WorkflowDetail = ({ workflow }) => {
  const [tasks, setTasks] = useState(workflow?.tasks || []);

  const handleAddTask = () => {
    const newTask = {
      id: Date.now(),
      name: `Task ${tasks.length + 1}`,
      commands: []
    };
    setTasks([...tasks, newTask]);
  };

  const handleCloseTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleRunTask = (taskId) => {
    // TODO: Implement task command execution
    console.log('Running task:', taskId);
  };

  if (!workflow) {
    return (
      <div className="workflow-detail empty">
        <p>Select a workflow to view details</p>
      </div>
    );
  }

  return (
    <div className="workflow-detail">
      <div className="workflow-detail-header">
        <h2>{workflow.name}</h2>
        <button 
          className="add-task" 
          onClick={handleAddTask}
          title="Add new task"
        >
          +
        </button>
      </div>
      <div className="tasks-container">
        {tasks.map(task => (
          <Task
            key={task.id}
            task={task}
            onClose={handleCloseTask}
            onRun={handleRunTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="no-tasks">
            <p>No tasks added yet</p>
            <button onClick={handleAddTask}>Add Task</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowDetail;