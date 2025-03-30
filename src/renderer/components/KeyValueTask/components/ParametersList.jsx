import React from 'react';
import ParameterItem from './ParameterItem';

const ParametersList = React.memo(({ 
  parameters, 
  loading, 
  isRequiredParam, 
  onValueChange, 
  onDelete 
}) => (
  <div className="parameters-section">
    <h4 className="parameters-header">Parameters</h4>
    <div className="parameters-list">
      {parameters.length > 0 ? (
        parameters.map((param, index) => (
          <ParameterItem
            key={index}
            param={param}
            index={index}
            isRequired={isRequiredParam(param.key)}
            onValueChange={onValueChange}
            onDelete={onDelete}
          />
        ))
      ) : (
        <div className="no-parameters">
          {loading 
            ? 'Loading parameters...' 
            : 'No parameters added yet. Add parameters below.'}
        </div>
      )}
    </div>
  </div>
));

export default ParametersList; 