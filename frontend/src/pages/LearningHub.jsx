import { useState, useEffect, useCallback, useRef } from 'react';

/* ═══════════════════════════════════════════════════════
   PREMIUM DESIGN TOKENS
═══════════════════════════════════════════════════════ */
const TOKENS = {
  // Primary colors
  PU: '#5B21B6',      // Purple
  PUF: '#EDE9FE',     // Purple fade
  PUL: '#7C3AED',     // Purple light
  PUD: '#4C1D95',     // Purple dark
  
  // Secondary colors
  GR: '#16A34A',      // Green
  GRB: '#DCFCE7',     // Green bg
  AM: '#D97706',      // Amber
  AMB: '#FEF3C7',     // Amber bg
  TL: '#0D9488',      // Teal
  TLB: '#CCFBF1',     // Teal bg
  
  // Text colors
  T1: '#111827',      // Text primary
  T2: '#6B7280',      // Text secondary
  T3: '#9CA3AF',      // Text tertiary
  
  // UI colors
  BD: '#E5E7EB',      // Border
  BG: '#F9FAFB',      // Background
  W: '#FFFFFF',       // White
};

// Category colors mapping
const CAT_COLORS = {
  'Energy Finance': { c: '#EA580C', b: '#FFF7ED', dark: '#92400E' },
  'Solar & Storage': { c: '#0D9488', b: '#F0FDFA', dark: '#134E4A' },
  'Risk & FX': { c: '#7C3AED', b: '#F5F3FF', dark: '#5B21B6' },
  'Policy & ESG': { c: '#16A34A', b: '#F0FDF4', dark: '#15803D' },
  'Financial Planning': { c: '#2563EB', b: '#EFF6FF', dark: '#1E40AF' },
  'Project Management': { c: '#DC2626', b: '#FEE2E2', dark: '#991B1B' },
  'Risk Management': { c: '#9333EA', b: '#F3E8FF', dark: '#6B21A8' },
  'Technology': { c: '#0891B2', b: '#ECFDF5', dark: '#0E7490' },
  'Transportation': { c: '#EA580C', b: '#FFEDD5', dark: '#92400E' },
  'Energy Resources': { c: '#15803D', b: '#F0FDF4', dark: '#166534' },
  'Emerging Tech': { c: '#7C3AED', b: '#F5F3FF', dark: '#5B21B6' },
};

