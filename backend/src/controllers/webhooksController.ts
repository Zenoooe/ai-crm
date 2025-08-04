/**
 * Webhook控制器
 * 处理Webhook的创建、管理、日志记录和外部回调
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { WebhookService } from '../services/webhookService';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * 创建Webhook
 */
export const createWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';

  const webhook = await WebhookService.createWebhook(userId, req.body);
  
  res.status(201).json({
    success: true,
    data: webhook,
    message: 'Webhook创建成功'
  });
});

/**
 * 获取Webhook列表
 */
export const getWebhooks = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';

  const { page = 1, limit = 20, status, event } = req.query;
  
  const webhooks = await WebhookService.getWebhooks(userId, {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    status: status as string,
    event: event as string
  });
  
  res.json({
    success: true,
    data: webhooks
  });
});

/**
 * 获取单个Webhook
 */
export const getWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  const webhook = await WebhookService.getWebhook(userId, webhookId);
  
  res.json({
    success: true,
    data: webhook
  });
});

/**
 * 更新Webhook
 */
export const updateWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  const webhook = await WebhookService.updateWebhook(userId, webhookId, req.body);
  
  res.json({
    success: true,
    data: webhook,
    message: 'Webhook更新成功'
  });
});

/**
 * 删除Webhook
 */
export const deleteWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  await WebhookService.deleteWebhook(userId, webhookId);
  
  res.json({
    success: true,
    message: 'Webhook删除成功'
  });
});

/**
 * 测试Webhook
 */
export const testWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  const result = await WebhookService.testWebhook(userId, webhookId, req.body);
  
  res.json({
    success: true,
    data: result,
    message: 'Webhook测试完成'
  });
});

/**
 * 暂停Webhook
 */
export const pauseWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  await WebhookService.pauseWebhook(userId, webhookId);
  
  res.json({
    success: true,
    message: 'Webhook已暂停'
  });
});

/**
 * 恢复Webhook
 */
export const resumeWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  await WebhookService.resumeWebhook(userId, webhookId);
  
  res.json({
    success: true,
    message: 'Webhook已恢复'
  });
});

/**
 * 重试Webhook
 */
export const retryWebhook = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId, logId } = req.params;

  if (!webhookId || !logId) {
    throw new ApiError(400, 'Webhook ID和日志ID不能为空');
  }

  const result = await WebhookService.retryWebhook(userId, webhookId, logId);
  
  res.json({
    success: true,
    data: result,
    message: 'Webhook重试完成'
  });
});

/**
 * 获取Webhook日志
 */
export const getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  const { page = 1, limit = 50, status, startDate, endDate } = req.query;
  
  const logs = await WebhookService.getWebhookLogs(userId, webhookId, {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    status: status as string,
    startDate: startDate as string,
    endDate: endDate as string
  });
  
  res.json({
    success: true,
    data: logs
  });
});

/**
 * 获取Webhook统计
 */
export const getWebhookStats = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  const { period = '7d' } = req.query;
  
  const stats = await WebhookService.getWebhookStats(userId, webhookId, period as string);
  
  res.json({
    success: true,
    data: stats
  });
});

/**
 * 导出Webhook日志
 */
export const exportWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { webhookId } = req.params;

  if (!webhookId) {
    throw new ApiError(400, 'Webhook ID不能为空');
  }

  const { format = 'csv', startDate, endDate } = req.query;
  
  const exportData = await WebhookService.exportWebhookLogs(userId, webhookId, {
    format: format as string,
    startDate: startDate as string,
    endDate: endDate as string
  });
  
  res.json({
    success: true,
    data: exportData,
    message: 'Webhook日志导出成功'
  });
});

/**
 * 批量更新Webhook
 */
export const bulkUpdateWebhooks = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';

  const { webhookIds, action, data } = req.body;
  
  if (!webhookIds || !Array.isArray(webhookIds) || webhookIds.length === 0) {
    throw new ApiError(400, 'Webhook ID列表不能为空');
  }

  if (!action) {
    throw new ApiError(400, '操作类型不能为空');
  }

  const result = await WebhookService.bulkUpdateWebhooks(userId, webhookIds, action, data);
  
  res.json({
    success: true,
    data: result,
    message: '批量操作完成'
  });
});

/**
 * 获取Webhook模板
 */
export const getWebhookTemplates = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';

  const { category, provider } = req.query;
  
  const templates = await WebhookService.getWebhookTemplates({
    category: category as string,
    provider: provider as string
  });
  
  res.json({
    success: true,
    data: templates
  });
});

/**
 * 创建Webhook模板
 */
export const createWebhookTemplate = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';

  const template = await WebhookService.createWebhookTemplate(userId, req.body);
  
  res.status(201).json({
    success: true,
    data: template,
    message: 'Webhook模板创建成功'
  });
});

/**
 * 更新Webhook模板
 */
export const updateWebhookTemplate = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { templateId } = req.params;

  if (!templateId) {
    throw new ApiError(400, '模板ID不能为空');
  }

  const template = await WebhookService.updateWebhookTemplate(userId, templateId, req.body);
  
  res.json({
    success: true,
    data: template,
    message: 'Webhook模板更新成功'
  });
});

/**
 * 删除Webhook模板
 */
export const deleteWebhookTemplate = asyncHandler(async (req: Request, res: Response) => {
  // 暂时屏蔽登录验证，使用默认用户ID
  const userId = req.user?.id || 'default-user-id';
  const { templateId } = req.params;

  if (!templateId) {
    throw new ApiError(400, '模板ID不能为空');
  }

  await WebhookService.deleteWebhookTemplate(userId, templateId);
  
  res.json({
    success: true,
    message: 'Webhook模板删除成功'
  });
});

/**
 * 处理外部Webhook回调
 */
export const handleIncomingWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { provider, webhookId } = req.params;
  const payload = req.body;
  const headers = req.headers;
  
  if (!provider) {
    throw new ApiError(400, '提供商不能为空');
  }

  try {
    const result = await WebhookService.handleIncomingWebhook(provider, webhookId, payload, headers);
    
    res.json({
      success: true,
      data: result,
      message: 'Webhook处理成功'
    });
  } catch (error) {
    logger.error('处理外部Webhook失败', error as Error);
    
    // 对于外部Webhook，即使处理失败也要返回200状态码
    // 避免第三方服务重复发送
    res.status(200).json({
      success: false,
      message: 'Webhook处理失败',
      error: (error as Error).message
    });
  }
});

/**
 * 验证Webhook签名中间件
 */
export const validateWebhookSignature = asyncHandler(async (req: Request, res: Response, next: any) => {
  const { provider } = req.params;
  const signature = req.headers['x-signature'] || req.headers['x-hub-signature'] || req.headers['x-webhook-signature'];
  const payload = req.body;
  
  try {
    const isValid = await WebhookService.validateWebhookSignature(provider, signature as string, payload);
    
    if (!isValid) {
      throw new ApiError(401, 'Webhook签名验证失败');
    }
    
    next();
  } catch (error) {
    logger.error('Webhook签名验证失败', error as Error);
    res.status(401).json({
      success: false,
      message: 'Webhook签名验证失败'
    });
  }
});