import { useState } from 'react';
import { dueDiligenceAPI } from '../../api/endpoints';

const MAX_ATTACHMENTS = 5;

const DDCommentsPanel = ({ dueDiligenceId, comments = [], onRefresh }) => {
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : '';
  const canPost = newComment.trim().length > 0 || attachments.length > 0;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (comment) => {
    const first = comment.author?.firstName?.[0] || '';
    const last = comment.author?.lastName?.[0] || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return comment.author?.email?.[0]?.toUpperCase() || 'A';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canPost) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('content', newComment.trim());
      attachments.forEach((file) => formData.append('attachments', file));

      await dueDiligenceAPI.addComment(dueDiligenceId, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewComment('');
      setAttachments([]);
      onRefresh();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttach = (event) => {
    const files = Array.from(event.target.files || []);
    setAttachments((prev) => {
      const nextFiles = [...prev, ...files].slice(0, MAX_ATTACHMENTS);
      return nextFiles;
    });
    event.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await dueDiligenceAPI.deleteComment(dueDiligenceId, commentId);
      onRefresh();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const renderAttachment = (attachment, index) => {
    const isImage = typeof attachment === 'string' && attachment.match(/\.(jpeg|jpg|png|gif|webp)$/i);
    if (isImage) {
      return (
        <div key={`${attachment}-${index}`} className="dd-comment-attachment-card">
          <img className="dd-attachment-image" src={attachment} alt={`Attachment ${index + 1}`} />
        </div>
      );
    }

    return (
      <a
        key={`${attachment}-${index}`}
        href={attachment}
        target="_blank"
        rel="noreferrer"
        className="dd-attachment-file-link"
      >
        <span>{`Attachment ${index + 1}`}</span>
        <span className="dd-attachment-file-meta">Open file</span>
      </a>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  };

  return (
    <div className="dd-comments-panel">
      <form onSubmit={handleSubmit} className="dd-comment-form">
        <div className="dd-comment-form-header">
          <div>
            <h3 className="dd-comment-form-title">Team discussion</h3>
            <p className="dd-comment-form-subtitle">Share progress, ask questions, and attach files instantly.</p>
          </div>
          <div className="dd-comment-form-counter">
            {attachments.length}/{MAX_ATTACHMENTS} files
          </div>
        </div>

        <textarea
          id="dd-comment-input"
          name="comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write something helpful..."
          className="dd-comment-input"
          rows="4"
        />

        <div className="dd-comment-actions">
          <label htmlFor="dd-comment-attachment" className="dd-file-picker-button">
            + Add images or files
          </label>
          <input
            id="dd-comment-attachment"
            type="file"
            multiple
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleAttach}
            className="dd-file-input"
          />
          <button type="submit" className="dd-send-button" disabled={submitting || !canPost}>
            {submitting ? 'Sending...' : 'Post'}
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="dd-file-chip-group">
            {attachments.map((file, index) => (
              <div key={`${file.name}-${index}`} className="dd-file-chip">
                <div>
                  <div className="dd-file-chip-name">{file.name}</div>
                  <div className="dd-file-chip-size">{formatFileSize(file.size)}</div>
                </div>
                <button type="button" onClick={() => removeAttachment(index)} className="dd-file-chip-remove">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </form>

      {comments && comments.length > 0 ? (
        <div className="dd-comments-list">
          {comments.map((comment) => {
            const isMine = comment.author?.email === currentUserEmail;
            return (
              <div key={comment.id} className="dd-comment-card">
                <div className="dd-comment-header">
                  <div className="dd-comment-author-info">
                    <div className="dd-comment-avatar">{getInitials(comment)}</div>
                    <div>
                      <div className="dd-comment-author">{comment.author?.firstName || comment.author?.email || 'Anonymous'}</div>
                      <div className="dd-comment-time">{formatDate(comment.createdAt)}</div>
                    </div>
                  </div>
                  {isMine && (
                    <button type="button" onClick={() => handleDelete(comment.id)} className="dd-comment-delete-button">
                      Delete
                    </button>
                  )}
                </div>

                <div className="dd-comment-content">{comment.content || 'Shared an update.'}</div>

                {comment.attachments && comment.attachments.length > 0 && (
                  <div className="dd-comment-attachments">
                    {comment.attachments.map(renderAttachment)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="dd-empty-state">
          <div className="dd-empty-emoji">💬</div>
          <div className="dd-empty-text">No comments yet. Kick off the conversation with an update.</div>
        </div>
      )}
    </div>
  );
};

export default DDCommentsPanel;
