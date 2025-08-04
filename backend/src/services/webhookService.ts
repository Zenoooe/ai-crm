/**
 * Webhook服务
 * 处理Webhook的创建、管理、触发和日志记录
 */
import crypto from 'crypto';
import axios from 'axios';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

interface WebhookOptions {
  page?: number;
  limit?: number;
  status?: string;
  event?: string;
  startDate?: string;
  endDate?: string;
  format?: string;
  category?: string;
  provider?: string;
}

interface WebhookData {
  name: string;
  url: string;
  events: string[];
  active?: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryAttempts?: number;
  timeout?: number;
  description?: string;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  response?: {
    status: number;
    body: any;
    headers: Record<string, string>;
  };
  status: 'success' | 'failed' | 'pending' | 'retrying';
  attempts: number;
  lastAttemptAt: Date;
  createdAt: Date;
  error?: string;
}

interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  headers: Record<string, string>;
  retryAttempts: number;
  timeout: number;
  description?: string;
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastTriggeredAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookService {
  private static webhooks: Map<string, Webhook> = new Map();
  private static logs: Map<string, WebhookLog[]> = new Map();
  private static templates: any[] = [
    {
      id: 'slack_notification',
      name: 'Slack通知',
      category: 'notification',
      provider: 'slack',
      description: '发送消息到Slack频道',
      events: ['contact.created', 'opportunity.won', 'task.completed'],
      template: {
        url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: {
          text: '{{event.type}}: {{event.data.name}}',
          channel: '#sales',
          username: 'CRM Bot'
        }
      }
    },
    {
      id: 'email_notification',
      name: '邮件通知',
      category: 'notification',
      provider: 'email',
      description: '发送邮件通知',
      events: ['contact.created', 'opportunity.created'],
      template: {
        url: 'https://api.sendgrid.com/v3/mail/send',
        headers: {
          'Authorization': 'Bearer YOUR_API_KEY',
          'Content-Type': 'application/json'
        },
        payload: {
          personalizations: [{
            to: [{ email: '{{recipient.email}}' }],
            subject: '{{event.type}} - {{event.data.name}}'
          }],
          from: { email: 'noreply@example.com' },
          content: [{
            type: 'text/html',
            value: '<p>{{event.description}}</p>'
          }]
        }
      }
    }
  ];

  /**
   * 创建Webhook
   */
  static async createWebhook(userId: string, data: WebhookData): Promise<Webhook> {
    try {
      const webhookId = this.generateId();
      const secret = data.secret || this.generateSecret();
      
      const webhook: Webhook = {
        id: webhookId,
        userId,
        name: data.name,
        url: data.url,
        events: data.events,
        active: data.active !== false,
        secret,
        headers: data.headers || {},
        retryAttempts: data.retryAttempts || 3,
        timeout: data.timeout || 30000,
        description: data.description,
        stats: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.webhooks.set(webhookId, webhook);
      this.logs.set(webhookId, []);

      logger.info(`用户 ${userId} 创建了Webhook: ${webhook.name}`);
      return webhook;
    } catch (error) {
      logger.error('创建Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取Webhook列表
   */
  static async getWebhooks(userId: string, options: WebhookOptions) {
    try {
      const userWebhooks = Array.from(this.webhooks.values())
        .filter(webhook => webhook.userId === userId);

      // 应用过滤器
      let filteredWebhooks = userWebhooks;
      
      if (options.status) {
        filteredWebhooks = filteredWebhooks.filter(webhook => 
          options.status === 'active' ? webhook.active : !webhook.active
        );
      }

      if (options.event) {
        filteredWebhooks = filteredWebhooks.filter(webhook => 
          webhook.events.includes(options.event!)
        );
      }

      // 分页
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedWebhooks = filteredWebhooks.slice(startIndex, endIndex);

      return {
        webhooks: paginatedWebhooks,
        total: filteredWebhooks.length,
        page,
        limit,
        totalPages: Math.ceil(filteredWebhooks.length / limit)
      };
    } catch (error) {
      logger.error('获取Webhook列表失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取单个Webhook
   */
  static async getWebhook(userId: string, webhookId: string): Promise<Webhook> {
    try {
      const webhook = this.webhooks.get(webhookId);
      
      if (!webhook) {
        throw new ApiError(404, 'Webhook不存在');
      }

      if (webhook.userId !== userId) {
        throw new ApiError(403, '权限不足');
      }

      return webhook;
    } catch (error) {
      logger.error('获取Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新Webhook
   */
  static async updateWebhook(userId: string, webhookId: string, data: Partial<WebhookData>): Promise<Webhook> {
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      
      // 更新字段
      if (data.name !== undefined) webhook.name = data.name;
      if (data.url !== undefined) webhook.url = data.url;
      if (data.events !== undefined) webhook.events = data.events;
      if (data.active !== undefined) webhook.active = data.active;
      if (data.headers !== undefined) webhook.headers = data.headers;
      if (data.retryAttempts !== undefined) webhook.retryAttempts = data.retryAttempts;
      if (data.timeout !== undefined) webhook.timeout = data.timeout;
      if (data.description !== undefined) webhook.description = data.description;
      
      webhook.updatedAt = new Date();
      
      this.webhooks.set(webhookId, webhook);
      
      logger.info(`用户 ${userId} 更新了Webhook: ${webhook.name}`);
      return webhook;
    } catch (error) {
      logger.error('更新Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 删除Webhook
   */
  static async deleteWebhook(userId: string, webhookId: string): Promise<void> {
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      
      this.webhooks.delete(webhookId);
      this.logs.delete(webhookId);
      
      logger.info(`用户 ${userId} 删除了Webhook: ${webhook.name}`);
    } catch (error) {
      logger.error('删除Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 测试Webhook
   */
  static async testWebhook(userId: string, webhookId: string, testData?: any) {
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      
      const payload = testData || {
        event: 'webhook.test',
        data: {
          message: '这是一个测试Webhook',
          timestamp: new Date().toISOString()
        }
      };

      const result = await this.triggerWebhook(webhook, payload);
      
      return {
        success: result.success,
        status: result.status,
        response: result.response,
        duration: result.duration
      };
    } catch (error) {
      logger.error('测试Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 暂停Webhook
   */
  static async pauseWebhook(userId: string, webhookId: string): Promise<void> {
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      webhook.active = false;
      webhook.updatedAt = new Date();
      
      this.webhooks.set(webhookId, webhook);
      
      logger.info(`用户 ${userId} 暂停了Webhook: ${webhook.name}`);
    } catch (error) {
      logger.error('暂停Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 恢复Webhook
   */
  static async resumeWebhook(userId: string, webhookId: string): Promise<void> {
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      webhook.active = true;
      webhook.updatedAt = new Date();
      
      this.webhooks.set(webhookId, webhook);
      
      logger.info(`用户 ${userId} 恢复了Webhook: ${webhook.name}`);
    } catch (error) {
      logger.error('恢复Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 重试Webhook
   */
  static async retryWebhook(userId: string, webhookId: string, logId: string) {
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      const logs = this.logs.get(webhookId) || [];
      const log = logs.find(l => l.id === logId);
      
      if (!log) {
        throw new ApiError(404, 'Webhook日志不存在');
      }

      if (log.status === 'success') {
        throw new ApiError(400, '成功的Webhook无需重试');
      }

      const result = await this.triggerWebhook(webhook, log.payload);
      
      // 更新日志
      log.attempts += 1;
      log.lastAttemptAt = new Date();
      log.status = result.success ? 'success' : 'failed';
      log.response = result.response;
      if (!result.success) {
        log.error = result.error;
      }
      
      return result;
    } catch (error) {
      logger.error('重试Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取Webhook日志
   */
  static async getWebhookLogs(userId: string, webhookId: string, options: WebhookOptions) {
    try {
      await this.getWebhook(userId, webhookId); // 验证权限
      
      let logs = this.logs.get(webhookId) || [];
      
      // 应用过滤器
      if (options.status) {
        logs = logs.filter(log => log.status === options.status);
      }
      
      if (options.startDate) {
        const startDate = new Date(options.startDate);
        logs = logs.filter(log => log.createdAt >= startDate);
      }
      
      if (options.endDate) {
        const endDate = new Date(options.endDate);
        logs = logs.filter(log => log.createdAt <= endDate);
      }
      
      // 排序（最新的在前）
      logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      // 分页
      const page = options.page || 1;
      const limit = options.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedLogs = logs.slice(startIndex, endIndex);
      
      return {
        logs: paginatedLogs,
        total: logs.length,
        page,
        limit,
        totalPages: Math.ceil(logs.length / limit)
      };
    } catch (error) {
      logger.error('获取Webhook日志失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取Webhook统计
   */
  static async getWebhookStats(userId: string, webhookId: string, period: string) {
    try {
      const webhook = await this.getWebhook(userId, webhookId);
      const logs = this.logs.get(webhookId) || [];
      
      // 计算时间范围
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const periodLogs = logs.filter(log => log.createdAt >= startDate);
      
      const stats = {
        totalRequests: periodLogs.length,
        successfulRequests: periodLogs.filter(log => log.status === 'success').length,
        failedRequests: periodLogs.filter(log => log.status === 'failed').length,
        pendingRequests: periodLogs.filter(log => log.status === 'pending').length,
        retryingRequests: periodLogs.filter(log => log.status === 'retrying').length,
        successRate: 0,
        averageResponseTime: 0,
        lastTriggeredAt: webhook.stats.lastTriggeredAt,
        period
      };
      
      if (stats.totalRequests > 0) {
        stats.successRate = (stats.successfulRequests / stats.totalRequests) * 100;
      }
      
      return stats;
    } catch (error) {
      logger.error('获取Webhook统计失败', error as Error);
      throw error;
    }
  }

  /**
   * 导出Webhook日志
   */
  static async exportWebhookLogs(userId: string, webhookId: string, options: WebhookOptions) {
    try {
      const logsData = await this.getWebhookLogs(userId, webhookId, {
        ...options,
        page: 1,
        limit: 10000 // 导出时获取更多数据
      });
      
      const format = options.format || 'csv';
      
      return {
        data: logsData.logs,
        format,
        filename: `webhook_${webhookId}_logs_${new Date().toISOString().split('T')[0]}.${format}`,
        exportedAt: new Date()
      };
    } catch (error) {
      logger.error('导出Webhook日志失败', error as Error);
      throw error;
    }
  }

  /**
   * 批量更新Webhook
   */
  static async bulkUpdateWebhooks(userId: string, webhookIds: string[], action: string, data?: any) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      for (const webhookId of webhookIds) {
        try {
          switch (action) {
            case 'pause':
              await this.pauseWebhook(userId, webhookId);
              break;
            case 'resume':
              await this.resumeWebhook(userId, webhookId);
              break;
            case 'delete':
              await this.deleteWebhook(userId, webhookId);
              break;
            case 'update':
              await this.updateWebhook(userId, webhookId, data);
              break;
            default:
              throw new Error(`不支持的操作: ${action}`);
          }
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Webhook ${webhookId}: ${(error as Error).message}`);
        }
      }
      
      return results;
    } catch (error) {
      logger.error('批量更新Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取Webhook模板
   */
  static async getWebhookTemplates(options: WebhookOptions) {
    try {
      let templates = [...this.templates];
      
      if (options.category) {
        templates = templates.filter(template => template.category === options.category);
      }
      
      if (options.provider) {
        templates = templates.filter(template => template.provider === options.provider);
      }
      
      return {
        templates,
        total: templates.length
      };
    } catch (error) {
      logger.error('获取Webhook模板失败', error as Error);
      throw error;
    }
  }

  /**
   * 创建Webhook模板
   */
  static async createWebhookTemplate(userId: string, templateData: any) {
    try {
      const template = {
        id: this.generateId(),
        ...templateData,
        createdBy: userId,
        createdAt: new Date()
      };
      
      this.templates.push(template);
      
      return template;
    } catch (error) {
      logger.error('创建Webhook模板失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新Webhook模板
   */
  static async updateWebhookTemplate(userId: string, templateId: string, updateData: any) {
    try {
      const templateIndex = this.templates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new ApiError(404, 'Webhook模板不存在');
      }
      
      const template = this.templates[templateIndex];
      
      // 检查权限（只有创建者或管理员可以更新）
      if (template.createdBy !== userId) {
        throw new ApiError(403, '权限不足');
      }
      
      this.templates[templateIndex] = {
        ...template,
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date()
      };
      
      return this.templates[templateIndex];
    } catch (error) {
      logger.error('更新Webhook模板失败', error as Error);
      throw error;
    }
  }

  /**
   * 删除Webhook模板
   */
  static async deleteWebhookTemplate(userId: string, templateId: string) {
    try {
      const templateIndex = this.templates.findIndex(t => t.id === templateId);
      
      if (templateIndex === -1) {
        throw new ApiError(404, 'Webhook模板不存在');
      }
      
      const template = this.templates[templateIndex];
      
      // 检查权限
      if (template.createdBy !== userId) {
        throw new ApiError(403, '权限不足');
      }
      
      this.templates.splice(templateIndex, 1);
    } catch (error) {
      logger.error('删除Webhook模板失败', error as Error);
      throw error;
    }
  }

  /**
   * 处理外部Webhook
   */
  static async handleIncomingWebhook(provider: string, webhookId: string | undefined, payload: any, headers: any) {
    try {
      logger.info(`收到来自 ${provider} 的Webhook`, { webhookId, payload });
      
      // 根据提供商处理不同的Webhook格式
      switch (provider.toLowerCase()) {
        case 'github':
          return this.handleGitHubWebhook(payload, headers);
        case 'stripe':
          return this.handleStripeWebhook(payload, headers);
        case 'slack':
          return this.handleSlackWebhook(payload, headers);
        case 'zapier':
          return this.handleZapierWebhook(payload, headers);
        default:
          return this.handleGenericWebhook(provider, payload, headers);
      }
    } catch (error) {
      logger.error('处理外部Webhook失败', error as Error);
      throw error;
    }
  }

  /**
   * 验证Webhook签名
   */
  static async validateWebhookSignature(provider: string, signature: string, payload: any): Promise<boolean> {
    try {
      if (!signature) {
        return false;
      }
      
      // 根据提供商使用不同的签名验证方法
      switch (provider.toLowerCase()) {
        case 'github':
          return this.validateGitHubSignature(signature, payload);
        case 'stripe':
          return this.validateStripeSignature(signature, payload);
        default:
          return this.validateGenericSignature(signature, payload);
      }
    } catch (error) {
      logger.error('验证Webhook签名失败', error as Error);
      return false;
    }
  }

  /**
   * 触发Webhook
   */
  static async triggerWebhook(webhook: Webhook, payload: any) {
    const startTime = Date.now();
    
    try {
      if (!webhook.active) {
        throw new Error('Webhook已暂停');
      }
      
      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Webhook/1.0',
        ...webhook.headers
      };
      
      // 添加签名
      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }
      
      // 发送请求
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: webhook.timeout,
        validateStatus: (status) => status < 500 // 4xx也算成功
      });
      
      const duration = Date.now() - startTime;
      
      // 记录日志
      const log: WebhookLog = {
        id: this.generateId(),
        webhookId: webhook.id,
        event: payload.event || 'unknown',
        payload,
        response: {
          status: response.status,
          body: response.data,
          headers: response.headers as Record<string, string>
        },
        status: response.status < 400 ? 'success' : 'failed',
        attempts: 1,
        lastAttemptAt: new Date(),
        createdAt: new Date()
      };
      
      this.addLog(webhook.id, log);
      
      // 更新统计
      webhook.stats.totalRequests++;
      if (response.status < 400) {
        webhook.stats.successfulRequests++;
      } else {
        webhook.stats.failedRequests++;
      }
      webhook.stats.lastTriggeredAt = new Date();
      
      return {
        success: response.status < 400,
        status: response.status,
        response: response.data,
        duration,
        error: response.status >= 400 ? `HTTP ${response.status}` : undefined
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 记录失败日志
      const log: WebhookLog = {
        id: this.generateId(),
        webhookId: webhook.id,
        event: payload.event || 'unknown',
        payload,
        status: 'failed',
        attempts: 1,
        lastAttemptAt: new Date(),
        createdAt: new Date(),
        error: (error as Error).message
      };
      
      this.addLog(webhook.id, log);
      
      // 更新统计
      webhook.stats.totalRequests++;
      webhook.stats.failedRequests++;
      webhook.stats.lastTriggeredAt = new Date();
      
      return {
        success: false,
        status: 0,
        response: null,
        duration,
        error: (error as Error).message
      };
    }
  }

  // 辅助方法
  private static generateId(): string {
    return 'webhook_' + Math.random().toString(36).substr(2, 9);
  }

  private static generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private static generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  private static addLog(webhookId: string, log: WebhookLog): void {
    const logs = this.logs.get(webhookId) || [];
    logs.unshift(log); // 添加到开头
    
    // 保留最近1000条日志
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    
    this.logs.set(webhookId, logs);
  }

  // 特定提供商的Webhook处理方法
  private static handleGitHubWebhook(payload: any, headers: any) {
    const event = headers['x-github-event'];
    return {
      provider: 'github',
      event,
      data: payload,
      processed: true
    };
  }

  private static handleStripeWebhook(payload: any, headers: any) {
    return {
      provider: 'stripe',
      event: payload.type,
      data: payload.data,
      processed: true
    };
  }

  private static handleSlackWebhook(payload: any, headers: any) {
    return {
      provider: 'slack',
      event: payload.type || 'message',
      data: payload,
      processed: true
    };
  }

  private static handleZapierWebhook(payload: any, headers: any) {
    return {
      provider: 'zapier',
      event: 'trigger',
      data: payload,
      processed: true
    };
  }

  private static handleGenericWebhook(provider: string, payload: any, headers: any) {
    return {
      provider,
      event: payload.event || 'generic',
      data: payload,
      processed: true
    };
  }

  // 签名验证方法
  private static validateGitHubSignature(signature: string, payload: any): boolean {
    // GitHub使用sha256签名
    const secret = process.env.GITHUB_WEBHOOK_SECRET || 'default_secret';
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return signature === expectedSignature;
  }

  private static validateStripeSignature(signature: string, payload: any): boolean {
    // Stripe签名验证逻辑
    const secret = process.env.STRIPE_WEBHOOK_SECRET || 'default_secret';
    const expectedSignature = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return signature === expectedSignature;
  }

  private static validateGenericSignature(signature: string, payload: any): boolean {
    // 通用签名验证
    const secret = process.env.WEBHOOK_SECRET || 'default_secret';
    const expectedSignature = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return signature === expectedSignature;
  }
}