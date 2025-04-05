import React, { useState, useEffect } from 'react';
import { Popover, Input, Tabs, Empty, Tree } from 'antd';
import { LinkOutlined, SearchOutlined } from '@ant-design/icons';
import { useWorkflow } from '../../context/WorkflowContext';
import './styles.css';

const VariableSelector = ({ 
  workflowId, 
  currentTaskId, 
  onSelect, 
  selectedValue = '', 
  placement = 'bottom' 
}) => {
  const [visible, setVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [variablesData, setVariablesData] = useState([]);
  const { taskOutputs, workflows } = useWorkflow();

  // Prepare variable tree data from task outputs
  useEffect(() => {
    if (!visible || !workflowId) return;
    
    try {
      // Find current workflow
      const currentWorkflow = workflows.find(w => w.id === workflowId);
      if (!currentWorkflow || !currentWorkflow.tasks) {
        setVariablesData([]);
        return;
      }
      
      // Build tree data from task outputs
      const treeData = currentWorkflow.tasks
        // Filter out current task and tasks without outputs
        .filter(task => {
          return (
            task.id !== currentTaskId && 
            taskOutputs[`${workflowId}-${task.id}`]
          );
        })
        // Map tasks to tree nodes
        .map(task => {
          const taskOutput = taskOutputs[`${workflowId}-${task.id}`];
          
          // Function to recursively build tree nodes from output object
          const buildOutputNodes = (obj, path = '') => {
            if (!obj || typeof obj !== 'object') return [];
            
            return Object.keys(obj).map(key => {
              const newPath = path ? `${path}.${key}` : key;
              const value = obj[key];
              
              if (value && typeof value === 'object') {
                // Recursively build child nodes for objects
                return {
                  title: key,
                  key: `${task.id}-${newPath}`,
                  children: buildOutputNodes(value, newPath)
                };
              } else {
                // Create leaf node for primitive values
                return {
                  title: `${key}: ${value}`,
                  key: `${task.id}-${newPath}`,
                  value: `\${task-${task.id}.output.${newPath}}`,
                  isLeaf: true
                };
              }
            });
          };
          
          // Create task root node with output children
          return {
            title: `${task.name || 'Task ' + task.id}`,
            key: `task-${task.id}`,
            children: buildOutputNodes(taskOutput)
          };
        });
      
      setVariablesData(treeData);
    } catch (error) {
      console.error('Failed to prepare variables data:', error);
      setVariablesData([]);
    }
  }, [visible, workflowId, currentTaskId, taskOutputs, workflows]);

  // Filter variables based on search term
  const filteredVariables = searchTerm
    ? variablesData.reduce((acc, taskGroup) => {
        // Recursively search in the tree
        const searchInNodes = (nodes) => {
          if (!nodes) return [];
          
          return nodes.reduce((filtered, node) => {
            // Check if this node or any of its children match the search
            const titleMatches = node.title.toLowerCase().includes(searchTerm.toLowerCase());
            const childMatches = searchInNodes(node.children);
            
            if (titleMatches || childMatches.length > 0) {
              filtered.push({
                ...node,
                children: childMatches
              });
            }
            
            return filtered;
          }, []);
        };
        
        const matchingChildren = searchInNodes(taskGroup.children);
        
        if (matchingChildren.length > 0) {
          acc.push({
            ...taskGroup,
            children: matchingChildren
          });
        }
        
        return acc;
      }, [])
    : variablesData;

  const handleVariableSelect = (_, { node }) => {
    debugger
    if (node.isLeaf) {
      onSelect(node.value);
      setVisible(false);
    }
  };

  const content = (
    <div className="variable-selector-content">
      <Input
        placeholder="Search variables"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        prefix={<SearchOutlined />}
        allowClear
      />
      
      <Tabs 
        defaultActiveKey="tasks" 
        className="variable-selector-tabs"
        items={[
          {
            key: 'tasks',
            label: 'Tasks',
            children: filteredVariables.length > 0 ? (
              <Tree
                treeData={filteredVariables}
                onSelect={handleVariableSelect}
                showIcon={false}
                showLine
                blockNode
              />
            ) : (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No task outputs available" 
              />
            )
          },
          {
            key: 'workflow',
            label: 'Workflow',
            children: (
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="Workflow variables will appear here" 
              />
            )
          }
        ]}
      />
    </div>
  );

  return (
    <Popover
      content={content}
      title="Select Variable"
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement={placement}
      overlayClassName="variable-selector-popover"
    >
      <button 
        className={`variable-selector-button ${selectedValue ? 'has-value' : ''}`}
        title="Select variable reference"
      >
        <LinkOutlined />
      </button>
    </Popover>
  );
};

export default VariableSelector; 