import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { randomUUID } from 'crypto';
import { basename } from 'path';

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

@Injectable()
export class UploadsService {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicBaseUrl?: string;
  private readonly apiPrefix: string;

  constructor(configService: ConfigService) {
    const config = configService.get('aws');
    this.bucket = config?.s3Bucket;
    this.region = config?.region || 'us-east-1';
    this.publicBaseUrl = config?.s3Url?.replace(/\/$/, '');
    this.apiPrefix = String(configService.get('app.apiPrefix') || 'api').replace(/^\/+|\/+$/g, '');
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
    const key = input.key || `uploads/${userId}/${input.purpose}/${randomUUID()}-${safeName}`;
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
    const url = await this.s3.getSignedUrlPromise('uploadPart', {
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Expires: 900,
    });
    return { url };
  }

  async complete(userId: string, input: { key: string; uploadId: string; parts: Array<{ partNumber: number; eTag: string }>; fileName: string; mimeType: string; size: number }) {
    this.assertOwnedKey(userId, input.key);
    if (!input.uploadId || !Array.isArray(input.parts) || input.parts.length === 0) throw new BadRequestException('Upload parts are required');
    const parts = [...input.parts].sort((left, right) => left.partNumber - right.partNumber);
    if (parts.some((part, index) => part.partNumber !== index + 1 || !part.eTag)) throw new BadRequestException('Upload parts are incomplete');
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
    if (uploadId) await this.s3.abortMultipartUpload({ Bucket: this.bucket, Key: key, UploadId: uploadId }).promise();
    return { success: true };
  }

  async getSignedDownloadUrl(key: string) {
    this.ensureConfigured();
    if (!key?.startsWith('uploads/') || key.includes('..')) throw new BadRequestException('Invalid storage key');
    return this.s3.getSignedUrlPromise('getObject', { Bucket: this.bucket, Key: key, Expires: 900 });
  }

  async deleteObject(key: string) {
    this.ensureConfigured();
    if (!key?.startsWith('uploads/') || key.includes('..')) throw new BadRequestException('Invalid storage key');
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
  }

  private assertOwnedKey(userId: string, key: string) {
    this.ensureConfigured();
    if (!key?.startsWith(`uploads/${userId}/`) || key.includes('..')) throw new BadRequestException('Invalid upload key');
  }

  private ensureConfigured() {
    if (!this.bucket) throw new ServiceUnavailableException('S3 uploads are not configured');
  }
}