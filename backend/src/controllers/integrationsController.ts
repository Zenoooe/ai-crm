/**
 * 集成控制器
 * 处理第三方集成相关的请求
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { IntegrationService } from '../services/integrationService';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * 获取可用集成列表
 */
export const getAvailableIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const { category, search } = req.query;
  
  const integrations = await IntegrationService.getAvailableIntegrations({
    category: category as string,
    search: search as string
  });
  
  res.json({
    success: true,
    data: integrations
  });
});

/**
 * 获取用户集成列表
 */
export const getUserIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { page = 1, limit = 10, status, provider } = req.query;
  
  const result = await IntegrationService.getUserIntegrations(userId, {
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 20,
    status: status as string,
    provider: provider as string
  });
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * 获取单个集成详情
 */
export const getIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  
  const integration = await IntegrationService.getIntegration(userId, integrationId);
  
  res.json({
    success: true,
    data: integration
  });
});

/**
 * 创建集成
 */
export const createIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const integrationData = req.body;
  
  const integration = await IntegrationService.createIntegration(userId, integrationData);
  
  res.status(201).json({
    success: true,
    message: '集成创建成功',
    data: integration
  });
});

/**
 * 更新集成
 */
export const updateIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  const updateData = req.body;
  
  const integration = await IntegrationService.updateIntegration(userId, integrationId, updateData);
  
  res.json({
    success: true,
    message: '集成更新成功',
    data: integration
  });
});

/**
 * 删除集成
 */
export const deleteIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  
  await IntegrationService.deleteIntegration(userId, integrationId);
  
  res.json({
    success: true,
    message: '集成删除成功'
  });
});

/**
 * 测试集成连接
 */
export const testIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  
  const result = await IntegrationService.testIntegration(userId, integrationId);
  
  res.json({
    success: true,
    message: '集成测试完成',
    data: result
  });
});

/**
 * 启用集成
 */
export const enableIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  
  await IntegrationService.enableIntegration(userId, integrationId);
  
  res.json({
    success: true,
    message: '集成已启用'
  });
});

/**
 * 禁用集成
 */
export const disableIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  
  await IntegrationService.disableIntegration(userId, integrationId);
  
  res.json({
    success: true,
    message: '集成已禁用'
  });
});

/**
 * 同步集成数据
 */
export const syncIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  const { force } = req.body;
  
  const result = await IntegrationService.syncIntegration(userId, integrationId, force);
  
  res.json({
    success: true,
    message: '数据同步已开始',
    data: result
  });
});

/**
 * 获取集成同步历史
 */
export const getSyncHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  const { page, limit } = req.query;
  
  const result = await IntegrationService.getSyncHistory(userId, integrationId, {
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 20
  });
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * 获取集成统计
 */
export const getIntegrationStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  const { period } = req.query;
  
  const stats = await IntegrationService.getIntegrationStats(userId, integrationId, period as string);
  
  res.json({
    success: true,
    data: stats
  });
});

/**
 * 发起OAuth授权流程
 */
export const initiateOAuthFlow = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider } = req.params;
  const { redirectUri } = req.query;
  
  const authUrl = await IntegrationService.initiateOAuthFlow(userId, provider, redirectUri as string);
  
  res.json({
    success: true,
    data: {
      authUrl
    }
  });
});

/**
 * 处理OAuth回调
 */
export const handleOAuthCallback = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider } = req.params;
  const { code, state } = req.query;
  
  const result = await IntegrationService.handleOAuthCallback(userId, provider, {
    code: code as string,
    state: state as string
  });
  
  res.json({
    success: true,
    message: 'OAuth授权成功',
    data: result
  });
});

/**
 * 刷新OAuth令牌
 */
export const refreshOAuthToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, integrationId } = req.params;
  
  const result = await IntegrationService.refreshOAuthToken(userId, provider, integrationId);
  
  res.json({
    success: true,
    message: '令牌刷新成功',
    data: result
  });
});

