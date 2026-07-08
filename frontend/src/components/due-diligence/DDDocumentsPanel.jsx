import { useState } from 'react';
import { dueDiligenceAPI } from '../../api/endpoints';
import DDCommentsPanel from './DDCommentsPanel';

const DDDocumentsPanel = ({ dueDiligenceId, documents = [], comments = [], onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    fileName: '',
    fileUrl: '',
    fileType: 'pdf',
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type.split('/')[1] || prev.fileType,
        fileUrl: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !formData.fileUrl.trim()) {
      alert('Please upload a file or provide a file URL.');
      return;
    }

    try {
      const data = new FormData();
      if (selectedFile) {
        data.append('file', selectedFile);
      }
      data.append('category', formData.category);
      if (formData.description) data.append('description', formData.description);
      if (formData.tags) data.append('tags', formData.tags);
      if (formData.fileName) data.append('fileName', formData.fileName);
      if (formData.fileType) data.append('fileType', formData.fileType);
      if (formData.fileUrl) data.append('fileUrl', formData.fileUrl);

      await dueDiligenceAPI.uploadDocument(dueDiligenceId, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSelectedFile(null);
      setFormData({
        fileName: '',
        fileUrl: '',
        fileType: 'pdf',
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
      await dueDiligenceAPI.deleteDocument(dueDiligenceId, docId);
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label htmlFor="dd-doc-file" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>File upload</label>
                <input
                  id="dd-doc-file"
                  type="file"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label htmlFor="dd-doc-url" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Or file URL</label>
                <input
                  id="dd-doc-url"
                  type="text"
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleChange}
                  placeholder="Optional if you upload a file"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="dd-doc-description" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Description</label>
              <textarea
                id="dd-doc-description"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label htmlFor="dd-doc-type" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>File type</label>
                <select
                  id="dd-doc-type"
                  name="fileType"
                  value={formData.fileType}
                  onChange={handleChange}
                  style={{
                    width: '100%',
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
              </div>
              <div>
                <label htmlFor="dd-doc-category" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Category</label>
                <select
                  id="dd-doc-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  style={{
                    width: '100%',
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
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="dd-doc-tags" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Tags</label>
              <input
                id="dd-doc-tags"
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
                  boxSizing: 'border-box',
                }}
              />
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
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() => handleDelete(doc.id)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  border: 'none',
                  background: 'transparent',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                ×
              </button>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {fileIcons[doc.fileType] || fileIcons.other}
              </div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600, wordBreak: 'break-word' }}>
                {doc.fileName}
              </h4>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6B7280' }}>
                {doc.fileSize || 'Unknown size'}
              </p>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-block',
                    marginBottom: '8px',
                    color: '#4338CA',
                    fontSize: '12px',
                    textDecoration: 'underline',
                  }}
                >
                  View document
                </a>
              )}
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
