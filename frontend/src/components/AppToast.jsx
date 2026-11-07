import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AlertTriangle, Check, RotateCw, X } from 'lucide-react';
import { dismissToast, getToasts, showToast, subscribeToasts } from '../utils/toast';
import './AppToast.css';

export function ToastNotice({ message, type = 'error', action, onDismiss, duration }) {
  const optionsRef = useRef({});
  optionsRef.current = { action, onDismiss, duration };

  useEffect(() => {
    if (message) showToast(message, { type, ...optionsRef.current });
  }, [message, type]);

  return null;
}

export default function AppToast() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  return (
    <div className="app-toast-stack" aria-label="Notifications">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const Icon = isError ? AlertTriangle : Check;
        const closeToast = () => {
          toast.onDismiss?.();
          dismissToast(toast.id);
        };

        return (
          <section
            key={toast.id}
            className={`app-toast app-toast-${toast.type}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
          >
            <span className="app-toast-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={2.5} />
            </span>
            <p className="app-toast-message">{toast.message}</p>
            {toast.action ? (
              <button
                type="button"
                className="app-toast-action"
                onClick={() => {
                  try {
                    Promise.resolve(toast.action.onClick()).catch((error) => {
                      showToast(error instanceof Error ? error.message : 'The action could not be completed.', { type: 'error' });
                    });
                  } catch (error) {
                    showToast(error instanceof Error ? error.message : 'The action could not be completed.', { type: 'error' });
                  }
                  closeToast();
                }}
                aria-label={toast.action.label || 'Retry'}
              >
                <RotateCw size={22} />
              </button>
            ) : (
              <button type="button" className="app-toast-close" onClick={closeToast} aria-label="Dismiss notification">
                <X size={22} />
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
