import { useState } from 'react';
import { dueDiligenceAPI } from '../../api/endpoints';

const DDDocumentsPanel = ({ dueDiligenceId, documents = [], onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileType: 'pdf',
    fileSize: '',
    category: 'financial',
    description: '',
    tags: '',
  });

  const fileIcons = {
    pdf: '📄',
    excel: '📊',
    word: '📝',
    image: '🖼️',
    video: '🎥',
    other: '📦',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };
      await dueDiligenceAPI.uploadDocument(dueDiligenceId, data);
      setFormData({
        fileName: '',
        fileUrl: '',
        fileType: 'pdf',
        fileSize: '',
        category: 'financial',
        description: '',
        tags: '',
      });
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      // Implementation would delete the document
      onRefresh();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  return (
    <div>
      {showForm ? (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                name="fileName"
                value={formData.fileName}
                onChange={handleChange}
                placeholder="File name"
                required
                style={{
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <input
                type="text"
                name="fileUrl"
                value={formData.fileUrl}
                onChange={handleChange}
                placeholder="File URL or path"
                required
                style={{
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <textarea
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
                marginBottom: '12px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <select
                name="fileType"
                value={formData.fileType}
                onChange={handleChange}
                style={{
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="word">Word</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
              <select
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
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                name="fileSize"
                value={formData.fileSize}
                onChange={handleChange}
                placeholder="File size (e.g., 2.5MB)"
                style={{
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Tags (comma separated)"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
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
                Upload
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
          + Upload Document
        </button>
      )}

      {documents && documents.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {documents.map(doc => (
            <div
              key={doc.id}
              style={{
                padding: '16px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: '#F9FAFB',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {fileIcons[doc.fileType] || fileIcons.other}
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, wordBreak: 'break-word' }}>
                {doc.fileName}
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6B7280' }}>
                {doc.fileSize}
              </p>
              {doc.description && (
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6B7280' }}>
                  {doc.description}
                </p>
              )}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#EDE9FE',
                  color: '#5B21B6',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  textTransform: 'capitalize',
                }}
              >
                {doc.category}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
          📂 No documents yet. Upload one to get started.
        </div>
      )}
    </div>
  );
};

export default DDDocumentsPanel;
