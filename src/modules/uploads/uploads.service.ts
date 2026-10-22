import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { createHash, randomUUID } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'fs/promises';
import { basename, join, relative, resolve, sep } from 'path';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';

const PART_SIZE = 8 * 1024 * 1024;
const MAX_FILE_SIZE = 1024 * 1024 * 1024;
const PURPOSES = new Set(['profile-avatar', 'profile-cover', 'messaging', 'due-diligence', 'project-pipeline']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']);
const FILE_TYPES = new Set([
  ...IMAGE_TYPES,
  'application/pdf', 'text/plain', 'text/csv', 'application/zip', 'application/x-zip-compressed',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4', 'video/quicktime', 'video/webm',
]);
const UPLOAD_PREFIX = 'uploads/';

@Injectable()
export class UploadsService {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl?: string;
  private readonly apiPrefix: string;
  private readonly storageProvider: 'local' | 's3';
  private readonly localStoragePath: string;

  constructor(configService: ConfigService) {
    const config = configService.get('aws');
    this.bucket = config?.s3Bucket;
    this.region = config?.region || 'us-east-1';
    this.publicBaseUrl = config?.s3Url?.replace(/\/$/, '');
    this.apiPrefix = String(configService.get('app.apiPrefix') || 'api').replace(/^\/+|\/+$/g, '');
    this.storageProvider = process.env.UPLOAD_STORAGE_PROVIDER?.trim().toLowerCase() === 'local' ? 'local' : 's3';
    this.localStoragePath = resolve(process.env.UPLOADS_STORAGE_PATH || join(process.cwd(), 'storage', 'uploads'));
    this.s3 = new AWS.S3({
      ...(config?.accessKeyId ? { accessKeyId: config.accessKeyId } : {}),
      ...(config?.secretAccessKey ? { secretAccessKey: config.secretAccessKey } : {}),
      region: this.region,
      signatureVersion: 'v4',
    });
  }

  async initiate(userId: string, input: { purpose: string; fileName: string; mimeType: string; size: number; key?: string; uploadId?: string }) {
    if (!PURPOSES.has(input.purpose) || !input.fileName?.trim() || !input.mimeType?.trim()) {
      throw new BadRequestException('Invalid upload details');
    }
    if (input.purpose.startsWith('profile-') ? !IMAGE_TYPES.has(input.mimeType) : !FILE_TYPES.has(input.mimeType)) {
      throw new BadRequestException('This file type is not supported');
    }
    if (!Number.isSafeInteger(input.size) || input.size < 1 || input.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Files must be smaller than 1 GB');
    }
    this.ensureConfigured();

    const safeName = basename(input.fileName).replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120) || 'upload';
    let key = `uploads/${userId}/${input.purpose}/${randomUUID()}-${safeName}`;
    if (this.storageProvider === 'local') {
      let uploadId: string = randomUUID();
      if (input.key && input.uploadId) {
        try {
          const manifest = await this.readLocalManifest(userId, input.uploadId);
          if (
            manifest.key === input.key
            && manifest.purpose === input.purpose
            && manifest.fileName === safeName
            && manifest.mimeType === input.mimeType
            && manifest.size === input.size
          ) {
            key = manifest.key;
            uploadId = input.uploadId;
          }
        } catch {
          // A stale or invalid browser session starts a fresh upload.
        }
      }

      const sessionDir = this.localSessionDir(userId, uploadId);
      await mkdir(join(sessionDir, 'parts'), { recursive: true, mode: 0o700 });
      await writeFile(
        join(sessionDir, 'session.json'),
        JSON.stringify({ key, purpose: input.purpose, fileName: safeName, mimeType: input.mimeType, size: input.size }),
        { mode: 0o600 },
      );
      return { key, uploadId, partSize: PART_SIZE, completedParts: await this.getLocalCompletedParts(userId, key, uploadId) };
    }

    key = input.key || key;
    if (!key.startsWith(`uploads/${userId}/${input.purpose}/`)) throw new BadRequestException('Invalid upload key');

    let uploadId = input.uploadId;
    let completedParts: Array<{ partNumber: number; eTag: string }> = [];
    if (uploadId) {
      try {
        const result = await this.s3.listParts({ Bucket: this.bucket, Key: key, UploadId: uploadId }).promise();
        completedParts = (result.Parts || []).map((part) => ({ partNumber: part.PartNumber!, eTag: part.ETag! }));
      } catch {
        uploadId = undefined;
      }
    }
    if (!uploadId) {
      const result = await this.s3.createMultipartUpload({
        Bucket: this.bucket,
        Key: key,
        ContentType: input.mimeType,
        ServerSideEncryption: 'AES256',
        Metadata: { 'owner-id': userId, 'original-name': safeName, purpose: input.purpose },
      }).promise();
      uploadId = result.UploadId;
    }
    if (!uploadId) throw new ServiceUnavailableException('Could not start the S3 upload');
    return { key, uploadId, partSize: PART_SIZE, completedParts };
  }

  async getPartUrl(userId: string, key: string, uploadId: string, partNumber: number) {
    this.assertOwnedKey(userId, key);
    if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10000 || !uploadId) {
      throw new BadRequestException('Invalid multipart upload part');
    }
    if (this.storageProvider === 'local') {
      const manifest = await this.readLocalManifest(userId, uploadId);
      if (manifest.key !== key || partNumber > Math.ceil(manifest.size / PART_SIZE)) {
        throw new BadRequestException('Invalid multipart upload part');
      }
      const query = new URLSearchParams({ key, uploadId, partNumber: String(partNumber) });
      return { url: `/${this.apiPrefix}/uploads/multipart/part?${query.toString()}` };
    }
    const url = await this.s3.getSignedUrlPromise('uploadPart', {
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Expires: 900,
    });
    return { url };
  }

  async uploadLocalPart(userId: string, key: string, uploadId: string, partNumber: number, request: NodeJS.ReadableStream) {
    if (this.storageProvider !== 'local') throw new BadRequestException('Local uploads are not enabled');
    this.assertOwnedKey(userId, key);
    const manifest = await this.readLocalManifest(userId, uploadId);
    const partCount = Math.ceil(manifest.size / PART_SIZE);
    if (manifest.key !== key || !Number.isInteger(partNumber) || partNumber < 1 || partNumber > partCount) {
      throw new BadRequestException('Invalid multipart upload part');
    }

    const partsDir = join(this.localSessionDir(userId, uploadId), 'parts');
    const partPath = join(partsDir, `part-${partNumber}.bin`);
    const temporaryPath = `${partPath}.${randomUUID()}.tmp`;
    const expectedSize = Math.min(PART_SIZE, manifest.size - ((partNumber - 1) * PART_SIZE));
    let receivedSize = 0;
    const sizeGuard = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        receivedSize += chunk.length;
        if (receivedSize > expectedSize) {
          callback(new BadRequestException('Upload part exceeds its expected size'));
          return;
        }
        callback(null, chunk);
      },
    });

    try {
      await pipeline(request, sizeGuard, createWriteStream(temporaryPath, { flags: 'wx', mode: 0o600 }));
      if (receivedSize !== expectedSize) throw new BadRequestException('Upload part has an unexpected size');
      const contents = await readFile(temporaryPath);
      const eTag = createHash('md5').update(contents).digest('hex');
      await rename(temporaryPath, partPath);
      return { eTag };
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
  }

  async complete(userId: string, input: { key: string; uploadId: string; parts: Array<{ partNumber: number; eTag: string }>; fileName: string; mimeType: string; size: number }) {
    this.assertOwnedKey(userId, input.key);
    if (!input.uploadId || !Array.isArray(input.parts) || input.parts.length === 0) throw new BadRequestException('Upload parts are required');
    const parts = [...input.parts].sort((left, right) => left.partNumber - right.partNumber);
    if (parts.some((part, index) => part.partNumber !== index + 1 || !part.eTag)) throw new BadRequestException('Upload parts are incomplete');
    if (this.storageProvider === 'local') {
      return this.completeLocalUpload(userId, input, parts);
    }
    try {
      await this.s3.completeMultipartUpload({
        Bucket: this.bucket,
        Key: input.key,
        UploadId: input.uploadId,
        MultipartUpload: { Parts: parts.map((part) => ({ PartNumber: part.partNumber, ETag: part.eTag })) },
      }).promise();
    } catch {
      throw new BadRequestException('Could not complete the S3 upload');
    }
    const keyParts = input.key.split('/');
    const profilePurpose = keyParts[2];
    const url = profilePurpose === 'profile-avatar' || profilePurpose === 'profile-cover'
      ? `/${this.apiPrefix}/uploads/multipart/profile/${keyParts[1]}/${profilePurpose}/${encodeURIComponent(keyParts.slice(3).join('/'))}`
      : this.publicBaseUrl
        ? `${this.publicBaseUrl}/${input.key.split('/').map(encodeURIComponent).join('/')}`
        : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${input.key.split('/').map(encodeURIComponent).join('/')}`;
    return {
      fileName: basename(input.fileName),
      mimeType: input.mimeType,
      size: input.size,
      storageKey: input.key,
      url,
    };
  }

  async abort(userId: string, key: string, uploadId: string) {
    this.assertOwnedKey(userId, key);
    if (this.storageProvider === 'local') {
      const manifest = await this.readLocalManifest(userId, uploadId);
      if (manifest.key !== key) throw new BadRequestException('Invalid multipart upload session');
      await rm(this.localSessionDir(userId, uploadId), { recursive: true, force: true });
      return { success: true };
    }
    if (uploadId) await this.s3.abortMultipartUpload({ Bucket: this.bucket, Key: key, UploadId: uploadId }).promise();
    return { success: true };
  }

  async getSignedDownloadUrl(key: string) {
    this.assertStorageKey(key);
    if (this.storageProvider === 'local') {
      await this.getLocalFilePath(key);
      return this.localFileUrl(key);
    }
    this.ensureConfigured();
    return this.s3.getSignedUrlPromise('getObject', { Bucket: this.bucket, Key: key, Expires: 900 });
  }

  async deleteObject(key: string) {
    this.assertStorageKey(key);
    if (this.storageProvider === 'local') {
      await rm(this.getLocalObjectPath(key), { force: true });
      return;
    }
    this.ensureConfigured();
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
  }

  private assertOwnedKey(userId: string, key: string) {
    this.assertStorageKey(key);
    if (!key.startsWith(`${UPLOAD_PREFIX}${userId}/`)) throw new BadRequestException('Invalid upload key');
    if (this.storageProvider === 's3') this.ensureConfigured();
  }

  private assertStorageKey(key: string) {
    if (
      typeof key !== 'string'
      || !key.startsWith(UPLOAD_PREFIX)
      || key.includes('..')
      || key.includes('\\')
      || key.split('/').some((part) => !part || part === '.' || part === '..')
    ) {
      throw new BadRequestException('Invalid storage key');
    }
  }

  private localSessionDir(userId: string, uploadId: string) {
    if (!/^[A-Za-z0-9_-]+$/.test(userId) || !/^[0-9a-f-]{36}$/i.test(uploadId || '')) {
      throw new BadRequestException('Invalid multipart upload session');
    }
    return join(this.localStoragePath, '.multipart', userId, uploadId);
  }

  private getLocalObjectPath(key: string) {
    this.assertStorageKey(key);
    const path = resolve(this.localStoragePath, key.slice(UPLOAD_PREFIX.length));
    const pathFromRoot = relative(this.localStoragePath, path);
    if (!pathFromRoot || pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === '..') {
      throw new BadRequestException('Invalid storage key');
    }
    return path;
  }

  async getLocalFilePath(key: string) {
    if (this.storageProvider !== 'local') throw new BadRequestException('Local uploads are not enabled');
    const path = this.getLocalObjectPath(key);
    try {
      const file = await stat(path);
      if (!file.isFile()) throw new Error('Not a file');
      return path;
    } catch {
      throw new BadRequestException('Uploaded file not found');
    }
  }

  async tryGetLocalFilePath(key: string) {
    if (this.storageProvider !== 'local') return undefined;
    return this.getLocalFilePath(key);
  }

  private async readLocalManifest(userId: string, uploadId: string) {
    try {
      return JSON.parse(await readFile(join(this.localSessionDir(userId, uploadId), 'session.json'), 'utf8')) as {
        key: string;
        purpose: string;
        fileName: string;
        mimeType: string;
        size: number;
      };
    } catch {
      throw new BadRequestException('Multipart upload session not found');
    }
  }

  private async getLocalCompletedParts(userId: string, key: string, uploadId: string) {
    const manifest = await this.readLocalManifest(userId, uploadId);
    if (manifest.key !== key) throw new BadRequestException('Invalid multipart upload session');
    const partsDir = join(this.localSessionDir(userId, uploadId), 'parts');
    const names = await readdir(partsDir);
    const completedParts: Array<{ partNumber: number; eTag: string }> = [];
    for (const name of names) {
      const match = /^part-(\d+)\.bin$/.exec(name);
      if (!match) continue;
      const partNumber = Number(match[1]);
      if (!Number.isSafeInteger(partNumber) || partNumber < 1 || partNumber > Math.ceil(manifest.size / PART_SIZE)) continue;
      const eTag = createHash('md5').update(await readFile(join(partsDir, name))).digest('hex');
      completedParts.push({ partNumber, eTag });
    }
    return completedParts.sort((left, right) => left.partNumber - right.partNumber);
  }

  private async completeLocalUpload(
    userId: string,
    input: { key: string; uploadId: string; parts: Array<{ partNumber: number; eTag: string }>; fileName: string; mimeType: string; size: number },
    parts: Array<{ partNumber: number; eTag: string }>,
  ) {
    const manifest = await this.readLocalManifest(userId, input.uploadId);
    const partCount = Math.ceil(manifest.size / PART_SIZE);
    if (
      manifest.key !== input.key
      || manifest.fileName !== basename(input.fileName).replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120)
      || manifest.mimeType !== input.mimeType
      || manifest.size !== input.size
      || parts.length !== partCount
    ) {
      throw new BadRequestException('Upload details do not match the initiated session');
    }

    const partsDir = join(this.localSessionDir(userId, input.uploadId), 'parts');
    const partPaths: string[] = [];
    for (let index = 0; index < partCount; index += 1) {
      const partNumber = index + 1;
      const partPath = join(partsDir, `part-${partNumber}.bin`);
      const partStats = await stat(partPath).catch(() => undefined);
      const expectedSize = Math.min(PART_SIZE, manifest.size - (index * PART_SIZE));
      if (!partStats?.isFile() || partStats.size !== expectedSize) {
        throw new BadRequestException('Upload parts are incomplete');
      }
      const eTag = createHash('md5').update(await readFile(partPath)).digest('hex');
      if (parts[index].partNumber !== partNumber || parts[index].eTag.replaceAll('"', '') !== eTag) {
        throw new BadRequestException('Upload part verification failed');
      }
      partPaths.push(partPath);
    }

    const objectPath = this.getLocalObjectPath(input.key);
    await mkdir(join(objectPath, '..'), { recursive: true, mode: 0o700 });
    const temporaryPath = `${objectPath}.${randomUUID()}.tmp`;
    async function* readParts() {
      for (const partPath of partPaths) {
        for await (const chunk of createReadStream(partPath)) yield chunk;
      }
    }
    try {
      await pipeline(Readable.from(readParts()), createWriteStream(temporaryPath, { flags: 'wx', mode: 0o600 }));
      await rename(temporaryPath, objectPath);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw error;
    }
    await rm(this.localSessionDir(userId, input.uploadId), { recursive: true, force: true });
    return {
      fileName: basename(input.fileName),
      mimeType: input.mimeType,
      size: manifest.size,
      storageKey: input.key,
      url: this.localFileUrl(input.key),
    };
  }

  private localFileUrl(key: string) {
    const segments = key.slice(UPLOAD_PREFIX.length).split('/').map(encodeURIComponent);
    const [userId, purpose, ...fileName] = segments;
    if (purpose === 'profile-avatar' || purpose === 'profile-cover') {
      return `/${this.apiPrefix}/uploads/multipart/profile/${userId}/${purpose}/${fileName.join('/')}`;
    }
    if (purpose === 'messaging') {
      return `/${this.apiPrefix}/uploads/multipart/public/${userId}/messaging/${fileName.join('/')}`;
    }
    return `/${this.apiPrefix}/uploads/multipart/file?key=${encodeURIComponent(key)}`;
  }

  private ensureConfigured() {
    if (this.storageProvider === 'local') return;
    if (!this.bucket) throw new ServiceUnavailableException('S3 uploads are not configured');
  }
}