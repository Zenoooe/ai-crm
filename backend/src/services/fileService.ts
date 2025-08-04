import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const stat = promisify(fs.stat);

export interface FileUploadOptions {
  maxSize?: number; // 最大文件大小（字节）
  allowedTypes?: string[]; // 允许的文件类型
  generateThumbnail?: boolean; // 是否生成缩略图
  thumbnailSize?: { width: number; height: number }; // 缩略图尺寸
}

export interface UploadedFile {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  tags?: string[];
  description?: string;
}

class FileService {
  private uploadDir: string;
  private baseUrl: string;
  private maxFileSize: number;
  private allowedImageTypes: string[];
  private allowedDocumentTypes: string[];

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
    this.allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    
    this.ensureUploadDirExists();
  }

  /**
   * 确保上传目录存在
   */
  private async ensureUploadDirExists(): Promise<void> {
    try {
      await access(this.uploadDir);
    } catch {
      await mkdir(this.uploadDir, { recursive: true });
      logger.info('Created upload directory', { path: this.uploadDir });
    }
  }

  /**
   * 生成唯一文件名
   */
  private generateFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${hash}${ext}`;
  }

  /**
   * 验证文件类型
   */
  private validateFileType(mimeType: string, allowedTypes?: string[]): boolean {
    if (!allowedTypes) {
      return [...this.allowedImageTypes, ...this.allowedDocumentTypes].includes(mimeType);
    }
    return allowedTypes.includes(mimeType);
  }

  /**
   * 验证文件大小
   */
  private validateFileSize(size: number, maxSize?: number): boolean {
    const limit = maxSize || this.maxFileSize;
    return size <= limit;
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnail(
    inputPath: string,
    outputPath: string,
    size: { width: number; height: number } = { width: 200, height: 200 }
  ): Promise<void> {
    try {
      await sharp(inputPath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
      
      logger.debug('Generated thumbnail', { inputPath, outputPath, size });
    } catch (error) {
      logger.error('Failed to generate thumbnail', error as Error, { inputPath, outputPath });
      throw new ApiError(500, 'Failed to generate thumbnail');
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    options: FileUploadOptions = {}
  ): Promise<UploadedFile> {
    try {
      // 验证文件类型
      if (!this.validateFileType(mimeType, options.allowedTypes)) {
        throw new ApiError(400, `File type ${mimeType} is not allowed`);
      }

      // 验证文件大小
      if (!this.validateFileSize(fileBuffer.length, options.maxSize)) {
        const maxSize = options.maxSize || this.maxFileSize;
        throw new ApiError(400, `File size exceeds limit of ${maxSize} bytes`);
      }

      // 生成文件名和路径
      const filename = this.generateFilename(originalName);
      const filePath = path.join(this.uploadDir, filename);
      const fileUrl = `${this.baseUrl}/uploads/${filename}`;

      // 保存文件
      await writeFile(filePath, fileBuffer);

      const uploadedFile: UploadedFile = {
        originalName,
        filename,
        path: filePath,
        size: fileBuffer.length,
        mimeType,
        url: fileUrl
      };

      // 生成缩略图（仅对图片）
      if (options.generateThumbnail && this.allowedImageTypes.includes(mimeType)) {
        const thumbnailFilename = `thumb_${filename}`;
        const thumbnailPath = path.join(this.uploadDir, thumbnailFilename);
        const thumbnailUrl = `${this.baseUrl}/uploads/${thumbnailFilename}`;

        await this.generateThumbnail(filePath, thumbnailPath, options.thumbnailSize);
        uploadedFile.thumbnailUrl = thumbnailUrl;
      }

      logger.info('File uploaded successfully', {
        filename,
        originalName,
        size: fileBuffer.length,
        mimeType,
        userId
      });

      return uploadedFile;
    } catch (error) {
      logger.error('File upload failed', error as Error, {
        originalName,
        mimeType,
        size: fileBuffer.length,
        userId
      });
      throw error;
    }
  }

  /**
   * 上传图片
   */
  async uploadImage(
    file: Express.Multer.File,
    category: string = 'general'
  ): Promise<string> {
    try {
      const uploadedFile = await this.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'system', // 系统上传
        {
          maxSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: this.allowedImageTypes,
          generateThumbnail: true
        }
      );
      
      return uploadedFile.url;
    } catch (error) {
      logger.error('图片上传失败:', error as Error);
      throw new ApiError(500, '图片上传失败');
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const thumbnailPath = path.join(this.uploadDir, `thumb_${filename}`);

      // 删除主文件
      try {
        await unlink(filePath);
        logger.debug('Deleted file', { filePath });
      } catch (error) {
        logger.warn('File not found for deletion', { filePath });
      }

      // 删除缩略图（如果存在）
      try {
        await unlink(thumbnailPath);
        logger.debug('Deleted thumbnail', { thumbnailPath });
      } catch (error) {
        // 缩略图可能不存在，忽略错误
      }

      logger.info('File deleted successfully', { filename });
    } catch (error) {
      logger.error('File deletion failed', error as Error, { filename });
      throw new ApiError(500, 'Failed to delete file');
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filename: string): Promise<FileMetadata | null> {
    try {
      const filePath = path.join(this.uploadDir, filename);
      const stats = await stat(filePath);

      return {
        id: filename,
        originalName: filename,
        filename,
        path: filePath,
        size: stats.size,
        mimeType: this.getMimeTypeFromExtension(path.extname(filename)),
        uploadedAt: stats.birthtime,
        uploadedBy: 'unknown' // 这里需要从数据库获取
      };
    } catch (error) {
      logger.error('Failed to get file info', error as Error, { filename });
      return null;
    }
  }

  /**
   * 根据文件扩展名获取MIME类型
   */
  private getMimeTypeFromExtension(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv'
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(filenames: string[]): Promise<void> {
    const deletePromises = filenames.map(filename => this.deleteFile(filename));
    await Promise.allSettled(deletePromises);
    logger.info('Batch file deletion completed', { count: filenames.length });
  }

  /**
   * 清理过期文件
   */
  async cleanupExpiredFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.uploadDir);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await stat(filePath);
        
        if (now - stats.birthtime.getTime() > maxAge) {
          await this.deleteFile(file);
          deletedCount++;
        }
      }

      logger.info('Cleanup completed', { deletedCount, maxAge });
    } catch (error) {
      logger.error('Cleanup failed', error as Error);
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    typeDistribution: Record<string, number>;
  }> {
    try {
      const files = await fs.promises.readdir(this.uploadDir);
      let totalSize = 0;
      const typeDistribution: Record<string, number> = {};

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await stat(filePath);
        const ext = path.extname(file).toLowerCase();
        
        totalSize += stats.size;
        typeDistribution[ext] = (typeDistribution[ext] || 0) + 1;
      }

      return {
        totalFiles: files.length,
        totalSize,
        averageSize: files.length > 0 ? totalSize / files.length : 0,
        typeDistribution
      };
    } catch (error) {
      logger.error('Failed to get storage stats', error as Error);
      throw new ApiError(500, 'Failed to get storage statistics');
    }
  }
}

// 创建全局文件服务实例
export const fileService = new FileService();

// 导出文件服务类
export { FileService };

export default fileService;