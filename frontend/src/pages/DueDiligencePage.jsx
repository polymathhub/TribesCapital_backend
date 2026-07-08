import { useState, useEffect, useMemo } from 'react';
import { dueDiligenceAPI } from '../api/endpoints';
import DDListView from '../components/due-diligence/DDListView';
import DDDetailView from '../components/due-diligence/DDDetailView';
import DDCreateDialog from '../components/due-diligence/DDCreateDialog';
import '../styles/due-diligence.css';

const normalizeDueDiligence = (item) => ({
  id: item?.id || `demo-${Date.now()}`,
  title: item?.title || 'Untitled diligence',
  description: item?.description || 'No description provided.',
  type: item?.type || 'investment',
  status: item?.status || 'pending',
  priority: item?.priority || 'medium',
  completionPercent: Number(item?.completionPercent ?? item?.progress ?? 0),
  score: item?.score ? Number(item.score) : null,
  riskLevel: item?.riskLevel || 'medium',
  targetName: item?.targetName || 'Demo target',
  targetType: item?.targetType || 'company',
  targetDeadline: item?.targetDeadline || null,
  items: Array.isArray(item?.items) ? item.items : [],
  documents: Array.isArray(item?.documents) ? item.documents : [],
  comments: Array.isArray(item?.comments) ? item.comments : [],
  approvals: Array.isArray(item?.approvals) ? item.approvals : [],
  creator: item?.creator || null,
  assignedTo: item?.assignedTo || null,
});

const applyFilters = (items, filters) => {
  return items.filter((item) => {
    const search = filters.search.trim().toLowerCase();
    const matchesSearch = !search || [item.title, item.description, item.targetName].some((value) =>
      String(value || '').toLowerCase().includes(search),
    );
    const matchesStatus = filters.status === 'all' || item.status === filters.status;
    const matchesPriority = filters.priority === 'all' || item.priority === filters.priority;
    const matchesType = filters.type === 'all' || item.type === filters.type;
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });
};

const RefreshIcon = ({ spinning = false }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', animation: spinning ? 'spin 0.8s linear infinite' : 'none' }}
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

const DueDiligencePage = ({ onBack, onToggleSidebar, isMobile, isTablet }) => {
  const [view, setView] = useState('list');
  const [dueDiligences, setDueDiligences] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    type: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
  });

  const loadDueDiligences = async ({ page = pagination.page, limit = pagination.limit } = {}) => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      setError('');
      setFeedback('');
      const params = {
        page,
        limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.type !== 'all' && { type: filters.type }),
      };
      const response = await dueDiligenceAPI.list(params);
      const payload = response?.data;
      const rawItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
      const normalized = rawItems.map(normalizeDueDiligence);
      const filtered = applyFilters(normalized, filters);
      const start = (page - 1) * limit;
      const pageItems = filtered.slice(start, start + limit);
      setDueDiligences(pageItems);
      setPagination(prev => ({ ...prev, page, limit, total: filtered.length }));
    } catch (err) {
      console.error('Error loading due diligences:', err);
      setDueDiligences([]);
      setPagination(prev => ({ ...prev, total: 0 }));
      setError('We could not load your diligence cases right now. Please refresh or try again shortly.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDueDiligences();
  }, [filters, pagination.page]);

  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setView('detail');
    setFeedback('');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedItem(null);
    setFeedback('');
    loadDueDiligences();
  };

  const handleCreateNew = async (data) => {
    try {
      const response = await dueDiligenceAPI.create(data);
      const createdItem = normalizeDueDiligence(response?.data || response || data);
      setFeedback(`Created “${createdItem.title}” successfully.`);
      setShowCreateDialog(false);
      await loadDueDiligences({ page: 1 });
    } catch (err) {
      console.error('Error creating due diligence:', err);
      setError('We could not create this diligence case right now. Please review the details and try again.');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const stats = useMemo(() => {
    const openCount = dueDiligences.filter((item) => item.status !== 'completed' && item.status !== 'approved').length;
    const reviewCount = dueDiligences.filter((item) => item.status === 'review' || item.status === 'in_progress').length;
    const completedCount = dueDiligences.filter((item) => item.status === 'completed' || item.status === 'approved').length;
    const nextDeadline = dueDiligences
      .map((item) => item.targetDeadline)
      .filter(Boolean)
      .sort()[0] || null;

    return { openCount, reviewCount, completedCount, nextDeadline };
  }, [dueDiligences]);

  return (
    <div className="dd-page" style={{ padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {view === 'list' ? (
          <>
            <div className="dd-hero-card" style={{ marginBottom: '16px' }}>
              <div className="dd-header" style={{ marginBottom: 0 }}>
                <div className="dd-header-content">
                  <h1>Due Diligence Vault</h1>
                  <p>Track diligence work, approvals, and follow-ups in one place.</p>
                </div>
                <div className="dd-toolbar-actions">
                  <button
                    type="button"
                    onClick={() => { setFeedback('Refreshing diligence items…'); loadDueDiligences(); }}
                    className="dd-btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', padding: 0 }}
                    aria-label="Refresh diligence items"
                  >
                    <RefreshIcon spinning={isRefreshing} />
                  </button>
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="dd-btn-primary"
                  >
                    + New Due Diligence
                  </button>
                </div>
              </div>

              <div className="dd-stat-grid">
                <div className="dd-stat-card">
                  <div className="dd-stat-label">Open work</div>
                  <div className="dd-stat-value">{stats.openCount}</div>
                </div>
                <div className="dd-stat-card">
                  <div className="dd-stat-label">In review</div>
                  <div className="dd-stat-value">{stats.reviewCount}</div>
                </div>
                <div className="dd-stat-card">
                  <div className="dd-stat-label">Completed</div>
                  <div className="dd-stat-value">{stats.completedCount}</div>
                </div>
                <div className="dd-stat-card">
                  <div className="dd-stat-label">Next deadline</div>
                  <div className="dd-stat-value" style={{ fontSize: '14px' }}>
                    {stats.nextDeadline ? new Date(stats.nextDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </div>
              </div>
            </div>
            {error && (
              <div className="dd-banner" style={{ marginBottom: '16px' }}>
                {error}
              </div>
            )}
            {feedback && (
              <div className="dd-banner dd-banner-success" style={{ marginBottom: '16px' }}>
                {feedback}
              </div>
            )}
            <DDListView
              items={dueDiligences}
              loading={loading}
              onViewDetail={handleViewDetail}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              pagination={pagination}
            />
          </>
        ) : (
          <DDDetailView
            item={selectedItem}
            onBack={handleBackToList}
            onRefresh={() => loadDueDiligences()}
          />
        )}
      </div>

      {showCreateDialog && (
        <DDCreateDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateNew}
        />
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DueDiligencePage;
