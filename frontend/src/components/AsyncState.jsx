import React, { isValidElement } from 'react';
import { BookOpen, CalendarDays, Inbox, SearchX } from 'lucide-react';
import Skeleton from './Skeleton';
import { ToastNotice } from './AppToast';
import './async-state.css';

const EMPTY_ICONS = {
  courses: BookOpen,
  events: CalendarDays,
  search: SearchX,
  default: Inbox,
};

export function AsyncState({
  variant = 'empty',
  title,
  description,
  action,
  icon,
  skeleton = 'rows',
  rows = 3,
  columns = 3,
  compact = false,
  className = '',
  illustration,
}) {
  if (variant === 'loading') {
    return (
      <Skeleton
        variant={skeleton}
        rows={rows}
        columns={columns}
        compact={compact}
        label={title || 'Loading'}
        className={className}
      />
    );
  }

  if (variant === 'error') {
    const retryButton = isValidElement(action) ? action : null;
    const retryAction = typeof retryButton?.props?.onClick === 'function'
      ? {
        label: typeof retryButton.props.children === 'string' ? retryButton.props.children : 'Retry',
        onClick: retryButton.props.onClick,
      }
      : undefined;
    const message = [title, description].filter(Boolean).join('. ');
    return <ToastNotice message={message} type="error" action={retryAction} />;
  }

  const Icon = typeof icon === 'function' ? icon : EMPTY_ICONS[icon] || EMPTY_ICONS.default;
  const hasIllustration = Boolean(illustration);

  return (
    <div
      className={`async-state async-state-${variant}${compact ? ' is-compact' : ''}${hasIllustration ? ' has-illustration' : ''} ${className}`.trim()}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {illustration
        ? <img className="async-state-illustration" src={illustration} alt="" aria-hidden="true" />
        : <span className="async-state-icon" aria-hidden="true"><Icon size={compact ? 19 : 22} strokeWidth={1.8} /></span>}
      <div className="async-state-copy">
        {title && <strong>{title}</strong>}
        {description && <p>{description}</p>}
      </div>
      {action && <div className="async-state-action">{action}</div>}
    </div>
  );
}

export default AsyncState;
