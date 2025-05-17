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

// 拖动图标组件
const DragHandleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M4 8h16M4 16h16" strokeLinecap="round" strokeLinejoin="round"/>
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
    loadWorkflows,
    updateWorkflowsOrder
  } = useWorkflow();
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);

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

  // 工作流拖动开始
  const handleDragStart = (index, e) => {
    setDragIndex(index);
    
    // 设置拖动时的透明度效果
    if (e.target.classList.contains('workflow-item')) {
      e.target.classList.add('dragging');
    }
    
    // 设置拖动时的图片，使其更小，增强视觉效果
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // 创建一个空的拖动图像，以便自定义拖动时的视觉效果
      const dragImage = new Image();
      dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1透明gif
      e.dataTransfer.setDragImage(dragImage, 0, 0);
    }
  };

  // 工作流拖动结束
  const handleDragEnd = (e) => {
    setDragIndex(null);
    
    // 移除所有拖动样式类
    document.querySelectorAll('.workflow-item').forEach(item => {
      item.classList.remove('dragging', 'drag-over');
    });
  };

  // 拖动经过其他工作流
  const handleDragOver = (e, index) => {
    e.preventDefault(); // 允许放置
    
    if (dragIndex !== null && dragIndex !== index) {
      const items = document.querySelectorAll('.workflow-item');
      
      // 移除所有drag-over类
      items.forEach(item => {
        item.classList.remove('drag-over');
      });
      
      // 为目标元素添加drag-over类
      if (items[index]) {
        items[index].classList.add('drag-over');
      }
    }
  };

  // 拖动离开工作流
  const handleDragLeave = (e) => {
    e.target.classList.remove('drag-over');
  };

  // 放置工作流，重新排序
  const handleDrop = async (dropIndex, e) => {
    e.preventDefault();
    
    if (dragIndex === null || dragIndex === dropIndex) return;
    
    // 创建新的排序
    const newWorkflows = [...workflows];
    const [movedWorkflow] = newWorkflows.splice(dragIndex, 1);
    newWorkflows.splice(dropIndex, 0, movedWorkflow);
    
    // 移除所有拖动样式类
    document.querySelectorAll('.workflow-item').forEach(item => {
      item.classList.remove('dragging', 'drag-over');
    });
    
    try {
      // 保存新排序到存储
      await updateWorkflowsOrder(newWorkflows);
    } catch (error) {
      console.error('Failed to update workflow order:', error);
      message.error('工作流排序更新失败');
    }
  };

  // 上移工作流
  const handleMoveUp = async (index, e) => {
    e.stopPropagation();
    if (index === 0) return; // 已经是第一个
    
    const newWorkflows = [...workflows];
    [newWorkflows[index-1], newWorkflows[index]] = [newWorkflows[index], newWorkflows[index-1]];
    
    try {
      await updateWorkflowsOrder(newWorkflows);
    } catch (error) {
      console.error('Failed to move workflow up:', error);
      message.error('工作流上移失败');
    }
  };
  
  // 下移工作流
  const handleMoveDown = async (index, e) => {
    e.stopPropagation();
    if (index === workflows.length - 1) return; // 已经是最后一个
    
    const newWorkflows = [...workflows];
    [newWorkflows[index], newWorkflows[index+1]] = [newWorkflows[index+1], newWorkflows[index]];
    
    try {
      await updateWorkflowsOrder(newWorkflows);
    } catch (error) {
      console.error('Failed to move workflow down:', error);
      message.error('工作流下移失败');
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
          workflows.map((workflow, index) => (
            <div
              key={workflow.id}
              className={`workflow-item ${selectedWorkflow?.id === workflow.id ? 'selected' : ''}`}
              onClick={() => selectWorkflow(workflow)}
              data-id={workflow.id}
              draggable
              onDragStart={(e) => handleDragStart(index, e)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(index, e)}
            >
              <div className="workflow-item-content">
                <div className="workflow-drag-handle" title="拖动调整顺序">
                  <DragHandleIcon />
                </div>
                <span title={workflow.name}>{workflow.name}</span>
              </div>
              <div className="workflow-actions">
                <Tooltip title="上移" placement="top">
                  <button 
                    className="workflow-action" 
                    onClick={(e) => handleMoveUp(index, e)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                </Tooltip>
                <Tooltip title="下移" placement="top">
                  <button 
                    className="workflow-action" 
                    onClick={(e) => handleMoveDown(index, e)}
                    disabled={index === workflows.length - 1}
                  >
                    ↓
                  </button>
                </Tooltip>
                <button
                  className="remove-button"
                  onClick={(e) => handleRemoveWorkflow(workflow.id, e)}
                  title="Remove workflow"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkflowList;