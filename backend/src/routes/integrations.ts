/**
 * 集成路由
 * 处理第三方集成相关的API端点
 */
import express from 'express';
import { auth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';
import * as integrationsController from '../controllers/integrationsController';

const router = express.Router();

// 应用认证中间件
router.use(auth);

// 获取可用集成列表
router.get(
  '/available',
  rateLimiter.general,
  integrationsController.getAvailableIntegrations
);

// 获取用户集成列表
router.get(
  '/',
  rateLimiter.general,
  integrationsController.getUserIntegrations
);

// 获取单个集成详情
router.get(
  '/:integrationId',
  rateLimiter.general,
  integrationsController.getIntegration
);

// 创建集成
router.post(
  '/',
  rateLimiter.general,
  validateRequest({
    name: { required: true, type: 'string' },
    provider: { required: true, type: 'string' },
    config: { required: true, type: 'object' }
  }),
  integrationsController.createIntegration
);

// 更新集成
router.put(
  '/:integrationId',
  rateLimiter.general,
  validateRequest({
    name: { required: false, type: 'string' },
    config: { required: false, type: 'object' },
    active: { required: false, type: 'boolean' }
  }),
  integrationsController.updateIntegration
);

// 删除集成
router.delete(
  '/:integrationId',
  rateLimiter.general,
  integrationsController.deleteIntegration
);

// 测试集成连接
router.post(
  '/:integrationId/test',
  rateLimiter.general,
  integrationsController.testIntegration
);

// 启用集成
router.post(
  '/:integrationId/enable',
  rateLimiter.general,
  integrationsController.enableIntegration
);

// 禁用集成
router.post(
  '/:integrationId/disable',
  rateLimiter.general,
  integrationsController.disableIntegration
);

// 同步集成数据
router.post(
  '/:integrationId/sync',
  rateLimiter.general,
  integrationsController.syncIntegration
);

// 获取集成同步历史
router.get(
  '/:integrationId/sync-history',
  rateLimiter.general,
  integrationsController.getSyncHistory
);

// 获取集成统计
router.get(
  '/:integrationId/stats',
  rateLimiter.general,
  integrationsController.getIntegrationStats
);

// OAuth授权相关
router.get(
  '/oauth/:provider/authorize',
  rateLimiter.general,
  integrationsController.initiateOAuthFlow
);

router.get(
  '/oauth/:provider/callback',
  rateLimiter.general,
  integrationsController.handleOAuthCallback
);

router.post(
  '/oauth/:provider/refresh',
  rateLimiter.general,
  integrationsController.refreshOAuthToken
);

// 邮件集成
router.get(
  '/email/providers',
  rateLimiter.general,
  integrationsController.getEmailProviders
);

router.post(
  '/email/configure',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    config: { required: true, type: 'object' }
  }),
  integrationsController.configureEmailIntegration
);

router.post(
  '/email/test',
  rateLimiter.general,
  validateRequest({
    to: { required: true, type: 'string' },
    subject: { required: true, type: 'string' },
    content: { required: true, type: 'string' }
  }),
  integrationsController.testEmailIntegration
);

// CRM集成
router.get(
  '/crm/providers',
  rateLimiter.general,
  integrationsController.getCRMProviders
);

router.post(
  '/crm/import',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    dataTypes: { required: true, type: 'array' }
  }),
  integrationsController.importFromCRM
);

router.post(
  '/crm/export',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    dataTypes: { required: true, type: 'array' }
  }),
  integrationsController.exportToCRM
);

// 营销自动化集成
router.get(
  '/marketing/providers',
  rateLimiter.general,
  integrationsController.getMarketingProviders
);

router.post(
  '/marketing/sync-contacts',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    listId: { required: false, type: 'string' }
  }),
  integrationsController.syncMarketingContacts
);

router.post(
  '/marketing/create-campaign',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    campaign: { required: true, type: 'object' }
  }),
  integrationsController.createMarketingCampaign
);

