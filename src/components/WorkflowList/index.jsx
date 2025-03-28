import React from 'react';
import { useWorkflow } from '../../context/WorkflowContext';
import './styles.css';

// 空状态图标组件
const EmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
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
    const workflowElement = e.target.closest('.workflow-item');
    workflowElement.style.transform = 'scale(0.9)';
    workflowElement.style.opacity = '0';
    
    try {
      setTimeout(async () => {
        await deleteWorkflow(id);
      }, 200);
    } catch (error) {
      console.error('Failed to remove workflow:', error);
      workflowElement.style.transform = '';
      workflowElement.style.opacity = '';
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
      <div className="workflow-list-header">
        <h2>WorkFlow List</h2>
        <button 
          className="add-button" 
          onClick={handleAddWorkflow}
          title="Add new workflow"
        >
          +
        </button>
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