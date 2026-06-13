import { useState } from 'react';
import '../../styles/due-diligence.css';

const DDListView = ({ items, loading, onViewDetail, onFilterChange, onPageChange, pagination }) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    type: 'all',
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const priorityDot = (priority) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#7C3AED',
    };
    return (
      <span
        style={{
          display: 'inline-block',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: colors[priority] || '#6B7280',
          marginRight: '8px',
        }}
      />
    );
  };

  const statusBadge = (status) => {
    const colors = {
      'pending': { bg: '#FEF3C7', color: '#92400E' },
      'in_progress': { bg: '#DBEAFE', color: '#1E40AF' },
      'completed': { bg: '#DCFCE7', color: '#15803D' },
      'on_hold': { bg: '#FEE2E2', color: '#991B1B' },
    };
    const style = colors[status] || { bg: '#F3F4F6', color: '#374151' };
    return (
      <span
        style={{
          padding: '4px 12px',
          background: style.bg,
          color: style.color,
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'capitalize',
        }}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="dd-list-container">
      {/* Filters */}
      <div className="dd-filter-bar">
        <input
          type="text"
          placeholder="Search by title, target, or description..."
          value={localFilters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="dd-search-input"
        />
        <select
          value={localFilters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="dd-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
        <select
          value={localFilters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="dd-filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={localFilters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="dd-filter-select"
        >
          <option value="all">All Types</option>
          <option value="investment">Investment</option>
          <option value="compliance">Compliance</option>
          <option value="company">Company</option>
          <option value="fund">Fund</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
          No due diligences found. Create one to get started.
        </div>
      ) : (
        <>
          <div className="dd-table-wrapper">
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Score</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="dd-table-row" onClick={() => onViewDetail(item)}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#5B21B6', cursor: 'pointer' }}>
                        {item.title}
                      </span>
                    </td>
                    <td>{item.targetName || '—'}</td>
                    <td>{statusBadge(item.status)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '100px',
                            height: '6px',
                            background: '#E5E7EB',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${item.completionPercent || 0}%`,
                              background: '#5B21B6',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {item.completionPercent || 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {item.score ? item.score.toFixed(1) : '—'}/10
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {priorityDot(item.priority)}
                        <span style={{ textTransform: 'capitalize' }}>{item.priority}</span>
                      </span>
                    </td>
                    <td>{formatDate(item.targetDeadline)}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetail(item);
                        }}
                        style={{
                          padding: '4px 12px',
                          background: 'none',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#5B21B6',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <span style={{ color: '#6B7280' }}>
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #E5E7EB',
                  background: pagination.page === 1 ? '#F9FAFB' : 'white',
                  borderRadius: '4px',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  opacity: pagination.page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span style={{ padding: '6px 12px' }}>
                Page {pagination.page} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #E5E7EB',
                  background: pagination.page >= totalPages ? '#F9FAFB' : 'white',
                  borderRadius: '4px',
                  cursor: pagination.page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: pagination.page >= totalPages ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DDListView;
