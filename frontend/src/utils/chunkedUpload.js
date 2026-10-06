import { uploadsAPI } from '../api/endpoints';
import apiClient from '../api/client';

const SESSION_PREFIX = 'tribes-multipart-upload:';
const MAX_RETRIES = 3;

function sessionKey(file, purpose) {
  return `${SESSION_PREFIX}${purpose}:${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

function readSession(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function saveSession(key, session) {
  try {
    localStorage.setItem(key, JSON.stringify(session));
  } catch {
    // Upload can continue even when browser storage is unavailable.
  }
}

function uploadPart(url, blob, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) return reject(new Error(`S3 rejected upload part (${request.status}).`));
      const eTag = request.getResponseHeader('ETag');
      if (!eTag) return reject(new Error('S3 CORS must expose the ETag response header to complete uploads.'));
      resolve(eTag);
    };
    request.onerror = () => reject(new Error('Network connection interrupted during upload.'));
    request.onabort = () => reject(new Error('Upload was interrupted.'));
    request.send(blob);
  });
}

export async function uploadFileInChunks(file, purpose, onProgress = () => {}) {
  const localKey = sessionKey(file, purpose);
  const previous = readSession(localKey);
  const { data: session } = await uploadsAPI.initiate({
    purpose,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    key: previous?.key,
    uploadId: previous?.uploadId,
  });
  saveSession(localKey, session);

  const partCount = Math.ceil(file.size / session.partSize);
  const completed = new Map((session.completedParts || []).map((part) => [part.partNumber, part.eTag]));
  let uploadedBytes = [...completed.keys()].reduce((total, partNumber) => total + Math.min(session.partSize, file.size - (partNumber - 1) * session.partSize), 0);
  onProgress({ loaded: uploadedBytes, total: file.size, percent: Math.round(uploadedBytes / file.size * 100) });

  for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
    if (completed.has(partNumber)) continue;
    const start = (partNumber - 1) * session.partSize;
    const chunk = file.slice(start, Math.min(start + session.partSize, file.size));
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const { data: signed } = await uploadsAPI.getPartUrl({ key: session.key, uploadId: session.uploadId, partNumber });
        const eTag = await uploadPart(signed.url, chunk, (loaded) => {
          const currentLoaded = uploadedBytes + loaded;
          onProgress({ loaded: currentLoaded, total: file.size, percent: Math.min(99, Math.round(currentLoaded / file.size * 100)) });
        });
        completed.set(partNumber, eTag);
        uploadedBytes += chunk.size;
        saveSession(localKey, { ...session, completedParts: [...completed].map(([number, tag]) => ({ partNumber: number, eTag: tag })) });
        onProgress({ loaded: uploadedBytes, total: file.size, percent: Math.min(99, Math.round(uploadedBytes / file.size * 100)) });
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (lastError) throw lastError;
  }

  const { data: result } = await uploadsAPI.complete({
    ...session,
    parts: [...completed].map(([partNumber, eTag]) => ({ partNumber, eTag })),
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  });
  try { localStorage.removeItem(localKey); } catch {}
  onProgress({ loaded: file.size, total: file.size, percent: 100 });
  return result;
}

function saveDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

const trackDownload = (onProgress) => (event) => {
  if (!event.lengthComputable || !event.total) return onProgress(null);
  onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
};

export async function downloadFileFromApi(path, fileName, onProgress = () => {}) {
  const response = await apiClient.get(path, { responseType: 'blob', onDownloadProgress: trackDownload(onProgress) });
  saveDownload(response.data, fileName);
}

export async function downloadFileFromUrl(url, fileName, onProgress = () => {}) {
  const downloadUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Download failed (${response.status}).`);
  const total = Number(response.headers.get('content-length')) || 0;
  if (!response.body || !total) {
    saveDownload(await response.blob(), fileName);
    onProgress(100);
    return;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress(Math.min(100, Math.round((loaded / total) * 100)));
  }
  saveDownload(new Blob(chunks, { type: response.headers.get('content-type') || 'application/octet-stream' }), fileName);
}