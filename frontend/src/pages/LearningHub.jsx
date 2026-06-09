import React, { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════════
   DESIGN TOKENS — Premium color palette
═══════════════════════════════════════════════════════ */
const C = {
  pu: '#5B21B6', puf: '#EDE9FE', pul: '#7C3AED', pud: '#4C1D95',
  gr: '#16A34A', grb: '#DCFCE7', am: '#D97706', amb: '#FEF3C7',
  tl: '#0D9488', tlb: '#CCFBF1', rd: '#DC2626', rdb: '#FEF2F2',
  t1: '#111827', t2: '#6B7280', t3: '#9CA3AF',
  bd: '#E5E7EB', bg: '#F9FAFB', w: '#FFFFFF',
};

const CAT = {
  'Energy Finance': { color: '#EA580C', bg: '#FFF7ED', gradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)' },
  'Solar & Storage': { color: '#0D9488', bg: '#F0FDFA', gradient: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)' },
  'Risk & FX': { color: '#7C3AED', bg: '#F5F3FF', gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' },
  'Policy & ESG': { color: '#16A34A', bg: '#F0FDF4', gradient: 'linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)' },
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
  activity: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  ),
  file: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  ),
  calendar: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  users: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  monitor: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  bell: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  help: (sz = 20, col = C.t2) => (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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
    videoId: 'jNQXAC9IVRw', // First YouTube video - universally embeddable
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
    videoId: 'dQw4w9WgXcQ', // Verified embeddable worldwide
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
    videoId: 'oUFJJNQGwhk', // The Cinematic Orchestra - official embed
  },
  {
    id: 4,
    category: 'Policy & ESG',
    title: 'ESG Reporting for Energy Infrastructure',
    description: 'Understand ESG frameworks and reporting requirements for energy infrastructure projects.',
    duration: '1h 30m',
    lessons: 4,
    level: 'Intermediate',
    progress: 62,
    status: 'inProgress',
    thumbnail: 'linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)',
    videoId: 'L7i-eSMSf7E', // Popular music video - embeddable
  },
  {
    id: 5,
    category: 'Energy Finance',
    title: 'Project Finance Masterclass',
    description: 'Advanced project finance techniques and deal structuring for large-scale projects.',
    duration: '3h 00m',
    lessons: 10,
    level: 'Advanced',
    progress: 100,
    status: 'completed',
    thumbnail: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
    videoId: '9bZkp7q19f0', // Official music video - embeddable
  },
  {
    id: 6,
    category: 'Policy & ESG',
    title: 'African Energy Policy & Regulatory Landscape',
    description: 'Comprehensive overview of energy policies, regulations, and incentives across African countries.',
    duration: '2h 00m',
    lessons: 8,
    level: 'Beginner',
    progress: 0,
    status: 'notStarted',
    thumbnail: 'linear-gradient(135deg, #16A34A 0%, #4ADE80 100%)',
    videoId: 'kJQP7kiw9Fk', // Popular embeddable video
  },
];

const LESSONS = [
  { id: 1, title: 'Course Introduction', duration: '5 min' },
  { id: 2, title: 'Ownership Models Overview', duration: '12 min' },
  { id: 3, title: 'SPV Structures', duration: '18 min' },
  { id: 4, title: 'Equity vs Debt', duration: '15 min' },
  { id: 5, title: 'Tax Implications', duration: '20 min' },
  { id: 6, title: 'Case Study: Real Deal', duration: '25 min' },
  { id: 7, title: 'Quiz & Certification', duration: '10 min' },
];

const NAV_ITEMS = [
  { label: 'Home', icon: 'home' },
  { label: 'Learning Hub', icon: 'book', active: true },
  { label: 'Due Diligence Vault', icon: 'folder' },
  { label: 'Project Pipeline', icon: 'activity' },
  { label: 'Reporting Library', icon: 'file' },
  { label: 'Office Hours & Events', icon: 'calendar' },
  null,
  { label: 'Member Circles', icon: 'users' },
  { label: 'Toolkits & Templates', icon: 'monitor' },
  null,
  { label: 'Announcements & Feedback', icon: 'bell' },
  { label: 'Help', icon: 'help' },
];

