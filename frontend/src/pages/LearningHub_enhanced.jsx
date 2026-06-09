import React, { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS — Premium Color Grading Palette
═══════════════════════════════════════════════════════ */
const C = {
  pu: '#5B21B6', puf: '#EDE9FE', pul: '#7C3AED', pud: '#4C1D95',
  gr: '#16A34A', grb: '#DCFCE7', am: '#D97706', amb: '#FEF3C7',
  tl: '#0D9488', tlb: '#CCFBF1', rd: '#DC2626', rdb: '#FEF2F2',
  t1: '#111827', t2: '#6B7280', t3: '#9CA3AF',
  bd: '#E5E7EB', bg: '#F9FAFB', w: '#FFFFFF',
  
  /* Enhanced color grading */
  glass1: 'rgba(255, 255, 255, 0.7)',
  glass2: 'rgba(255, 255, 255, 0.5)',
  glass3: 'rgba(255, 255, 255, 0.3)',
  glass_dark1: 'rgba(17, 24, 39, 0.6)',
  glass_dark2: 'rgba(17, 24, 39, 0.4)',
  
  /* Gradient enhancements */
  grad_purple: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
  grad_teal: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
  grad_green: 'linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)',
  grad_amber: 'linear-gradient(135deg, #D97706 0%, #F97316 100%)',
  grad_glow: 'linear-gradient(135deg, rgba(91, 33, 182, 0.2) 0%, rgba(123, 58, 237, 0.1) 100%)',
  grad_dark: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
};

const CAT = {
  'Energy Finance': { color: '#EA580C', bg: '#FFF7ED', gradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)' },
  'Solar & Storage': { color: '#0D9488', bg: '#F0FDFA', gradient: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)' },
  'Risk & FX': { color: '#7C3AED', bg: '#F5F3FF', gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' },
  'Policy & ESG': { color: '#16A34A', bg: '#F0FDF4', gradient: 'linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)' },
};

/* ═══════════════════════════════════════════════════════
   GLASSMORPHISM UTILITIES
═══════════════════════════════════════════════════════ */
const glassMorphic = {
  card: {
    background: C.glass1,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${C.glass2}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  cardDark: {
    background: C.glass_dark1,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${C.glass_dark2}`,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  button: {
    background: C.glass2,
    backdropFilter: 'blur(8px)',
    border: `1px solid ${C.glass2}`,
  },
  surface: {
    background: 'rgba(249, 250, 251, 0.6)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${C.glass2}`,
  },
};

/* ═══════════════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════════════ */
const ICONS = {
  home: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
  book: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  play: (sz = 24, col = C.w) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill={col} stroke={col} strokeWidth={2}>
      <polygon points="5,3 19,12 5,21" />
    </svg>
  ),
  mail: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  clock: (sz = 16, col = C.t3) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  ),
  bookmark: (sz = 16, col = C.t3) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  ),
  check: (sz = 16, col = C.gr) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),
  x: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  back: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
  ),
  folder: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  refresh: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M1 4v6h6M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 03.51 15" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════════════ */
const COURSES = [
  {
    id: 1,
    category: 'Energy Finance',
    title: 'Understanding Clean Energy Ownership Structures',
    description: 'Learn the fundamentals of energy project ownership models and legal structures for African investments.',
    duration: '2h 30m',
    lessons: 7,
    level: 'Beginner',
    progress: 62,
    status: 'inProgress',
    thumbnail: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
    videoId: 'jNQXAC9IVRw',
  },
  {
    id: 2,
    category: 'Solar & Storage',
    title: 'Solar Asset Fundamentals for Non-Engineers',
    description: 'A comprehensive guide to solar technology, asset optimization, and battery storage systems.',
    duration: '1h 45m',
    lessons: 5,
    level: 'Beginner',
    progress: 100,
    status: 'completed',
    thumbnail: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
    videoId: 'dQw4w9WgXcQ',
  },
  {
    id: 3,
    category: 'Risk & FX',
    title: 'FX Risk for African Energy Investments',
    description: 'Master currency risk management and hedging strategies specific to African markets.',
    duration: '2h 15m',
    lessons: 6,
    level: 'Beginner',
    progress: 0,
    status: 'notStarted',
    thumbnail: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
    videoId: 'oUFJJNQGwhk',
  },
];

