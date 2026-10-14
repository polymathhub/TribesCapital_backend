import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminOperationsAPI } from '../api/endpoints';
import { COLORS } from '../constants/colors';

const unwrap = (response) => response?.data?.data ?? response?.data ?? {};
const fullName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.email || 'Unknown';
const roleNames = (user) => (user?.roles || []).map((role) => typeof role === 'string' ? role : role.name);
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';

function Panel({ children }) {
  return <section style={{ background: COLORS.W, border: `1px solid ${COLORS.BD}`, borderRadius: 12, padding: 18, marginTop: 14 }}>{children}</section>;
}

function Notice({ children, error = false }) {
  if (!children) return null;
  return <div role={error ? 'alert' : 'status'} style={{ padding: 11, margin: '12px 0', borderRadius: 8, background: error ? '#FEF3F2' : '#ECFDF3', color: error ? '#B42318' : '#027A48', fontSize: 13 }}>{children}</div>;
}

function PageControls({ page, total, limit, setPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / limit));
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14, color: COLORS.T2, fontSize: 12 }}>
    <span>{total || 0} records · page {page} of {pages}</span>
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
      <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
    </div>
  </div>;
}

function ReviewerSelect({ users, value, onChange, label }) {
  return <label style={{ display: 'grid', gap: 4, color: COLORS.T2, fontSize: 12 }}>
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} style={{ minWidth: 190, padding: 8, border: `1px solid ${COLORS.BD}`, borderRadius: 7, color: COLORS.T1, background: COLORS.W }}>
      <option value="">Unassigned</option>
      {users.map((person) => <option key={person.id} value={person.id}>{fullName(person)}</option>)}
    </select>
  </label>;
}

