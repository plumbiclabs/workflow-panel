import React from 'react';
import WorkflowList from './components/WorkflowList';
import WorkflowDetail from './components/WorkflowDetail';
import './App.css';

function App() {
  return (
    <div className="app">
      <WorkflowList />
      <WorkflowDetail />
    </div>
  );
}

export default App;