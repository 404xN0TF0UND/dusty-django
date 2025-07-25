import React, { useState, useEffect } from 'react';
import { Chore, ChoreFormData, User } from '../types';
import './ChoreForm.css';

interface ChoreFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ChoreFormData) => void;
  initialData?: Chore | null;
  users?: User[];
  isFromTemplate?: boolean;
  allChores?: Chore[]; // For dependency selection
}

const defaultForm: ChoreFormData = {
  title: '',
  description: '',
  assigneeId: '',
  dueDate: undefined,
  isRecurring: false,
  recurrencePattern: undefined,
  priority: 'medium',
  category: '',
  dependencies: [],
  blocksOthers: false,
};

export const ChoreForm: React.FC<ChoreFormProps> = ({ open, onClose, onSubmit, initialData, users, isFromTemplate = false, allChores = [] }) => {
  const [form, setForm] = useState<ChoreFormData>(defaultForm);

  useEffect(() => {
    if (initialData) {
      let resolvedAssigneeId = initialData.assigneeId || '';
      // Defensive: if initialData.assigneeId is a display name, map to UID
      if (users && resolvedAssigneeId && !users.find(u => u.id === resolvedAssigneeId)) {
        // Try to find by display name
        const match = users.find(u => u.displayName === resolvedAssigneeId);
        if (match) resolvedAssigneeId = match.id;
      }
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        assigneeId: resolvedAssigneeId,
        dueDate: initialData.dueDate ? 
          (typeof initialData.dueDate === 'object' && 'toDate' in initialData.dueDate ? 
            (initialData.dueDate as any).toDate() : new Date(initialData.dueDate)) : 
          undefined,
        isRecurring: initialData.isRecurring || false,
        recurrencePattern: initialData.recurrencePattern,
        priority: initialData.priority || 'medium',
        category: initialData.category || '',
        dependencies: initialData.dependencies || [],
        blocksOthers: initialData.blocksOthers || false,
      });
    } else {
      setForm(defaultForm);
    }
  }, [initialData, open, users]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'assigneeId') {
    }
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === 'dueDate') {
      setForm(prev => ({
        ...prev,
        dueDate: value || undefined, // Store as string
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.dueDate) {
    }
    onSubmit(form);
    onClose(); // Close the modal after submit
  };

  return (
    <div className="chore-form-modal">
      <div className="chore-form-backdrop" onClick={onClose} />
      <div className="chore-form-container">
        <h2>
          {initialData ? 'Edit Chore' : isFromTemplate ? 'Add Chore from Template' : 'Add Chore'}
          {isFromTemplate && <span className="template-indicator">📋</span>}
        </h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              autoFocus
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
            />
          </label>
          <label>
            Assignee
            <select name="assigneeId" value={form.assigneeId} onChange={handleChange}>
              <option value="">Unassigned</option>
              {users && users.map(user => (
                <option key={user.id} value={user.id}>{user.display_name || user.displayName || user.username}</option>
              ))}
            </select>
          </label>
          <label>
            Due Date
            <input
              type="date"
              name="dueDate"
              value={form.dueDate || ''}
              onChange={handleChange}
            />
          </label>
          <label className="recurring-checkbox">
            <input
              type="checkbox"
              name="isRecurring"
              checked={form.isRecurring}
              onChange={handleChange}
            />
            Recurring
          </label>
          {form.isRecurring && (
            <label>
              Recurrence Pattern
              <select name="recurrencePattern" value={form.recurrencePattern || ''} onChange={handleChange}>
                <option value="">Select</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
          )}
          <label>
            Priority
            <select name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            Category
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            />
          </label>
          <label className="blocks-checkbox">
            <input
              type="checkbox"
              name="blocksOthers"
              checked={form.blocksOthers}
              onChange={handleChange}
            />
            This chore blocks other chores
          </label>
          
          {/* Dependency Selection */}
          {allChores.length > 0 && (
            <label>
              Dependencies (optional)
              <div className="dependency-selector">
                {allChores
                  .filter(chore => !initialData || chore.id !== initialData.id) // Don't show current chore as dependency
                  .map(chore => (
                    <label key={chore.id} className="dependency-option">
                      <input
                        type="checkbox"
                        checked={form.dependencies?.includes(chore.id) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm(prev => ({
                            ...prev,
                            dependencies: checked
                              ? [...(prev.dependencies || []), chore.id]
                              : (prev.dependencies || []).filter(id => id !== chore.id)
                          }));
                        }}
                      />
                      <span className="dependency-title">{chore.title}</span>
                      {chore.assignee && (
                        <span className="dependency-assignee">
                          ({chore.assignee.display_name || chore.assignee.username || chore.assignee.email})
                        </span>
                      )}
                    </label>
                  ))}
              </div>
            </label>
          )}
          
          <div className="chore-form-actions">
            <button type="submit" className="btn btn-primary">
              {initialData ? 'Save Changes' : 'Add Chore'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 