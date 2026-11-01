import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { projectMarketplaceAPI } from '../api/endpoints';
import './ProjectMarketplace.css';

const PAGE_SIZE = 100;
const SIDEBAR_PROJECT_LIMIT = 3;
const FEATURED_TABS = ['overview', 'details'];
const DEMO_PROJECTS = [
  {
    id: 'demo-community-solar',
    title: 'Community Solar Microgrid',
    projectType: 'Solar',
    capacityKwp: 420,
    isWaitlisted: false,
    isDemo: true,
  },
  {
    id: 'demo-rural-minigrid',
    title: 'Rural Mini-grid',
    projectType: 'Mini-grid',
    capacityKwp: 180,
    isWaitlisted: false,
    isDemo: true,
  },
  {
    id: 'demo-wind-project',
    title: 'Wind Demonstration Project',
    projectType: 'Wind',
    capacityKwp: 650,
    isWaitlisted: false,
    isDemo: true,
  },
];

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

function getImageSource(value) {
  if (typeof value !== 'string') return null;
  const source = value.trim();
  if (/^https:\/\/[^\s]+$/i.test(source)) return source;
  if (source.startsWith('/') && !source.startsWith('//')) return source;
  return null;
}

function renderDemoThumbnail({ featured = false, compact = false }) {
  return (
    <div
      className={`pm-demo-thumbnail${featured ? ' is-featured' : ''}${compact ? ' is-card' : ''}`}
      role="img"
      aria-label="Illustrative demo thumbnail of a solar energy project"
    >
      <span className="pm-demo-sun" aria-hidden="true" />
      <span className="pm-demo-hills" aria-hidden="true" />
      <span className="pm-demo-hills pm-demo-hills-back" aria-hidden="true" />
      <span className="pm-demo-panels" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </span>
      {!compact && (
        <>
          <span className="pm-demo-badge">Demo preview</span>
          <span className="pm-demo-caption">Illustrative image</span>
        </>
      )}
    </div>
  );
}

function renderProjectThumbnail({ project, featured = false, compact = false }) {
  const imageSource = getImageSource(project?.thumbnail);
  if (imageSource) {
    return (
      <img
        className={`pm-project-thumbnail${featured ? ' is-featured' : ''}`}
        src={imageSource}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    );
  }
  if (project?.isDemo) return renderDemoThumbnail({ featured, compact });

  return (
    <span className={`pm-thumbnail-fallback${featured ? ' is-featured' : ''}`}>
      Project preview unavailable
    </span>
  );
}

