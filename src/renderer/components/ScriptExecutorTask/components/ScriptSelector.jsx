import React from 'react';

const ScriptSelector = React.memo(({ 
  taskId, 
  selectedScriptId, 
  scriptOptions, 
  loading, 
  onScriptChange, 
  selectedScript 
}) => (
  <div className="script-selector-container">
    <label htmlFor={`script-select-${taskId}`}>Script:</label>
    {loading ? (
      <div className="loading-scripts">Loading scripts...</div>
    ) : (
      <>
        <select
          id={`script-select-${taskId}`}
          className="script-select"
          value={selectedScriptId || ""}
          onChange={onScriptChange}
          disabled={loading}
        >
          <option value="">-- select script --</option>
          {scriptOptions.map(script => (
            <option key={script.id} value={script.id}>
              {script.name}
            </option>
          ))}
        </select>
        {selectedScript && (
          <p className="script-description">{selectedScript.description}</p>
        )}
      </>
    )}
  </div>
));

export default ScriptSelector; 