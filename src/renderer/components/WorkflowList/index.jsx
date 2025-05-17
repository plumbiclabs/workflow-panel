import React, { useState } from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import { Modal, message, Tooltip } from 'antd';
import WorkflowService from '../../services/workflow.service';
import './styles.css';

// 空状态图标组件
const EmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 导入图标组件
const ImportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// 导出图标组件
const ExportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WorkflowList = () => {
  const { 
    workflows, 
    selectedWorkflow, 
    loading, 
    error, 
    addWorkflow, 
    deleteWorkflow, 
    selectWorkflow,
    loadWorkflows 
  } = useWorkflow();
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);

  // 导出工作流处理函数
  const handleExportWorkflow = async (e) => {
    e.stopPropagation();
    if (!selectedWorkflow) {
      message.warning('请先选择一个工作流');
      return;
    }

    try {
      const result = await WorkflowService.exportWorkflow(selectedWorkflow);
      if (result.success) {
        message.success(`工作流已成功导出到: ${result.filePath}`);
      } else if (result.message) {
        message.info(result.message);
      } else if (result.error) {
        message.error(`导出失败: ${result.error}`);
      }
    } catch (error) {
      message.error(`导出失败: ${error.message}`);
    }
  };

  // 导入工作流处理函数
  const handleImportWorkflow = async (e) => {
    e.stopPropagation();
    try {
      const result = await WorkflowService.importWorkflow();
      
      if (result.success && result.workflowData) {
        // 为导入的工作流生成新ID，避免冲突
        const importedWorkflow = {
          ...result.workflowData,
          id: Date.now(),
          tasks: result.workflowData.tasks || []
        };
        
        // 将导入的工作流保存到Electron Store
        const savedWorkflow = await addWorkflow(importedWorkflow);
        
        if (savedWorkflow) {
          message.success(`工作流 "${savedWorkflow.name}" 已成功导入`);
          selectWorkflow(savedWorkflow);
        }
      } else if (result.message) {
        message.info(result.message);
      } else if (result.error) {
        message.error(`导入失败: ${result.error}`);
      }
    } catch (error) {
      message.error(`导入失败: ${error.message}`);
    }
  };

  const handleAddWorkflow = async () => {
    try {
      const newWorkflow = {
        id: Date.now(),
        name: `work flow ${workflows.length + 1}`,
        tasks: []  // 初始化空的任务列表
      };
      await addWorkflow(newWorkflow);
    } catch (error) {
      console.error('Failed to add workflow:', error);
    }
  };

  const handleRemoveWorkflow = async (id, e) => {
    e.stopPropagation();
    setWorkflowToDelete(id);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!workflowToDelete) return;
    
    const workflowElement = document.querySelector(`.workflow-item[data-id="${workflowToDelete}"]`);
    if (workflowElement) {
      workflowElement.style.transform = 'scale(0.9)';
      workflowElement.style.opacity = '0';
    }
    
    try {
      setTimeout(async () => {
        await deleteWorkflow(workflowToDelete);
        setDeleteModalVisible(false);
        setWorkflowToDelete(null);
      }, 200);
    } catch (error) {
      console.error('Failed to remove workflow:', error);
      if (workflowElement) {
        workflowElement.style.transform = '';
        workflowElement.style.opacity = '';
      }
    }
  };

  if (loading) {
    return <div className="workflow-list loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="workflow-list error">
        <p>Error: {error}</p>
        <button onClick={loadWorkflows}>Retry</button>
      </div>
    );
  }

  return (
    <div className="workflow-list">
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setWorkflowToDelete(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this workflow? This action cannot be undone.</p>
      </Modal>
      <div className="workflow-list-header">
        <h2>WorkFlow List</h2>
        <div className="workflow-actions">
          <Tooltip title="导入工作流" placement="bottom">
            <button 
              className="action-button import-button" 
              onClick={handleImportWorkflow}
            >
              <ImportIcon />
            </button>
          </Tooltip>
          <Tooltip title={selectedWorkflow ? "导出工作流" : "请先选择一个工作流"} placement="bottom">
            <button 
              className="action-button export-button" 
              onClick={handleExportWorkflow}
              disabled={!selectedWorkflow}
            >
              <ExportIcon />
            </button>
          </Tooltip>
          <Tooltip title="创建新工作流" placement="bottom">
            <button 
              className="add-button" 
              onClick={handleAddWorkflow}
            >
              +
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="workflow-items">
        {workflows.length === 0 ? (
          <div className="workflow-empty">
            <EmptyIcon />
            <span>No workflows yet. Click + to create one.</span>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`workflow-item ${selectedWorkflow?.id === workflow.id ? 'selected' : ''}`}
              onClick={() => selectWorkflow(workflow)}
              data-id={workflow.id}
            >
              <span title={workflow.name}>{workflow.name}</span>
              <button
                className="remove-button"
                onClick={(e) => handleRemoveWorkflow(workflow.id, e)}
                title="Remove workflow"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkflowList;