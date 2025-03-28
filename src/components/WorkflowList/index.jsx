import React, { useState } from 'react';
import './styles.css';

const WorkflowList = () => {
  const [workflows, setWorkflows] = useState([
    { id: 1, name: 'work flow 1' },
    { id: 2, name: 'work flow 2' },
    { id: 3, name: 'Develop the NPM library of wlp-tree' }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const handleAddWorkflow = () => {
    const newWorkflow = {
      id: workflows.length + 1,
      name: `work flow ${workflows.length + 1}`
    };
    setWorkflows([...workflows, newWorkflow]);
  };

  const handleRemoveWorkflow = (id, e) => {
    e.stopPropagation();
    setWorkflows(workflows.filter(workflow => workflow.id !== id));
    if (selectedWorkflow === id) {
      setSelectedWorkflow(null);
    }
  };

  const handleSelectWorkflow = (id) => {
    setSelectedWorkflow(id);
  };

  return (
    <div className="workflow-list">
      <div className="workflow-list-header">
        <h2>WorkFlow List</h2>
        <button className="add-button" onClick={handleAddWorkflow}>
          +
        </button>
      </div>
      <div className="workflow-items">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`workflow-item ${selectedWorkflow === workflow.id ? 'selected' : ''}`}
            onClick={() => handleSelectWorkflow(workflow.id)}
          >
            <span>{workflow.name}</span>
            <button
              className="remove-button"
              onClick={(e) => handleRemoveWorkflow(workflow.id, e)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowList; 