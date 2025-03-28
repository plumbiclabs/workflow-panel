import React, { useState, useEffect } from 'react';
import Task from '../Task';
import WorkflowService from '../../renderer/services/workflow.service';
import './style.css';

const WorkflowDetail = ({ workflow }) => {
  const [tasks, setTasks] = useState(workflow?.tasks || []);
  const [currentWorkflow, setCurrentWorkflow] = useState(workflow);
  
  // 当传入的 workflow 改变时更新 tasks 和 currentWorkflow
  useEffect(() => {
    if (workflow) {
      setTasks(workflow.tasks || []);
      setCurrentWorkflow(workflow);
    }
  }, [workflow]);

  // 保存 workflow 及其任务
  const saveWorkflow = async (updatedTasks) => {
    if (!currentWorkflow) return;
    
    try {
      const updatedWorkflow = {
        ...currentWorkflow,
        tasks: updatedTasks
      };
      
      await WorkflowService.saveWorkflow(updatedWorkflow);
      setCurrentWorkflow(updatedWorkflow);
    } catch (error) {
      console.error('Failed to save workflow tasks:', error);
    }
  };

  const handleAddTask = async () => {
    const newTask = {
      id: Date.now(),
      name: `Task ${tasks.length + 1}`,
      commands: []
    };
    
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    
    // 保存到 workflow
    await saveWorkflow(updatedTasks);
  };

  const handleCloseTask = async (taskId) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    
    // 保存到 workflow
    await saveWorkflow(updatedTasks);
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