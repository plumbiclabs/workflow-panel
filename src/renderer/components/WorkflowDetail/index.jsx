import React, { useState } from 'react';
import GenericTask from '../GenericTask';
import ScriptExecutorTask from '../ScriptExecutorTask';
import EditableTitle from '../EditableTitle';
import TaskTemplateModal from './TaskTemplateModal';
import { useWorkflow } from '../../context/WorkflowContext';
import { Modal } from 'antd';
import './style.css';

const WorkflowDetail = () => {
  const { 
    selectedWorkflow, 
    updateWorkflow, 
    addTask, 
    deleteTask,
    updateWorkflowName 
  } = useWorkflow();
  
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

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
      } else if (template.type === 'script-executor') {
        // Key-value task
        newTask = {
          name: `Task ${(selectedWorkflow.tasks || []).length + 1}`,
          parameters: [],
          type: 'script-executor'
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
    setTaskToDelete(taskId);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWorkflow || !taskToDelete) return;

    try {
      await deleteTask(selectedWorkflow.id, taskToDelete);
      setDeleteModalVisible(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // 渲染特定类型的任务
  const renderTask = (task) => {
    if (task.type === 'script-executor') {
      return (
        <ScriptExecutorTask
          key={task.id}
          task={task}
          workflowId={selectedWorkflow.id}
          onClose={handleDeleteTask}
        />
      );
    }
    
    // Default to command task
    return (
      <GenericTask
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
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setTaskToDelete(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this task? This action cannot be undone.</p>
      </Modal>
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