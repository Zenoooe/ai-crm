import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

// 文件类型配置
const FILE_TYPES = {
  images: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize: 5 * 1024 * 1024, // 5MB
    folder: 'images'
  },
  documents: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'documents'
  },
  avatars: {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 2 * 1024 * 1024, // 2MB
    folder: 'avatars'
  },
  exports: {
    extensions: ['.csv', '.xlsx', '.pdf'],
    mimeTypes: [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    folder: 'exports'
  }
};

// 存储配置
const STORAGE_CONFIG = {
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  allowedMimeTypes: [
    ...FILE_TYPES.images.mimeTypes,
    ...FILE_TYPES.documents.mimeTypes,
    ...FILE_TYPES.avatars.mimeTypes,
    ...FILE_TYPES.exports.mimeTypes
  ]
};

/**
 * 确保目录存在
 */
const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.info('创建目录', { path: dirPath });
  }
};

/**
 * 生成唯一文件名
 */
const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}_${random}_${name}${ext}`;
};

/**
 * 验证文件类型
 */
const validateFileType = (file: Express.Multer.File, allowedTypes: string[]): boolean => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;
  
  return allowedTypes.some(type => {
    const typeConfig = Object.values(FILE_TYPES).find(config => 
      config.extensions.includes(ext) && config.mimeTypes.includes(mimeType)
    );
    return typeConfig !== undefined;
  });
};

/**
 * 创建multer存储配置
 */
const createStorage = (subfolder: string = '') => {
  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const uploadPath = path.join(STORAGE_CONFIG.uploadDir, subfolder);
        await ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    }
  });
};

/**
 * 创建文件过滤器
 */
const createFileFilter = (fileType: keyof typeof FILE_TYPES) => {
  return (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const config = FILE_TYPES[fileType];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (config.extensions.includes(ext) && config.mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `不支持的文件类型。允许的类型：${config.extensions.join(', ')}`));
    }
  };
};

// 预配置的multer实例
export const uploadConfigs = {
  // 头像上传
  avatar: multer({
    storage: createStorage(FILE_TYPES.avatars.folder),
    fileFilter: createFileFilter('avatars'),
    limits: {
      fileSize: FILE_TYPES.avatars.maxSize,
      files: 1
    }
  }),
  
  // 图片上传
  image: multer({
    storage: createStorage(FILE_TYPES.images.folder),
    fileFilter: createFileFilter('images'),
    limits: {
      fileSize: FILE_TYPES.images.maxSize,
      files: 5
    }
  }),
  
  // 文档上传
  document: multer({
    storage: createStorage(FILE_TYPES.documents.folder),
    fileFilter: createFileFilter('documents'),
    limits: {
      fileSize: FILE_TYPES.documents.maxSize,
      files: 10
    }
  }),
  
  // 通用文件上传
  general: multer({
    storage: createStorage(),
    limits: {
      fileSize: STORAGE_CONFIG.maxFileSize,
      files: STORAGE_CONFIG.maxFiles
    },
    fileFilter: (req, file, cb) => {
      if (STORAGE_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new ApiError(400, '不支持的文件类型'));
      }
    }
  })
};

/**
 * 文件服务类
 */
export class FileService {
  /**
   * 保存文件信息到数据库
   */
  static async saveFileInfo(fileData: {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimetype: string;
    userId: string;
    category?: string;
  }) {
    // 这里应该保存到数据库，暂时返回文件信息
    return {
      id: Date.now().toString(),
      ...fileData,
      uploadedAt: new Date()
    };
  }
  
  /**
   * 删除文件
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(STORAGE_CONFIG.uploadDir, filePath);
      await fs.unlink(fullPath);
      logger.info('文件删除成功', { path: fullPath });
    } catch (error) {
      logger.error(`文件删除失败: ${error instanceof Error ? error.message : String(error)}`);
      throw new ApiError(500, '文件删除失败');
    }
  }
  
  /**
   * 获取文件信息
   */
  static async getFileInfo(filePath: string): Promise<{
    size: number;
    createdAt: Date;
    modifiedAt: Date;
    isFile: boolean;
    isDirectory: boolean;
  }> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(STORAGE_CONFIG.uploadDir, filePath);
      const stats = await fs.stat(fullPath);
      
      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      logger.error(`获取文件信息失败: ${error instanceof Error ? error.message : String(error)}`);
      throw new ApiError(404, '文件不存在');
    }
  }
  
  /**
   * 检查文件是否存在
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(STORAGE_CONFIG.uploadDir, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 创建文件URL
   */
  static createFileUrl(filename: string, category?: string): string {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const filePath = category ? `${category}/${filename}` : filename;
    return `${baseUrl}/uploads/${filePath}`;
  }
  
  /**
   * 清理过期文件
   */
  static async cleanupExpiredFiles(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const tempDir = path.join(STORAGE_CONFIG.uploadDir, 'temp');
      
      if (await this.fileExists(tempDir)) {
        const files = await fs.readdir(tempDir);
        const now = Date.now();
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.birthtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            logger.info('清理过期文件', { path: filePath });
          }
        }
      }
    } catch (error) {
      logger.error(`清理过期文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取存储统计信息
   */
  static async getStorageStats() {
    try {
      const stats = {
        totalSize: 0,
        fileCount: 0,
        categories: {} as Record<string, { size: number; count: number }>
      };
      
      for (const [category, config] of Object.entries(FILE_TYPES)) {
        const categoryPath = path.join(STORAGE_CONFIG.uploadDir, config.folder);
        
        if (await this.fileExists(categoryPath)) {
          const files = await fs.readdir(categoryPath);
          let categorySize = 0;
          
          for (const file of files) {
            const filePath = path.join(categoryPath, file);
            const fileStats = await fs.stat(filePath);
            categorySize += fileStats.size;
          }
          
          stats.categories[category] = {
            size: categorySize,
            count: files.length
          };
          
          stats.totalSize += categorySize;
          stats.fileCount += files.length;
        }
      }
      
      return stats;
    } catch (error) {
      logger.error(`获取存储统计失败: ${error instanceof Error ? error.message : String(error)}`);
      throw new ApiError(500, '获取存储统计失败');
    }
  }
}

// 初始化存储目录
export const initializeStorage = async (): Promise<void> => {
  try {
    await ensureDirectoryExists(STORAGE_CONFIG.uploadDir);
    
    // 创建各个分类目录
    for (const config of Object.values(FILE_TYPES)) {
      await ensureDirectoryExists(path.join(STORAGE_CONFIG.uploadDir, config.folder));
    }
    
    // 创建临时目录
    await ensureDirectoryExists(path.join(STORAGE_CONFIG.uploadDir, 'temp'));
    
    logger.info('存储目录初始化完成', { uploadDir: STORAGE_CONFIG.uploadDir });
  } catch (error) {
    logger.error(`存储目录初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

export { FILE_TYPES, STORAGE_CONFIG };
export default FileService;