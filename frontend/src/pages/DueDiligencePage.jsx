import { useState, useEffect } from 'react';
import { dueDiligenceAPI } from '../api/endpoints';
import DDListView from '../components/due-diligence/DDListView';
import DDDetailView from '../components/due-diligence/DDDetailView';
import DDCreateDialog from '../components/due-diligence/DDCreateDialog';

const DueDiligencePage = ({ onBack, onToggleSidebar, isMobile, isTablet }) => {
  const [view, setView] = useState('list');
  const [dueDiligences, setDueDiligences] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    type: 'all',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const loadDueDiligences = async () => {
    try {
      setLoading(true);
      const params = {
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.priority !== 'all' && { priority: filters.priority }),
        ...(filters.type !== 'all' && { type: filters.type }),
      };
      const response = await dueDiligenceAPI.list(params);
      setDueDiligences(response.data || []);
      setPagination(prev => ({ ...prev, total: response.total || 0 }));
    } catch (error) {
      console.error('Error loading due diligences:', error);
      alert('Failed to load due diligences');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDueDiligences();
  }, [filters, pagination.page]);

  const handleViewDetail = (item) => {
    setSelectedItem(item);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedItem(null);
    loadDueDiligences();
  };

  const handleCreateNew = async (data) => {
    try {
      await dueDiligenceAPI.create(data);
      setShowCreateDialog(false);
      loadDueDiligences();
    } catch (error) {
      console.error('Error creating due diligence:', error);
      alert('Failed to create due diligence');
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {view === 'list' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827' }}>Due Diligence Vault</h1>
              <button
                onClick={() => setShowCreateDialog(true)}
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
                + New Due Diligence
              </button>
            </div>
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
    </div>
  );
};

export default DueDiligencePage;
