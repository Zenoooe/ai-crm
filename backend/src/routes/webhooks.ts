/**
 * Webhook路由
 * 处理外部系统的Webhook回调和内部Webhook管理
 */
import express from 'express';
import { auth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';
import {
  createWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
  retryWebhook,
  handleIncomingWebhook,
  validateWebhookSignature,
  getWebhookStats,
  pauseWebhook,
  resumeWebhook,
  bulkUpdateWebhooks,
  exportWebhookLogs,
  getWebhookTemplates,
  createWebhookTemplate,
  updateWebhookTemplate,
  deleteWebhookTemplate
} from '../controllers/webhooksController';

const router = express.Router();

// Webhook管理 (暂时屏蔽登录验证)
router.post('/', rateLimiter.general, validateRequest, createWebhook);
router.get('/', rateLimiter.general, getWebhooks);
router.get('/:webhookId', rateLimiter.general, getWebhook);
router.put('/:webhookId', rateLimiter.general, validateRequest, updateWebhook);
router.delete('/:webhookId', rateLimiter.general, deleteWebhook);

// Webhook操作 (暂时屏蔽登录验证)
router.post('/:webhookId/test', rateLimiter.general, validateRequest, testWebhook);
router.post('/:webhookId/pause', rateLimiter.general, pauseWebhook);
router.post('/:webhookId/resume', rateLimiter.general, resumeWebhook);
router.post('/:webhookId/retry/:logId', rateLimiter.general, retryWebhook);

// Webhook日志和统计 (暂时屏蔽登录验证)
router.get('/:webhookId/logs', rateLimiter.general, getWebhookLogs);
router.get('/:webhookId/stats', rateLimiter.general, getWebhookStats);
router.get('/:webhookId/logs/export', rateLimiter.exports, exportWebhookLogs);

// 批量操作 (暂时屏蔽登录验证)
router.patch('/bulk', rateLimiter.general, validateRequest, bulkUpdateWebhooks);

// Webhook模板 (暂时屏蔽登录验证)
router.get('/templates/list', rateLimiter.general, getWebhookTemplates);
router.post('/templates', rateLimiter.general, validateRequest, createWebhookTemplate);
router.put('/templates/:templateId', rateLimiter.general, validateRequest, updateWebhookTemplate);
router.delete('/templates/:templateId', rateLimiter.general, deleteWebhookTemplate);

// 接收外部Webhook（无需认证）
router.post('/incoming/:provider', rateLimiter.general, validateWebhookSignature, handleIncomingWebhook);
router.post('/incoming/:provider/:webhookId', rateLimiter.general, validateWebhookSignature, handleIncomingWebhook);

export default router;