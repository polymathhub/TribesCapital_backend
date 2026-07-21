import { useState } from 'react';
import CorporateMemphisIllustration from '../CorporateMemphisIllustration';
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

  const handleClearFilters = () => {
    const resetFilters = { search: '', status: 'all', priority: 'all', type: 'all' };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
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
    const normalized = String(status || 'draft').toLowerCase();
    const colors = {
      draft: { bg: '#FEF3C7', color: '#92400E' },
      pending: { bg: '#FEF3C7', color: '#92400E' },
      in_progress: { bg: '#DBEAFE', color: '#1E40AF' },
      review: { bg: '#FDE68A', color: '#92400E' },
      approved: { bg: '#DCFCE7', color: '#15803D' },
      rejected: { bg: '#FEE2E2', color: '#991B1B' },
      completed: { bg: '#DCFCE7', color: '#15803D' },
      on_hold: { bg: '#FEE2E2', color: '#991B1B' },
    };
    const style = colors[normalized] || { bg: '#F3F4F6', color: '#374151' };
    const label = normalized === 'draft' ? 'Draft' : normalized.replace('_', ' ');
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
        {label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const hasActiveFilters = Object.values(localFilters).some((value) => value !== 'all' && value !== '');

  return (
    <div className="dd-list-container">
      {/* Filters */}
      <div className="dd-filter-bar">
        <label htmlFor="dd-search" className="sr-only">Search due diligence</label>
        <input
          id="dd-search"
          name="search"
          type="text"
          placeholder="Search by title, target, or description..."
          value={localFilters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="dd-search-input"
        />
        <label htmlFor="dd-status" className="sr-only">Filter by status</label>
        <select
          id="dd-status"
          name="status"
          value={localFilters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="dd-filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
        <label htmlFor="dd-priority-filter" className="sr-only">Filter by priority</label>
        <select
          id="dd-priority-filter"
          name="priority"
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
        <label htmlFor="dd-type-filter" className="sr-only">Filter by type</label>
        <select
          id="dd-type-filter"
          name="type"
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
        {hasActiveFilters && (
          <button type="button" onClick={handleClearFilters} className="dd-btn-secondary" style={{ justifySelf: 'start' }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px' }}>
          <CorporateMemphisIllustration variant="data" size={220} />
          <div style={{ maxWidth: '420px' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No due diligences yet</div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6, color: '#6B7280' }}>
              Create a diligence entry to track an investment, company, or fund with structure and momentum of your entires.
            </p>
          </div>
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
