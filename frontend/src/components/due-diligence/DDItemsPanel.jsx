import { useState } from 'react';
import { dueDiligenceAPI } from '../../api/endpoints';

const DDItemsPanel = ({ dueDiligenceId, items = [], onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'financial',
    priority: 'medium',
    maxScore: 10,
    dueDate: '',
  });

  const categoryEmojis = {
    financial: '💰',
    legal: '⚖️',
    technical: '⚙️',
    compliance: '✅',
    operational: '📋',
    market: '📊',
    team: '👥',
    other: '📌',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dueDiligenceAPI.createItem(dueDiligenceId, formData);
      setFormData({
        title: '',
        description: '',
        category: 'financial',
        priority: 'medium',
        maxScore: 10,
        dueDate: '',
      });
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await dueDiligenceAPI.deleteItem(dueDiligenceId, itemId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  return (
    <div>
      {showForm ? (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label htmlFor="dd-item-title" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Item title</label>
                <input
                  id="dd-item-title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Item title"
                  required
                  style={{
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label htmlFor="dd-item-category" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Category</label>
                <select
                  id="dd-item-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="financial">Financial</option>
                  <option value="legal">Legal</option>
                  <option value="technical">Technical</option>
                  <option value="compliance">Compliance</option>
                  <option value="operational">Operational</option>
                  <option value="market">Market</option>
                  <option value="team">Team</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="dd-item-description" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Description</label>
              <textarea
                id="dd-item-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description"
                rows="2"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label htmlFor="dd-item-priority" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Priority</label>
                <select
                  id="dd-item-priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label htmlFor="dd-item-max-score" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Max score</label>
                <input
                  id="dd-item-max-score"
                  type="number"
                  name="maxScore"
                  value={formData.maxScore}
                  onChange={handleChange}
                  placeholder="Max score"
                  min="1"
                  max="100"
                  style={{
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label htmlFor="dd-item-due-date" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Due date</label>
                <input
                  id="dd-item-due-date"
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  style={{
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#5B21B6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '8px 16px',
                  background: '#E5E7EB',
                  color: '#111827',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            background: '#5B21B6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          + Add Item
        </button>
      )}

      {items && items.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {items.map(item => (
            <div
              key={item.id}
              style={{
                padding: '16px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: '#F9FAFB',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>
                    {categoryEmojis[item.category]} {item.title}
                  </h4>
                  {item.description && (
                    <p style={{ margin: '0', fontSize: '13px', color: '#6B7280' }}>{item.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    padding: '4px 8px',
                    background: '#FEE2E2',
                    color: '#991B1B',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6B7280' }}>
                <span>Priority: {item.priority}</span>
                <span>Max Score: {item.maxScore}</span>
                <span>Status: {item.status || 'pending'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
          📝 No items yet. Add one to get started.
        </div>
      )}
    </div>
  );
};

export default DDItemsPanel;