/**
 * 获取邮件服务提供商
 */
export const getEmailProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getEmailProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 配置邮件集成
 */
export const configureEmailIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, config } = req.body;
  
  const integration = await IntegrationService.configureEmailIntegration(userId, provider, config);
  
  res.json({
    success: true,
    message: '邮件集成配置成功',
    data: integration
  });
});

/**
 * 测试邮件集成
 */
export const testEmailIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, config } = req.body;
  
const result = await IntegrationService.testEmailIntegration(userId, {
    provider,
    config
  });
  
  res.json({
    success: true,
    message: '测试邮件发送成功',
    data: result
  });
});

/**
 * 获取CRM服务提供商
 */
export const getCRMProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getCRMProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 从CRM导入数据
 */
export const importFromCRM = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, dataTypes } = req.body;
  
  const result = await IntegrationService.importFromCRM(userId, provider, dataTypes);
  
  res.json({
    success: true,
    message: 'CRM数据导入已开始',
    data: result
  });
});

/**
 * 导出数据到CRM
 */
export const exportToCRM = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, dataTypes } = req.body;
  
  const result = await IntegrationService.exportToCRM(userId, provider, dataTypes);
  
  res.json({
    success: true,
    message: 'CRM数据导出已开始',
    data: result
  });
});

/**
 * 获取营销自动化提供商
 */
export const getMarketingProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getMarketingProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 同步营销联系人
 */
export const syncMarketingContacts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, listId } = req.body;
  
  const result = await IntegrationService.syncMarketingContacts(userId, provider, listId);
  
  res.json({
    success: true,
    message: '营销联系人同步已开始',
    data: result
  });
});

/**
 * 创建营销活动
 */
export const createMarketingCampaign = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, campaign } = req.body;
  
  const result = await IntegrationService.createMarketingCampaign(userId, provider, campaign);
  
  res.json({
    success: true,
    message: '营销活动创建成功',
    data: result
  });
});

/**
 * 获取会计软件提供商
 */
export const getAccountingProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getAccountingProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 同步会计发票
 */
export const syncAccountingInvoices = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider } = req.body;
  
  const result = await IntegrationService.syncAccountingInvoices(userId, provider);
  
  res.json({
    success: true,
    message: '会计发票同步已开始',
    data: result
  });
});

/**
 * 创建会计发票
 */
export const createAccountingInvoice = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, invoice } = req.body;
  
  const result = await IntegrationService.createAccountingInvoice(userId, provider, invoice);
  
  res.json({
    success: true,
    message: '会计发票创建成功',
    data: result
  });
});

/**
 * 获取通信工具提供商
 */
export const getCommunicationProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getCommunicationProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 发送通信消息
 */
export const sendCommunicationMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, channel, message } = req.body;
  
  const result = await IntegrationService.sendCommunicationMessage(userId, provider, {
    channel,
    message
  });
  
  res.json({
    success: true,
    message: '消息发送成功',
    data: result
  });
});

/**
 * 获取文件存储提供商
 */
export const getStorageProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getStorageProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 上传文件到存储
 */
export const uploadToStorage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider } = req.body;
  const file = req.file;
  
  if (!file) {
    throw new ApiError(400, '请选择要上传的文件');
  }
  
  const result = await IntegrationService.uploadToStorage(userId, provider, file);
  
  res.json({
    success: true,
    message: '文件上传成功',
    data: result
  });
});

/**
 * 列出存储文件
 */
export const listStorageFiles = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, path } = req.query;
  
  const result = await IntegrationService.listStorageFiles(userId, provider as string, path as string);
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * 获取分析工具提供商
 */
export const getAnalyticsProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getAnalyticsProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 跟踪分析事件
 */
export const trackAnalyticsEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, event } = req.body;
  
  const result = await IntegrationService.trackAnalyticsEvent(userId, provider, event);
  
  res.json({
    success: true,
    message: '事件跟踪成功',
    data: result
  });
});

