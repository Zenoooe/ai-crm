/**
 * 仪表板服务
 * 处理仪表板相关的业务逻辑和数据聚合
 */
import { Contact } from '../models/Contact';
import { Interaction } from '../models/Interaction';
import { Opportunity } from '../models/Opportunity';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { ExternalApiService } from './externalApiService';

interface DashboardOverview {
  totalContacts: number;
  totalOpportunities: number;
  totalRevenue: number;
  conversionRate: number;
  recentActivities: any[];
  upcomingTasks: any[];
  salesTrends: any[];
  topPerformers: any[];
}

interface SalesStats {
  totalSales: number;
  salesGrowth: number;
  averageDealSize: number;
  salesByPeriod: any[];
  topProducts: any[];
  salesByRegion: any[];
  forecasts?: any[];
}

interface CustomerStats {
  totalCustomers: number;
  newCustomers: number;
  customerGrowth: number;
  customerSegments: any[];
  customerLifetimeValue: number;
  churnRate: number;
}

interface ActivityStats {
  totalActivities: number;
  activitiesByType: any[];
  activitiesByUser: any[];
  activityTrends: any[];
  responseRates: any[];
}

export class DashboardService {
  /**
   * 获取仪表板概览数据
   */
  static async getOverview(userId: string, options: {
    period: string;
    timezone: string;
  }): Promise<DashboardOverview> {
    try {
      const { period, timezone } = options;
      const dateRange = this.getDateRange(period, timezone);

      // 并行获取各种统计数据
      const [totalContacts, totalOpportunities, totalRevenue, recentActivities, upcomingTasks] = await Promise.all([
        Contact.countDocuments({ createdBy: userId }),
        Opportunity.countDocuments({ assignedTo: userId }),
        this.calculateTotalRevenue(userId, dateRange),
        this.getRecentActivitiesData(userId, 10),
        this.getUpcomingTasksData(userId, 10)
      ]);

      const conversionRate = await this.calculateConversionRate(userId, dateRange);
      const salesTrends = await this.getSalesTrendsData(userId, dateRange);
      const topPerformers = await this.getTopPerformersData(userId, dateRange);

      return {
        totalContacts,
        totalOpportunities,
        totalRevenue,
        conversionRate,
        recentActivities,
        upcomingTasks,
        salesTrends,
        topPerformers
      };
    } catch (error) {
      logger.error('获取仪表板概览数据失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取销售统计数据
   */
  static async getSalesStats(userId: string, options: {
    startDate?: string;
    endDate?: string;
    groupBy: string;
    includeForecasts: boolean;
  }): Promise<SalesStats> {
    try {
      const { startDate, endDate, groupBy, includeForecasts } = options;
      const dateRange = startDate && endDate ? 
        { start: new Date(startDate), end: new Date(endDate) } :
        this.getDateRange('month');

      const [totalSales, averageDealSize, salesByPeriod, topProducts, salesByRegion] = await Promise.all([
        this.calculateTotalSales(userId, dateRange),
        this.calculateAverageDealSize(userId, dateRange),
        this.getSalesByPeriod(userId, dateRange, groupBy),
        this.getTopProducts(userId, dateRange),
        this.getSalesByRegion(userId, dateRange)
      ]);

      const salesGrowth = await this.calculateSalesGrowth(userId, dateRange);
      let forecasts;
      
      if (includeForecasts) {
        forecasts = await this.generateSalesForecasts(userId, dateRange);
      }

      return {
        totalSales,
        salesGrowth,
        averageDealSize,
        salesByPeriod,
        topProducts,
        salesByRegion,
        forecasts
      };
    } catch (error) {
      logger.error('获取销售统计数据失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取客户统计数据
   */
  static async getCustomerStats(userId: string, options: {
    period: string;
    segmentBy?: string;
  }): Promise<CustomerStats> {
    try {
      const { period, segmentBy } = options;
      const dateRange = this.getDateRange(period);

      const [totalCustomers, newCustomers, customerSegments, customerLifetimeValue, churnRate] = await Promise.all([
        Contact.countDocuments({ createdBy: userId }),
        Contact.countDocuments({ 
          createdBy: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }),
        this.getCustomerSegments(userId, segmentBy),
        this.calculateCustomerLifetimeValue(userId, dateRange),
        this.calculateChurnRate(userId, dateRange)
      ]);

      const customerGrowth = await this.calculateCustomerGrowth(userId, dateRange);

      return {
        totalCustomers,
        newCustomers,
        customerGrowth,
        customerSegments,
        customerLifetimeValue,
        churnRate
      };
    } catch (error) {
      logger.error('获取客户统计数据失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取活动统计数据
   */
  static async getActivityStats(userId: string, options: {
    period: string;
    activityTypes?: string[];
    targetUserId?: string;
  }): Promise<ActivityStats> {
    try {
      const { period, activityTypes, targetUserId } = options;
      const dateRange = this.getDateRange(period);
      const queryUserId = targetUserId || userId;

      const query: any = {
        createdBy: queryUserId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      };

      if (activityTypes && activityTypes.length > 0) {
        query.type = { $in: activityTypes };
      }

      const [totalActivities, activitiesByType, activitiesByUser, activityTrends, responseRates] = await Promise.all([
        Interaction.countDocuments(query),
        this.getActivitiesByType(queryUserId, dateRange, activityTypes),
        this.getActivitiesByUser(queryUserId, dateRange),
        this.getActivityTrends(queryUserId, dateRange),
        this.getResponseRates(queryUserId, dateRange)
      ]);

      return {
        totalActivities,
        activitiesByType,
        activitiesByUser,
        activityTrends,
        responseRates
      };
    } catch (error) {
      logger.error('获取活动统计数据失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取销售漏斗数据
   */
  static async getSalesFunnel(userId: string, options: {
    period: string;
    includeConversionRates: boolean;
  }) {
    try {
      const { period, includeConversionRates } = options;
      const dateRange = this.getDateRange(period);

      const funnelStages = await Opportunity.aggregate([
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
            totalValue: { $sum: '$value' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      let conversionRates: any[] = [];
      if (includeConversionRates) {
        conversionRates = await this.calculateFunnelConversionRates(userId, dateRange);
      }

      return {
        stages: funnelStages,
        conversionRates
      };
    } catch (error) {
      logger.error('获取销售漏斗数据失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取收入趋势
   */
  static async getRevenueTrends(userId: string, options: {
    period: string;
    compareWithPrevious: boolean;
    currency: string;
  }) {
    try {
      const { period, compareWithPrevious, currency } = options;
      const dateRange = this.getDateRange(period);

      const revenueTrends = await this.getRevenueTrendsData(userId, dateRange, currency);
      
      let previousPeriodData;
      if (compareWithPrevious) {
        const previousDateRange = this.getPreviousDateRange(period);
        previousPeriodData = await this.getRevenueTrendsData(userId, previousDateRange, currency);
      }

      return {
        current: revenueTrends,
        previous: previousPeriodData,
        growth: previousPeriodData ? this.calculateGrowthRate(revenueTrends, previousPeriodData) : null
      };
    } catch (error) {
      logger.error('获取收入趋势失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取团队绩效数据
   */
  static async getTeamPerformance(userId: string, options: {
    period: string;
    teamId?: string;
    metrics?: string[];
  }) {
    try {
      const { period, teamId, metrics } = options;
      const dateRange = this.getDateRange(period);

      // 模拟团队绩效数据
      return {
        teamMetrics: {
          totalSales: 150000,
          averagePerformance: 85,
          topPerformer: 'John Doe',
          teamSize: 8
        },
        individualPerformance: [
          { name: 'John Doe', sales: 45000, performance: 95 },
          { name: 'Jane Smith', sales: 38000, performance: 88 },
          { name: 'Bob Johnson', sales: 32000, performance: 82 }
        ],
        trends: [
          { period: '2024-01', performance: 82 },
          { period: '2024-02', performance: 85 },
          { period: '2024-03', performance: 88 }
        ]
      };
    } catch (error) {
      logger.error('获取团队绩效数据失败', error as Error);
      throw error;
    }
  }

  // 辅助方法
  private static getDateRange(period: string, timezone: string = 'UTC') {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        start = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  }

  private static getPreviousDateRange(period: string) {
    const current = this.getDateRange(period);
    const duration = current.end.getTime() - current.start.getTime();
    
    return {
      start: new Date(current.start.getTime() - duration),
      end: new Date(current.start.getTime())
    };
  }

  private static async calculateTotalRevenue(userId: string, dateRange: { start: Date; end: Date }) {
    const result = await Opportunity.aggregate([
      {
        $match: {
          assignedTo: userId,
          stage: 'closed_won',
          closedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$value' }
        }
      }
    ]);

    return result[0]?.total || 0;
  }

  private static async calculateConversionRate(userId: string, dateRange: { start: Date; end: Date }) {
    const [totalOpportunities, wonOpportunities] = await Promise.all([
      Opportunity.countDocuments({
        assignedTo: userId,
        createdAt: { $gte: dateRange.start, $lte: dateRange.end }
      }),
      Opportunity.countDocuments({
        assignedTo: userId,
        stage: 'closed_won',
        closedAt: { $gte: dateRange.start, $lte: dateRange.end }
      })
    ]);

    return totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;
  }

  // 其他辅助方法的模拟实现
  private static async getRecentActivitiesData(userId: string, limit: number) {
    return Interaction.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('contact', 'basicInfo.name basicInfo.company')
      .lean();
  }

  private static async getUpcomingTasksData(userId: string, limit: number) {
    return Task.find({ 
      assignedTo: userId,
      status: { $in: ['pending', 'in_progress'] },
      dueDate: { $gte: new Date() }
    })
      .sort({ dueDate: 1 })
      .limit(limit)
      .lean();
  }

  private static async getSalesTrendsData(userId: string, dateRange: { start: Date; end: Date }) {
    return Opportunity.aggregate([
      {
        $match: {
          assignedTo: userId,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          value: { $sum: '$value' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
  }

  private static async getTopPerformersData(userId: string, dateRange: { start: Date; end: Date }) {
    // 模拟数据
    return [
      { name: 'John Doe', sales: 45000, deals: 12 },
      { name: 'Jane Smith', sales: 38000, deals: 10 },
      { name: 'Bob Johnson', sales: 32000, deals: 8 }
    ];
  }

  // 更多辅助方法...
  private static async calculateTotalSales(userId: string, dateRange: { start: Date; end: Date }) {
    const result = await Opportunity.aggregate([
      {
        $match: {
          assignedTo: userId,
          stage: 'closed_won',
          closedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$value' }
        }
      }
    ]);

    return result[0]?.total || 0;
  }

  private static async calculateAverageDealSize(userId: string, dateRange: { start: Date; end: Date }) {
    const result = await Opportunity.aggregate([
      {
        $match: {
          assignedTo: userId,
          stage: 'closed_won',
          closedAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$value' }
        }
      }
    ]);

    return result[0]?.average || 0;
  }

  // 其他方法的简化实现...
  private static async getSalesByPeriod(userId: string, dateRange: any, groupBy: string) {
    return [];
  }

  private static async getTopProducts(userId: string, dateRange: any) {
    return [];
  }

  private static async getSalesByRegion(userId: string, dateRange: any) {
    return [];
  }

  private static async calculateSalesGrowth(userId: string, dateRange: any) {
    return 0;
  }

  private static async generateSalesForecasts(userId: string, dateRange: any) {
    return [];
  }

  private static async getCustomerSegments(userId: string, segmentBy?: string) {
    return [];
  }

  private static async calculateCustomerLifetimeValue(userId: string, dateRange: any) {
    return 0;
  }

  private static async calculateChurnRate(userId: string, dateRange: any) {
    return 0;
  }

  private static async calculateCustomerGrowth(userId: string, dateRange: any) {
    return 0;
  }

  private static async getActivitiesByType(userId: string, dateRange: any, activityTypes?: string[]) {
    return [];
  }

  private static async getActivitiesByUser(userId: string, dateRange: any) {
    return [];
  }

  private static async getActivityTrends(userId: string, dateRange: any) {
    return [];
  }

  private static async getResponseRates(userId: string, dateRange: any) {
    return [];
  }

  private static async calculateFunnelConversionRates(userId: string, dateRange: any) {
    return [];
  }

  private static async getRevenueTrendsData(userId: string, dateRange: any, currency: string) {
    return [];
  }

  private static calculateGrowthRate(current: any, previous: any) {
    return 0;
  }

  // 占位符方法，用于其他控制器方法
  static async getRecentActivities(userId: string, options: any) {
    return { activities: [], total: 0 };
  }

  static async getTasks(userId: string, options: any) {
    return { tasks: [], total: 0 };
  }

  static async getNotifications(userId: string, options: any) {
    return { notifications: [], total: 0 };
  }

  static async getKPIs(userId: string, options: any) {
    return { kpis: [] };
  }

  static async getForecasts(userId: string, options: any) {
    return { forecasts: [] };
  }

  static async getCompetitorAnalysis(userId: string, options: any) {
    return { analysis: [] };
  }

  static async getMarketTrends(userId: string, options: any) {
    return { trends: [] };
  }

  static async getDashboardConfig(userId: string) {
    return { config: {} };
  }

  static async updateDashboardConfig(userId: string, configData: any) {
    return { config: configData };
  }

  static async exportDashboard(userId: string, options: any) {
    return { exportUrl: 'https://example.com/export.pdf' };
  }
}