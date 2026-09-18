import React from 'react';

const getName = (person) => {
  const source = person?.user || person?.profile || person || {};
  return source.displayName || `${source.firstName || ''} ${source.lastName || ''}`.trim() || source.name || source.email || 'Member';
};

const getInitials = (person) => {
  const name = getName(person);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getColor = (person) => {
  const name = getName(person);
  const colors = ['#5B21B6', '#0F766E', '#0369A1', '#B45309', '#BE185D', '#166534'];
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export default function InitialsAvatar({ person, className = '', style = {}, alt, size }) {
  return <span
    className={className}
    title={getName(person)}
    aria-label={alt || `${getName(person)} profile`}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
      borderRadius: '50%',
      background: getColor(person),
      color: '#fff',
      fontSize: size || '0.72em',
      fontWeight: 700,
      letterSpacing: '0.02em',
      lineHeight: 1,
      ...style,
    }}
  >{getInitials(person)}</span>;
}
