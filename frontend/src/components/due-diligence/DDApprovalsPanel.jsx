import { useState } from 'react';
import { dueDiligenceAPI } from '../../api/endpoints';
import Icon from '../Icon';

const DDApprovalsPanel = ({ dueDiligenceId, approvals = [], onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    approverRole: 'reviewer',
    approvalNotes: '',
  });

  const statusColors = {
    'pending': { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
    'approved': { bg: '#DCFCE7', text: '#15803D', label: 'Approved' },
    'rejected': { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dueDiligenceAPI.createApproval(dueDiligenceId, {
        approverRole: formData.approverRole || 'reviewer',
        approvalNotes: formData.approvalNotes,
      });
      setFormData({ approverRole: 'reviewer', approvalNotes: '' });
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error('Error creating approval:', error);
      alert('Failed to create approval request');
    }
  };

  const handleApproveOrReject = async (approvalId, decision, notes) => {
    try {
      await dueDiligenceAPI.approveOrReject(dueDiligenceId, approvalId, { status: decision, approvalNotes: notes });
      onRefresh();
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to update approval');
    }
  };

  return (
    <div>
      {showForm ? (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="dd-approval-role" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Approver role</label>
              <input
                id="dd-approval-role"
                type="text"
                name="approverRole"
                value={formData.approverRole}
                onChange={handleChange}
                placeholder="reviewer"
                required
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
            <label htmlFor="dd-approval-notes" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#111827', fontSize: '13px' }}>Approval notes</label>
            <textarea
              id="dd-approval-notes"
              name="approvalNotes"
              value={formData.approvalNotes}
              onChange={handleChange}
              placeholder="Approval notes"
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
                Request Approval
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
          className="interactive-button"
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            background: '#5B21B6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon name="plus" size={14} color="#fff" />
          Request Approval
        </button>
      )}

      {approvals && approvals.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {approvals.map(approval => {
            const status = approval.status || 'pending';
            const colors = statusColors[status];
            return (
              <div
                key={approval.id}
                style={{
                  padding: '16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: '#F9FAFB',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>
                      {approval.approver?.email || approval.approverRole || 'Pending Reviewer'}
                    </h5>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: colors.bg,
                        color: colors.text,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {colors.label}
                    </span>
                  </div>
                </div>
                {approval.approvalNotes && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#111827' }}>
                    {approval.approvalNotes}
                  </p>
                )}
                {status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => handleApproveOrReject(approval.id, 'approved', '')}
                      className="interactive-button"
                      style={{
                        padding: '6px 12px',
                        background: '#DCFCE7',
                        color: '#15803D',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Icon name="check" size={12} color="#15803D" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveOrReject(approval.id, 'rejected', '')}
                      className="interactive-button"
                      style={{
                        padding: '6px 12px',
                        background: '#FEE2E2',
                        color: '#991B1B',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Icon name="close" size={12} color="#991B1B" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>
          <div style={{ display: 'inline-flex', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: '999px', background: '#F3F4F6', marginBottom: 12 }}>
            <Icon name="check" size={20} color="#6B7280" />
          </div>
          <div>No approval requests yet.</div>
        </div>
      )}
    </div>
  );
};

export default DDApprovalsPanel;
