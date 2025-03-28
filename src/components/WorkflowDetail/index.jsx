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

  // 修改后:
  const handleAddTask = async () => {
    if (!currentWorkflow) return;

    try {
      const newTask = {
        name: `Task ${tasks.length + 1}`,
        commands: []
      };

      // 直接使用 addTask API
      const updatedWorkflow = await WorkflowService.addTask(currentWorkflow.id, newTask);
      if (updatedWorkflow) {
        setCurrentWorkflow(updatedWorkflow);
        setTasks(updatedWorkflow.tasks || []);
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!currentWorkflow) return;

    try {
      // 直接使用 deleteTask API
      const updatedWorkflow = await WorkflowService.deleteTask(currentWorkflow.id, taskId);
      if (updatedWorkflow) {
        setCurrentWorkflow(updatedWorkflow);
        setTasks(updatedWorkflow.tasks || []);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
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
            onClose={handleDeleteTask}
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