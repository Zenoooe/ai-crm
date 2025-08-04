import express from 'express';
import authRoutes from './auth';
import contactRoutes from './contacts';
import customerRoutes from './customers';
import opportunityRoutes from './opportunities';
import taskRoutes from './tasks';
import aiRoutes from './ai';
import externalApiRoutes from './externalApi';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

const router = express.Router();

// 健康检查路由
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CRM API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API版本信息
router.get('/version', (req, res) => {
  res.json({
    success: true,
    data: {
      version: process.env.npm_package_version || '1.0.0',
      apiVersion: 'v1',
      environment: process.env.NODE_ENV || 'development',
      buildDate: process.env.BUILD_DATE || new Date().toISOString()
    }
  });
});

// 注册子路由
router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/customers', customerRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/tasks', taskRoutes);
router.use('/ai', aiRoutes);
router.use('/external', externalApiRoutes);

// 404处理
router.use('*', (req, res, next) => {
  const error = ApiError.notFound(`路由 ${req.originalUrl} 不存在`);
  logger.warn('API路由未找到', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next(error);
});

export default router;