// 会计软件集成
router.get(
  '/accounting/providers',
  rateLimiter.general,
  integrationsController.getAccountingProviders
);

router.post(
  '/accounting/sync-invoices',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' }
  }),
  integrationsController.syncAccountingInvoices
);

router.post(
  '/accounting/create-invoice',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    invoice: { required: true, type: 'object' }
  }),
  integrationsController.createAccountingInvoice
);

// 通信工具集成
router.get(
  '/communication/providers',
  rateLimiter.general,
  integrationsController.getCommunicationProviders
);

router.post(
  '/communication/send-message',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    channel: { required: true, type: 'string' },
    message: { required: true, type: 'string' }
  }),
  integrationsController.sendCommunicationMessage
);

// 文件存储集成
router.get(
  '/storage/providers',
  rateLimiter.general,
  integrationsController.getStorageProviders
);

router.post(
  '/storage/upload',
  rateLimiter.fileUpload,
  integrationsController.uploadToStorage
);

router.get(
  '/storage/files',
  rateLimiter.general,
  integrationsController.listStorageFiles
);

// 分析工具集成
router.get(
  '/analytics/providers',
  rateLimiter.general,
  integrationsController.getAnalyticsProviders
);

router.post(
  '/analytics/track-event',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    event: { required: true, type: 'object' }
  }),
  integrationsController.trackAnalyticsEvent
);

// 支付处理集成
router.get(
  '/payment/providers',
  rateLimiter.general,
  integrationsController.getPaymentProviders
);

router.post(
  '/payment/create-invoice',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    amount: { required: true, type: 'number' },
    currency: { required: true, type: 'string' },
    customer: { required: true, type: 'object' }
  }),
  integrationsController.createPaymentInvoice
);

router.post(
  '/payment/process',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    paymentMethod: { required: true, type: 'string' },
    amount: { required: true, type: 'number' }
  }),
  integrationsController.processPayment
);

// 客服工具集成
router.get(
  '/support/providers',
  rateLimiter.general,
  integrationsController.getSupportProviders
);

router.post(
  '/support/create-ticket',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    ticket: { required: true, type: 'object' }
  }),
  integrationsController.createSupportTicket
);

// 社交媒体集成
router.get(
  '/social/providers',
  rateLimiter.general,
  integrationsController.getSocialProviders
);

router.post(
  '/social/post',
  rateLimiter.general,
  validateRequest({
    provider: { required: true, type: 'string' },
    content: { required: true, type: 'string' },
    platforms: { required: true, type: 'array' }
  }),
  integrationsController.postToSocial
);

// 批量操作
router.post(
  '/bulk/sync',
  rateLimiter.bulk,
  validateRequest({
    integrationIds: { required: true, type: 'array' }
  }),
  integrationsController.bulkSyncIntegrations
);

router.post(
  '/bulk/enable',
  rateLimiter.bulk,
  validateRequest({
    integrationIds: { required: true, type: 'array' }
  }),
  integrationsController.bulkEnableIntegrations
);

router.post(
  '/bulk/disable',
  rateLimiter.bulk,
  validateRequest({
    integrationIds: { required: true, type: 'array' }
  }),
  integrationsController.bulkDisableIntegrations
);

// 集成市场
router.get(
  '/marketplace',
  rateLimiter.general,
  integrationsController.getIntegrationMarketplace
);

router.get(
  '/marketplace/:integrationId',
  rateLimiter.general,
  integrationsController.getMarketplaceIntegration
);

router.post(
  '/marketplace/:integrationId/install',
  rateLimiter.general,
  integrationsController.installMarketplaceIntegration
);

// 自定义集成
router.post(
  '/custom',
  rateLimiter.general,
  validateRequest({
    name: { required: true, type: 'string' },
    type: { required: true, type: 'string' },
    config: { required: true, type: 'object' }
  }),
  integrationsController.createCustomIntegration
);

router.get(
  '/custom/templates',
  rateLimiter.general,
  integrationsController.getCustomIntegrationTemplates
);

export default router;