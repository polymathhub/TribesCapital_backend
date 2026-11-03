import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { projectMarketplaceAPI } from '../api/endpoints';
import './ProjectMarketplace.css';

const PAGE_SIZE = 100;

function getErrorMessage(error, fallback) {
  const responseMessage = error?.response?.data?.message;
  if (Array.isArray(responseMessage)) return responseMessage.filter(Boolean).join(' ');
  if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function getCapacityValue(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function formatCapacity(value) {
  const capacity = getCapacityValue(value);
  return capacity === null ? null : new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(capacity);
}

function ProjectMarketplace({ user }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [pendingProjectId, setPendingProjectId] = useState(null);
  const [detailsProject, setDetailsProject] = useState(null);
  const dialogRef = useRef(null);
  const detailsProjectId = detailsProject?.id;
  const isGuest = user?.accountType === 'GUEST';

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setProjects([]);
    try {
      const response = await projectMarketplaceAPI.list({ skip: 0, take: PAGE_SIZE });
      if (!Array.isArray(response?.data?.data)) {
        throw new Error('Project listings returned an unexpected response.');
      }
      setProjects(response.data.data);
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Project listings could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!detailsProjectId || !dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [detailsProjectId]);

  const projectTypes = useMemo(
    () => [...new Set(projects.map((project) => project.projectType?.trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right)),
    [projects],
  );

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return projects
      .filter((project) => {
        const title = project.title?.toLocaleLowerCase() || '';
        const type = project.projectType?.toLocaleLowerCase() || '';
        return (typeFilter === 'all' || project.projectType === typeFilter)
          && (!query || title.includes(query) || type.includes(query));
      })
      .sort((left, right) => {
        if (sortBy === 'capacity') {
          return (getCapacityValue(right.capacityKwp) || 0) - (getCapacityValue(left.capacityKwp) || 0);
        }
        return (left.title || '').localeCompare(right.title || '');
      });
  }, [projects, search, sortBy, typeFilter]);

  async function toggleWaitlist(project) {
    if (!project) return;
    if (isGuest) {
      window.location.assign('/signup');
      return;
    }
    if (pendingProjectId) return;

    const nextIsWaitlisted = !project.isWaitlisted;
    setPendingProjectId(project.id);
    setActionError('');
    setActionMessage('');
    try {
      const response = nextIsWaitlisted
        ? await projectMarketplaceAPI.joinWaitlist(project.id)
        : await projectMarketplaceAPI.leaveWaitlist(project.id);
      if (response?.data?.isWaitlisted !== nextIsWaitlisted) {
        throw new Error('We could not confirm the waitlist change. Please refresh and try again.');
      }

      setProjects((currentProjects) => currentProjects.map((currentProject) => (
        currentProject.id === project.id
          ? { ...currentProject, isWaitlisted: nextIsWaitlisted }
          : currentProject
      )));
      setDetailsProject((currentProject) => (
        currentProject?.id === project.id
          ? { ...currentProject, isWaitlisted: nextIsWaitlisted }
          : currentProject
      ));
      setActionMessage(nextIsWaitlisted
        ? `You are on the waitlist for ${project.title}.`
        : `You have left the waitlist for ${project.title}.`);
    } catch (error) {
      setActionError(getErrorMessage(error, 'The waitlist could not be updated. Please try again.'));
    } finally {
      setPendingProjectId(null);
    }
  }

  function renderProjectAction(project, compact = false) {
    const isPending = project && pendingProjectId === project.id;
    const isJoined = Boolean(project?.isWaitlisted && !isGuest);
    const label = isPending ? 'Saving...' : isJoined ? 'Leave waitlist' : 'Join waitlist';

    return (
      <button
        type="button"
        className={`pm-button ${isJoined ? 'pm-button-secondary' : 'pm-button-primary'}${compact ? ' pm-compact' : ''}`}
        onClick={() => toggleWaitlist(project)}
        disabled={!project || Boolean(pendingProjectId)}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="project-marketplace">
      <main className="pm-page">
        <header className="pm-page-header" data-od-id="marketplace-heading">
          <div>
            <h1>Project marketplace</h1>
            <p>Explore published clean energy projects and register non-binding interest.</p>
          </div>
        </header>

        {actionMessage && <p className="pm-feedback pm-feedback-success" role="status">{actionMessage}</p>}
        {actionError && !detailsProject && <p className="pm-feedback pm-feedback-error" role="alert">{actionError}</p>}

        <section id="pm-listings" aria-labelledby="pm-listing-title" data-od-id="project-browse">
          <div className="pm-section-heading">
            <div>
              <h2 id="pm-listing-title">All projects</h2>
              <p>Published clean energy projects.</p>
            </div>
          </div>

          <div className="pm-controls" role="group" aria-label="Project filters">
            <label className="pm-control">
              <input
                type="search"
                aria-label="Search projects"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects or technology"
              />
            </label>
            <label className="pm-control">
              <select
                aria-label="Filter by project type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">All project types</option>
                {projectTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <label className="pm-control">
              <select
                aria-label="Sort projects"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="name">Name: A to Z</option>
                <option value="capacity">System size: largest first</option>
              </select>
            </label>
          </div>

          {loading && (
            <div className="pm-empty-state" aria-busy="true">
              <div>
                <strong>Loading projects</strong>
                Published projects will appear here.
              </div>
            </div>
          )}
          {!loading && loadError && (
            <div className="pm-empty-state pm-load-error" role="alert">
              <div className="pm-load-error-content">
                <strong>Projects could not be loaded</strong>
                <p>{loadError} Please try again.</p>
                <button type="button" className="pm-button pm-button-primary pm-retry-button" onClick={loadProjects}>
                  Try again
                </button>
              </div>
            </div>
          )}
          {!loading && !loadError && projects.length === 0 && (
            <div className="pm-empty-state">
              <div>
                <strong>No published projects yet</strong>
                Approved marketplace listings will appear here when available.
              </div>
            </div>
          )}
          {!loading && !loadError && projects.length > 0 && visibleProjects.length === 0 && (
            <div className="pm-empty-state">
              <div>
                <strong>No matching projects</strong>
                Try a different search or project type.
              </div>
            </div>
          )}
          {!loading && !loadError && visibleProjects.length > 0 && (
            <div className="pm-project-grid">
              {visibleProjects.map((project) => (
                <article className="pm-project-card" key={project.id}>
                  <div className="pm-project-copy">
                    <p className="pm-project-type">{project.projectType || 'Clean energy project'}</p>
                    <h3>{project.title}</h3>
                    {formatCapacity(project.capacityKwp) && (
                      <div className="pm-project-capacity">
                        <span>Indicative system size</span>
                        <strong>{formatCapacity(project.capacityKwp)} kWp</strong>
                      </div>
                    )}
                    <div className="pm-project-actions">
                      <button
                        type="button"
                        className="pm-button pm-button-secondary"
                        onClick={() => setDetailsProject(project)}
                      >
                        Details
                      </button>
                      {renderProjectAction(project, true)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <dialog
        ref={dialogRef}
        className="pm-dialog"
        aria-labelledby="pm-dialog-title"
        onCancel={(event) => { event.preventDefault(); setDetailsProject(null); }}
      >
        {detailsProject && (
          <>
            <div className="pm-dialog-top">
              <span className="pm-status-pill">Funding stage</span>
              <button
                type="button"
                className="pm-dialog-close"
                onClick={() => setDetailsProject(null)}
                aria-label="Close project details"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className="pm-dialog-type">{detailsProject.projectType || 'Clean energy project'}</p>
            <h2 id="pm-dialog-title">{detailsProject.title}</h2>
            {formatCapacity(detailsProject.capacityKwp) && (
              <div className="pm-dialog-fact">
                <span>Indicative system size</span>
                <strong>{formatCapacity(detailsProject.capacityKwp)} kWp</strong>
              </div>
            )}
            <p className="pm-detail-note">
              Only approved public project information is shown here. Additional project documents
              and financial terms are not published in the marketplace.
            </p>
            <p className="pm-detail-disclaimer">
              Waitlist interest is non-binding, reserves no units, and does not create an order.
              You can leave the waitlist at any time.
            </p>
            {actionError && <p className="pm-feedback pm-feedback-error" role="alert">{actionError}</p>}
            {renderProjectAction(detailsProject)}
          </>
        )}
      </dialog>

    </div>
  );
}

export default ProjectMarketplace;
