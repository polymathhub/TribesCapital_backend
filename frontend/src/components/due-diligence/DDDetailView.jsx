import { useState, useEffect } from 'react';
import { dueDiligenceAPI } from '../../api/endpoints';
import DDItemsPanel from './DDItemsPanel';
import DDDocumentsPanel from './DDDocumentsPanel';
import DDCommentsPanel from './DDCommentsPanel';
import DDApprovalsPanel from './DDApprovalsPanel';
import '../../styles/due-diligence.css';

const DDDetailView = ({ item, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('items');
  const [data, setData] = useState(item);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setData(item);
  }, [item]);

  const statusColors = {
    'pending': '#FEF3C7',
    'in_progress': '#DBEAFE',
    'completed': '#DCFCE7',
    'on_hold': '#FEE2E2',
  };

  const priorityColors = {
    'low': { bg: '#ECFDF5', text: '#10B981' },
    'medium': { bg: '#FEF3C7', text: '#F59E0B' },
    'high': { bg: '#FEE2E2', text: '#EF4444' },
    'critical': { bg: '#F3E8FF', text: '#7C3AED' },
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await dueDiligenceAPI.update(data.id, { status: newStatus });
      setData(prev => ({ ...prev, status: newStatus }));
      onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (!data) return <div>Loading...</div>;

  const tabCounts = {
    items: data.items?.length || 0,
    documents: data.documents?.length || 0,
    comments: data.comments?.length || 0,
    approvals: data.approvals?.length || 0,
  };

  return (
    <div>
      {/* Header */}
      <div className="dd-detail-header">
        <button onClick={onBack} className="dd-back-button">
          ← Back to List
        </button>

        <div className="dd-detail-title-section">
          <div className="dd-detail-title">
            <h1>{data.title}</h1>
            {data.description && <p>{data.description}</p>}
          </div>

          <select
            value={data.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            style={{
              padding: '8px 12px',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              background: statusColors[data.status],
            }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {/* Metrics Grid */}
        <div className="dd-metrics-grid">
          <div className="dd-metric-card">
            <div className="dd-metric-label">Progress</div>
            <div className="dd-metric-value">{data.completionPercent}%</div>
            <div className="dd-progress-bar" style={{ marginTop: '8px' }}>
              <div
                className="dd-progress-fill"
                style={{ width: `${data.completionPercent}%` }}
              />
            </div>
          </div>

          <div className="dd-metric-card">
            <div className="dd-metric-label">Score</div>
            <div className="dd-metric-value">{data.score ? data.score.toFixed(1) : '—'}/10</div>
            {data.riskLevel && <div className="dd-metric-secondary">Risk: {data.riskLevel}</div>}
          </div>

          <div className="dd-metric-card">
            <div className="dd-metric-label">Priority</div>
            <div
              style={{
                background: priorityColors[data.priority]?.bg,
                color: priorityColors[data.priority]?.text,
                padding: '8px 12px',
                borderRadius: '4px',
                fontWeight: 600,
                textAlign: 'center',
                textTransform: 'capitalize',
              }}
            >
              {data.priority}
            </div>
          </div>

          <div className="dd-metric-card">
            <div className="dd-metric-label">Target</div>
            <div className="dd-metric-value" style={{ fontSize: '14px' }}>
              {data.targetName || '—'}
            </div>
            {data.targetType && <div className="dd-metric-secondary">Type: {data.targetType}</div>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dd-tabs">
        {['items', 'documents', 'comments', 'approvals'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`dd-tab ${activeTab === tab ? 'active' : ''}`}
          >
            <span style={{ textTransform: 'capitalize' }}>{tab}</span>
            <span className="dd-tab-count">{tabCounts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {activeTab === 'items' && <DDItemsPanel dueDiligenceId={data.id} items={data.items} onRefresh={onRefresh} />}
        {activeTab === 'documents' && <DDDocumentsPanel dueDiligenceId={data.id} documents={data.documents} comments={data.comments} onRefresh={onRefresh} />}
        {activeTab === 'comments' && <DDCommentsPanel dueDiligenceId={data.id} comments={data.comments} onRefresh={onRefresh} />}
        {activeTab === 'approvals' && <DDApprovalsPanel dueDiligenceId={data.id} approvals={data.approvals} onRefresh={onRefresh} />}
      </div>
    </div>
  );
};

export default DDDetailView;
