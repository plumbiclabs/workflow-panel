import React, { useState } from 'react';
import './styles.css';

const TASK_TEMPLATES = [
  { 
    id: 'command',
    name: 'Command Task', 
    description: 'Create a task with custom commands',
    type: 'command'
  },
  { 
    id: 'key-value',
    name: 'Parameter Task', 
    description: 'Create a task with key-value parameters',
    type: 'key-value'
  }
];

const TaskTemplateModal = ({ onClose, onSelectTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(TASK_TEMPLATES[0]);

  const handleCreate = () => {
    onSelectTemplate(selectedTemplate);
    onClose();
  };

  return (
    <div className="task-template-modal-backdrop">
      <div className="task-template-modal">
        <div className="task-template-modal-header">
          <h3>Select Task Template</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="task-template-modal-content">
          <div className="form-group">
            <label htmlFor="template-select">Task Type:</label>
            <select 
              id="template-select"
              value={selectedTemplate.id}
              onChange={(e) => {
                const selected = TASK_TEMPLATES.find(t => t.id === e.target.value);
                setSelectedTemplate(selected);
              }}
            >
              {TASK_TEMPLATES.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <p className="template-description">{selectedTemplate.description}</p>
          </div>
        </div>
        
        <div className="task-template-modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="create-button" onClick={handleCreate}>Create</button>
        </div>
      </div>
    </div>
  );
};

export default TaskTemplateModal;