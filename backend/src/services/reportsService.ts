/**
 * 报告服务
 * 处理各种报告生成和分析的业务逻辑
 */
import { Contact } from '../models/Contact';
import { Interaction } from '../models/Interaction';
import { Opportunity } from '../models/Opportunity';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

interface ReportOptions {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  targetUserId?: string;
  teamId?: string;
  includeForecasts?: boolean;
  currency?: string;
  breakdown?: string;
  compareWithPrevious?: boolean;
  segmentBy?: string;
  includeChurn?: boolean;
  includeLTV?: boolean;
  activityTypes?: string[];
  includeResponseRates?: boolean;
  metrics?: string[];
  includeComparisons?: boolean;
  includeVelocity?: boolean;
  includeConversionRates?: boolean;
  period?: string;
  confidence?: number;
  includeScenarios?: boolean;
  method?: string;
  reportType?: string;
  format?: string;
  includeCharts?: boolean;
  comparison?: boolean;
  cohortType?: string;
  includeDropoff?: boolean;
  page?: number;
  limit?: number;
  status?: string;
}

export class ReportsService {
  /**
   * 生成销售报告
   */
  static async generateSalesReport(userId: string, options: ReportOptions): Promise<any> {
    try {
      const { startDate, endDate, groupBy, targetUserId, teamId, includeForecasts } = options;
      const dateRange = this.getDateRange(startDate, endDate);
      const queryUserId = targetUserId || userId;

      // 获取销售数据
      const salesData = await Opportunity.aggregate([
        {
          $match: {
            assignedTo: queryUserId,
            createdAt: { $gte: dateRange.start, $lte: dateRange.end }
          }
        },
        {
          $group: {
            _id: this.getGroupByExpression(groupBy || 'month'),
            totalSales: { $sum: { $cond: [{ $eq: ['$stage', 'closed_won'] }, '$value', 0] } },
            totalOpportunities: { $sum: 1 },
            wonOpportunities: { $sum: { $cond: [{ $eq: ['$stage', 'closed_won'] }, 1, 0] } },
            averageDealSize: { $avg: { $cond: [{ $eq: ['$stage', 'closed_won'] }, '$value', null] } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      // 计算转化率
      const conversionRates = salesData.map(item => ({
        ...item,
        conversionRate: item.totalOpportunities > 0 ? (item.wonOpportunities / item.totalOpportunities) * 100 : 0
      }));

      let forecasts = null;
      if (includeForecasts) {
        forecasts = await this.generateSalesForecasts(queryUserId, dateRange);
      }

      return {
        salesData: conversionRates,
        summary: {
          totalSales: salesData.reduce((sum, item) => sum + item.totalSales, 0),
          totalOpportunities: salesData.reduce((sum, item) => sum + item.totalOpportunities, 0),
          averageConversionRate: salesData.length > 0 ? 
            salesData.reduce((sum, item) => sum + (item.wonOpportunities / item.totalOpportunities || 0), 0) / salesData.length * 100 : 0
        },
        forecasts
      };
    } catch (error) {
      logger.error('生成销售报告失败', error as Error);
      throw error;
    }
  }

  /**
   * 生成收入报告
   */
  static async generateRevenueReport(userId: string, options: ReportOptions): Promise<any> {
    try {
      const { startDate, endDate, currency, breakdown, compareWithPrevious } = options;
      const dateRange = this.getDateRange(startDate, endDate);

      const revenueData = await Opportunity.aggregate([
        {
          $match: {
            assignedTo: userId,
            stage: 'closed_won',
            closedAt: { $gte: dateRange.start, $lte: dateRange.end },
            currency: currency || 'USD'
          }
        },
        {
          $group: {
            _id: this.getBreakdownExpression(breakdown || 'product'),
            revenue: { $sum: '$value' },
            count: { $sum: 1 },
            averageDealSize: { $avg: '$value' }
          }
        },
        {
          $sort: { revenue: -1 }
        }
      ]);

      let previousPeriodData = null;
      if (compareWithPrevious) {
        const previousDateRange = this.getPreviousDateRange(startDate, endDate);
        previousPeriodData = await this.getRevenueData(userId, previousDateRange, currency, breakdown);
      }

      return {
        revenueData,
        previousPeriodData,
        summary: {
          totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
          totalDeals: revenueData.reduce((sum, item) => sum + item.count, 0),
          averageDealSize: revenueData.length > 0 ? 
            revenueData.reduce((sum, item) => sum + item.averageDealSize, 0) / revenueData.length : 0
        }
      };
    } catch (error) {
      logger.error('生成收入报告失败', error as Error);
      throw error;
    }
  }

  /**
   * 生成客户报告
   */
  static async generateCustomerReport(userId: string, options: ReportOptions): Promise<any> {
    try {
      const { startDate, endDate, segmentBy, includeChurn, includeLTV } = options;
      const dateRange = this.getDateRange(startDate, endDate);

      const customerData = await Contact.aggregate([
        {
          $match: {
            createdBy: userId,
            createdAt: { $gte: dateRange.start, $lte: dateRange.end }
          }
        },
        {
          $group: {
            _id: this.getSegmentExpression(segmentBy || 'industry'),
            count: { $sum: 1 },
            newCustomers: { $sum: { $cond: [{ $gte: ['$createdAt', dateRange.start] }, 1, 0] } }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      let churnData = null;
      if (includeChurn) {
        churnData = await this.calculateChurnData(userId, dateRange);
      }

      let ltvData = null;
      if (includeLTV) {
        ltvData = await this.calculateLTVData(userId, dateRange);
      }

      return {
        customerData,
        churnData,
        ltvData,
        summary: {
          totalCustomers: customerData.reduce((sum, item) => sum + item.count, 0),
          newCustomers: customerData.reduce((sum, item) => sum + item.newCustomers, 0)
        }
      };
    } catch (error) {
      logger.error('生成客户报告失败', error as Error);
      throw error;
    }
  }

  /**
   * 生成活动报告
   */
  static async generateActivityReport(userId: string, options: ReportOptions): Promise<any> {
    try {
      const { startDate, endDate, activityTypes, targetUserId, includeResponseRates } = options;
      const dateRange = this.getDateRange(startDate, endDate);
      const queryUserId = targetUserId || userId;

      const query: any = {
        createdBy: queryUserId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (activityTypes && activityTypes.length > 0) {
        query.type = { $in: activityTypes };
      }

      const activityData = await Interaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgDuration: { $avg: '$duration' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      let responseRates = null;
      if (includeResponseRates) {
        responseRates = await this.calculateResponseRates(queryUserId, dateRange);
      }

      return {
        activityData,
        responseRates,
        summary: {
          totalActivities: activityData.reduce((sum, item) => sum + item.count, 0)
        }
      };
    } catch (error) {
      logger.error('生成活动报告失败', error as Error);
      throw error;
    }
  }

  /**
   * 生成绩效报告
   */
  static async generatePerformanceReport(userId: string, options: ReportOptions): Promise<any> {
    try {
      const { startDate, endDate, teamId, metrics, includeComparisons } = options;
      const dateRange = this.getDateRange(startDate, endDate);

      // 模拟绩效数据
      const performanceData = {
        salesPerformance: {
          totalSales: 150000,
          target: 200000,
          achievement: 75
        },
        activityPerformance: {
          totalActivities: 250,
          target: 300,
          achievement: 83
        },
        conversionRate: 15.5,
        averageDealSize: 5000
      };

      return {
        performanceData,
        summary: {
          overallScore: 79,
          ranking: 3,
          improvement: 5.2
        }
      };
    } catch (error) {
      logger.error('生成绩效报告失败', error as Error);
      throw error;
    }
  }

  /**
   * 生成销售管道报告
   */
  static async generatePipelineReport(userId: string, options: ReportOptions): Promise<any> {
    try {
      const { startDate, endDate, includeVelocity, includeConversionRates, groupBy } = options;
      const dateRange = this.getDateRange(startDate, endDate);

      const pipelineData = await Opportunity.aggregate([
        {
          $match: {
            assignedTo: userId,
            createdAt: { $gte: dateRange.start, $lte: dateRange.end }
          }
        },
        {
          $group: {
            _id: '$stage',
            count: { $sum: 1 },
            totalValue: { $sum: '$value' },
            averageValue: { $avg: '$value' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      let velocity = null;
      if (includeVelocity) {
        velocity = await this.calculatePipelineVelocity(userId, dateRange);
      }

      let conversionRates = null;
      if (includeConversionRates) {
        conversionRates = await this.calculateStageConversionRates(userId, dateRange);
      }

      return {
        pipelineData,
        velocity,
        conversionRates,
        summary: {
          totalOpportunities: pipelineData.reduce((sum, item) => sum + item.count, 0),
          totalValue: pipelineData.reduce((sum, item) => sum + item.totalValue, 0)
        }
      };
    } catch (error) {
      logger.error('生成销售管道报告失败', error as Error);
      throw error;
    }
  }

  /**
   * 生成预测报告
   */
  static async generateForecastReport(userId: string, options: ReportOptions): Promise<any> {
    try {
      const { period, confidence, includeScenarios, method } = options;

      // 模拟预测数据
      const forecastData = {
        period: period || 'quarter',
        confidence: confidence || 80,
        method: method || 'linear',
        predictions: [
          { period: '2024-Q1', predicted: 180000, actual: 175000 },
          { period: '2024-Q2', predicted: 195000, actual: null },
          { period: '2024-Q3', predicted: 210000, actual: null }
        ]
      };

      let scenarios = null;
      if (includeScenarios) {
        scenarios = {
          optimistic: forecastData.predictions.map(p => ({ ...p, predicted: p.predicted * 1.2 })),
          pessimistic: forecastData.predictions.map(p => ({ ...p, predicted: p.predicted * 0.8 }))
        };
      }

      return {
        forecastData,
        scenarios,
        summary: {
          nextPeriodPrediction: 195000,
          confidenceLevel: confidence || 80,
          accuracy: 92.5
        }
      };
    } catch (error) {
      logger.error('生成预测报告失败', error as Error);
      throw error;
    }
  }

  // 辅助方法
  private static getDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private static getPreviousDateRange(startDate?: string, endDate?: string): { start: Date; end: Date } {
    const current = this.getDateRange(startDate, endDate);
    const duration = current.end.getTime() - current.start.getTime();
    return {
      start: new Date(current.start.getTime() - duration),
      end: new Date(current.start.getTime())
    };
  }

  private static getGroupByExpression(groupBy: string): any {
    switch (groupBy) {
      case 'day':
        return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      case 'week':
        return { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
      case 'month':
        return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      case 'quarter':
        return {
          $concat: [
            { $toString: { $year: '$createdAt' } },
            '-Q',
            { $toString: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } }
          ]
        };
      case 'year':
        return { $year: '$createdAt' };
      default:
        return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }
  }

  private static getBreakdownExpression(breakdown: string): any {
    switch (breakdown) {
      case 'product':
        return '$products.productId';
      case 'region':
        return '$region';
      case 'salesperson':
        return '$assignedTo';
      case 'source':
        return '$source';
      default:
        return '$source';
    }
  }

  private static getSegmentExpression(segmentBy: string): any {
    switch (segmentBy) {
      case 'industry':
        return '$basicInfo.industry';
      case 'size':
        return '$basicInfo.companySize';
      case 'region':
        return '$basicInfo.region';
      case 'source':
        return '$source';
      default:
        return '$basicInfo.industry';
    }
  }

  // 占位符方法
  private static async generateSalesForecasts(userId: string, dateRange: any): Promise<any[]> {
    return [];
  }

  private static async getRevenueData(userId: string, dateRange: any, currency?: string, breakdown?: string): Promise<any[]> {
    return [];
  }

  private static async calculateChurnData(userId: string, dateRange: any): Promise<any> {
    return { churnRate: 5.2, churnedCustomers: 12 };
  }

  private static async calculateLTVData(userId: string, dateRange: any): Promise<any> {
    return { averageLTV: 15000, totalLTV: 450000 };
  }

  private static async calculateResponseRates(userId: string, dateRange: any): Promise<any> {
    return { emailResponseRate: 25.5, callResponseRate: 45.2 };
  }

  private static async calculatePipelineVelocity(userId: string, dateRange: any): Promise<any> {
    return { averageDaysInPipeline: 45, velocityTrend: 'increasing' };
  }

  private static async calculateStageConversionRates(userId: string, dateRange: any): Promise<any[]> {
    return [
      { from: 'lead', to: 'qualified', rate: 35 },
      { from: 'qualified', to: 'proposal', rate: 60 },
      { from: 'proposal', to: 'negotiation', rate: 75 },
      { from: 'negotiation', to: 'closed_won', rate: 80 }
    ];
  }

  // 其他服务方法的占位符实现
  static async getCustomReport(userId: string, reportId: string, parameters: any): Promise<any> {
    return { reportId, data: {}, parameters };
  }

  static async createCustomReport(userId: string, reportData: any): Promise<any> {
    return { id: 'report_123', ...reportData, createdBy: userId };
  }

  static async updateCustomReport(userId: string, reportId: string, updateData: any): Promise<any> {
    return { id: reportId, ...updateData, updatedBy: userId };
  }

  static async deleteCustomReport(userId: string, reportId: string): Promise<any> {
    return { deleted: true, reportId };
  }

  static async exportReport(userId: string, options: ReportOptions): Promise<any> {
    return { exportUrl: 'https://example.com/export.pdf', format: options.format };
  }

  static async createReportSchedule(userId: string, scheduleData: any): Promise<any> {
    return { id: 'schedule_123', ...scheduleData, createdBy: userId };
  }

  static async getReportSchedules(userId: string, options: ReportOptions): Promise<any> {
    return { schedules: [], total: 0, page: options.page, limit: options.limit };
  }

  static async updateReportSchedule(userId: string, scheduleId: string, updateData: any): Promise<any> {
    return { id: scheduleId, ...updateData, updatedBy: userId };
  }

  static async deleteReportSchedule(userId: string, scheduleId: string): Promise<any> {
    return { deleted: true, scheduleId };
  }

  static async getTrendAnalysis(userId: string, options: ReportOptions): Promise<any> {
    return { trends: [], metrics: options.metrics, period: options.period };
  }

  static async getCohortAnalysis(userId: string, options: ReportOptions): Promise<any> {
    return { cohorts: [], cohortType: options.cohortType, period: options.period };
  }

  static async getFunnelAnalysis(userId: string, options: ReportOptions): Promise<any> {
    return { funnel: [], dropoffRates: [] };
  }

  static async getKPIs(userId: string, options: ReportOptions): Promise<any> {
    return { kpis: [], period: options.period };
  }
}