const LESSONS = [
  { id: 1, title: 'Course Introduction', duration: '5 min' },
  { id: 2, title: 'Ownership Models Overview', duration: '12 min' },
  { id: 3, title: 'SPV Structures', duration: '18 min' },
  { id: 4, title: 'Equity vs Debt', duration: '15 min' },
  { id: 5, title: 'Tax Implications', duration: '20 min' },
];

/* ═══════════════════════════════════════════════════════
   ENHANCED COURSE CARD WITH GLASSMORPHISM
═══════════════════════════════════════════════════════ */
function CourseCard({ course, onEnroll, onPlayFullscreen }) {
  const [isHovered, setIsHovered] = useState(false);
  const cat = CAT[course.category];
  const isCompleted = course.status === 'completed';
  const isInProgress = course.status === 'inProgress';
  const buttonLabel = isCompleted ? 'Review' : isInProgress ? 'Resume' : 'Start';
  const thumbnailUrl = `https://img.youtube.com/vi/${course.videoId}/maxresdefault.jpg`;

  return (
    <div
      style={{
        background: C.w,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: isHovered ? '0 20px 40px rgba(91, 33, 182, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail with overlay */}
      <div
        style={{
          height: 160,
          background: `url(${thumbnailUrl}) center/cover`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPlayFullscreen(course);
        }}
      >
        {/* Glassmorphic overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isHovered ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(2px)',
            transition: 'all 0.3s ease',
          }}
        />

        {/* Animated play button */}
        <div
          style={{
            width: 60,
            height: 60,
            background: glassMorphic.button.background,
            backdropFilter: glassMorphic.button.backdropFilter,
            border: glassMorphic.button.border,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isHovered ? '0 8px 24px rgba(91, 33, 182, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isHovered ? 'scale(1.1)' : 'scale(0.9)',
            zIndex: 2,
          }}
        >
          {ICONS.play(28, C.pu)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {/* Category Badge with glassmorphism */}
        <div
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 700,
            color: cat.color,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            background: cat.bg,
            padding: '6px 12px',
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          {course.category}
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.t1, lineHeight: 1.4 }}>
          {course.title}
        </h3>

        {/* Description */}
        <p
          style={{
            margin: '0 0 14px',
            fontSize: 13,
            color: C.t2,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {course.description}
        </p>

        {/* Meta with icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, fontSize: 12, color: C.t3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {ICONS.clock(14, C.t3)} {course.duration}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {ICONS.bookmark(14, C.t3)} {course.lessons} lessons
          </div>
        </div>

        {/* Progress Bar */}
        {course.status === 'inProgress' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 4, background: C.bg, borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${course.progress}%`,
                  background: C.grad_purple,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: C.t3, marginTop: 6 }}>{course.progress}% complete</div>
          </div>
        )}

        {isCompleted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12, color: C.gr }}>
            {ICONS.check(14, C.gr)} Completed
          </div>
        )}

        {/* Glassmorphic Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEnroll(course);
          }}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: C.pu,
            color: C.w,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: isHovered ? `0 8px 24px ${C.pu}40` : `0 2px 8px ${C.pu}20`,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {buttonLabel} →
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ENHANCED YOUTUBE PLAYER WITH SEAMLESS FALLBACK
═══════════════════════════════════════════════════════ */
function YouTubePlayer({ videoId, title, onGmailOpen }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef(null);

  const youtubeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1&iv_load_policy=3&playsinline=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: C.grad_dark }}>
      {isLoading && !hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: C.grad_dark,
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: C.t3, marginBottom: 20 }}>Loading YouTube video...</div>
            <div
              style={{
                width: 50,
                height: 50,
                border: `3px solid ${C.pu}20`,
                borderTop: `3px solid ${C.pu}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
              }}
            />
          </div>
        </div>
      )}

      {hasError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: C.grad_dark,
            zIndex: 10,
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <img
            src={thumbnailUrl}
            alt={title}
            style={{
              width: 280,
              height: 157,
              borderRadius: 12,
              objectFit: 'cover',
              marginBottom: 24,
              border: `2px solid ${C.glass2}`,
            }}
            onError={(e) => (e.target.style.display = 'none')}
          />
          <div style={{ fontSize: 18, color: C.w, fontWeight: 600, marginBottom: 12 }}>Video Unavailable</div>
          <div style={{ fontSize: 14, color: C.t3, marginBottom: 24, maxWidth: 400 }}>
            We're having trouble loading the video. You can still complete this lesson and watch it directly on YouTube.
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: C.pu,
              color: C.w,
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.target.style.background = C.pul)}
            onMouseLeave={(e) => (e.target.style.background = C.pu)}
          >
            Watch on YouTube →
          </a>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={youtubeUrl}
        title={title}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: hasError ? 'none' : 'block',
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms allow-top-navigation-by-user-activation"
        allowFullScreen={true}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIDEO PLAYER VIEW
═══════════════════════════════════════════════════════ */
function VideoPlayer({ course, onBack, onCompleted, onGmailOpen }) {
  const [currentLesson, setCurrentLesson] = useState(0);

  const handleNextLesson = () => {
    if (currentLesson < LESSONS.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      onCompleted();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 30px', background: C.w, borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: `1px solid ${C.bd}`,
              padding: 8,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.background = C.bg)}
            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
          >
            {ICONS.back(20, C.t2)}
          </button>
          <div>
            <div style={{ fontSize: 12, color: C.t3 }}>{course.category}</div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.t1 }}>{course.title}</h2>
          </div>
        </div>
        <button
          onClick={onGmailOpen}
          style={{
            background: glassMorphic.button.background,
            backdropFilter: glassMorphic.button.backdropFilter,
            border: glassMorphic.button.border,
            padding: '8px 16px',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: C.t2,
            fontSize: 13,
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.target.style.background = C.glass1)}
          onMouseLeave={(e) => (e.target.style.background = glassMorphic.button.background)}
        >
          {ICONS.mail(16, C.pu)} Gmail
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video Section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.t1 }}>
          <YouTubePlayer videoId={course.videoId} title={`${course.title} - Lesson ${currentLesson + 1}`} onGmailOpen={onGmailOpen} />

          {/* Video Info */}
          <div style={{ padding: 20, background: C.w, borderTop: `1px solid ${C.bd}` }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: C.t1 }}>
              Lesson {currentLesson + 1}: {LESSONS[currentLesson].title}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: C.t2 }}>Duration: {LESSONS[currentLesson].duration}</p>
          </div>
        </div>

        {/* Lessons Sidebar */}
        <div style={{ width: 300, background: C.w, borderLeft: `1px solid ${C.bd}`, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${C.bd}` }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.t1 }}>Course Lessons ({LESSONS.length})</h4>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: C.t3 }}>Progress: {currentLesson + 1} of {LESSONS.length}</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {LESSONS.map((lesson, idx) => (
              <div
                key={lesson.id}
                onClick={() => setCurrentLesson(idx)}
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${C.bd}`,
                  cursor: 'pointer',
                  background: idx === currentLesson ? C.puf : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: idx === currentLesson ? C.pu : C.bg,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: idx === currentLesson ? C.w : C.t2,
                  }}
                >
                  {idx < currentLesson ? ICONS.check(16, C.gr) : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: idx === currentLesson ? 600 : 500, color: C.t1 }}>{lesson.title}</div>
                  <div style={{ fontSize: 11, color: C.t3 }}>{lesson.duration}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderTop: `1px solid ${C.bd}`, background: C.bg }}>
            <button
              onClick={handleNextLesson}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: currentLesson === LESSONS.length - 1 ? C.gr : C.pu,
                color: C.w,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.02)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {currentLesson === LESSONS.length - 1 ? '✓ Complete Course' : '→ Next Lesson'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   GMAIL INTEGRATION OVERLAY
═══════════════════════════════════════════════════════ */
function GmailOverlay({ onClose }) {
  const [emails, setEmails] = useState([
    {
      id: 1,
      from: 'Tribes Capital Team',
      subject: 'Course Completion Certificate - Energy Finance',
      preview: 'Congratulations on completing...',
      time: '2h ago',
      unread: true,
    },
    {
      id: 2,
      from: 'Learning Hub',
      subject: 'New Course Available: ESG Reporting Fundamentals',
      preview: 'We have a new course available...',
      time: '1d ago',
      unread: false,
    },
  ]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      {/* Gmail Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400,
          height: '90vh',
          background: C.w,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: 16, borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.t1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {ICONS.mail(20, C.pu)} Gmail
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              fontSize: 24,
              color: C.t2,
            }}
          >
            ×
          </button>
        </div>

        {/* Email List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {emails.map((email) => (
            <div
              key={email.id}
              style={{
                padding: 16,
                borderBottom: `1px solid ${C.bd}`,
                cursor: 'pointer',
                background: email.unread ? C.puf : 'transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = email.unread ? C.puf : C.bg)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontWeight: email.unread ? 700 : 500, color: C.t1, fontSize: 13 }}>{email.from}</div>
                <div style={{ fontSize: 11, color: C.t3 }}>{email.time}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: email.unread ? 600 : 500, color: C.t1, marginBottom: 4 }}>{email.subject}</div>
              <div style={{ fontSize: 12, color: C.t3 }}>{email.preview}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: 16, borderTop: `1px solid ${C.bd}`, background: C.bg }}>
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '10px 14px',
              background: C.pu,
              color: C.w,
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.background = C.pul)}
            onMouseLeave={(e) => (e.target.style.background = C.pu)}
          >
            Open Full Gmail →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HUB VIEW — Course Grid
═══════════════════════════════════════════════════════ */
function HubView({ onEnroll, onPlayFullscreen, courses }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      {/* Header with glassmorphic background */}
      <div
        style={{
          padding: '30px',
          background: C.w,
          borderBottom: `1px solid ${C.bd}`,
          backgroundImage: C.grad_glow,
          backgroundAttachment: 'fixed',
        }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: C.t1 }}>Learning Hub</h1>
        <p style={{ margin: 0, fontSize: 14, color: C.t2 }}>Develop your expertise with curated courses on clean energy investment, finance, and policy.</p>
      </div>

      {/* Course Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 30 }}>
        {courses && courses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} onEnroll={onEnroll} onPlayFullscreen={onPlayFullscreen} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.t1 }}>🎉 All Courses Completed!</div>
            <div style={{ fontSize: 16, color: C.t2, textAlign: 'center', maxWidth: 400 }}>
              You've successfully completed all available courses. Your certificates have been sent to the Reporting Library.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen] = useState('hub');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [fullscreenCourse, setFullscreenCourse] = useState(null);
  const [showGmail, setShowGmail] = useState(false);
  const [activeCourses, setActiveCourses] = useState(COURSES);

  const handleEnroll = (course) => {
    setSelectedCourse(course);
    setScreen('player');
  };

  const handlePlayFullscreen = (course) => {
    setFullscreenCourse(course);
  };

  const handleCloseFullscreen = () => {
    setFullscreenCourse(null);
  };

  const handleCourseCompleted = () => {
    if (!selectedCourse) return;
    const updatedCourses = activeCourses.filter((c) => c.id !== selectedCourse.id);
    setActiveCourses(updatedCourses);
    setScreen('hub');
    setSelectedCourse(null);
    setTimeout(() => {
      alert('🎉 Congratulations! Course Completed!\n\nYour certificate has been sent to the Reporting Library.');
    }, 500);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: C.bg,
        fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
        fontSize: 14,
        overflow: 'hidden',
      }}
    >
      {screen === 'hub' ? (
        <HubView onEnroll={handleEnroll} onPlayFullscreen={handlePlayFullscreen} courses={activeCourses} />
      ) : (
        <VideoPlayer course={selectedCourse} onBack={() => setScreen('hub')} onCompleted={handleCourseCompleted} onGmailOpen={() => setShowGmail(true)} />
      )}

      {/* Fullscreen Video Modal */}
      {fullscreenCourse && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          {/* Close button */}
          <button
            onClick={handleCloseFullscreen}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: C.w,
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              zIndex: 10000,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.3)')}
            onMouseLeave={(e) => (e.target.style.background = 'rgba(255, 255, 255, 0.2)')}
          >
            ×
          </button>

          {/* YouTube Video Container */}
          <div style={{ width: '90vw', height: '90vh', maxWidth: '1400px', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
            <YouTubePlayer videoId={fullscreenCourse.videoId} title={fullscreenCourse.title} />
          </div>
        </div>
      )}

      {/* Gmail Overlay */}
      {showGmail && <GmailOverlay onClose={() => setShowGmail(false)} />}

      {/* Global Styles */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.bd}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.t3}; }
      `}</style>
    </div>
  );
}