function ProjectMarketplace({ user }) {
  const [projects, setProjects] = useState([]);
  const [demoMode, setDemoMode] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [pendingProjectId, setPendingProjectId] = useState(null);
  const [detailsProject, setDetailsProject] = useState(null);
  const [featuredTab, setFeaturedTab] = useState('overview');
  const [activePage, setActivePage] = useState('marketplace');
  const dialogRef = useRef(null);
  const featuredTabRefs = useRef({});
  const detailsProjectId = detailsProject?.id;
  const isGuest = user?.accountType === 'GUEST';

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setProjects([]);
    setDemoMode(false);
    try {
      const response = await projectMarketplaceAPI.list({ skip: 0, take: PAGE_SIZE });
      if (!Array.isArray(response?.data?.data)) {
        throw new Error('Project listings returned an unexpected response.');
      }
      if (response.data.data.length === 0) {
        setProjects(DEMO_PROJECTS);
        setDemoMode(true);
      } else {
        setProjects(response.data.data);
      }
    } catch (error) {
      setLoadError(getErrorMessage(error, 'Project listings could not be loaded.'));
      setProjects(DEMO_PROJECTS);
      setDemoMode(true);
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

  const spotlightProject = visibleProjects[0] || null;
  const spotlightCapacity = formatCapacity(spotlightProject?.capacityKwp);
  const joinedProjects = useMemo(
    () => projects.filter((project) => project.isWaitlisted && !project.isDemo),
    [projects],
  );
  const visibleWaitlistedProjects = joinedProjects.slice(0, SIDEBAR_PROJECT_LIMIT);

  async function toggleWaitlist(project) {
    if (!project || project.isDemo) return;
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
    const label = project?.isDemo
      ? 'Demo only'
      : isPending
        ? 'Saving...'
        : isJoined
          ? 'Leave waitlist'
          : 'Join waitlist';

    return (
      <button
        type="button"
        className={`pm-button ${isJoined ? 'pm-button-secondary' : 'pm-button-primary'}${compact ? ' pm-compact' : ''}${project?.isDemo ? ' pm-button-demo' : ''}`}
        onClick={() => toggleWaitlist(project)}
        disabled={!project || project.isDemo || Boolean(pendingProjectId)}
      >
        {label}
      </button>
    );
  }

  function renderProjectCard(project) {
    return (
      <article className="pm-project-card" key={project.id}>
        <div className="pm-card-preview">
          {renderProjectThumbnail({ project, compact: true })}
        </div>
        <div className="pm-project-copy">
          <p className="pm-project-type">
            {project.isDemo && <span className="pm-demo-project-label">Demo</span>}
            {project.projectType || 'Clean energy project'}
          </p>
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
    );
  }

  function selectProjectType(type) {
    setTypeFilter(type);
    const listingSection = document.getElementById('pm-listings');
    if (listingSection) {
      listingSection.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
  }

  function handleFeaturedTabKeyDown(event) {
    const currentIndex = FEATURED_TABS.indexOf(featuredTab);
    const nextIndex = event.key === 'ArrowRight'
      ? (currentIndex + 1) % FEATURED_TABS.length
      : event.key === 'ArrowLeft'
        ? (currentIndex - 1 + FEATURED_TABS.length) % FEATURED_TABS.length
        : event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? FEATURED_TABS.length - 1
            : -1;
    if (nextIndex < 0) return;

    event.preventDefault();
    const nextTab = FEATURED_TABS[nextIndex];
    setFeaturedTab(nextTab);
    featuredTabRefs.current[nextTab]?.focus();
  }

  return (
    <div className="project-marketplace">
      <main className="pm-page">
        <header className="pm-page-header" data-od-id="marketplace-heading">
          <div>
            <h1>Project marketplace</h1>
            <p>Explore published cleanenergy projects and register nonbinding interest.</p>
          </div>
        </header>

        {actionMessage && <p className="pm-feedback pm-feedback-success" role="status">{actionMessage}</p>}
        {actionError && !detailsProject && <p className="pm-feedback pm-feedback-error" role="alert">{actionError}</p>}

        <div className="pm-market-layout">
          <div className="pm-market-main">
            <section className="pm-feature-card" data-od-id="project-spotlight">
              <div className="pm-feature-image">
                {spotlightProject && renderProjectThumbnail({ project: spotlightProject, featured: true })}
              </div>
              <div className="pm-feature-copy">
                <div
                  className="pm-feature-tabs"
                  role="tablist"
                  aria-label="Project information"
                  onKeyDown={handleFeaturedTabKeyDown}
                >
                  <button
                    type="button"
                    ref={(element) => { featuredTabRefs.current.overview = element; }}
                    id="pm-tab-overview"
                    role="tab"
                    aria-selected={featuredTab === 'overview'}
                    aria-controls="pm-feature-overview-panel"
                    tabIndex={featuredTab === 'overview' ? 0 : -1}
                    className={`pm-feature-tab${featuredTab === 'overview' ? ' pm-feature-tab-active' : ''}`}
                    onClick={() => setFeaturedTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    type="button"
                    ref={(element) => { featuredTabRefs.current.details = element; }}
                    id="pm-tab-details"
                    role="tab"
                    aria-selected={featuredTab === 'details'}
                    aria-controls="pm-feature-details-panel"
                    tabIndex={featuredTab === 'details' ? 0 : -1}
                    className={`pm-feature-tab${featuredTab === 'details' ? ' pm-feature-tab-active' : ''}`}
                    onClick={() => setFeaturedTab('details')}
                  >
                    Project details
                  </button>
                </div>
                <div className="pm-feature-panels">
                  <div
                    id="pm-feature-overview-panel"
                    className={`pm-feature-panel${featuredTab === 'overview' ? '' : ' is-inactive'}`}
                    role="tabpanel"
                    aria-labelledby="pm-tab-overview"
                    aria-hidden={featuredTab !== 'overview'}
                    tabIndex={featuredTab === 'overview' ? 0 : -1}
                  >
                    <span className="pm-feature-kicker">{spotlightProject?.projectType || 'Clean energy project'}</span>
                    <h2>{spotlightProject?.title || 'Project details appear here when published'}</h2>
                    <p className="pm-feature-description">
                      Only approved public information is shown. Project documents, financial terms,
                      return figures, and purchase actions are not part of this marketplace.
                    </p>
                    <div className="pm-feature-fact">
                      <span>Indicative system size</span>
                      <strong>
                        {spotlightCapacity
                          ? `${spotlightCapacity} kWp`
                          : 'Provided by published listing'}
                      </strong>
                    </div>
                  </div>
                  <div
                    id="pm-feature-details-panel"
                    className={`pm-feature-panel${featuredTab === 'details' ? '' : ' is-inactive'}`}
                    role="tabpanel"
                    aria-labelledby="pm-tab-details"
                    aria-hidden={featuredTab !== 'details'}
                    tabIndex={featuredTab === 'details' ? 0 : -1}
                  >
                    <span className="pm-feature-kicker">{spotlightProject?.projectType || 'Clean energy project'}</span>
                    <h2>{spotlightProject?.title || 'Project details appear here when published'}</h2>
                    <dl className="pm-feature-details-list">
                      <div>
                        <dt>Project stage</dt>
                        <dd>Funding stage</dd>
                      </div>
                      <div>
                        <dt>Indicative system size</dt>
                        <dd>{spotlightCapacity ? `${spotlightCapacity} kWp` : 'Provided by published listing'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <div className="pm-feature-action">
                  <span className="pm-status-pill">{spotlightProject?.isDemo ? 'Demo project' : 'Funding stage'}</span>
                  {renderProjectAction(spotlightProject)}
                </div>
              </div>
            </section>

          </div>

          <aside className="pm-right-rail" aria-label="Project marketplace side panel">
            <section className="pm-interest-panel" data-od-id="waitlist-summary" style={{ backgroundColor: 'rgb(93, 74, 191)' }}>
              <div className="pm-interest-heading">
                <h2>My waitlist</h2>
              </div>
              <p className="pm-interest-state">Your waitlist status</p>
              <p className="pm-interest-count">Interest only</p>
              <p className="pm-interest-note">
                Joining is non-binding, reserves no units, and does not create an order.
                You can leave a waitlist at any time.
              </p>
            </section>

            <section className="pm-rail-panel" data-od-id="project-types">
              <div className="pm-rail-heading">
                <h2>Browse project types</h2>
                <span>Filters</span>
              </div>
              <div className="pm-type-list">
                <button
                  type="button"
                  className={`pm-type-chip${typeFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => selectProjectType('all')}
                  aria-pressed={typeFilter === 'all'}
                >
                  All types
                </button>
                {projectTypes.map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`pm-type-chip${typeFilter === type ? ' is-active' : ''}`}
                    onClick={() => selectProjectType(type)}
                    aria-pressed={typeFilter === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </section>

            <section className="pm-rail-panel" data-od-id="waitlist-projects">
              <div className="pm-rail-heading">
                <h2>Joined projects</h2>
                <span>Current listings</span>
              </div>
              {loading ? (
                <div className="pm-waitlist-placeholder">Your waitlisted projects will appear here.</div>
              ) : loadError ? (
                <div className="pm-waitlist-placeholder" role="alert">Waitlisted projects are unavailable until listings load.</div>
              ) : visibleWaitlistedProjects.length > 0 ? (
                <div className="pm-waitlist-list">
                  {visibleWaitlistedProjects.map((project) => (
                    <div className="pm-waitlist-row" key={project.id}>
                      <button
                        type="button"
                        className="pm-waitlist-project"
                        onClick={() => setDetailsProject(project)}
                        aria-label={`View details for ${project.title}`}
                      >
                        <span className="pm-waitlist-icon" aria-hidden="true" />
                        <span className="pm-waitlist-copy">
                          <strong>{project.title}</strong>
                          <small>{project.projectType || 'Clean energy project'}</small>
                        </span>
                      </button>
                      {renderProjectAction(project, true)}
                    </div>
                  ))}
                  {waitlistedProjects.length > SIDEBAR_PROJECT_LIMIT && (
                    <p className="pm-waitlist-more">
                      +{waitlistedProjects.length - SIDEBAR_PROJECT_LIMIT} more in current listings
                    </p>
                  )}
                </div>
              ) : (
                <div className="pm-waitlist-placeholder">Your waitlisted projects will appear here.</div>
              )}
            </section>
          </aside>
        </div>

        <section id="pm-listings" aria-labelledby="pm-listing-title" data-od-id="project-browse">
          <div className="pm-section-heading">
            <div>
              <h2 id="pm-listing-title">All projects</h2>
              <p>
                {demoMode
                  ? 'Illustrative demo projects · not published investment listings.'
                  : 'Published listings only · project information is carefully limited.'}
              </p>
            </div>
          </div>
          {demoMode && (
            <p className="pm-demo-notice" role="status">
              Demo preview only. These sample projects, capacities, and thumbnails are illustrative,
              are not live listings, and cannot be joined.
            </p>
          )}

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
                Published marketplace listings will appear here.
              </div>
            </div>
          )}
          {!loading && loadError && (
            <div className="pm-empty-state pm-load-error" role="alert">
              <div className="pm-load-error-content">
                <strong>Projects could not be loaded</strong>
                <p>Current listings are temporarily unavailable. Please try again.</p>
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
          {!loading && projects.length > 0 && visibleProjects.length === 0 && (
            <div className="pm-empty-state">
              <div>
                <strong>No matching projects</strong>
                Try a different search or project type.
              </div>
            </div>
          )}
          {!loading && visibleProjects.length > 0 && (
            <div className="pm-project-grid">
              {visibleProjects.map((project) => (
                <article className="pm-project-card" key={project.id}>
                  <div className="pm-card-preview">
                    {renderProjectThumbnail({ project, compact: true })}
                  </div>
                  <div className="pm-project-copy">
                    <p className="pm-project-type">
                      {project.isDemo && <span className="pm-demo-project-label">Demo</span>}
                      {project.projectType || 'Clean energy project'}
                    </p>
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
              Only approved public project information is shown here. Location, project documents,
              financial terms, and return figures are not available in this preview.
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
