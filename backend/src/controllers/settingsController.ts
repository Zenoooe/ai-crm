/**
 * 设置控制器
 * 处理系统设置、用户偏好、团队配置等相关的请求
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { SettingsService } from '@/services/settingsService';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

/**
 * 获取用户设置
 */
export const getUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getUserSettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新用户设置
 */
export const updateUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateUserSettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: '用户设置更新成功'
  });
});

/**
 * 获取系统设置
 */
export const getSystemSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  // 检查管理员权限
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, '权限不足');
  }

  const settings = await SettingsService.getSystemSettings();
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新系统设置
 */
export const updateSystemSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  // 检查管理员权限
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, '权限不足');
  }

  const settings = await SettingsService.updateSystemSettings(req.body, userId);
  
  res.json({
    success: true,
    data: settings,
    message: '系统设置更新成功'
  });
});

/**
 * 获取团队设置
 */
export const getTeamSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const teamId = req.params.teamId;
  
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getTeamSettings(teamId, userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新团队设置
 */
export const updateTeamSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const teamId = req.params.teamId;
  
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  if (!teamId) {
    throw new ApiError(400, '团队ID不能为空');
  }

  const settings = await SettingsService.updateTeamSettings(teamId, req.body, userId);
  
  res.json({
    success: true,
    data: settings,
    message: '团队设置更新成功'
  });
});

/**
 * 获取通知设置
 */
export const getNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getNotificationSettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新通知设置
 */
export const updateNotificationSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateNotificationSettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: '通知设置更新成功'
  });
});

/**
 * 获取安全设置
 */
export const getSecuritySettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getSecuritySettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新安全设置
 */
export const updateSecuritySettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateSecuritySettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: '安全设置更新成功'
  });
});

/**
 * 获取集成设置
 */
export const getIntegrationSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getIntegrationSettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新集成设置
 */
export const updateIntegrationSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateIntegrationSettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: '集成设置更新成功'
  });
});

/**
 * 获取工作流设置
 */
export const getWorkflowSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getWorkflowSettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新工作流设置
 */
export const updateWorkflowSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateWorkflowSettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: '工作流设置更新成功'
  });
});

/**
 * 获取自定义字段设置
 */
export const getCustomFieldSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getCustomFieldSettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新自定义字段设置
 */
export const updateCustomFieldSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateCustomFieldSettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: '自定义字段设置更新成功'
  });
});

/**
 * 获取邮件模板设置
 */
export const getEmailTemplateSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getEmailTemplateSettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新邮件模板设置
 */
export const updateEmailTemplateSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateEmailTemplateSettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: '邮件模板设置更新成功'
  });
});

/**
 * 获取数据保留设置
 */
export const getDataRetentionSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  // 检查管理员权限
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, '权限不足');
  }

  const settings = await SettingsService.getDataRetentionSettings();
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新数据保留设置
 */
export const updateDataRetentionSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  // 检查管理员权限
  if (req.user?.role !== 'admin') {
    throw new ApiError(403, '权限不足');
  }

  const settings = await SettingsService.updateDataRetentionSettings(req.body, userId);
  
  res.json({
    success: true,
    data: settings,
    message: '数据保留设置更新成功'
  });
});

/**
 * 获取API设置
 */
export const getAPISettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.getAPISettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * 更新API设置
 */
export const updateAPISettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const settings = await SettingsService.updateAPISettings(userId, req.body);
  
  res.json({
    success: true,
    data: settings,
    message: 'API设置更新成功'
  });
});

/**
 * 重置设置
 */
export const resetSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const { settingType } = req.body;
  
  const result = await SettingsService.resetSettings(userId, settingType);
  
  res.json({
    success: true,
    data: result,
    message: '设置重置成功'
  });
});

/**
 * 导出设置
 */
export const exportSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const { format = 'json', includeSystem = false } = req.query;
  
  const exportData = await SettingsService.exportSettings(userId, {
    format: format as string,
    includeSystem: includeSystem === 'true'
  });
  
  res.json({
    success: true,
    data: exportData,
    message: '设置导出成功'
  });
});

/**
 * 导入设置
 */
export const importSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const { settingsData, overwrite = false } = req.body;
  
  const result = await SettingsService.importSettings(userId, settingsData, overwrite);
  
  res.json({
    success: true,
    data: result,
    message: '设置导入成功'
  });
});

/**
 * 获取设置历史
 */
export const getSettingsHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  const { page = 1, limit = 20, settingType } = req.query;
  
  const history = await SettingsService.getSettingsHistory(userId, {
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    settingType: settingType as string
  });
  
  res.json({
    success: true,
    data: history
  });
});

/**
 * 恢复设置版本
 */
export const restoreSettingsVersion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { versionId } = req.params;
  
  if (!userId) {
    throw new ApiError(401, '用户未认证');
  }

  if (!versionId) {
    throw new ApiError(400, '版本ID不能为空');
  }

  const result = await SettingsService.restoreSettingsVersion(userId, versionId);
  
  res.json({
    success: true,
    data: result,
    message: '设置版本恢复成功'
  });
});