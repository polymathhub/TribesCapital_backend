import React, { useEffect, useState } from 'react';
import InitialsAvatar from './InitialsAvatar';
import { resolveProfileImageUrl } from '../utils/profileImageUrl';

const profileOf = (person) => person?.user || person?.profile || person || {};
const nameOf = (person) => {
  const profile = profileOf(person);
  return profile.displayName
    || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    || profile.name
    || profile.email
    || 'Member';
};

export default function ProfileAvatar({
  person,
  className = '',
  style = {},
  alt,
  fallbackText,
  decorative = false,
}) {
  const profile = profileOf(person);
  const source = resolveProfileImageUrl(profile.avatar || person?.avatar);
  const [failedSource, setFailedSource] = useState('');
  const displayName = nameOf(person);

  useEffect(() => {
    setFailedSource('');
  }, [source]);

  if (source && failedSource !== source) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: '50%',
          ...style,
        }}
        title={decorative ? undefined : displayName}
        aria-hidden={decorative || undefined}
      >
        <img
          src={source}
          alt={decorative ? '' : alt || `${displayName} profile`}
          onError={() => setFailedSource(source)}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </span>
    );
  }

  if (fallbackText !== undefined) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          borderRadius: '50%',
          ...style,
        }}
        title={decorative ? undefined : displayName}
        aria-hidden={decorative || undefined}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : alt || `${displayName} profile`}
      >
        {fallbackText}
      </span>
    );
  }

  if (!decorative) {
    return <InitialsAvatar person={person} className={className} style={style} alt={alt} />;
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: '50%',
        ...style,
      }}
      aria-hidden="true"
    >
      <InitialsAvatar person={person} style={{ width: '100%', height: '100%' }} alt="" />
    </span>
  );
}
