import React from 'react';
import './skeleton.css';

const VARIANTS = ['rows', 'cards', 'table', 'profile', 'detail'];

export default function Skeleton({
  variant = 'rows',
  rows = 3,
  columns = 3,
  compact = false,
  label = 'Loading content',
  className = '',
}) {
  const safeVariant = VARIANTS.includes(variant) ? variant : 'rows';
  const count = Math.max(1, Math.min(8, Math.floor(rows)));
  const columnCount = Math.max(1, Math.min(6, Math.floor(columns)));

  return (
    <div
      className={`skeleton-layout skeleton-${safeVariant}${compact ? ' skeleton-compact' : ''} ${className}`.trim()}
      role="status"
      aria-label={label}
      aria-busy="true"
      style={['cards', 'table'].includes(safeVariant) ? { '--skeleton-columns': columnCount } : undefined}
    >
      {safeVariant === 'rows' && Array.from({ length: count }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <i className="skeleton-shape skeleton-avatar" />
          <span className="skeleton-row-copy"><i className="skeleton-shape skeleton-line" /><i className="skeleton-shape skeleton-line short" /></span>
        </div>
      ))}
      {safeVariant === 'cards' && Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <i className="skeleton-shape skeleton-card-media" />
          <span className="skeleton-card-copy"><i className="skeleton-shape skeleton-line" /><i className="skeleton-shape skeleton-line medium" /><i className="skeleton-shape skeleton-line short" /></span>
        </div>
      ))}
      {safeVariant === 'table' && (
        <>
          <div className="skeleton-table-head">{Array.from({ length: columnCount }, (_, index) => <i className="skeleton-shape skeleton-line medium" key={index} />)}</div>
          {Array.from({ length: count }, (_, rowIndex) => (
            <div className="skeleton-table-row" key={rowIndex}>{Array.from({ length: columnCount }, (_, columnIndex) => <i className={`skeleton-shape skeleton-line${columnIndex === 0 ? '' : ' medium'}`} key={columnIndex} />)}</div>
          ))}
        </>
      )}
      {safeVariant === 'profile' && (
        <>
          <div className="skeleton-profile-cover skeleton-shape" />
          <div className="skeleton-profile-header">
            <i className="skeleton-shape skeleton-avatar large" />
            <span className="skeleton-row-copy"><i className="skeleton-shape skeleton-line" /><i className="skeleton-shape skeleton-line short" /></span>
          </div>
          <div className="skeleton-profile-grid">{Array.from({ length: count }, (_, index) => <span className="skeleton-profile-tile" key={index}><i className="skeleton-shape skeleton-line medium" /><i className="skeleton-shape skeleton-line" /><i className="skeleton-shape skeleton-line short" /></span>)}</div>
        </>
      )}
      {safeVariant === 'detail' && (
        <>
          <div className="skeleton-detail-heading"><i className="skeleton-shape skeleton-line short" /><i className="skeleton-shape skeleton-line" /><i className="skeleton-shape skeleton-line medium" /></div>
          <div className="skeleton-detail-panel">{Array.from({ length: count }, (_, index) => <span className="skeleton-row-copy" key={index}><i className="skeleton-shape skeleton-line medium" /><i className="skeleton-shape skeleton-line" /></span>)}</div>
        </>
      )}
      <span className="skeleton-sr-only">{label}</span>
    </div>
  );
}
