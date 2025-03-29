import React from 'react';
import WorkflowList from '../components/WorkflowList';
import WorkflowDetail from '../components/WorkflowDetail';
import './style.css';

/**
 * WorkflowContainer组件
 * 
 * 功能：整合工作流列表和详情的容器组件
 * 负责将工作流列表和详情页面整合到一起展示
 */
const WorkflowContainer = () => {
  return (
    <div className="workflow-container">
      <WorkflowList />
      <WorkflowDetail />
    </div>
  );
};

export default WorkflowContainer;