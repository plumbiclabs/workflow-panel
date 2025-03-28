import React from 'react';
import Task from '../Task';
import EditableTitle from '../EditableTitle';
import { useWorkflow } from '../../context/WorkflowContext';
import './style.css';

const WorkflowDetail = () => {
  const { 
    selectedWorkflow, 
    updateWorkflow, 
    addTask, 
    deleteTask 
  } = useWorkflow();

  // 处理工作流名称变更
  const handleWorkflowNameSave = async (newName) => {
    if (!selectedWorkflow) return;
    
    try {
      await updateWorkflow(selectedWorkflow.id, { name: newName });
    } catch (error) {
      console.error('Failed to update workflow name:', error);
    }
  };

  // 添加任务
  const handleAddTask = async () => {
    if (!selectedWorkflow) return;

    try {
      const newTask = {
        name: `Task ${(selectedWorkflow.tasks || []).length + 1}`,
        commands: []
      };
      await addTask(selectedWorkflow.id, newTask);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId) => {
    if (!selectedWorkflow) return;

    try {
      await deleteTask(selectedWorkflow.id, taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (!selectedWorkflow) {
    return (
      <div className="workflow-detail empty">
        <p>Select a workflow to view details</p>
      </div>
    );
  }

  return (
    <div className="workflow-detail">
      <div className="workflow-detail-header">
        <EditableTitle 
          value={selectedWorkflow.name} 
          onSave={handleWorkflowNameSave}
          size="medium"
          placeholder="Workflow"
          className="workflow-title"
        />
        <button
          className="add-task"
          onClick={handleAddTask}
          title="Add new task"
        >
          +
        </button>
      </div>
      <div className="tasks-container">
        {(selectedWorkflow.tasks || []).map(task => (
          <Task
            key={task.id}
            task={task}
            workflowId={selectedWorkflow.id}
            onClose={handleDeleteTask}
          />
        ))}
        {(!selectedWorkflow.tasks || selectedWorkflow.tasks.length === 0) && (
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