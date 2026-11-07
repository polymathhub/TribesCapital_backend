import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './FilePreviewModal.css';

export function getFilePreviewType(fileName, mimeType) {
  const type = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  if (type.startsWith('image/') || /\.(apng|avif|gif|jpe?g|png|svg|webp)$/.test(name)) return 'image';
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type.startsWith('video/') || /\.(mp4|mov|webm|ogv)$/.test(name)) return 'video';
  if (
    ['text/plain', 'text/csv', 'text/markdown', 'text/tab-separated-values'].includes(type)
    || /\.(csv|md|txt)$/.test(name)
  ) return 'text';
  return 'unsupported';
}

function FilePreviewModal({ fileName, mimeType, url, loading = false, error = '', onClose, previewType }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const type = previewType || getFilePreviewType(fileName, mimeType);
  const [imageFailedUrl, setImageFailedUrl] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return createPortal(
    <div
      className="file-preview-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`file-preview-modal${type === 'image' ? ' is-image' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${fileName || 'file'}`}
        aria-busy={loading}
      >
        <header className="file-preview-header">
          <div>
            <strong>{fileName || 'File preview'}</strong>
            <small>{mimeType || type.toUpperCase()}</small>
          </div>
          <button type="button" onClick={onClose} aria-label="Close preview" title="Close preview">
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="file-preview-body">
          {loading ? (
            <p role="status">Preparing preview…</p>
          ) : error ? (
            <p className="file-preview-error" role="alert">{error}</p>
          ) : !url ? (
            <p role="status">This file preview is unavailable.</p>
          ) : type === 'image' ? (
            imageFailedUrl === url ? (
              <p className="file-preview-error" role="alert">This image preview could not be loaded.</p>
            ) : (
              <img src={url} alt={fileName || 'Preview'} onError={() => setImageFailedUrl(url)} />
            )
          ) : type === 'pdf' || type === 'text' ? (
            <iframe src={url} title={`Preview of ${fileName || 'file'}`} />
          ) : type === 'video' ? (
            <video src={url} controls aria-label={`Preview of ${fileName || 'video'}`} />
          ) : (
            <p>
              Preview is not available for this file type. Use the download option to open it.
            </p>
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default FilePreviewModal;
