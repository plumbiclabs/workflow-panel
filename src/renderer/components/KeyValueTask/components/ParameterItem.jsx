import React from 'react';

const ParameterItem = React.memo(({ 
  param, 
  index, 
  isRequired, 
  onValueChange, 
  onDelete 
}) => (
  <div className={`parameter-item ${isRequired ? 'required' : ''}`}>
    <div className="parameter-key">
      {param.key}
      {isRequired && <span className="required-badge">Required</span>}
    </div>
    <input
      type="text"
      className="parameter-value-input-inline"
      value={param.value}
      onChange={(e) => onValueChange(index, e.target.value)}
      placeholder={`Enter value for ${param.key}`}
    />
    {!isRequired && (
      <button 
        className="parameter-delete" 
        onClick={() => onDelete(index)}
        title="Delete parameter"
      >
        ×
      </button>
    )}
  </div>
));

export default ParameterItem; 