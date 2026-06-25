import React from 'react';
import { COLORS } from '../constants/colors';

function Icon({ name, size = 15, color = COLORS.T3 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const paths = {
    home: <><path d="M3 9.5L9 4l6 5.5V19H6v-5h6v5h3V9.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    book: <><path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M4 15h16" stroke={color} strokeWidth="1.5"/></>,
    folder: <><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke={color} strokeWidth="1.5" fill="none"/></>,
    chart: <><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="1.5" fill="none"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/><line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.5"/><line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5" fill="none"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    search: <><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.5" fill="none"/><path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    arrow: <><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><polyline points="12,5 19,12 12,19" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    doc: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="1.5" fill="none"/><line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.5"/><line x1="8" y1="17" x2="12" y2="17" stroke={color} strokeWidth="1.5"/></>,
    time: <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="12,6 12,12 16,14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 17l5-5-5-5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12H9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
  };

  const NAV_ICONS = {
    'Home': 'home',
    'Learning Hub': 'book',
    'Due Diligence Vault': 'folder',
    'Project Pipeline': 'chart',
    'Reporting Library': 'file',
    'Office Hours & Events': 'calendar',
    'Member Circles': 'users',
    'Help': 'bell',
  };

  const iconName = NAV_ICONS[name] || name;
  return <svg viewBox="0 0 24 24" style={s}>{paths[iconName]}</svg>;
}

export default Icon;