export default function AdminLifecyclePanel({ currentUser }) {
  const [tab, setTab] = useState('submissions');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [data, setData] = useState({ overview: null, records: [], total: 0, roles: [], candidates: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [reasons, setReasons] = useState({});
  const [assignees, setAssignees] = useState({});
  const [roleDrafts, setRoleDrafts] = useState({});

  const roles = useMemo(() => roleNames(currentUser), [currentUser]);
  const isAdmin = roles.includes('admin') || roles.includes('super-admin');
  const isProjectReviewer = roles.includes('project-reviewer');
  const isInvestmentApprover = roles.includes('investment-approver');
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewResponse, listResponse, roleResponse, candidateResponses] = await Promise.all([
        adminOperationsAPI.getOverview(),
        tab === 'submissions'
          ? adminOperationsAPI.listProjects({ page, limit, search: search || undefined })
          : tab === 'diligence'
            ? adminOperationsAPI.listDiligence({ page, limit, search: search || undefined })
            : tab === 'users'
              ? adminOperationsAPI.listUsers({ page, limit, search: search || undefined })
              : tab === 'audit'
                ? adminOperationsAPI.listAuditHistory({ page, limit })
                : Promise.resolve({ data: { data: [], total: 0 } }),
        tab === 'users' ? adminOperationsAPI.listRoles() : Promise.resolve({ data: [] }),
        tab === 'submissions' || tab === 'diligence'
          ? Promise.all([
            adminOperationsAPI.listUsers({ page: 1, limit: 100, role: 'project-reviewer' }),
            adminOperationsAPI.listUsers({ page: 1, limit: 100, role: 'diligence-reviewer' }),
            adminOperationsAPI.listUsers({ page: 1, limit: 100, role: 'investment-approver' }),
          ])
          : Promise.resolve([]),
      ]);
      const overview = unwrap(overviewResponse);
      const list = unwrap(listResponse);
      setData({
        overview,
        records: list.data || [],
        total: list.total || 0,
        roles: Array.isArray(unwrap(roleResponse)) ? unwrap(roleResponse) : [],
        candidates: candidateResponses.flatMap((response) => unwrap(response).data || []),
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load the project lifecycle data.');
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, tab]);

  useEffect(() => { void load(); }, [load, refresh]);

  const candidatesFor = (roleNamesAllowed) => {
    const eligible = data.candidates.filter((person) => person.isActive && roleNames(person).some((role) => roleNamesAllowed.includes(role)));
    return Array.from(new Map(eligible.map((person) => [person.id, person])).values());
  };

  const reasonFor = (key) => {
    const value = reasons[key]?.trim();
    if (!value || value.length < 3) {
      setError('Enter a reason of at least 3 characters before submitting this action.');
      return null;
    }
    return value;
  };

  const perform = async (key, operation) => {
    setBusy(key);
    setError('');
    setNotice('');
    try {
      await operation();
      setNotice('Change saved.');
      setRefresh((current) => current + 1);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'The operation failed. No success was recorded.');
    } finally {
      setBusy('');
    }
  };

  const decideProject = (project, decision) => {
    const key = `project-${project.id}`;
    const reason = reasonFor(key);
    if (!reason) return;
    void perform(key, () => adminOperationsAPI.decideProject(project.id, { decision, reason }));
  };

  const assignProject = (project) => {
    const key = `project-assign-${project.id}`;
    const reason = reasonFor(key);
    if (!reason) return;
    void perform(key, () => adminOperationsAPI.assignProjectReviewer(project.id, { reviewerId: assignees[project.id] || null, reason }));
  };

  const openDiligence = (project) => {
    void perform(`open-dd-${project.id}`, () => adminOperationsAPI.createProjectDiligence(project.id, { assignedToId: assignees[project.id] || undefined }));
  };

  const assignDiligence = (item) => {
    const key = `dd-assign-${item.id}`;
    const reason = reasonFor(key);
    if (!reason) return;
    void perform(key, () => adminOperationsAPI.assignDiligenceReviewer(item.id, { reviewerId: assignees[item.id] || null, reason }));
  };

  const createApproval = (item) => {
    const approverId = assignees[`approver-${item.id}`];
    if (!approverId) {
      setError('Select an investment approver before assigning the decision.');
      return;
    }
    void perform(`approval-${item.id}`, () => adminOperationsAPI.createInvestmentApproval(item.id, { approverId }));
  };

  const decideApproval = (item, approval, decision) => {
    const key = `approval-decision-${approval.id}`;
    const reason = reasonFor(key);
    if (!reason) return;
    void perform(key, () => adminOperationsAPI.decideInvestmentApproval(item.id, approval.id, { decision, reason }));
  };

  const updateUser = (person) => {
    const key = `user-${person.id}`;
    const reason = reasonFor(key);
    if (!reason) return;
    const roleIds = roleDrafts[person.id] ?? person.roles.map((role) => role.id);
    void perform(key, () => adminOperationsAPI.updateUserAccess(person.id, { isActive: person.isActive, accountType: person.accountType, roleIds, reason }));
  };

  const metricCards = [
    ['New submissions', data.overview?.submittedProjects, `${data.overview?.unassignedSubmissions ?? 0} unassigned`],
    ['Projects in diligence', data.overview?.projectsInDiligence, `${data.overview?.activeDiligence ?? 0} active cases`],
    ['Outstanding checklist', data.overview?.outstandingChecklistItems, 'Items awaiting completion'],
    ['Pending decisions', data.overview?.pendingInvestmentDecisions, 'Investment approver queue'],
  ];

  const inputStyle = { padding: 8, border: `1px solid ${COLORS.BD}`, borderRadius: 7, color: COLORS.T1, background: COLORS.W, font: 'inherit', fontSize: 12 };
  const buttonStyle = { border: `1px solid ${COLORS.BD}`, borderRadius: 7, padding: '8px 10px', background: COLORS.W, color: COLORS.T1, font: 'inherit', fontSize: 12, cursor: 'pointer' };

  return <div style={{ marginTop: 28 }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div><div style={{ color: COLORS.P, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Persisted workflow</div><h2 style={{ margin: '5px 0', fontSize: 24 }}>Projects, diligence & decisions</h2><p style={{ margin: 0, color: COLORS.T2, fontSize: 13 }}>Operational data comes from linked project and diligence records.</p></div>
      <button type="button" style={buttonStyle} onClick={() => setRefresh((current) => current + 1)}>Refresh data</button>
    </div>
    <Notice error>{error}</Notice><Notice>{notice}</Notice>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginTop: 14 }}>
      {metricCards.map(([label, value, note]) => <article key={label} style={{ background: COLORS.W, border: `1px solid ${COLORS.BD}`, borderRadius: 10, padding: 14 }}><div style={{ color: COLORS.T2, fontSize: 11, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div><strong style={{ display: 'block', margin: '7px 0', color: COLORS.T1, fontSize: 25 }}>{value ?? (loading ? '—' : 0)}</strong><span style={{ color: COLORS.T2, fontSize: 11 }}>{note}</span></article>)}
    </div>
    <nav aria-label="Admin lifecycle sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
      {[
        ['submissions', 'Project submissions'],
        ['diligence', 'Due diligence'],
        ['users', 'Users & access'],
        ['audit', 'Audit history'],
      ].map(([key, label]) => <button key={key} type="button" onClick={() => { setTab(key); setPage(1); setNotice(''); setError(''); }} aria-pressed={tab === key} style={{ ...buttonStyle, borderColor: tab === key ? COLORS.P : COLORS.BD, background: tab === key ? COLORS.PF : COLORS.W, color: tab === key ? COLORS.P : COLORS.T1, fontWeight: 700 }}>{label}</button>)}
    </nav>
    <Panel>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <strong style={{ color: COLORS.T1 }}>{tab === 'submissions' ? 'Project pipeline intake' : tab === 'diligence' ? 'Due-diligence cases' : tab === 'users' ? 'Account access' : 'Recorded actions'}</strong>
        {tab !== 'audit' && <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(searchInput.trim()); }} style={{ display: 'flex', gap: 6 }}>
          <input aria-label="Search records" placeholder="Search records" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} style={inputStyle} />
          <button style={buttonStyle} type="submit">Search</button>
        </form>}
      </div>
      {loading && data.records.length === 0 && <p role="status" style={{ color: COLORS.T2 }}>Loading records…</p>}
      {!loading && data.records.length === 0 && <p style={{ color: COLORS.T2 }}>No matching records found.</p>}

      {tab === 'submissions' && data.records.map((project) => {
        const canDecide = isProjectReviewer && project.reviewerId === currentUser?.id && ['submitted', 'information_requested'].includes(project.status);
        const canOpenDiligence = isAdmin && project.status === 'development' && !project.diligenceCases?.length;
        return <article key={project.id} style={{ borderTop: `1px solid ${COLORS.BD}`, padding: '14px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><div><strong>{project.title}</strong><div style={{ color: COLORS.T2, fontSize: 12, marginTop: 4 }}>{fullName(project.creator)} · {project.creator?.email} · submitted {formatDate(project.createdAt)}</div></div><span style={{ alignSelf: 'flex-start', borderRadius: 99, padding: '4px 9px', background: COLORS.PF, color: COLORS.P, fontSize: 11, fontWeight: 700 }}>{project.status}</span></div>
          <p style={{ color: COLORS.T2, fontSize: 12, lineHeight: 1.5, margin: '8px 0' }}>{project.description || 'No description provided.'}</p>
          <div style={{ color: COLORS.T2, fontSize: 12 }}>Location: {project.location || 'Not provided'} · Capacity: {project.capacityKwp ?? 'Not provided'} kWp · Contact: {project.contactEmail || 'Not provided'} · Reviewer: {project.reviewer ? fullName(project.reviewer) : 'Unassigned'}</div>
          {project.diligenceCases?.map((item) => <div key={item.id} style={{ marginTop: 8, padding: 9, background: COLORS.BG, borderRadius: 7, fontSize: 12 }}>Linked diligence: {item.title} · {item.status} · {item.completionPercent}% · {item._count?.items ?? 0} checklist items · {item._count?.documents ?? 0} documents</div>)}
          {isAdmin && ['submitted', 'information_requested'].includes(project.status) && <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <ReviewerSelect label="Assign project reviewer" users={candidatesFor(['project-reviewer'])} value={assignees[project.id] ?? project.reviewerId ?? ''} onChange={(value) => setAssignees((current) => ({ ...current, [project.id]: value }))} />
            <input aria-label={`Reason for assigning ${project.title}`} placeholder="Reason for assignment" value={reasons[`project-assign-${project.id}`] || ''} onChange={(event) => setReasons((current) => ({ ...current, [`project-assign-${project.id}`]: event.target.value }))} style={inputStyle} />
            <button style={buttonStyle} disabled={busy === `project-assign-${project.id}`} onClick={() => assignProject(project)}>Save assignment</button>
          </div>}
          {canDecide && <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <input aria-label={`Reason for ${project.title}`} placeholder="Decision reason" value={reasons[`project-${project.id}`] || ''} onChange={(event) => setReasons((current) => ({ ...current, [`project-${project.id}`]: event.target.value }))} style={inputStyle} />
            <button style={buttonStyle} disabled={Boolean(busy)} onClick={() => decideProject(project, 'approve')}>Approve for development</button>
            <button style={buttonStyle} disabled={Boolean(busy)} onClick={() => decideProject(project, 'return_for_information')}>Return for information</button>
            <button style={buttonStyle} disabled={Boolean(busy)} onClick={() => decideProject(project, 'reject')}>Reject</button>
          </div>}
          {canOpenDiligence && <button type="button" style={{ ...buttonStyle, marginTop: 10 }} disabled={Boolean(busy)} onClick={() => openDiligence(project)}>Open linked diligence case</button>}
        </article>;
      })}

      {tab === 'diligence' && data.records.map((item) => <article key={item.id} style={{ borderTop: `1px solid ${COLORS.BD}`, padding: '14px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><div><strong>{item.title}</strong><div style={{ color: COLORS.T2, fontSize: 12, marginTop: 4 }}>{item.project ? `Project: ${item.project.title} · ` : 'Unlinked legacy case · '}{item.targetName}</div></div><span style={{ color: COLORS.P, fontSize: 12, fontWeight: 700 }}>{item.status} · {item.completionPercent}%</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>{(item.items || []).map((check) => <span key={check.id} title={check.title} style={{ background: check.status === 'completed' ? '#ECFDF3' : '#FFFAEB', color: check.status === 'completed' ? '#027A48' : '#B54708', borderRadius: 99, padding: '4px 8px', fontSize: 10 }}>{check.title}: {check.status}</span>)}</div>
        <div style={{ display: 'grid', gap: 5, marginTop: 8 }}>{(item.documents || []).map((document) => <div key={document.id} style={{ color: COLORS.T2, fontSize: 11 }}>Document: {document.fileName} · {document.category} · {document.status}</div>)}</div>
        <div style={{ color: COLORS.T2, fontSize: 12, marginTop: 8 }}>Assigned to: {item.assignedTo ? fullName(item.assignedTo) : 'Unassigned'}</div>
        {isAdmin && <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <ReviewerSelect label="Assign diligence owner" users={candidatesFor(['diligence-reviewer', 'investment-approver'])} value={assignees[item.id] ?? item.assignedTo?.id ?? ''} onChange={(value) => setAssignees((current) => ({ ...current, [item.id]: value }))} />
          <input aria-label={`Reason for assigning ${item.title}`} placeholder="Reason for assignment" value={reasons[`dd-assign-${item.id}`] || ''} onChange={(event) => setReasons((current) => ({ ...current, [`dd-assign-${item.id}`]: event.target.value }))} style={inputStyle} />
          <button style={buttonStyle} disabled={busy === `dd-assign-${item.id}`} onClick={() => assignDiligence(item)}>Save assignment</button>
          <ReviewerSelect label="Investment approver" users={candidatesFor(['investment-approver'])} value={assignees[`approver-${item.id}`] || ''} onChange={(value) => setAssignees((current) => ({ ...current, [`approver-${item.id}`]: value }))} />
          <button style={buttonStyle} disabled={Boolean(busy)} onClick={() => createApproval(item)}>Assign decision</button>
        </div>}
        {(item.approvals || []).map((approval) => <div key={approval.id} style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap', marginTop: 10, padding: 9, background: COLORS.BG, borderRadius: 7 }}>
          <span style={{ color: COLORS.T2, fontSize: 12 }}>Investment decision: {approval.status} · approver {approval.approver ? fullName(approval.approver) : 'unassigned'}</span>
          {isInvestmentApprover && approval.approverId === currentUser?.id && approval.status === 'pending' && <>
            <input aria-label={`Reason for investment decision ${item.title}`} placeholder="Decision reason" value={reasons[`approval-decision-${approval.id}`] || ''} onChange={(event) => setReasons((current) => ({ ...current, [`approval-decision-${approval.id}`]: event.target.value }))} style={inputStyle} />
            <button style={buttonStyle} disabled={Boolean(busy)} onClick={() => decideApproval(item, approval, 'approved')}>Approve investment</button>
            <button style={buttonStyle} disabled={Boolean(busy)} onClick={() => decideApproval(item, approval, 'return_for_information')}>Return for information</button>
            <button style={buttonStyle} disabled={Boolean(busy)} onClick={() => decideApproval(item, approval, 'rejected')}>Reject investment</button>
          </>}
        </div>)}
      </article>)}

      {tab === 'users' && data.records.map((person) => {
        const selectedRoleIds = roleDrafts[person.id] ?? person.roles.map((role) => role.id);
        return <article key={person.id} style={{ borderTop: `1px solid ${COLORS.BD}`, padding: '14px 0' }}>
          <strong>{fullName(person)}</strong><div style={{ color: COLORS.T2, fontSize: 12, marginTop: 3 }}>{person.email} · {person.accountType} · {person.isActive ? 'Active' : 'Inactive'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, margin: '10px 0' }}>{data.roles.map((role) => <label key={role.id} style={{ display: 'flex', gap: 5, alignItems: 'center', color: COLORS.T2, fontSize: 11 }}><input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={(event) => setRoleDrafts((current) => ({ ...current, [person.id]: event.target.checked ? [...selectedRoleIds, role.id] : selectedRoleIds.filter((id) => id !== role.id) }))} />{role.name}</label>)}</div>
          <div style={{ display: 'flex', alignItems: 'end', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ display: 'grid', gap: 4, color: COLORS.T2, fontSize: 11 }}>Account type<select value={person.accountType} onChange={(event) => setData((current) => ({ ...current, records: current.records.map((row) => row.id === person.id ? { ...row, accountType: event.target.value } : row) }))} style={inputStyle}><option>COMMUNITY_MEMBER</option><option>INVESTOR</option><option>FACILITY_OPERATOR</option><option>GUEST</option></select></label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', color: COLORS.T2, fontSize: 12 }}><input type="checkbox" checked={person.isActive} onChange={(event) => setData((current) => ({ ...current, records: current.records.map((row) => row.id === person.id ? { ...row, isActive: event.target.checked } : row) }))} />Active</label>
            <input aria-label={`Reason for changing ${fullName(person)}`} placeholder="Reason for access change" value={reasons[`user-${person.id}`] || ''} onChange={(event) => setReasons((current) => ({ ...current, [`user-${person.id}`]: event.target.value }))} style={inputStyle} />
            <button style={buttonStyle} disabled={busy === `user-${person.id}`} onClick={() => updateUser(person)}>Save access</button>
          </div>
        </article>;
      })}

      {tab === 'audit' && data.records.map((entry) => <article key={`${entry.recordType}-${entry.id}`} style={{ borderTop: `1px solid ${COLORS.BD}`, padding: '12px 0' }}>
        <strong>{entry.action}</strong><div style={{ color: COLORS.T2, fontSize: 12, marginTop: 4 }}>{entry.recordType} · {entry.record?.title || fullName(entry.record)} · by {fullName(entry.actor)} · {formatDate(entry.createdAt)}</div>
        {entry.reason && <div style={{ color: COLORS.T2, fontSize: 12, marginTop: 4 }}>Reason: {entry.reason}</div>}
      </article>)}
      <PageControls page={page} total={data.total} limit={limit} setPage={setPage} />
    </Panel>
  </div>;
}
