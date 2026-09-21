import React, { useEffect, useState } from 'react';
import { coursesAPI, lessonsAPI } from '../api/endpoints';

const C = { ink: '#172033', muted: '#64748B', line: '#E2E8F0', paper: '#FFFFFF', bg: '#F8FAFC', violet: '#5B21B6', teal: '#0F766E', red: '#B91C1C' };
const unwrap = (response) => response?.data?.data ?? response?.data ?? [];
const inputStyle = { width: '100%', boxSizing: 'border-box', border: `1px solid ${C.line}`, borderRadius: 8, padding: '10px 11px', font: 'inherit', color: C.ink, background: C.paper };

function youtubeId(value) {
  const raw = String(value || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return url.searchParams.get('v') || (url.hostname.includes('youtu.be') ? url.pathname.slice(1) : url.pathname.split('/').filter(Boolean).pop()) || '';
  } catch { return ''; }
}

export default function AdminLearningHub({ isMobile = false }) {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [course, setCourse] = useState({ title: '', description: '', categoryId: 'general', difficulty: 'beginner', isPublished: true });
  const [lesson, setLesson] = useState({ title: '', description: '', youtube: '' });
  const [lessons, setLessons] = useState([]);
  const [state, setState] = useState({ busy: false, notice: '', error: '' });

  const loadCourses = async () => {
    try { const response = await coursesAPI.list({ skip: 0, take: 100 }); const items = unwrap(response); setCourses(Array.isArray(items) ? items : []); }
    catch (error) { setState({ busy: false, notice: '', error: error?.response?.data?.message || 'Unable to load courses.' }); }
  };
  useEffect(() => { void loadCourses(); }, []);
  useEffect(() => { if (!selectedCourse) { setLessons([]); return; } lessonsAPI.getByCourse(selectedCourse).then((response) => { const items = unwrap(response); setLessons(Array.isArray(items) ? items : []); }).catch(() => setLessons([])); }, [selectedCourse]);

  const createCourse = async (event) => {
    event.preventDefault(); setState({ busy: true, notice: '', error: '' });
    try { const response = await coursesAPI.create(course); const created = unwrap(response); await loadCourses(); setSelectedCourse(created.id); setCourse({ title: '', description: '', categoryId: 'general', difficulty: 'beginner', isPublished: true }); setState({ busy: false, notice: 'Course created. Add a YouTube lesson below.', error: '' }); }
    catch (error) { setState({ busy: false, notice: '', error: error?.response?.data?.message || 'Unable to create the course.' }); }
  };
  const addLesson = async (event) => {
    event.preventDefault(); const id = youtubeId(lesson.youtube);
    if (!selectedCourse || !id) { setState({ busy: false, notice: '', error: 'Choose a course and provide a valid YouTube URL or video ID.' }); return; }
    setState({ busy: true, notice: '', error: '' });
    try { await lessonsAPI.create(selectedCourse, { title: lesson.title, description: lesson.description, videoUrl: `https://www.youtube.com/watch?v=${id}` }); const response = await lessonsAPI.getByCourse(selectedCourse); const items = unwrap(response); setLessons(Array.isArray(items) ? items : []); setLesson({ title: '', description: '', youtube: '' }); setState({ busy: false, notice: 'YouTube lesson added to the Learning Hub.', error: '' }); }
    catch (error) { setState({ busy: false, notice: '', error: error?.response?.data?.message || 'Unable to add the lesson.' }); }
  };

  return <main style={{ minHeight: '100%', overflowY: 'auto', background: C.bg, color: C.ink, padding: isMobile ? 16 : 30, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}><div style={{ maxWidth: 1180, margin: '0 auto' }}>
    <header style={{ marginBottom: 24 }}><div style={{ color: C.violet, fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 8 }}>Admin Learning Hub</div><h1 style={{ margin: 0, fontSize: isMobile ? 26 : 36, letterSpacing: '-.04em' }}>Publish useful learning</h1><p style={{ color: C.muted, lineHeight: 1.6, maxWidth: 650 }}>Create a course, paste a YouTube link or video ID, and publish lessons for members.</p></header>
    {state.error && <div role="alert" style={{ marginBottom: 14, padding: 11, borderRadius: 8, background: '#FEF2F2', color: C.red, border: '1px solid #FECACA', fontSize: 13 }}>{state.error}</div>}{state.notice && <div role="status" style={{ marginBottom: 14, padding: 11, borderRadius: 8, background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', fontSize: 13 }}>{state.notice}</div>}
    <section style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(280px,.8fr) minmax(0,1.2fr)', gap: 16, alignItems: 'start' }}>
      <form onSubmit={createCourse} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}><h2 style={{ margin: '0 0 5px', fontSize: 18 }}>New course</h2><p style={{ color: C.muted, fontSize: 12, margin: '0 0 16px' }}>Start a container for your videos.</p><label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Course title<input required value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} style={inputStyle} /></label><label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700 }}>Description<textarea required rows={5} value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} /></label><button disabled={state.busy} style={{ width: '100%', marginTop: 18, border: 0, borderRadius: 8, background: C.violet, color: '#fff', padding: '11px 14px', fontWeight: 700, cursor: 'pointer' }}>{state.busy ? 'Saving...' : 'Create published course'}</button></form>
      <div style={{ display: 'grid', gap: 16 }}><form onSubmit={addLesson} style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}><h2 style={{ margin: '0 0 5px', fontSize: 18 }}>Add YouTube lesson</h2><p style={{ color: C.muted, fontSize: 12, margin: '0 0 16px' }}>Paste a full YouTube URL or the 11-character video ID.</p><label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Course<select required value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} style={inputStyle}><option value="">Choose a course</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Lesson title<input required value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} style={inputStyle} /></label><label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 700 }}>YouTube URL or ID<input required placeholder="https://youtube.com/watch?v=..." value={lesson.youtube} onChange={(e) => setLesson({ ...lesson, youtube: e.target.value })} style={inputStyle} /></label><button disabled={state.busy} style={{ marginTop: 18, border: 0, borderRadius: 8, background: C.teal, color: '#fff', padding: '11px 14px', fontWeight: 700, cursor: 'pointer' }}>{state.busy ? 'Saving...' : 'Add lesson'}</button></form><div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 20 }}><h2 style={{ margin: '0 0 12px', fontSize: 18 }}>Current lessons</h2>{lessons.length ? lessons.map((item) => <div key={item.id} style={{ padding: '10px 0', borderBottom: `1px solid ${C.line}` }}><strong style={{ fontSize: 13 }}>{item.title}</strong><div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{item.videoUrl || 'No video URL'}</div></div>) : <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>Select a course to inspect its lessons.</p>}</div></div>
    </section></div></main>;
}