/* ═══════════════════════════════════════════════════════
   COMPREHENSIVE COURSES DATA
═══════════════════════════════════════════════════════ */
const COURSES_DATA = [
  {
    id: 1,
    title: 'Understanding Clean Energy Ownership Structures',
    category: 'Energy Finance',
    description: 'Learn how C&I solar assets are owned, financed, and structured across emerging markets in plain English.',
    duration: '3h 20m',
    level: 'Beginner',
    enrollment: 234,
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'Introduction to energy ownership', duration: '18 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Types of project structures', duration: '22 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'SPV and holding companies', duration: '30 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Legal frameworks explained', duration: '28 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Tax equity structures', duration: '28 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Revenue sharing models', duration: '28 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Exit strategies & liquidity', duration: '28 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 2,
    title: 'Solar Asset Fundamentals for Non-Engineers',
    category: 'Solar & Storage',
    description: 'Demystify solar panel technology, battery systems, and grid integration without needing an engineering background.',
    duration: '3h 20m',
    level: 'Beginner',
    enrollment: 189,
    thumbnail: 'https://images.unsplash.com/photo-1559163853-cd4628902d4a?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'Solar technology basics', duration: '20 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Panel performance metrics', duration: '25 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Battery storage systems', duration: '28 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Grid integration', duration: '22 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Efficiency & losses', duration: '25 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Maintenance & operations', duration: '20 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Cost analysis & ROI', duration: '23 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 3,
    title: 'FX Risk for African Energy Investments',
    category: 'Risk & FX',
    description: 'Understand how foreign exchange volatility affects returns on African infrastructure.',
    duration: '3h 20m',
    level: 'Beginner',
    enrollment: 156,
    thumbnail: 'https://images.unsplash.com/photo-1611974784278-430578653e83?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'FX market fundamentals', duration: '24 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'African currency dynamics', duration: '26 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Hedging strategies', duration: '30 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Risk measurement tools', duration: '22 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Scenario analysis', duration: '25 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Investment case studies', duration: '27 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Portfolio optimization', duration: '26 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 4,
    title: 'ESG Reporting for Energy Infrastructure',
    category: 'Policy & ESG',
    description: 'Navigate ESG frameworks GRI, TCFD, and SFDR and understand what investors and regulators require.',
    duration: '3h 20m',
    level: 'Intermediate',
    enrollment: 312,
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'ESG frameworks overview', duration: '21 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'GRI standards', duration: '23 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'TCFD climate reporting', duration: '26 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'SFDR sustainable finance', duration: '25 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Social impact measurement', duration: '24 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Investor expectations', duration: '22 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Reporting best practices', duration: '23 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 5,
    title: 'Project Finance Masterclass',
    category: 'Energy Finance',
    description: 'A comprehensive course on how large-scale energy projects are financed from term sheets to financial close.',
    duration: '4h 30m',
    level: 'Advanced',
    enrollment: 245,
    thumbnail: 'https://images.unsplash.com/photo-1554224311-beee415c15c7?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'Project finance fundamentals', duration: '28 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Deal structuring', duration: '32 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Term sheets & negotiations', duration: '30 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Debt & equity arrangements', duration: '29 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Financial modeling', duration: '35 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Risk allocation frameworks', duration: '28 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'From closing to operations', duration: '26 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 6,
    title: 'African Energy Policy & Regulatory Landscape',
    category: 'Policy & ESG',
    description: 'Map the regulatory environment across key African markets: Nigeria, Ghana, Kenya, and South Africa.',
    duration: '3h 45m',
    level: 'Intermediate',
    enrollment: 267,
    thumbnail: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'African energy overview', duration: '20 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Nigeria regulatory framework', duration: '24 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Ghana energy market', duration: '22 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Kenya renewable policies', duration: '23 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'South Africa transition', duration: '25 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Investment incentives', duration: '21 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Future energy trends', duration: '22 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 7,
    title: 'Energy Storage & Battery Technologies',
    category: 'Technology',
    description: 'Comprehensive overview of battery technologies and grid-scale energy storage systems.',
    duration: '3h 30m',
    level: 'Advanced',
    enrollment: 198,
    thumbnail: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'Battery chemistry basics', duration: '26 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Li-ion technology deep dive', duration: '28 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Alternative battery types', duration: '24 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Grid storage systems', duration: '27 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Safety & thermal management', duration: '25 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Performance optimization', duration: '23 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Cost trajectory & scaling', duration: '21 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 8,
    title: 'Electric Vehicles & Charging Infrastructure',
    category: 'Transportation',
    description: 'Explore EV market dynamics, charging networks, and investment opportunities in electric vehicles.',
    duration: '2h 40m',
    level: 'Beginner',
    enrollment: 401,
    thumbnail: 'https://images.unsplash.com/photo-1560958089-b8a63019b29a?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'EV market overview', duration: '18 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Vehicle technology trends', duration: '22 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Charging infrastructure', duration: '25 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Grid integration challenges', duration: '20 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Financial models & ROI', duration: '23 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Investment opportunities', duration: '19 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Future of mobility', duration: '18 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 9,
    title: 'Smart Grid & Energy Management Systems',
    category: 'Technology',
    description: 'Master smart grid technologies, IoT solutions, and AI-driven energy management.',
    duration: '3h 50m',
    level: 'Advanced',
    enrollment: 189,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'Smart grid fundamentals', duration: '26 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'IoT sensors & data', duration: '28 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Real-time monitoring', duration: '24 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'AI & machine learning', duration: '29 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Demand forecasting', duration: '25 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Distribution optimization', duration: '27 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Cybersecurity in grids', duration: '25 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 10,
    title: 'Water & Hydroelectric Power',
    category: 'Energy Resources',
    description: 'Deep dive into hydroelectric power, water management, and sustainable water resource investing.',
    duration: '2h 55m',
    level: 'Intermediate',
    enrollment: 145,
    thumbnail: 'https://images.unsplash.com/photo-1497435334941-0fa4b418baa0?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'Hydroelectric systems', duration: '22 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Water resource management', duration: '24 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Environmental impact', duration: '20 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Turbine & generator technology', duration: '23 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Power output optimization', duration: '21 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Climate adaptation', duration: '19 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Investment opportunities', duration: '20 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
  {
    id: 11,
    title: 'Geothermal & Alternative Energy Sources',
    category: 'Emerging Tech',
    description: 'Explore emerging renewable technologies including geothermal, tidal, and wave energy.',
    duration: '3h 25m',
    level: 'Advanced',
    enrollment: 98,
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=400&fit=crop',
    lessons: [
      { id: 1, title: 'Geothermal fundamentals', duration: '25 min', videoId: 'jNgP6d9HraI' },
      { id: 2, title: 'Tidal & wave power', duration: '27 min', videoId: '9bZkp7q19f0' },
      { id: 3, title: 'Biomass & biogas', duration: '23 min', videoId: 'Z0H8DhLcLbg' },
      { id: 4, title: 'Hydrogen economy', duration: '26 min', videoId: 'dQw4w9WgXcQ' },
      { id: 5, title: 'Emerging tech trends', duration: '24 min', videoId: 'jNgP6d9HraI' },
      { id: 6, title: 'Scalability analysis', duration: '22 min', videoId: '9bZkp7q19f0' },
      { id: 7, title: 'Future commercialization', duration: '24 min', videoId: 'Z0H8DhLcLbg' },
    ]
  },
];

/* ═══════════════════════════════════════════════════════
   ICON COMPONENT
═══════════════════════════════════════════════════════ */
const SVG_ICONS = {
  play: <path d="M5,3 L19,12 L5,21 Z" fill="currentColor" />,
  check: <polyline points="20,6 9,17 4,12" strokeWidth="2" strokeLinecap="round" />,
  bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeWidth="1.5" />,
  clock: <><circle cx="12" cy="12" r="10" strokeWidth="1.5" /><polyline points="12,6 12,12 16,14" /></>,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.5" /><circle cx="9" cy="7" r="4" strokeWidth="1.5" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="1.5" /></>,
  share: <><circle cx="18" cy="5" r="3" strokeWidth="1.5" /><circle cx="6" cy="12" r="3" strokeWidth="1.5" /><circle cx="18" cy="19" r="3" strokeWidth="1.5" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeWidth="1.5" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeWidth="1.5" /></>,
  star: <polygon points="12,2 15.09,10.26 24,10.26 17.55,16.52 19.64,24.78 12,18.52 4.36,24.78 6.45,16.52 0,10.26 8.91,10.26" strokeWidth="1.5" />,
  award: <><circle cx="12" cy="8" r="7" strokeWidth="1.5" /><polyline points="8.21,13.89 7,23 12 20 17 23 15.79,13.88" strokeWidth="1.5" /><line x1="9" y1="5" x2="10" y2="1" strokeWidth="1.5" /><line x1="15" y1="5" x2="14" y2="1" strokeWidth="1.5" /></>,
  zap: <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeWidth="1.5" />,
};

function Icon({ name, size = 16, color = TOKENS.T2, fill = 'none', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} 
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {SVG_ICONS[name]}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   PROGRESS TRACKING SERVICE
═══════════════════════════════════════════════════════ */
class ProgressTracker {
  constructor() {
    this.storageKey = 'tribes_learning_progress';
    this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      this.data = saved ? JSON.parse(saved) : this.initializeData();
    } catch {
      this.data = this.initializeData();
    }
  }

  initializeData() {
    return {
      userId: `user_${Date.now()}`,
      courses: {},
      totalLessonTime: 0,
      startDate: new Date().toISOString(),
      achievements: [],
      bookmarks: [],
    };
  }

  saveProgress() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }

  initializeCourse(courseId, totalLessons) {
    if (!this.data.courses[courseId]) {
      this.data.courses[courseId] = {
        id: courseId,
        startDate: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        lessons: {},
        completedLessons: 0,
        totalLessons: totalLessons,
        progress: 0,
        timeSpent: 0,
        status: 'in_progress',
      };
      this.saveProgress();
    }
  }

  completeLesson(courseId, lessonId, duration) {
    this.initializeCourse(courseId, 7); // Default
    const course = this.data.courses[courseId];
    
    if (!course.lessons[lessonId]) {
      course.lessons[lessonId] = {
        id: lessonId,
        completed: true,
        completedAt: new Date().toISOString(),
        duration: duration,
      };
      course.completedLessons += 1;
      course.progress = Math.round((course.completedLessons / course.totalLessons) * 100);
      course.lastAccessed = new Date().toISOString();
      this.data.totalLessonTime += duration;
      
      this.checkAchievements(courseId);
      this.saveProgress();
      
      return true;
    }
    return false;
  }

  addBookmark(courseId) {
    if (!this.data.bookmarks.includes(courseId)) {
      this.data.bookmarks.push(courseId);
      this.saveProgress();
      return true;
    }
    return false;
  }

  removeBookmark(courseId) {
    const idx = this.data.bookmarks.indexOf(courseId);
    if (idx > -1) {
      this.data.bookmarks.splice(idx, 1);
      this.saveProgress();
      return true;
    }
    return false;
  }

  isBookmarked(courseId) {
    return this.data.bookmarks.includes(courseId);
  }

  checkAchievements(courseId) {
    const course = this.data.courses[courseId];
    
    // First lesson completion
    if (course.completedLessons === 1 && !this.data.achievements.includes('first_step')) {
      this.data.achievements.push('first_step');
    }
    
    // Course completion
    if (course.progress === 100 && !this.data.achievements.includes(`course_${courseId}`)) {
      this.data.achievements.push(`course_${courseId}`);
    }
    
    // Multiple courses
    const completedCourses = Object.values(this.data.courses).filter(c => c.progress === 100).length;
    if (completedCourses >= 3 && !this.data.achievements.includes('triple_master')) {
      this.data.achievements.push('triple_master');
    }
  }

  getStats() {
    const courses = Object.values(this.data.courses);
    const completedCourses = courses.filter(c => c.progress === 100).length;
    const inProgressCourses = courses.filter(c => c.progress > 0 && c.progress < 100).length;
    const avgProgress = courses.length > 0 
      ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
      : 0;

    return {
      totalCourses: courses.length,
      completedCourses,
      inProgressCourses,
      avgProgress,
      totalLessonTime: this.data.totalLessonTime,
      achievements: this.data.achievements,
    };
  }

  getCourseProgress(courseId) {
    return this.data.courses[courseId] || null;
  }

  getAllProgress() {
    return this.data.courses;
  }
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
function LearningHub() {
  // State management
  const [courses] = useState(COURSES_DATA);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [activeView, setActiveView] = useState('hub'); // 'hub' | 'player'
  const [courseProgress, setCourseProgress] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [stats, setStats] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('progress');
  const [searchQuery, setSearchQuery] = useState('');
  
  const trackerRef = useRef(new ProgressTracker());

  // Initialize progress tracking
  useEffect(() => {
    const tracker = trackerRef.current;
    
    // Initialize all courses
    courses.forEach(course => {
      tracker.initializeCourse(course.id, course.lessons.length);
    });

    // Load all progress
    const allProgress = tracker.getAllProgress();
    const progressMap = {};
    Object.entries(allProgress).forEach(([courseId, data]) => {
      progressMap[courseId] = data.progress;
    });
    
    setCourseProgress(progressMap);
    setBookmarks(tracker.data.bookmarks);
    setStats(tracker.getStats());
  }, [courses]);

  // Handle lesson completion
  const handleLessonComplete = useCallback((lessonId) => {
    if (!selectedCourse || !selectedLesson) return;

    const tracker = trackerRef.current;
    const durationInSeconds = parseInt(selectedLesson.duration.match(/\d+/)[0]) * 60; // Convert to seconds
    
    tracker.completeLesson(selectedCourse.id, lessonId, durationInSeconds);
    
    // Update local state
    const progress = tracker.getCourseProgress(selectedCourse.id);
    setCourseProgress(prev => ({
      ...prev,
      [selectedCourse.id]: progress.progress
    }));

    setStats(tracker.getStats());

    // Move to next lesson
    const currentIdx = selectedCourse.lessons.findIndex(l => l.id === lessonId);
    if (currentIdx < selectedCourse.lessons.length - 1) {
      const nextLesson = selectedCourse.lessons[currentIdx + 1];
      setSelectedLesson(nextLesson);
    }
  }, [selectedCourse, selectedLesson]);

  // Handle bookmark toggle
  const handleToggleBookmark = useCallback((courseId) => {
    const tracker = trackerRef.current;
    const isBookmarked = bookmarks.includes(courseId);
    
    if (isBookmarked) {
      tracker.removeBookmark(courseId);
    } else {
      tracker.addBookmark(courseId);
    }
    
    setBookmarks(tracker.data.bookmarks);
  }, [bookmarks]);

  // Filter and sort courses
  const filteredCourses = courses.filter(course => {
    const matchesCategory = filterCategory === 'All' || course.category === filterCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'progress':
        return (courseProgress[b.id] || 0) - (courseProgress[a.id] || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'enrollment':
        return b.enrollment - a.enrollment;
      default:
        return 0;
    }
  });

  const categories = ['All', ...new Set(courses.map(c => c.category))];

  // Resume course
  const resumeCourse = courses.find(c => 
    courseProgress[c.id] && courseProgress[c.id] > 0 && courseProgress[c.id] < 100
  );

  return (
    <div style={{ background: TOKENS.BG, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        * { box-sizing: border-box; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: rgba(124, 58, 237, 0.3); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {activeView === 'hub' ? (
        // HUB VIEW
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '40px', animation: 'fadeInDown 0.6s ease' }}>
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: TOKENS.T1, margin: '0 0 8px', letterSpacing: '-1px' }}>
              Learning Hub
            </h1>
            <p style={{ fontSize: '16px', color: TOKENS.T2, margin: 0, maxWidth: '600px' }}>
              Expand your knowledge on energy infrastructure, finance, policy, and investment strategies across emerging markets.
            </p>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '40px',
              animation: 'fadeInUp 0.6s ease 0.1s backwards'
            }}>
              {[
                { label: 'Total Courses', value: stats.totalCourses, icon: 'award', color: TOKENS.PUL },
                { label: 'Completed', value: stats.completedCourses, icon: 'check', color: TOKENS.GR },
                { label: 'In Progress', value: stats.inProgressCourses, icon: 'zap', color: TOKENS.AM },
                { label: 'Avg Progress', value: `${stats.avgProgress}%`, icon: 'star', color: TOKENS.TL },
              ].map((stat, idx) => (
                <div key={idx} style={{
                  background: TOKENS.W,
                  border: `1.5px solid ${TOKENS.BD}`,
                  borderRadius: '12px',
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.06)';
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: `${stat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon name={stat.icon} size={24} color={stat.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: TOKENS.T1, lineHeight: 1 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '12px', color: TOKENS.T3, marginTop: '4px', fontWeight: 600 }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resume Block */}
          {resumeCourse && (
            <div style={{
              background: `linear-gradient(135deg, ${CAT_COLORS[resumeCourse.category]?.c}15, ${CAT_COLORS[resumeCourse.category]?.c}08)`,
              border: `1.5px solid ${CAT_COLORS[resumeCourse.category]?.c}30`,
              borderRadius: '14px',
              padding: '24px 28px',
              marginBottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              animation: 'slideInRight 0.6s ease 0.2s backwards'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: `${CAT_COLORS[resumeCourse.category]?.c}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: `2px solid ${CAT_COLORS[resumeCourse.category]?.c}40`
              }}>
                <Icon name="play" size={28} color={CAT_COLORS[resumeCourse.category]?.c} fill={CAT_COLORS[resumeCourse.category]?.c} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: CAT_COLORS[resumeCourse.category]?.c, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Continue Learning
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: TOKENS.T1, marginBottom: '8px' }}>
                  {resumeCourse.title}
                </div>
                <div style={{ fontSize: '13px', color: TOKENS.T2 }}>
                  {courseProgress[resumeCourse.id]}% complete · Module {resumeCourse.lessons.length} lessons
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCourse(resumeCourse);
                  setSelectedLesson(resumeCourse.lessons[0]);
                  setActiveView('player');
                }}
                style={{
                  background: `linear-gradient(135deg, ${CAT_COLORS[resumeCourse.category]?.c}, ${CAT_COLORS[resumeCourse.category]?.dark})`,
                  color: TOKENS.W,
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 8px 20px ${CAT_COLORS[resumeCourse.category]?.c}40`
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 12px 28px ${CAT_COLORS[resumeCourse.category]?.c}50`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 8px 20px ${CAT_COLORS[resumeCourse.category]?.c}40`;
                }}
              >
                Resume Course
              </button>
            </div>
          )}

          {/* Filters & Search */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '32px',
            flexWrap: 'wrap',
            alignItems: 'center',
            animation: 'fadeInUp 0.6s ease 0.3s backwards'
          }}>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: '240px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1.5px solid ${TOKENS.BD}`,
                fontSize: '14px',
                background: TOKENS.W,
                color: TOKENS.T1,
                transition: 'all 0.3s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = TOKENS.PUL;
                e.target.style.boxShadow = `0 0 0 3px ${TOKENS.PUF}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = TOKENS.BD;
                e.target.style.boxShadow = 'none';
              }}
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: filterCategory === cat ? 'none' : `1.5px solid ${TOKENS.BD}`,
                    background: filterCategory === cat 
                      ? `linear-gradient(135deg, ${TOKENS.PUL}, ${TOKENS.PU})`
                      : TOKENS.W,
                    color: filterCategory === cat ? TOKENS.W : TOKENS.T2,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (filterCategory !== cat) {
                      e.target.style.background = TOKENS.BG;
                      e.target.style.borderColor = TOKENS.PUL;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filterCategory !== cat) {
                      e.target.style.background = TOKENS.W;
                      e.target.style.borderColor = TOKENS.BD;
                    }
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1.5px solid ${TOKENS.BD}`,
                background: TOKENS.W,
                color: TOKENS.T1,
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <option value="progress">By Progress</option>
              <option value="title">By Title (A-Z)</option>
              <option value="enrollment">Most Popular</option>
            </select>
          </div>

          {/* Courses Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
            animation: 'fadeInUp 0.6s ease 0.4s backwards'
          }}>
            {filteredCourses.map((course, idx) => {
              const colors = CAT_COLORS[course.category] || CAT_COLORS['Energy Finance'];
              const isBookmarked = bookmarks.includes(course.id);
              const progress = courseProgress[course.id] || 0;

              return (
                <div
                  key={course.id}
                  style={{
                    background: TOKENS.W,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: `1.5px solid ${TOKENS.BD}`,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.06)',
                    animation: `fadeInUp 0.6s ease ${0.4 + idx * 0.05}s backwards`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(124, 58, 237, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.06)';
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{
                    position: 'relative',
                    height: '200px',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #e5e7eb, #f3f4f6)'
                  }}>
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease'
                      }}
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect fill='%23e5e7eb' width='600' height='400'/%3E%3C/svg%3E`;
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3))'
                    }} />
                    
                    {/* Category badge */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: colors.c,
                      color: TOKENS.W,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                      {course.level}
                    </div>

                    {/* Bookmark button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmark(course.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isBookmarked 
                          ? `linear-gradient(135deg, ${TOKENS.AM}, ${TOKENS.AM}cc)`
                          : 'rgba(255,255,255,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <Icon 
                        name="bookmark" 
                        size={20} 
                        color={isBookmarked ? TOKENS.W : TOKENS.AM}
                        fill={isBookmarked ? TOKENS.AM : 'none'}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                    {/* Category tag */}
                    <div style={{
                      display: 'inline-block',
                      background: colors.b,
                      color: colors.c,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      width: 'fit-content',
                      border: `1px solid ${colors.c}30`
                    }}>
                      {course.category}
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: TOKENS.T1,
                      margin: 0,
                      lineHeight: '1.3',
                      letterSpacing: '-0.3px'
                    }}>
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p style={{
                      fontSize: '13px',
                      color: TOKENS.T2,
                      margin: 0,
                      lineHeight: '1.6',
                      flex: 1
                    }}>
                      {course.description}
                    </p>

                    {/* Meta */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      fontSize: '12px',
                      color: TOKENS.T3,
                      paddingTop: '12px',
                      borderTop: `1px solid ${TOKENS.BD}`,
                      flexWrap: 'wrap'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="clock" size={14} color={TOKENS.T3} />
                        {course.duration}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="users" size={14} color={TOKENS.T3} />
                        {course.lessons.length} lessons
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="users" size={14} color={TOKENS.T3} />
                        {course.enrollment} enrolled
                      </span>
                    </div>

                    {/* Progress */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${TOKENS.BD}`
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          height: '6px',
                          background: `${colors.c}15`,
                          borderRadius: '3px',
                          overflow: 'hidden',
                          border: `1px solid ${colors.c}30`
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: colors.c,
                            borderRadius: '2px',
                            transition: 'width 0.4s ease',
                            boxShadow: `0 0 8px ${colors.c}60`
                          }} />
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: colors.c,
                        minWidth: '40px',
                        textAlign: 'right'
                      }}>
                        {progress}%
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setSelectedLesson(course.lessons[0]);
                        setActiveView('player');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: progress === 100 
                          ? `${colors.c}15`
                          : `linear-gradient(135deg, ${colors.c}, ${colors.dark})`,
                        color: progress === 100 ? colors.c : TOKENS.W,
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        marginTop: 'auto',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: progress === 100 ? 'none' : `0 8px 20px ${colors.c}40`
                      }}
                      onMouseEnter={(e) => {
                        if (progress !== 100) {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = `0 12px 28px ${colors.c}50`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (progress !== 100) {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = `0 8px 20px ${colors.c}40`;
                        }
                      }}
                    >
                      {progress === 100 ? '✓ Completed' : progress > 0 ? 'Continue' : 'Start Course'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // PLAYER VIEW
        <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
          <button
            onClick={() => {
              setActiveView('hub');
              setSelectedCourse(null);
              setSelectedLesson(null);
            }}
            style={{
              marginBottom: '20px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: `1.5px solid ${TOKENS.BD}`,
              background: TOKENS.W,
              color: TOKENS.PUL,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = TOKENS.BG;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = TOKENS.W;
            }}
          >
            ← Back to Courses
          </button>

          {selectedCourse && selectedLesson && (
            <div style={{ animation: 'fadeInUp 0.6s ease' }}>
              {/* Video Player */}
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                height: 0,
                overflow: 'hidden',
                borderRadius: '16px',
                marginBottom: '32px',
                boxShadow: '0 20px 40px rgba(124, 58, 237, 0.15)',
                border: `1px solid rgba(124, 58, 237, 0.2)`
              }}>
                <iframe
                  src={`https://www.youtube.com/embed/${selectedLesson.videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&fs=1`}
                  title={selectedLesson.title}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Course Info Bar */}
              <div style={{
                background: TOKENS.W,
                border: `1.5px solid ${TOKENS.BD}`,
                borderRadius: '12px',
                padding: '20px 24px',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.06)'
              }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: TOKENS.T1, margin: '0 0 8px' }}>
                    {selectedLesson.title}
                  </h2>
                  <div style={{ fontSize: '13px', color: TOKENS.T2 }}>
                    {selectedCourse.category} · {selectedCourse.level} · Lesson {selectedCourse.lessons.indexOf(selectedLesson) + 1} of {selectedCourse.lessons.length}
                  </div>
                </div>

                <button
                  onClick={() => handleLessonComplete(selectedLesson.id)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #16A34A, #15803D)',
                    color: TOKENS.W,
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 20px rgba(22, 163, 74, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 28px rgba(22, 163, 74, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 20px rgba(22, 163, 74, 0.4)';
                  }}
                >
                  <Icon name="check" size={16} color={TOKENS.W} strokeWidth={3} /> Mark Complete
                </button>
              </div>

              {/* Main Content Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
                {/* Course Details */}
                <div style={{ background: TOKENS.W, borderRadius: '12px', border: `1.5px solid ${TOKENS.BD}`, padding: '24px' }}>
                  <div style={{
                    display: 'inline-block',
                    background: CAT_COLORS[selectedCourse.category].b,
                    color: CAT_COLORS[selectedCourse.category].c,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginBottom: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}>
                    {selectedCourse.category}
                  </div>

                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: TOKENS.T1, margin: '0 0 12px', lineHeight: '1.3' }}>
                    {selectedCourse.title}
                  </h1>

                  <p style={{ fontSize: '15px', color: TOKENS.T2, lineHeight: '1.7', marginBottom: '24px' }}>
                    {selectedCourse.description}
                  </p>

                  <div style={{ borderTop: `1px solid ${TOKENS.BD}`, paddingTop: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: TOKENS.T1, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      What you'll learn
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: TOKENS.T2, fontSize: '13px', lineHeight: '1.8' }}>
                      <li>Comprehensive understanding of {selectedCourse.category.toLowerCase()}</li>
                      <li>Practical applications in real-world scenarios</li>
                      <li>Expert insights and industry best practices</li>
                      <li>Advanced strategies and frameworks</li>
                    </ul>
                  </div>
                </div>

                {/* Lessons Sidebar */}
                <div style={{
                  background: TOKENS.W,
                  borderRadius: '12px',
                  border: `1.5px solid ${TOKENS.BD}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '600px'
                }}>
                  <div style={{ padding: '16px 20px', borderBottom: `1px solid ${TOKENS.BD}`, background: TOKENS.BG }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 700, color: TOKENS.T1, margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Course Lessons
                    </h3>
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    {selectedCourse.lessons.map((lesson, idx) => {
                      const isCompleted = courseProgress[selectedCourse.id] 
                        ? idx < Math.ceil(courseProgress[selectedCourse.id] / (100 / selectedCourse.lessons.length))
                        : false;
                      const isActive = selectedLesson.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedLesson(lesson)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            borderBottom: `1px solid ${TOKENS.BD}`,
                            background: isActive ? TOKENS.PUL : '#F3F4F6',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.target.style.background = '#E5E7EB';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.target.style.background = '#F3F4F6';
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isCompleted ? TOKENS.GR : isActive ? TOKENS.PUL : '#D1D5DB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: '10px',
                            fontWeight: 700,
                            color: isCompleted || isActive ? TOKENS.W : TOKENS.T2
                          }}>
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: '12px',
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? TOKENS.W : TOKENS.T1,
                              lineHeight: '1.3',
                              marginBottom: '2px'
                            }}>
                              {lesson.title}
                            </div>
                            <div style={{ fontSize: '11px', color: isActive ? TOKENS.W : TOKENS.T3 }}>
                              {lesson.duration}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LearningHub;
