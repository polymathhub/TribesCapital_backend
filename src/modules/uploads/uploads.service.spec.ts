import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import { UploadsService } from './uploads.service';

describe('UploadsService local storage', () => {
  let service: UploadsService;
  let storagePath: string;
  let previousProvider: string | undefined;
  let previousStoragePath: string | undefined;
  let previousNodeEnv: string | undefined;

  beforeEach(async () => {
    previousProvider = process.env.UPLOAD_STORAGE_PROVIDER;
    previousStoragePath = process.env.UPLOADS_STORAGE_PATH;
    previousNodeEnv = process.env.NODE_ENV;
    storagePath = await mkdtemp(join(tmpdir(), 'tribes-uploads-'));
    process.env.UPLOAD_STORAGE_PROVIDER = 'local';
    process.env.UPLOADS_STORAGE_PATH = storagePath;
    const configService = {
      get: jest.fn((key: string) => (key === 'app.apiPrefix' ? 'api' : undefined)),
    } as unknown as ConfigService;
    service = new UploadsService(configService);
  });

  afterEach(async () => {
    if (previousProvider === undefined) delete process.env.UPLOAD_STORAGE_PROVIDER;
    else process.env.UPLOAD_STORAGE_PROVIDER = previousProvider;
    if (previousStoragePath === undefined) delete process.env.UPLOADS_STORAGE_PATH;
    else process.env.UPLOADS_STORAGE_PATH = previousStoragePath;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    await rm(storagePath, { recursive: true, force: true });
  });

  it('uses local disk by default in production', async () => {
    delete process.env.UPLOAD_STORAGE_PROVIDER;
    process.env.NODE_ENV = 'production';
    const configService = {
      get: jest.fn((key: string) => (key === 'app.apiPrefix' ? 'api' : undefined)),
    } as unknown as ConfigService;
    const productionService = new UploadsService(configService);

    const session = await productionService.initiate('user123', {
      purpose: 'profile-avatar',
      fileName: 'avatar.png',
      mimeType: 'image/png',
      size: 5,
    });

    expect(session.key).toContain('uploads/user123/profile-avatar/');
    await expect(productionService.getPartUrl('user123', session.key, session.uploadId, 1))
      .resolves.toMatchObject({ url: expect.stringContaining('/api/uploads/multipart/part?') });
  });

  it('stores and serves a multipart file without AWS credentials', async () => {
    const session = await service.initiate('user123', {
      purpose: 'messaging',
      fileName: 'hello.txt',
      mimeType: 'text/plain',
      size: 5,
    });

    const partUrl = await service.getPartUrl('user123', session.key, session.uploadId, 1);
    expect(partUrl.url).toContain('/api/uploads/multipart/part?');

    const part = await service.uploadLocalPart(
      'user123',
      session.key,
      session.uploadId,
      1,
      Readable.from([Buffer.from('hello')]),
    );
    const completed = await service.complete('user123', {
      ...session,
      parts: [{ partNumber: 1, eTag: part.eTag }],
      fileName: 'hello.txt',
      mimeType: 'text/plain',
      size: 5,
    });

    expect(completed.url).toContain('/api/uploads/multipart/public/user123/messaging/');
    expect(await readFile(await service.getLocalFilePath(completed.storageKey), 'utf8')).toBe('hello');
  });

  it('does not allow one user to upload into another user directory', async () => {
    const session = await service.initiate('user123', {
      purpose: 'messaging',
      fileName: 'hello.txt',
      mimeType: 'text/plain',
      size: 5,
    });

    await expect(service.getPartUrl('another-user', session.key, session.uploadId, 1))
      .rejects.toThrow('Invalid upload key');
  });

  it('treats a missing local file as eligible for legacy S3 fallback', async () => {
    await expect(service.tryGetLocalFilePath('uploads/user123/profile-avatar/legacy.jpg'))
      .resolves.toBeUndefined();
  });

  it('continues serving legacy S3 objects when local storage is enabled', async () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'app.apiPrefix') return 'api';
        if (key === 'aws') return { s3Bucket: 'legacy-bucket', region: 'us-east-1' };
        return undefined;
      }),
    } as unknown as ConfigService;
    const localService = new UploadsService(configService);
    const getSignedUrlPromise = jest.fn().mockResolvedValue('https://signed.example/legacy.jpg');
    (localService as any).s3 = { getSignedUrlPromise };

    await expect(localService.getSignedDownloadUrl('uploads/user123/profile-avatar/legacy.jpg'))
      .resolves.toBe('https://signed.example/legacy.jpg');
    expect(getSignedUrlPromise).toHaveBeenCalledWith('getObject', {
      Bucket: 'legacy-bucket',
      Key: 'uploads/user123/profile-avatar/legacy.jpg',
      Expires: 900,
    });
  });
});
