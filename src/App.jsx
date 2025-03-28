import React, { useState } from 'react';
import WorkflowList from './components/WorkflowList';
import WorkflowDetail from './components/WorkflowDetail';
import './App.css';

function App() {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const handleWorkflowSelect = (workflow) => {
    setSelectedWorkflow(workflow);
  };

  return (
    <div className="app">
      <WorkflowList onSelectWorkflow={handleWorkflowSelect} />
      <WorkflowDetail workflow={selectedWorkflow} />
    </div>
  );
}

export default App;