import React from 'react';

const AddParameterForm = React.memo(({
  newKey,
  newValue,
  loading,
  onKeyChange,
  onValueChange,
  onSubmit,
  disableAdd,
}) => (
  <form className="parameter-form" onSubmit={onSubmit}>
    <h4 className="parameters-header">Add Custom Parameter</h4>
    <div className="parameter-inputs">
      <input
        type="text"
        className="parameter-key-input"
        placeholder="Key"
        value={newKey}
        onChange={onKeyChange}
        disabled={loading}
      />
      <input
        type="text"
        className="parameter-value-input"
        placeholder="Value"
        value={newValue}
        onChange={onValueChange}
        disabled={loading}
      />
      <button 
        type="submit" 
        className="add-parameter-button"
        disabled={disableAdd}
      >
        Add
      </button>
    </div>
  </form>
));

export default AddParameterForm; 