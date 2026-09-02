import { BadRequestException } from '@nestjs/common';
import { readFileSync } from 'fs';

export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/zip',
  'application/x-rar-compressed',
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
]);

function createFileFilter(allowedTypes: Set<string>) {
  return (_request: Express.Request, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
      return;
    }
    callback(null, true);
  };
}

export const documentUploadOptions = {
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: 1 },
  fileFilter: createFileFilter(DOCUMENT_MIME_TYPES),
};

export const attachmentUploadOptions = {
  limits: { fileSize: MAX_DOCUMENT_SIZE, files: 5 },
  fileFilter: createFileFilter(DOCUMENT_MIME_TYPES),
};

export const videoUploadOptions = {
  limits: { fileSize: MAX_VIDEO_SIZE, files: 1 },
  fileFilter: createFileFilter(VIDEO_MIME_TYPES),
};

export function validateStoredFile(file: Express.Multer.File): void {
  const contents = file.buffer || (file.path ? readFileSync(file.path) : undefined);
  const header = contents?.subarray(0, 8);
  if (!header || header.length === 0) {
    return;
  }

  const isPdf = header.subarray(0, 5).toString() === '%PDF-';
  const isPng = header.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isGif = header.subarray(0, 6).toString() === 'GIF87a' || header.subarray(0, 6).toString() === 'GIF89a';
  const isZip = header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;

  if (file.mimetype === 'application/pdf' && !isPdf) throw new BadRequestException('File content does not match its MIME type.');
  if (file.mimetype === 'image/png' && !isPng) throw new BadRequestException('File content does not match its MIME type.');
  if (file.mimetype === 'image/jpeg' && !isJpeg) throw new BadRequestException('File content does not match its MIME type.');
  if (file.mimetype === 'image/gif' && !isGif) throw new BadRequestException('File content does not match its MIME type.');
  if (['application/zip', 'application/x-rar-compressed'].includes(file.mimetype) && !isZip) throw new BadRequestException('File content does not match its MIME type.');
}
