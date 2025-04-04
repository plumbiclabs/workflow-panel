import React, { useState } from 'react';
import Task from '../Task';
import KeyValueTask from '../KeyValueTask';
import EditableTitle from '../EditableTitle';
import TaskTemplateModal from '../TaskTemplateModal';
import { useWorkflow } from '../../context/WorkflowContext';
import './style.css';

const WorkflowDetail = () => {
  const { 
    selectedWorkflow, 
    updateWorkflow, 
    addTask, 
    deleteTask 
  } = useWorkflow();
  
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // 处理工作流名称变更
  const handleWorkflowNameSave = async (newName) => {
    if (!selectedWorkflow) return;
    
    try {
      await updateWorkflow(selectedWorkflow.id, { name: newName });
    } catch (error) {
      console.error('Failed to update workflow name:', error);
    }
  };

  // 添加任务按钮点击
  const handleAddTaskClick = () => {
    setShowTemplateModal(true);
  };

  // 处理任务模板选择
  const handleSelectTemplate = async (template) => {
    if (!selectedWorkflow) return;

    try {
      let newTask;
      
      if (template.type === 'command') {
        // Command task (traditional task)
        newTask = {
          name: `Task ${(selectedWorkflow.tasks || []).length + 1}`,
          commands: [],
          type: 'command'
        };
      } else if (template.type === 'key-value') {
        // Key-value task
        newTask = {
          name: `Task ${(selectedWorkflow.tasks || []).length + 1}`,
          parameters: [],
          type: 'key-value'
        };
      }
      
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

  // 渲染特定类型的任务
  const renderTask = (task) => {
    if (task.type === 'key-value') {
      return (
        <KeyValueTask
          key={task.id}
          task={task}
          workflowId={selectedWorkflow.id}
          onClose={handleDeleteTask}
        />
      );
    }
    
    // Default to command task
    return (
      <Task
        key={task.id}
        task={task}
        workflowId={selectedWorkflow.id}
        onClose={handleDeleteTask}
      />
    );
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
          onClick={handleAddTaskClick}
          title="Add new task"
        >
          +
        </button>
      </div>
      <div className="tasks-container">
        {(selectedWorkflow.tasks || []).map(task => renderTask(task))}
        {(!selectedWorkflow.tasks || selectedWorkflow.tasks.length === 0) && (
          <div className="no-tasks">
            <p>No tasks added yet</p>
            <button onClick={handleAddTaskClick}>Add Task</button>
          </div>
        )}
      </div>
      
      {showTemplateModal && (
        <TaskTemplateModal 
          onClose={() => setShowTemplateModal(false)} 
          onSelectTemplate={handleSelectTemplate}
        />
      )}
    </div>
  );
};

export default WorkflowDetail;