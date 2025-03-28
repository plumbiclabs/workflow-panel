import React, { useState, useRef, useEffect } from 'react';
import './style.css';

const EditableTitle = ({ 
  value, 
  onSave, 
  className = '', 
  size = 'medium',  // 'small', 'medium', 'large'
  placeholder = 'Untitled'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    setTitle(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => setIsEditing(true);

  const handleChange = (e) => setTitle(e.target.value);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === value) {
      setIsEditing(false);
      return;
    }
    
    await onSave(trimmedTitle || `${placeholder} ${Date.now()}`);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTitle(value || '');
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={handleChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`editable-title-input ${className} size-${size}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div 
      onClick={handleEdit} 
      className={`editable-title ${className} size-${size}`}
    >
      <span className="title-text">{value || placeholder}</span>
      <span className="edit-icon" title="Edit title">✎</span>
    </div>
  );
};

export default EditableTitle;