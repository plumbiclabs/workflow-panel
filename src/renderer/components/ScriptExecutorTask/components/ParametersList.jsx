import React, { useState } from 'react';
import VariableSelector from './VariableSelector';
import { useWorkflow } from '../../../context/WorkflowContext';
import { Tooltip } from 'antd';

const ParametersList = ({ 
  parameters, 
  loading, 
  isRequiredParam,
  onValueChange,
  onDelete,
  workflowId,
  taskId
}) => {
  const { taskOutputs } = useWorkflow();
  const [previewMode, setPreviewMode] = useState({});

  if (parameters.length === 0) {
    return (
      <div className="empty-parameters">
        <p>No parameters added yet</p>
      </div>
    );
  }

  // 解析变量引用的值（用于预览）
  const getResolvedValue = (value) => {
    if (!value || typeof value !== 'string' || !value.includes('${')) {
      return value;
    }

    const variablePattern = /\${([^}]+)}/g;
    return value.replace(variablePattern, (match, varPath) => {
      try {
        const pathParts = varPath.split('.');
        if (pathParts.length >= 2 && pathParts[1] === 'output') {
          const taskRef = pathParts[0]; // 例如 "task-1"
          const taskOutput = taskOutputs[`${workflowId}-${taskRef.replace('task-', '')}`];
          
          if (!taskOutput) {
            return `[${match} - No data]`;
          }
          
          let result = taskOutput;
          for (let i = 2; i < pathParts.length; i++) {
            result = result[pathParts[i]];
            if (result === undefined) {
              return `[${match} - Not found]`;
            }
          }
          
          return typeof result === 'object' 
            ? JSON.stringify(result) 
            : String(result);
        }
        
        return match;
      } catch (error) {
        console.error('Error resolving variable for preview:', error);
        return `[${match} - Error]`;
      }
    });
  };

  // 渲染语法高亮的变量值
  const renderHighlightedValue = (value) => {
    if (!value || typeof value !== 'string') return value;
    
    // 如果不包含变量引用，直接返回
    if (!value.includes('${')) return value;
    
    // 用正则表达式匹配变量引用
    const parts = [];
    let lastIndex = 0;
    const variablePattern = /(\${[^}]+})/g;
    let match;
    
    while ((match = variablePattern.exec(value)) !== null) {
      // 添加变量引用前的普通文本
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {value.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // 添加变量引用（带高亮）
      const variableRef = match[1];
      parts.push(
        <Tooltip 
          key={`var-${match.index}`}
          title={`Preview: ${getResolvedValue(variableRef)}`}
          placement="top"
        >
          <span className="variable-reference">{variableRef}</span>
        </Tooltip>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加最后一部分普通文本（如果有）
    if (lastIndex < value.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {value.substring(lastIndex)}
        </span>
      );
    }
    
    return <div className="highlighted-value">{parts}</div>;
  };

  const handleVariableSelect = (paramIndex, value) => {
    // 如果现有值不为空，将变量引用添加到末尾
    const currentValue = parameters[paramIndex]?.value || '';
    let newValue = value;
    
    if (currentValue && !currentValue.endsWith(' ')) {
      newValue = `${currentValue} ${value}`;
    } else if (currentValue) {
      newValue = `${currentValue}${value}`;
    }
    
    // 直接调用 onValueChange 并传递索引和新值
    onValueChange(paramIndex, newValue);
  };

  const togglePreviewMode = (index) => {
    setPreviewMode(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className="parameters-list">
      <h3>Parameters</h3>
      <div className="parameters-table">
        <div className="parameters-header">
          <div className="param-cell">Name</div>
          <div className="param-cell">Value</div>
          <div className="param-cell param-actions">Actions</div>
        </div>
        
        <div className="parameters-body">
          {parameters.map((param, index) => (
            <div key={index} className={`parameter-row ${isRequiredParam(param.key) ? 'required-parameter' : ''}`}>
              <div className="param-cell param-name">
                {param.key}
                {isRequiredParam(param.key) && <span className="required-badge">*</span>}
              </div>
              <div className="param-cell param-value">
                <div className="param-input-container">
                  {previewMode[index] ? (
                    <div 
                      className="param-preview" 
                      onClick={() => togglePreviewMode(index)}
                    >
                      {getResolvedValue(param.value)}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => onValueChange(index, e.target.value)}
                        disabled={loading}
                        placeholder="Enter value"
                        className={`param-input ${param.value.includes('${') ? 'has-variable' : ''}`}
                      />
                      {param.value.includes('${') && (
                        <button 
                          className="preview-toggle"
                          onClick={() => togglePreviewMode(index)}
                          title="Toggle preview mode"
                        >
                          👁️
                        </button>
                      )}
                      <VariableSelector
                        workflowId={workflowId}
                        currentTaskId={taskId}
                        onSelect={(value) => handleVariableSelect(index, value)}
                        selectedValue={param.value.includes('${') ? param.value : ''}
                      />
                    </>
                  )}
                </div>
                
                {param.value.includes('${') && !previewMode[index] && (
                  <div className="param-preview-hint">
                    {renderHighlightedValue(param.value)}
                  </div>
                )}
              </div>
              <div className="param-cell param-actions">
                <button
                  className={`param-delete ${isRequiredParam(param.key) ? 'disabled' : ''}`}
                  onClick={() => onDelete(index)}
                  disabled={loading || isRequiredParam(param.key)}
                  title={isRequiredParam(param.key) ? "Required parameters cannot be deleted" : "Delete parameter"}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParametersList; 