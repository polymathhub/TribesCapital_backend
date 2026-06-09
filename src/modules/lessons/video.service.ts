import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

@Injectable()
export class VideoService {
  private s3: AWS.S3;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const awsConfig = this.configService.get('aws');
    this.bucket = awsConfig.s3Bucket;

    this.s3 = new AWS.S3({
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
      region: awsConfig.region,
    });
  }

  /**
   * Extract YouTube video ID from various URL formats
   * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube-nocookie.com/embed/ID
   */
  extractYoutubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([^&\n?#]+)/,
      /youtube-nocookie\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * Get optimized YouTube embed URL with performance parameters
   * - nocookie domain for privacy
   * - preload optimization
   * - autoplay disabled by default
   */
  getYoutubeEmbedUrl(videoId: string, autoplay = false): string {
    const params = new URLSearchParams({
      modestbranding: '1',
      rel: '0',
      iv_load_policy: '3',
      fs: '1',
      autoplay: autoplay ? '1' : '0',
    });
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  }

  /**
   * Get optimized YouTube video metadata with caching
   */
  getYoutubeMetadata(videoId: string): any {
    return {
      id: videoId,
      provider: 'youtube',
      embedUrl: this.getYoutubeEmbedUrl(videoId),
      type: 'video/youtube',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailUrlFallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  }

  /**
   * Validate if URL is a YouTube URL
   */
  isYoutubeUrl(url: string): boolean {
    return /(?:youtube|youtu\.be)/.test(url);
  }

  /**
   * Process video URL - detects YouTube vs S3 and returns appropriate metadata
   */
  processVideoUrl(
    videoUrlOrPath: string,
  ): { type: 'youtube' | 's3'; url?: string; embedUrl?: string; metadata?: any } {
    if (this.isYoutubeUrl(videoUrlOrPath)) {
      const youtubeId = this.extractYoutubeId(videoUrlOrPath);
      if (!youtubeId) {
        throw new BadRequestException('Invalid YouTube URL format');
      }
      return {
        type: 'youtube',
        ...this.getYoutubeMetadata(youtubeId),
      };
    }
    return {
      type: 's3',
      url: videoUrlOrPath,
    };
  }

  async uploadVideo(
    file: Express.Multer.File,
    courseId: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate video file
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid video format. Allowed: MP4, WebM, Ogg, QuickTime',
      );
    }

    const key = `courses/${courseId}/videos/${uuid()}-${Date.now()}.${this.getExtension(file.mimetype)}`;

    try {
      const params: AWS.S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'original-filename': file.originalname,
          'uploaded-at': new Date().toISOString(),
        },
      };

      await this.s3.upload(params).promise();
      return key;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new BadRequestException('Failed to upload video to S3');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new BadRequestException('Failed to generate video URL');
    }
  }

  async deleteVideo(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      console.error('Error deleting video from S3:', error);
      // Don't throw - continue even if deletion fails
    }
  }

  async getVideoMetadata(key: string): Promise<any> {
    try {
      const metadata = await this.s3
        .headObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
      return {
        size: metadata.ContentLength,
        type: metadata.ContentType,
        lastModified: metadata.LastModified,
      };
    } catch (error) {
      console.error('Error getting video metadata:', error);
      return null;
    }
  }

  private getExtension(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/ogg': 'ogv',
      'video/quicktime': 'mov',
    };
    return mimeToExt[mimeType] || 'mp4';
  }
}
