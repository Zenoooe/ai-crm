/**
 * 设置路由
 * 处理系统设置、用户偏好、团队配置等相关的API端点
 */
import express from 'express';
import { auth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { validateRequest } from '../middleware/validation';
import {
  getUserSettings,
  updateUserSettings,
  getSystemSettings,
  updateSystemSettings,
  getTeamSettings,
  updateTeamSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getIntegrationSettings,
  updateIntegrationSettings,
  getWorkflowSettings,
  updateWorkflowSettings,
  getCustomFieldSettings,
  updateCustomFieldSettings,
  getEmailTemplateSettings,
  updateEmailTemplateSettings,
  getDataRetentionSettings,
  updateDataRetentionSettings,
  getAPISettings,
  updateAPISettings,
  resetSettings,
  exportSettings,
  importSettings,
  getSettingsHistory,
  restoreSettingsVersion
} from '../controllers/settingsController';

const router = express.Router();

// 用户设置
router.get('/user', auth, rateLimiter.general, getUserSettings);
router.put('/user', auth, rateLimiter.general, validateRequest, updateUserSettings);

// 系统设置（管理员权限）
router.get('/system', auth, rateLimiter.general, getSystemSettings);
router.put('/system', auth, rateLimiter.general, validateRequest, updateSystemSettings);

// 团队设置
router.get('/team/:teamId?', auth, rateLimiter.general, getTeamSettings);
router.put('/team/:teamId', auth, rateLimiter.general, validateRequest, updateTeamSettings);

// 通知设置
router.get('/notifications', auth, rateLimiter.general, getNotificationSettings);
router.put('/notifications', auth, rateLimiter.general, validateRequest, updateNotificationSettings);

// 安全设置
router.get('/security', auth, rateLimiter.general, getSecuritySettings);
router.put('/security', auth, rateLimiter.general, validateRequest, updateSecuritySettings);

// 集成设置
router.get('/integrations', auth, rateLimiter.general, getIntegrationSettings);
router.put('/integrations', auth, rateLimiter.general, validateRequest, updateIntegrationSettings);

// 工作流设置
router.get('/workflows', auth, rateLimiter.general, getWorkflowSettings);
router.put('/workflows', auth, rateLimiter.general, validateRequest, updateWorkflowSettings);

// 自定义字段设置
router.get('/custom-fields', auth, rateLimiter.general, getCustomFieldSettings);
router.put('/custom-fields', auth, rateLimiter.general, validateRequest, updateCustomFieldSettings);

// 邮件模板设置
router.get('/email-templates', auth, rateLimiter.general, getEmailTemplateSettings);
router.put('/email-templates', auth, rateLimiter.general, validateRequest, updateEmailTemplateSettings);

// 数据保留设置
router.get('/data-retention', auth, rateLimiter.general, getDataRetentionSettings);
router.put('/data-retention', auth, rateLimiter.general, validateRequest, updateDataRetentionSettings);

// API设置
router.get('/api', auth, rateLimiter.general, getAPISettings);
router.put('/api', auth, rateLimiter.general, validateRequest, updateAPISettings);

// 设置管理
router.post('/reset', auth, rateLimiter.general, validateRequest, resetSettings);
router.get('/export', auth, rateLimiter.exports, exportSettings);
router.post('/import', auth, rateLimiter.general, validateRequest, importSettings);

// 设置历史
router.get('/history', auth, rateLimiter.general, getSettingsHistory);
router.post('/restore/:versionId', auth, rateLimiter.general, validateRequest, restoreSettingsVersion);

export default router;