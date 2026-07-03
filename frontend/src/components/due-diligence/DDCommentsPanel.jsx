import { useState } from 'react';
import { dueDiligenceAPI } from '../../api/endpoints';

const DDCommentsPanel = ({ dueDiligenceId, comments = [], onRefresh }) => {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      await dueDiligenceAPI.addComment(dueDiligenceId, { content: newComment });
      setNewComment('');
      onRefresh();
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
        <label htmlFor="dd-comment-input" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Comment</label>
        <textarea
          id="dd-comment-input"
          name="comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows="3"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            fontSize: '14px',
            marginBottom: '12px',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          style={{
            padding: '8px 16px',
            background: newComment.trim() ? '#5B21B6' : '#D1D5DB',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: newComment.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {comments && comments.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {comments.map(comment => (
            <div
              key={comment.id}
              style={{
                padding: '16px',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                background: '#F9FAFB',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div>
                  <h5 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 600 }}>
                    {comment.author?.firstName || 'Anonymous'} {comment.author?.lastName || ''}
                  </h5>
                  <p style={{ margin: '0', fontSize: '12px', color: '#9CA3AF' }}>
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
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
              <p style={{ margin: '0', fontSize: '14px', color: '#111827', lineHeight: '1.5' }}>
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
          💬 No comments yet. Be the first to comment.
        </div>
      )}
    </div>
  );
};

export default DDCommentsPanel;