/**
 * 获取支付处理提供商
 */
export const getPaymentProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getPaymentProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 创建支付发票
 */
export const createPaymentInvoice = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, amount, currency, customer } = req.body;
  
  const result = await IntegrationService.createPaymentInvoice(userId, provider, {
    amount,
    currency,
    customer
  });
  
  res.json({
    success: true,
    message: '支付发票创建成功',
    data: result
  });
});

/**
 * 处理支付
 */
export const processPayment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, paymentMethod, amount } = req.body;
  
  const result = await IntegrationService.processPayment(userId, provider, {
    paymentMethod,
    amount
  });
  
  res.json({
    success: true,
    message: '支付处理成功',
    data: result
  });
});

/**
 * 获取客服工具提供商
 */
export const getSupportProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getSupportProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 创建客服工单
 */
export const createSupportTicket = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, ticket } = req.body;
  
  const result = await IntegrationService.createSupportTicket(userId, provider, ticket);
  
  res.json({
    success: true,
    message: '客服工单创建成功',
    data: result
  });
});

/**
 * 获取社交媒体提供商
 */
export const getSocialProviders = asyncHandler(async (req: Request, res: Response) => {
  const providers = await IntegrationService.getSocialProviders();
  
  res.json({
    success: true,
    data: providers
  });
});

/**
 * 发布到社交媒体
 */
export const postToSocial = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { provider, content, platforms } = req.body;
  
  const result = await IntegrationService.postToSocial(userId, provider, {
    content,
    platforms
  });
  
  res.json({
    success: true,
    message: '社交媒体发布成功',
    data: result
  });
});

/**
 * 批量同步集成
 */
export const bulkSyncIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationIds } = req.body;
  
  const result = await IntegrationService.bulkSyncIntegrations(userId, integrationIds);
  
  res.json({
    success: true,
    message: '批量同步已开始',
    data: result
  });
});

/**
 * 批量启用集成
 */
export const bulkEnableIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationIds } = req.body;
  
  const result = await IntegrationService.bulkEnableIntegrations(userId, integrationIds);
  
  res.json({
    success: true,
    message: '批量启用成功',
    data: result
  });
});

/**
 * 批量禁用集成
 */
export const bulkDisableIntegrations = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationIds } = req.body;
  
  const result = await IntegrationService.bulkDisableIntegrations(userId, integrationIds);
  
  res.json({
    success: true,
    message: '批量禁用成功',
    data: result
  });
});

/**
 * 获取集成市场
 */
export const getIntegrationMarketplace = asyncHandler(async (req: Request, res: Response) => {
  const { category, search, page, limit } = req.query;
  
  const result = await IntegrationService.getIntegrationMarketplace({
    category: category as string,
    search: search as string,
    page: parseInt(page as string) || 1,
    limit: parseInt(limit as string) || 20
  });
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * 获取市场集成详情
 */
export const getMarketplaceIntegration = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.params;
  
  const integration = await IntegrationService.getMarketplaceIntegration(integrationId);
  
  res.json({
    success: true,
    data: integration
  });
});

/**
 * 安装市场集成
 */
export const installMarketplaceIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { integrationId } = req.params;
  const { config } = req.body;
  
  const result = await IntegrationService.installMarketplaceIntegration(userId, integrationId, config);
  
  res.json({
    success: true,
    message: '集成安装成功',
    data: result
  });
});

/**
 * 创建自定义集成
 */
export const createCustomIntegration = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }
  const { name, description, type, config, endpoints } = req.body;
  
  const integration = await IntegrationService.createCustomIntegration(userId, {
    name,
    type,
    config
  });
  
  res.status(201).json({
    success: true,
    message: '自定义集成创建成功',
    data: integration
  });
});

/**
 * 获取自定义集成模板
 */
export const getCustomIntegrationTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  
  const templates = await IntegrationService.getCustomIntegrationTemplates(type as string);
  
  res.json({
    success: true,
    data: templates
  });
});