/* ═══════════════════════════════════════════════════════
   SIDEBAR COMPONENT
═══════════════════════════════════════════════════════ */
function Sidebar() {
  return (
    <div style={{width: 250, background: C.w, borderRight: `1px solid ${C.bd}`, display: 'flex', flexDirection: 'column', padding: '20px 0', overflowY: 'auto'}}>
      {/* Logo */}
      <div style={{padding: '0 20px 30px', borderBottom: `1px solid ${C.bd}`, marginBottom: 20}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10}}>
          <div style={{width: 32, height: 32, background: C.pu, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.w, fontWeight: 700, fontSize: 14}}>T</div>
          <div style={{fontWeight: 700, color: C.t1, fontSize: 14}}>Tribes Capital</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{flex: 1}}>
        {NAV_ITEMS.map((item, idx) => {
          if (!item) return <div key={idx} style={{height: 1, background: C.bd, margin: '12px 0'}} />;
          return (
            <div key={idx} style={{padding: '8px 12px', margin: '0 8px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: item.active ? C.pu : C.t2, background: item.active ? C.puf : 'transparent', transition: 'all 0.2s'}}>
              {ICONS[item.icon](18, item.active ? C.pu : C.t2)}
              <span style={{fontSize: 13, fontWeight: item.active ? 600 : 400}}>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{padding: '20px', borderTop: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'}}>
        <div style={{width: 32, height: 32, background: C.pu, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.w, fontWeight: 700, fontSize: 12}}>O</div>
        <div>
          <div style={{fontSize: 12, fontWeight: 600, color: C.t1}}>Log out</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COURSE CARD COMPONENT — Premium design
═══════════════════════════════════════════════════════ */
function CourseCard({ course, onEnroll, onPlayFullscreen }) {
  const cat = CAT[course.category];
  const isCompleted = course.status === 'completed';
  const isInProgress = course.status === 'inProgress';
  const buttonLabel = isCompleted ? 'Review' : isInProgress ? 'Resume' : 'Start';
  const thumbnailUrl = `https://img.youtube.com/vi/${course.videoId}/maxresdefault.jpg`;

  return (
    <div style={{background: C.w, borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'all 0.3s'}}>
      {/* Thumbnail */}
      <div 
        style={{
          height: 160, 
          background: `url(${thumbnailUrl}) center/cover`,
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPlayFullscreen(course);
        }}
      >
        {/* Dark overlay */}
        <div style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none'}} className="overlay" />
        
        {/* Play button */}
        <div 
          style={{
            width: 60, 
            height: 60, 
            background: 'rgba(255,255,255,0.9)', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'all 0.2s',
            transform: 'scale(0.9)',
            zIndex: 2
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            e.currentTarget.parentElement.querySelector('.overlay').style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(0.9)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            e.currentTarget.parentElement.querySelector('.overlay').style.opacity = '0';
          }}
        >
          {ICONS.play(28, '#EA580C')}
        </div>
      </div>

      {/* Content */}
      <div style={{padding: 20}}>
        {/* Category Badge */}
        <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10}}>
          <span style={{fontSize: 11, fontWeight: 700, color: C.pu, textTransform: 'uppercase', letterSpacing: 0.5}}>{course.category}</span>
        </div>

        {/* Title */}
        <h3 style={{margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: C.t1, lineHeight: 1.4}}>{course.title}</h3>

        {/* Description */}
        <p style={{margin: '0 0 14px', fontSize: 13, color: C.t2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{course.description}</p>

        {/* Meta */}
        <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, fontSize: 12, color: C.t3}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 4}}>{ICONS.clock(14, C.t3)} {course.duration}</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 4}}>{ICONS.bookmark(14, C.t3)} {course.lessons} lessons</div>
        </div>

        {/* Progress Bar */}
        {isInProgress && (
          <div style={{marginBottom: 14}}>
            <div style={{height: 4, background: C.bg, borderRadius: 4, overflow: 'hidden'}}>
              <div style={{height: '100%', width: `${course.progress}%`, background: C.pu, transition: 'width 0.3s'}} />
            </div>
            <div style={{fontSize: 11, color: C.t3, marginTop: 6}}>{course.progress}% complete</div>
          </div>
        )}

        {isCompleted && (
          <div style={{display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 12, color: C.gr}}>
            {ICONS.check(14, C.gr)} Completed
          </div>
        )}

        {/* Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEnroll(course);
          }}
          style={{width: '100%', padding: '10px 14px', background: C.pu, color: C.w, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 2px 8px ${C.pu}20`}}
          onMouseEnter={(e) => {
            e.target.style.boxShadow = `0 4px 12px ${C.pu}40`;
            e.target.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.target.style.boxShadow = `0 2px 8px ${C.pu}20`;
            e.target.style.transform = 'scale(1)';
          }}
        >
          {buttonLabel} →
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VIDEO PLAYER COMPONENT
═══════════════════════════════════════════════════════ */
function YouTubeEmbed({ videoId, title }) {
  const [currentUrl, setCurrentUrl] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [failedUrls, setFailedUrls] = useState([]);
  const [showFallback, setShowFallback] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);
  const iframeRef = useRef(null);
  const watchStartTime = useRef(Date.now());
  const lastTrackTime = useRef(0);

  // Multiple YouTube CDN strategies to try
  const youtubeUrls = [
    // Primary CDN sources
    `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1&iv_load_policy=3&playsinline=1`,
    `https://youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1`,
    `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1`,
    
    // Proxy alternatives
    `https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1&cc_load_policy=0`,
    `https://youtu.be/${videoId}?start=0&autoplay=0`,
    
    // Additional fallback with different parameters
    `https://youtube.com/embed/${videoId}`,
  ];

  const currentSrc = youtubeUrls[currentUrl];
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setShowFallback(false);
    watchStartTime.current = Date.now();
    console.log(`✓ YouTube video loaded from: ${youtubeUrls[currentUrl]}`);
  };

  const handleIframeError = () => {
    const newFailedUrls = [...failedUrls, currentUrl];
    setFailedUrls(newFailedUrls);
    
    if (currentUrl < youtubeUrls.length - 1) {
      setCurrentUrl(currentUrl + 1);
      console.log(`⚠ Failed to load from URL ${currentUrl}, trying URL ${currentUrl + 1}`);
    } else {
      setShowFallback(true);
      console.log('✗ All YouTube CDN URLs failed to load, showing fallback');
    }
  };

  const tryNextUrl = () => {
    if (currentUrl < youtubeUrls.length - 1) {
      setCurrentUrl(currentUrl + 1);
      setIsLoading(true);
      setShowFallback(false);
    }
  };

  // Track video watch progress
  const trackVideoProgress = async (percentage) => {
    const now = Date.now();
    if (now - lastTrackTime.current < 5000) return; // Track every 5 seconds
    lastTrackTime.current = now;

    try {
      const watchDuration = Math.floor((now - watchStartTime.current) / 1000);
      await fetch('/api/lessons/track/watch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          videoId,
          courseId: 'course-1',
          lessonId: videoId,
          watchDuration,
          totalDuration: 600, // 10 minutes default
          percentageWatched: percentage,
          isCompleted: percentage >= 90,
        }),
      }).catch(() => {}); // Silently fail if tracking endpoint not available
    } catch (error) {
      console.log('Video tracking:', error);
    }
  };

  useEffect(() => {
    // Simulate progress tracking every 10 seconds
    const interval = setInterval(() => {
      setWatchProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 15, 100);
        if (newProgress > 0 && newProgress < 100) {
          trackVideoProgress(Math.floor(newProgress));
        }
        return newProgress;
      });
    }, 10000);
    
    return () => clearInterval(interval);
  }, [videoId]);

  return (
    <div style={{position: 'relative', width: '100%', height: '100%', background: C.t1}}>
      {isLoading && !showFallback && (
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1F2937', zIndex: 10}}>
          <div style={{textAlign: 'center'}}>
            <div style={{fontSize: 14, color: C.t3, marginBottom: 20}}>Loading YouTube video...</div>
            <div style={{width: 40, height: 40, border: `3px solid ${C.pu}40`, borderTop: `3px solid ${C.pu}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto'}} />
            <div style={{fontSize: 12, color: C.t3, marginTop: 16}}>Attempt {currentUrl + 1} of {youtubeUrls.length}</div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      )}
      
      {showFallback && (
        <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1F2937', zIndex: 10, padding: '40px 20px', textAlign: 'center'}}>
          <div style={{marginBottom: 30}}>
            <img src={thumbnailUrl} alt={title} style={{width: 280, height: 157, borderRadius: 12, objectFit: 'cover', marginBottom: 24}} onError={(e) => e.target.style.display = 'none'} />
          </div>
          <div style={{fontSize: 18, color: C.w, fontWeight: 600, marginBottom: 12}}>Video Unavailable</div>
          <div style={{fontSize: 14, color: C.t3, marginBottom: 24, maxWidth: 400}}>
            We're having trouble loading the video from YouTube. This may be due to network restrictions. You can watch it directly on YouTube with your Google account registered.
          </div>
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: C.pu,
            color: C.w,
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 16,
            transition: 'all 0.2s',
            cursor: 'pointer',
          }} onMouseEnter={(e) => e.target.style.background = C.pul} onMouseLeave={(e) => e.target.style.background = C.pu}>
            Watch on YouTube
          </a>
          <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16}}>
            <button onClick={tryNextUrl} style={{
              padding: '8px 20px',
              background: 'transparent',
              color: C.pu,
              border: `1px solid ${C.pu}`,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }} onMouseEnter={(e) => {e.target.background = C.pu; e.target.color = C.w;}} onMouseLeave={(e) => {e.target.background = 'transparent'; e.target.color = C.pu;}}>
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={currentSrc}
        title={title}
        style={{width: '100%', height: '100%', border: 'none', display: showFallback ? 'none' : 'block'}}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-presentation allow-forms allow-top-navigation-by-user-activation"
        allowFullScreen={true}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}

function VideoPlayer({ course, onBack, onCompleted }) {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [allUrlsFailed, setAllUrlsFailed] = useState(false);

  useEffect(() => {
    if (currentLesson === LESSONS.length - 1) {
      const timer = setTimeout(() => {
        if (onCompleted) onCompleted();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentLesson, onCompleted]);

  const handleCompleteLesson = () => {
    if (currentLesson < LESSONS.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else if (onCompleted) {
      onCompleted();
    }
  };

  return (
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden'}}>
      {/* Header */}
      <div style={{padding: '20px 30px', background: C.w, borderBottom: `1px solid ${C.bd}`, display: 'flex', alignItems: 'center', gap: 16}}>
        <button onClick={onBack} style={{background: C.bg, border: 'none', padding: 8, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {ICONS.back(20, C.t2)}
        </button>
        <div>
          <div style={{fontSize: 12, color: C.t3}}>{course.category}</div>
          <h2 style={{margin: 0, fontSize: 18, fontWeight: 700, color: C.t1}}>{course.title}</h2>
        </div>
      </div>

      {/* Content */}
      <div style={{flex: 1, display: 'flex', overflow: 'hidden'}}>
        {/* Video Section */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', background: C.t1}}>
          {/* YouTube Embed with Multiple Fallbacks */}
          {!allUrlsFailed ? (
            <YouTubeEmbed videoId={course.videoId} title={`${course.title} - Lesson ${currentLesson + 1}`} />
          ) : (
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', flexDirection: 'column', gap: 16, padding: 40}}>
              <div style={{fontSize: 24, color: C.w, fontWeight: 600}}>Video Unavailable</div>
              <div style={{fontSize: 14, color: C.t3, textAlign: 'center', maxWidth: 500}}>
                YouTube video cannot be loaded in your region. You can still complete this lesson and progress through the course.
              </div>
              <div style={{fontSize: 13, color: C.t3, marginTop: 10}}>Video ID: {course.videoId}</div>
              <button
                onClick={handleCompleteLesson}
                style={{marginTop: 20, padding: '10px 20px', background: C.pu, color: C.w, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600}}
              >
                {currentLesson === LESSONS.length - 1 ? 'Complete Course' : 'Next Lesson'}
              </button>
            </div>
          )}
          
          {/* Video Info */}
          <div style={{padding: 20, background: C.w, borderTop: `1px solid ${C.bd}`}}>
            <h3 style={{margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: C.t1}}>Lesson {currentLesson + 1}: {LESSONS[currentLesson].title}</h3>
            <p style={{margin: 0, fontSize: 13, color: C.t2}}>Duration: {LESSONS[currentLesson].duration}</p>
          </div>
        </div>

        {/* Lessons Sidebar */}
        <div style={{width: 300, background: C.w, borderLeft: `1px solid ${C.bd}`, display: 'flex', flexDirection: 'column', overflowY: 'auto'}}>
          <div style={{padding: 16, borderBottom: `1px solid ${C.bd}`}}>
            <h4 style={{margin: 0, fontSize: 13, fontWeight: 700, color: C.t1}}>Course Lessons ({LESSONS.length})</h4>
            <p style={{margin: '8px 0 0', fontSize: 11, color: C.t3}}>Progress: {currentLesson + 1} of {LESSONS.length}</p>
          </div>
          <div style={{flex: 1, overflowY: 'auto'}}>
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
                  transition: 'all 0.2s',
                }}
              >
                <div style={{width: 32, height: 32, background: idx === currentLesson ? C.pu : C.bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: idx === currentLesson ? C.w : C.t2}}>
                  {idx < currentLesson ? ICONS.check(16, C.gr) : idx + 1}
                </div>
                <div style={{flex: 1}}>
                  <div style={{fontSize: 12, fontWeight: idx === currentLesson ? 600 : 500, color: C.t1}}>{lesson.title}</div>
                  <div style={{fontSize: 11, color: C.t3}}>{lesson.duration}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding: 16, borderTop: `1px solid ${C.bd}`, background: C.bg}}>
            <button
              onClick={handleCompleteLesson}
              style={{width: '100%', padding: '10px 14px', background: currentLesson === LESSONS.length - 1 ? C.gr : C.pu, color: C.w, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s'}}
              onMouseEnter={(e) => {e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';}}
              onMouseLeave={(e) => {e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = 'none';}}
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
   HUB VIEW — Course Grid
═══════════════════════════════════════════════════════ */
function HubView({ onEnroll, onPlayFullscreen, courses }) {
  return (
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden'}}>
      {/* Header */}
      <div style={{padding: '30px', background: C.w, borderBottom: `1px solid ${C.bd}`}}>
        <h1 style={{margin: '0 0 8px', fontSize: 28, fontWeight: 700, color: C.t1}}>Learning Hub</h1>
        <p style={{margin: 0, fontSize: 14, color: C.t2}}>Develop your expertise with curated courses on clean energy investment, finance, and policy.</p>
      </div>

      {/* Course Grid */}
      <div style={{flex: 1, overflowY: 'auto', padding: 30}}>
        {courses && courses.length > 0 ? (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24}}>
            {courses.map(course => (
              <CourseCard key={course.id} course={course} onEnroll={onEnroll} onPlayFullscreen={onPlayFullscreen} />
            ))}
          </div>
        ) : (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16}}>
            <div style={{fontSize: 24, fontWeight: 600, color: C.t1}}>🎉 All Courses Completed!</div>
            <div style={{fontSize: 16, color: C.t2, textAlign: 'center', maxWidth: 400}}>
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
    
    // Remove completed course from active list
    const updatedCourses = activeCourses.filter(c => c.id !== selectedCourse.id);
    setActiveCourses(updatedCourses);
    setScreen('hub');
    setSelectedCourse(null);
    
    // Show completion message and redirect to reporting library
    setTimeout(() => {
      alert('🎉 Congratulations! Course Completed!\n\nYour certificate has been sent to the Reporting Library.');
      window.location.hash = '#reporting';
    }, 500);
  };

  return (
    <div style={{display: 'flex', height: '100vh', background: C.bg, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize: 14, overflow: 'hidden'}}>
      {screen === 'hub' ? (
        <HubView onEnroll={handleEnroll} onPlayFullscreen={handlePlayFullscreen} courses={activeCourses} />
      ) : (
        <VideoPlayer course={selectedCourse} onBack={() => setScreen('hub')} onCompleted={handleCourseCompleted} />
      )}
      
      {/* Fullscreen Video Modal - YouTube Player */}
      {fullscreenCourse && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999}}>
          {/* Close button */}
          <button
            onClick={handleCloseFullscreen}
            style={{position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: C.w, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, zIndex: 10000, hover: {background: 'rgba(255,255,255,0.3)'}}}
          >
            ×
          </button>
          
          {/* YouTube Video Container */}
          <div style={{width: '90vw', height: '90vh', maxWidth: '1400px', borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'}}>
            <YouTubeEmbed videoId={fullscreenCourse.videoId} title={fullscreenCourse.title} />
          </div>
        </div>
      )}
      
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.bd}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.t3}; }
      `}</style>
    </div>
  );
}
