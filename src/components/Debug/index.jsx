import React, { useState, useEffect } from 'react';
import WorkflowService from '../../renderer/services/workflow.service';
import './style.css';

const Debug = () => {
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const data = await WorkflowService.getAllWorkflows();
      console.log('Loaded workflows:', data);
      setWorkflows(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError('Failed to load data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleRefresh = () => {
    loadWorkflows();
  };

  const handleUpdateName = async (id, newName) => {
    try {
      console.log(`Updating workflow ${id} name to "${newName}"`);
      const result = await WorkflowService.updateWorkflow(id, { name: newName });
      console.log('Update result:', result);
      await loadWorkflows();
    } catch (err) {
      console.error('Failed to update workflow:', err);
      setError('Update failed: ' + err.message);
    }
  };

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <h2>Electron Store Debug</h2>
        <button onClick={handleRefresh}>Refresh Data</button>
      </div>

      {isLoading ? (
        <div className="loading">Loading data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="data-container">
          <h3>Workflows ({workflows.length})</h3>
          {workflows.length === 0 ? (
            <div className="empty-data">No workflows in store</div>
          ) : (
            <ul className="workflow-list">
              {workflows.map(workflow => (
                <li key={workflow.id} className="workflow-item">
                  <div className="workflow-header">
                    <div>
                      <strong>ID:</strong> {workflow.id}
                    </div>
                    <div className="workflow-name">
                      <strong>Name:</strong> {workflow.name}
                      <button 
                        onClick={() => handleUpdateName(workflow.id, `${workflow.name} (edited ${Date.now().toString().slice(-4)})`)}
                      >
                        Update Name
                      </button>
                    </div>
                  </div>
                  <div>
                    <strong>Tasks:</strong> {(workflow.tasks || []).length}
                  </div>
                  {(workflow.tasks || []).length > 0 && (
                    <ul className="task-list">
                      {workflow.tasks.map(task => (
                        <li key={task.id} className="task-item">
                          <div><strong>Task ID:</strong> {task.id}</div>
                          <div><strong>Name:</strong> {task.name}</div>
                          <div><strong>Commands:</strong> {(task.commands || []).length}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="raw-data">
            <h4>Raw Data:</h4>
            <pre>{JSON.stringify(workflows, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debug;