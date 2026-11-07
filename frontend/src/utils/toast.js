let toasts = [];
let nextToastId = 0;
const listeners = new Set();
const timers = new Map();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function removeToast(id) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  const nextToasts = toasts.filter((toast) => toast.id !== id);
  if (nextToasts.length !== toasts.length) {
    toasts = nextToasts;
    emitChange();
  }
}

export function subscribeToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts() {
  return toasts;
}

export function showToast(message, {
  type = 'success',
  action,
  onDismiss,
  duration = action ? 0 : type === 'error' ? 8000 : 5000,
} = {}) {
  if (typeof message !== 'string' || !message.trim()) return;

  const existing = toasts.find((toast) => toast.message === message && toast.type === type);
  if (existing) {
    if (action || onDismiss) {
      toasts = toasts.map((toast) => (toast.id === existing.id
        ? { ...toast, action: action || toast.action, onDismiss: onDismiss || toast.onDismiss }
        : toast));
      emitChange();
    }
    return;
  }

  const toast = {
    id: ++nextToastId,
    message: message.trim(),
    type: type === 'error' ? 'error' : 'success',
    action,
    onDismiss,
  };
  while (toasts.length >= 3) removeToast(toasts[0].id);
  toasts = [...toasts, toast];
  emitChange();

  if (duration > 0) {
    timers.set(toast.id, setTimeout(() => removeToast(toast.id), duration));
  }
}

export function dismissToast(id) {
  removeToast(id);
}
