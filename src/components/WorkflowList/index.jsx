import React, { useState } from 'react';
import './styles.css';

// 空状态图标组件
const EmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WorkflowList = () => {
  const [workflows, setWorkflows] = useState([
    { id: 1, name: 'work flow 1' },
    { id: 2, name: 'work flow 2' },
    { id: 3, name: 'Develop the NPM library of wlp-tree' }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const handleAddWorkflow = () => {
    const newWorkflow = {
      id: Date.now(),
      name: `work flow ${workflows.length + 1}`
    };
    setWorkflows([...workflows, newWorkflow]);
  };

  const handleRemoveWorkflow = (id, e) => {
    e.stopPropagation();
    const workflowElement = e.target.closest('.workflow-item');
    workflowElement.style.transform = 'scale(0.9)';
    workflowElement.style.opacity = '0';
    
    setTimeout(() => {
      setWorkflows(workflows.filter(workflow => workflow.id !== id));
      if (selectedWorkflow === id) {
        setSelectedWorkflow(null);
      }
    }, 200);
  };

  const handleSelectWorkflow = (id) => {
    setSelectedWorkflow(id);
  };

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
              className={`workflow-item ${selectedWorkflow === workflow.id ? 'selected' : ''}`}
              onClick={() => handleSelectWorkflow(workflow.id)}
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
