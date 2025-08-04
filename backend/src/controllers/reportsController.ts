/**
 * 报告控制器
 * 处理各种报告和分析相关的HTTP请求
 */
import { Request, Response } from 'express';
import { ReportsService } from '../services/reportsService';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

export class ReportsController {
  /**
   * 获取销售报告
   */
  static getSalesReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      groupBy = 'month',
      userId: targetUserId,
      teamId,
      includeForecasts = false
    } = req.query;

    const report = await ReportsService.generateSalesReport(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      groupBy: groupBy as string,
      targetUserId: targetUserId as string,
      teamId: teamId as string,
      includeForecasts: includeForecasts === 'true'
    });

    res.json({
      success: true,
      message: '销售报告获取成功',
      data: report
    });
  });

  /**
   * 获取收入报告
   */
  static getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      currency = 'USD',
      breakdown = 'product',
      compareWithPrevious = false
    } = req.query;

    const report = await ReportsService.generateRevenueReport(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      currency: currency as string,
      breakdown: breakdown as string,
      compareWithPrevious: compareWithPrevious === 'true'
    });

    res.json({
      success: true,
      message: '收入报告获取成功',
      data: report
    });
  });

  /**
   * 获取客户报告
   */
  static getCustomerReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      segmentBy = 'industry',
      includeChurn = false,
      includeLTV = false
    } = req.query;

    const report = await ReportsService.generateCustomerReport(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      segmentBy: segmentBy as string,
      includeChurn: includeChurn === 'true',
      includeLTV: includeLTV === 'true'
    });

    res.json({
      success: true,
      message: '客户报告获取成功',
      data: report
    });
  });

  /**
   * 获取活动报告
   */
  static getActivityReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      activityTypes,
      userId: targetUserId,
      includeResponseRates = false
    } = req.query;

    const report = await ReportsService.generateActivityReport(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      activityTypes: activityTypes ? (activityTypes as string).split(',') : undefined,
      targetUserId: targetUserId as string,
      includeResponseRates: includeResponseRates === 'true'
    });

    res.json({
      success: true,
      message: '活动报告获取成功',
      data: report
    });
  });

  /**
   * 获取绩效报告
   */
  static getPerformanceReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      teamId,
      metrics,
      includeComparisons = false
    } = req.query;

    const report = await ReportsService.generatePerformanceReport(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      teamId: teamId as string,
      metrics: metrics ? (metrics as string).split(',') : undefined,
      includeComparisons: includeComparisons === 'true'
    });

    res.json({
      success: true,
      message: '绩效报告获取成功',
      data: report
    });
  });

  /**
   * 获取销售管道报告
   */
  static getPipelineReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      includeVelocity = false,
      includeConversionRates = false,
      groupBy = 'stage'
    } = req.query;

    const report = await ReportsService.generatePipelineReport(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      includeVelocity: includeVelocity === 'true',
      includeConversionRates: includeConversionRates === 'true',
      groupBy: groupBy as string
    });

    res.json({
      success: true,
      message: '销售管道报告获取成功',
      data: report
    });
  });

  /**
   * 获取预测报告
   */
  static getForecastReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      period = 'quarter',
      confidence = 80,
      includeScenarios = false,
      method = 'linear'
    } = req.query;

    const report = await ReportsService.generateForecastReport(userId, {
      period: period as string,
      confidence: parseFloat(confidence as string),
      includeScenarios: includeScenarios === 'true',
      method: method as string
    });

    res.json({
      success: true,
      message: '预测报告获取成功',
      data: report
    });
  });

  /**
   * 获取自定义报告
   */
  static getCustomReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { reportId } = req.params;
    const { parameters } = req.query;

    let parsedParameters = {};
    if (parameters) {
      try {
        parsedParameters = JSON.parse(parameters as string);
      } catch (error) {
        throw new ApiError(400, '参数格式无效');
      }
    }

    const report = await ReportsService.getCustomReport(userId, reportId, parsedParameters);

    res.json({
      success: true,
      message: '自定义报告获取成功',
      data: report
    });
  });

  /**
   * 创建自定义报告
   */
  static createCustomReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const reportData = req.body;

    const report = await ReportsService.createCustomReport(userId, reportData);

    res.status(201).json({
      success: true,
      message: '自定义报告创建成功',
      data: report
    });
  });

  /**
   * 更新自定义报告
   */
  static updateCustomReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { reportId } = req.params;
    const updateData = req.body;

    const report = await ReportsService.updateCustomReport(userId, reportId, updateData);

    res.json({
      success: true,
      message: '自定义报告更新成功',
      data: report
    });
  });

  /**
   * 删除自定义报告
   */
  static deleteCustomReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { reportId } = req.params;

    await ReportsService.deleteCustomReport(userId, reportId);

    res.json({
      success: true,
      message: '自定义报告删除成功'
    });
  });

  /**
   * 导出报告
   */
  static exportReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { reportType } = req.params;
    const {
      format,
      startDate,
      endDate,
      includeCharts = false
    } = req.query;

    const exportResult = await ReportsService.exportReport(userId, {
      reportType: reportType as string,
      format: format as string,
      startDate: startDate as string,
      endDate: endDate as string,
      includeCharts: includeCharts === 'true'
    });

    res.json({
      success: true,
      message: '报告导出成功',
      data: exportResult
    });
  });

  /**
   * 创建报告调度
   */
  static scheduleReport = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const scheduleData = req.body;

    const schedule = await ReportsService.createReportSchedule(userId, scheduleData);

    res.status(201).json({
      success: true,
      message: '报告调度创建成功',
      data: schedule
    });
  });

  /**
   * 获取报告调度列表
   */
  static getReportSchedules = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const schedules = await ReportsService.getReportSchedules(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      status: status as string
    });

    res.json({
      success: true,
      message: '报告调度列表获取成功',
      data: schedules
    });
  });

  /**
   * 更新报告调度
   */
  static updateReportSchedule = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { scheduleId } = req.params;
    const updateData = req.body;

    const schedule = await ReportsService.updateReportSchedule(userId, scheduleId, updateData);

    res.json({
      success: true,
      message: '报告调度更新成功',
      data: schedule
    });
  });

  /**
   * 删除报告调度
   */
  static deleteReportSchedule = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { scheduleId } = req.params;

    await ReportsService.deleteReportSchedule(userId, scheduleId);

    res.json({
      success: true,
      message: '报告调度删除成功'
    });
  });

  /**
   * 获取趋势分析
   */
  static getTrendAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      metric,
      period,
      comparison = false
    } = req.query;

    const analysis = await ReportsService.getTrendAnalysis(userId, {
      metrics: [metric as string],
      period: period as string,
      comparison: comparison === 'true'
    });

    res.json({
      success: true,
      message: '趋势分析获取成功',
      data: analysis
    });
  });

  /**
   * 获取队列分析
   */
  static getCohortAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      cohortType,
      period
    } = req.query;

    const analysis = await ReportsService.getCohortAnalysis(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      cohortType: cohortType as string,
      period: period as string
    });

    res.json({
      success: true,
      message: '队列分析获取成功',
      data: analysis
    });
  });

  /**
   * 获取漏斗分析
   */
  static getFunnelAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      startDate,
      endDate,
      includeDropoff = false,
      segmentBy
    } = req.query;

    const analysis = await ReportsService.getFunnelAnalysis(userId, {
      startDate: startDate as string,
      endDate: endDate as string,
      includeDropoff: includeDropoff === 'true',
      segmentBy: segmentBy as string
    });

    res.json({
      success: true,
      message: '漏斗分析获取成功',
      data: analysis
    });
  });

  /**
   * 获取关键绩效指标
   */
  static getKPIs = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const {
      period = 'month',
      compareWithPrevious = false,
      teamId
    } = req.query;

    const kpis = await ReportsService.getKPIs(userId, {
      period: period as string,
      compareWithPrevious: compareWithPrevious === 'true',
      teamId: teamId as string
    });

    res.json({
      success: true,
      message: 'KPI数据获取成功',
      data: kpis
    });
  });
}