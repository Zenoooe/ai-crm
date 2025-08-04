/**
 * 仪表板控制器
 * 处理仪表板相关的业务逻辑
 */
import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboardService';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';

export class DashboardController {
  /**
   * 获取仪表板概览数据
   */
  static getOverview = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month', timezone = 'UTC' } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const overview = await DashboardService.getOverview(userId, {
      period: period as string,
      timezone: timezone as string
    });

    res.json({
      success: true,
      data: overview,
      message: '仪表板概览数据获取成功'
    });
  });

  /**
   * 获取销售统计数据
   */
  static getSalesStats = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, groupBy = 'day', includeForecasts = false } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const salesStats = await DashboardService.getSalesStats(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      groupBy: groupBy as string,
      includeForecasts: includeForecasts === 'true'
    });

    res.json({
      success: true,
      data: salesStats,
      message: '销售统计数据获取成功'
    });
  });

  /**
   * 获取客户统计数据
   */
  static getCustomerStats = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month', segmentBy } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const customerStats = await DashboardService.getCustomerStats(userId, {
      period: period as string,
      segmentBy: segmentBy as string
    });

    res.json({
      success: true,
      data: customerStats,
      message: '客户统计数据获取成功'
    });
  });

  /**
   * 获取活动统计数据
   */
  static getActivityStats = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'week', activityTypes, userId: targetUserId } = req.query;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw new ApiError(401, '用户未认证');
    }

    const activityStats = await DashboardService.getActivityStats(currentUserId, {
      period: period as string,
      activityTypes: activityTypes as string[],
      targetUserId: targetUserId as string
    });

    res.json({
      success: true,
      data: activityStats,
      message: '活动统计数据获取成功'
    });
  });

  /**
   * 获取销售漏斗数据
   */
  static getSalesFunnel = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month', includeConversionRates = false } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const salesFunnel = await DashboardService.getSalesFunnel(userId, {
      period: period as string,
      includeConversionRates: includeConversionRates === 'true'
    });

    res.json({
      success: true,
      data: salesFunnel,
      message: '销售漏斗数据获取成功'
    });
  });

  /**
   * 获取收入趋势
   */
  static getRevenueTrends = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month', compareWithPrevious = false, currency = 'USD' } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const revenueTrends = await DashboardService.getRevenueTrends(userId, {
      period: period as string,
      compareWithPrevious: compareWithPrevious === 'true',
      currency: currency as string
    });

    res.json({
      success: true,
      data: revenueTrends,
      message: '收入趋势数据获取成功'
    });
  });

  /**
   * 获取团队绩效数据
   */
  static getTeamPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month', teamId, metrics } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const teamPerformance = await DashboardService.getTeamPerformance(userId, {
      period: period as string,
      teamId: teamId as string,
      metrics: metrics as string[]
    });

    res.json({
      success: true,
      data: teamPerformance,
      message: '团队绩效数据获取成功'
    });
  });

  /**
   * 获取最近活动
   */
  static getRecentActivities = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 20, offset = 0, activityTypes } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const recentActivities = await DashboardService.getRecentActivities(userId, {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      activityTypes: activityTypes as string[]
    });

    res.json({
      success: true,
      data: recentActivities,
      message: '最近活动数据获取成功'
    });
  });

  /**
   * 获取待办事项
   */
  static getTasks = asyncHandler(async (req: Request, res: Response) => {
    const { status, priority, limit = 20 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const tasks = await DashboardService.getTasks(userId, {
      status: status as string,
      priority: priority as string,
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: tasks,
      message: '待办事项获取成功'
    });
  });

  /**
   * 获取通知
   */
  static getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { unreadOnly = false, limit = 20, types } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const notifications = await DashboardService.getNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: parseInt(limit as string),
      types: types as string[]
    });

    res.json({
      success: true,
      data: notifications,
      message: '通知获取成功'
    });
  });

  /**
   * 获取关键指标
   */
  static getKPIs = asyncHandler(async (req: Request, res: Response) => {
    const { period = 'month', metrics, compareWithTarget = false } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const kpis = await DashboardService.getKPIs(userId, {
      period: period as string,
      metrics: metrics as string[],
      compareWithTarget: compareWithTarget === 'true'
    });

    res.json({
      success: true,
      data: kpis,
      message: '关键指标获取成功'
    });
  });

  /**
   * 获取预测数据
   */
  static getForecasts = asyncHandler(async (req: Request, res: Response) => {
    const { type = 'sales', period = 'month', confidence = 0.8 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const forecasts = await DashboardService.getForecasts(userId, {
      type: type as string,
      period: period as string,
      confidence: parseFloat(confidence as string)
    });

    res.json({
      success: true,
      data: forecasts,
      message: '预测数据获取成功'
    });
  });

  /**
   * 获取竞争对手分析
   */
  static getCompetitorAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const { competitors, metrics } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const competitorAnalysis = await DashboardService.getCompetitorAnalysis(userId, {
      competitors: competitors as string[],
      metrics: metrics as string[]
    });

    res.json({
      success: true,
      data: competitorAnalysis,
      message: '竞争对手分析获取成功'
    });
  });

  /**
   * 获取市场趋势
   */
  static getMarketTrends = asyncHandler(async (req: Request, res: Response) => {
    const { industry, region, period = 'month' } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const marketTrends = await DashboardService.getMarketTrends(userId, {
      industry: industry as string,
      region: region as string,
      period: period as string
    });

    res.json({
      success: true,
      data: marketTrends,
      message: '市场趋势数据获取成功'
    });
  });

  /**
   * 获取仪表板配置
   */
  static getDashboardConfig = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const config = await DashboardService.getDashboardConfig(userId);

    res.json({
      success: true,
      data: config,
      message: '仪表板配置获取成功'
    });
  });

  /**
   * 更新仪表板配置
   */
  static updateDashboardConfig = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const configData = req.body;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const updatedConfig = await DashboardService.updateDashboardConfig(userId, configData);

    res.json({
      success: true,
      data: updatedConfig,
      message: '仪表板配置更新成功'
    });
  });

  /**
   * 导出仪表板数据
   */
  static exportDashboard = asyncHandler(async (req: Request, res: Response) => {
    const { format = 'pdf', sections } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, '用户未认证');
    }

    const exportData = await DashboardService.exportDashboard(userId, {
      format: format as string,
      sections: sections as string[]
    });

    res.json({
      success: true,
      data: exportData,
      message: '仪表板数据导出成功'
    });
  });
}