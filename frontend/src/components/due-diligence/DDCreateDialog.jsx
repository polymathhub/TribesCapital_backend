import { useState } from 'react';

const DDCreateDialog = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'investment',
    targetName: '',
    targetType: 'company',
    priority: 'medium',
    targetDeadline: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.targetName.trim()) newErrors.targetName = 'Target name is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitError('Please complete the required fields before creating the diligence case.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      await onCreate(formData);
      onClose();
    } catch (error) {
      console.error('Create due diligence failed:', error);
      setSubmitError('We could not create the diligence case right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 700, color: '#111827' }}>
          Create New Due Diligence
        </h2>

        <form onSubmit={handleSubmit}>
          {submitError && (
            <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
              {submitError}
            </div>
          )}
          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Q3 Investment Review"
              style={{
                width: '100%',
                padding: '10px',
                border: errors.title ? '2px solid #EF4444' : '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {errors.title && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.title}</span>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional context..."
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Type & Target Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="investment">Investment</option>
                <option value="compliance">Compliance</option>
                <option value="company">Company</option>
                <option value="fund">Fund</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                Target Type
              </label>
              <select
                name="targetType"
                value={formData.targetType}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="company">Company</option>
                <option value="fund">Fund</option>
                <option value="project">Project</option>
              </select>
            </div>
          </div>

          {/* Target Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
              Target Name *
            </label>
            <input
              type="text"
              name="targetName"
              value={formData.targetName}
              onChange={handleChange}
              placeholder="e.g., TechCorp Inc"
              style={{
                width: '100%',
                padding: '10px',
                border: errors.targetName ? '2px solid #EF4444' : '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            {errors.targetName && <span style={{ color: '#EF4444', fontSize: '12px' }}>{errors.targetName}</span>}
          </div>

          {/* Priority & Deadline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
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
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                Target Deadline
              </label>
              <input
                type="date"
                name="targetDeadline"
                value={formData.targetDeadline}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                border: '1px solid #E5E7EB',
                background: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#6B7280',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: '#5B21B6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DDCreateDialog;
