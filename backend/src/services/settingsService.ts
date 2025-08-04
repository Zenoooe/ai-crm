/**
 * 设置服务
 * 处理系统设置、用户偏好、团队配置等相关的业务逻辑
 */
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

interface SettingsOptions {
  format?: string;
  includeSystem?: boolean;
  page?: number;
  limit?: number;
  settingType?: string;
}

interface UserSettings {
  theme?: string;
  language?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  currency?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    desktop?: boolean;
  };
  dashboard?: {
    layout?: string;
    widgets?: string[];
    refreshInterval?: number;
  };
  privacy?: {
    profileVisibility?: string;
    activityVisibility?: string;
    contactSharing?: boolean;
  };
}

interface SystemSettings {
  general?: {
    siteName?: string;
    siteUrl?: string;
    adminEmail?: string;
    timezone?: string;
    language?: string;
  };
  security?: {
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSymbols?: boolean;
    };
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    lockoutDuration?: number;
    twoFactorRequired?: boolean;
  };
  email?: {
    provider?: string;
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
  };
  storage?: {
    provider?: string;
    maxFileSize?: number;
    allowedTypes?: string[];
  };
}

interface TeamSettings {
  name?: string;
  description?: string;
  visibility?: string;
  permissions?: {
    canCreateContacts?: boolean;
    canEditContacts?: boolean;
    canDeleteContacts?: boolean;
    canViewReports?: boolean;
    canExportData?: boolean;
  };
  workflow?: {
    approvalRequired?: boolean;
    autoAssignment?: boolean;
    escalationRules?: any[];
  };
  integrations?: {
    enabled?: string[];
    configurations?: Record<string, any>;
  };
}

export class SettingsService {
  /**
   * 获取用户设置
   */
  static async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const user = await User.findById(userId).select('preferences');
      if (!user) {
        throw new ApiError(404, '用户不存在');
      }

      return user.preferences || {
        theme: 'light',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        currency: 'CNY',
        notifications: {
          email: true,
          push: true,
          sms: false,
          desktop: true
        },
        dashboard: {
          layout: 'default',
          widgets: ['sales', 'activities', 'tasks'],
          refreshInterval: 300
        },
        privacy: {
          profileVisibility: 'team',
          activityVisibility: 'team',
          contactSharing: true
        }
      };
    } catch (error) {
      logger.error('获取用户设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新用户设置
   */
  static async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, '用户不存在');
      }

      // 合并设置
      const currentSettings = user.preferences || {};
      const updatedSettings = { ...currentSettings, ...settings };

      // 更新用户设置
      await User.findByIdAndUpdate(userId, { preferences: updatedSettings });

      return updatedSettings;
    } catch (error) {
      logger.error('更新用户设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取系统设置
   */
  static async getSystemSettings(): Promise<SystemSettings> {
    try {
      // 模拟系统设置数据
      return {
        general: {
          siteName: 'CRM系统',
          siteUrl: 'https://crm.example.com',
          adminEmail: 'admin@example.com',
          timezone: 'Asia/Shanghai',
          language: 'zh-CN'
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSymbols: false
          },
          sessionTimeout: 3600,
          maxLoginAttempts: 5,
          lockoutDuration: 900,
          twoFactorRequired: false
        },
        email: {
          provider: 'smtp',
          host: 'smtp.example.com',
          port: 587,
          secure: true,
          username: 'noreply@example.com',
          password: '***'
        },
        storage: {
          provider: 'local',
          maxFileSize: 10485760, // 10MB
          allowedTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx']
        }
      };
    } catch (error) {
      logger.error('获取系统设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新系统设置
   */
  static async updateSystemSettings(settings: Partial<SystemSettings>, userId: string): Promise<SystemSettings> {
    try {
      // 这里应该将设置保存到数据库或配置文件
      // 目前返回模拟数据
      const currentSettings = await this.getSystemSettings();
      const updatedSettings = { ...currentSettings, ...settings };

      logger.info(`用户 ${userId} 更新了系统设置`);
      return updatedSettings;
    } catch (error) {
      logger.error('更新系统设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取团队设置
   */
  static async getTeamSettings(teamId: string | undefined, userId: string): Promise<TeamSettings> {
    try {
      // 模拟团队设置数据
      return {
        name: '销售团队',
        description: '负责销售业务的团队',
        visibility: 'private',
        permissions: {
          canCreateContacts: true,
          canEditContacts: true,
          canDeleteContacts: false,
          canViewReports: true,
          canExportData: false
        },
        workflow: {
          approvalRequired: true,
          autoAssignment: false,
          escalationRules: []
        },
        integrations: {
          enabled: ['email', 'calendar'],
          configurations: {}
        }
      };
    } catch (error) {
      logger.error('获取团队设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新团队设置
   */
  static async updateTeamSettings(teamId: string, settings: Partial<TeamSettings>, userId: string): Promise<TeamSettings> {
    try {
      const currentSettings = await this.getTeamSettings(teamId, userId);
      const updatedSettings = { ...currentSettings, ...settings };

      logger.info(`用户 ${userId} 更新了团队 ${teamId} 的设置`);
      return updatedSettings;
    } catch (error) {
      logger.error('更新团队设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取通知设置
   */
  static async getNotificationSettings(userId: string) {
    try {
      const userSettings = await this.getUserSettings(userId);
      return {
        email: {
          enabled: userSettings.notifications?.email || true,
          frequency: 'immediate',
          types: {
            newLead: true,
            taskReminder: true,
            dealUpdate: true,
            systemAlert: false
          }
        },
        push: {
          enabled: userSettings.notifications?.push || true,
          quiet_hours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        },
        sms: {
          enabled: userSettings.notifications?.sms || false,
          types: {
            urgent: true,
            reminders: false
          }
        }
      };
    } catch (error) {
      logger.error('获取通知设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新通知设置
   */
  static async updateNotificationSettings(userId: string, settings: any) {
    try {
      // 更新用户的通知设置
      const currentUserSettings = await this.getUserSettings(userId);
      const updatedUserSettings = {
        ...currentUserSettings,
        notifications: {
          ...currentUserSettings.notifications,
          email: settings.email?.enabled,
          push: settings.push?.enabled,
          sms: settings.sms?.enabled
        }
      };

      await this.updateUserSettings(userId, updatedUserSettings);
      return settings;
    } catch (error) {
      logger.error('更新通知设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取安全设置
   */
  static async getSecuritySettings(userId: string) {
    try {
      return {
        twoFactor: {
          enabled: false,
          method: 'app',
          backupCodes: 5
        },
        sessions: {
          current: 1,
          maxSessions: 5,
          timeout: 3600
        },
        loginHistory: {
          trackLocation: true,
          trackDevice: true,
          retentionDays: 90
        },
        privacy: {
          profileVisibility: 'team',
          activityTracking: true,
          dataSharing: false
        }
      };
    } catch (error) {
      logger.error('获取安全设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新安全设置
   */
  static async updateSecuritySettings(userId: string, settings: any) {
    try {
      logger.info(`用户 ${userId} 更新了安全设置`);
      return settings;
    } catch (error) {
      logger.error('更新安全设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取集成设置
   */
  static async getIntegrationSettings(userId: string) {
    try {
      return {
        email: {
          provider: 'gmail',
          enabled: true,
          syncContacts: true,
          syncCalendar: false
        },
        calendar: {
          provider: 'google',
          enabled: false,
          syncMeetings: true
        },
        social: {
          linkedin: {
            enabled: false,
            autoConnect: false
          },
          twitter: {
            enabled: false,
            trackMentions: false
          }
        },
        webhooks: {
          enabled: false,
          endpoints: []
        }
      };
    } catch (error) {
      logger.error('获取集成设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新集成设置
   */
  static async updateIntegrationSettings(userId: string, settings: any) {
    try {
      logger.info(`用户 ${userId} 更新了集成设置`);
      return settings;
    } catch (error) {
      logger.error('更新集成设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取工作流设置
   */
  static async getWorkflowSettings(userId: string) {
    try {
      return {
        automation: {
          enabled: true,
          rules: [
            {
              id: 'auto-assign-leads',
              name: '自动分配线索',
              enabled: true,
              conditions: [],
              actions: []
            }
          ]
        },
        approval: {
          required: false,
          workflow: [
            {
              step: 1,
              approver: 'manager',
              condition: 'deal_value > 10000'
            }
          ]
        },
        notifications: {
          onStatusChange: true,
          onAssignment: true,
          onDeadline: true
        }
      };
    } catch (error) {
      logger.error('获取工作流设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新工作流设置
   */
  static async updateWorkflowSettings(userId: string, settings: any) {
    try {
      logger.info(`用户 ${userId} 更新了工作流设置`);
      return settings;
    } catch (error) {
      logger.error('更新工作流设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取自定义字段设置
   */
  static async getCustomFieldSettings(userId: string) {
    try {
      return {
        contacts: [
          {
            id: 'custom_1',
            name: '客户等级',
            type: 'select',
            options: ['A', 'B', 'C'],
            required: false,
            visible: true
          }
        ],
        opportunities: [
          {
            id: 'custom_2',
            name: '竞争对手',
            type: 'text',
            required: false,
            visible: true
          }
        ],
        companies: []
      };
    } catch (error) {
      logger.error('获取自定义字段设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新自定义字段设置
   */
  static async updateCustomFieldSettings(userId: string, settings: any) {
    try {
      logger.info(`用户 ${userId} 更新了自定义字段设置`);
      return settings;
    } catch (error) {
      logger.error('更新自定义字段设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取邮件模板设置
   */
  static async getEmailTemplateSettings(userId: string) {
    try {
      return {
        templates: [
          {
            id: 'welcome',
            name: '欢迎邮件',
            subject: '欢迎加入我们',
            content: '感谢您的关注...',
            active: true
          },
          {
            id: 'follow_up',
            name: '跟进邮件',
            subject: '跟进您的需求',
            content: '希望了解您的最新需求...',
            active: true
          }
        ],
        settings: {
          defaultSender: 'noreply@example.com',
          trackOpens: true,
          trackClicks: true,
          unsubscribeLink: true
        }
      };
    } catch (error) {
      logger.error('获取邮件模板设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新邮件模板设置
   */
  static async updateEmailTemplateSettings(userId: string, settings: any) {
    try {
      logger.info(`用户 ${userId} 更新了邮件模板设置`);
      return settings;
    } catch (error) {
      logger.error('更新邮件模板设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取数据保留设置
   */
  static async getDataRetentionSettings() {
    try {
      return {
        contacts: {
          retentionPeriod: 2555, // 7年
          autoDelete: false,
          archiveBeforeDelete: true
        },
        interactions: {
          retentionPeriod: 1095, // 3年
          autoDelete: true,
          archiveBeforeDelete: true
        },
        logs: {
          retentionPeriod: 365, // 1年
          autoDelete: true,
          archiveBeforeDelete: false
        },
        backups: {
          frequency: 'daily',
          retentionPeriod: 90,
          location: 'cloud'
        }
      };
    } catch (error) {
      logger.error('获取数据保留设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新数据保留设置
   */
  static async updateDataRetentionSettings(settings: any, userId: string) {
    try {
      logger.info(`用户 ${userId} 更新了数据保留设置`);
      return settings;
    } catch (error) {
      logger.error('更新数据保留设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取API设置
   */
  static async getAPISettings(userId: string) {
    try {
      return {
        keys: [
          {
            id: 'key_1',
            name: '主API密钥',
            key: 'sk_***',
            permissions: ['read', 'write'],
            lastUsed: new Date(),
            active: true
          }
        ],
        rateLimit: {
          requestsPerMinute: 100,
          requestsPerHour: 1000,
          requestsPerDay: 10000
        },
        webhooks: {
          enabled: false,
          endpoints: [],
          retryAttempts: 3
        },
        cors: {
          enabled: true,
          allowedOrigins: ['https://app.example.com']
        }
      };
    } catch (error) {
      logger.error('获取API设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 更新API设置
   */
  static async updateAPISettings(userId: string, settings: any) {
    try {
      logger.info(`用户 ${userId} 更新了API设置`);
      return settings;
    } catch (error) {
      logger.error('更新API设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 重置设置
   */
  static async resetSettings(userId: string, settingType: string) {
    try {
      switch (settingType) {
        case 'user':
          await this.updateUserSettings(userId, {
            theme: 'light',
            language: 'zh-CN',
            timezone: 'Asia/Shanghai'
          });
          break;
        case 'notifications':
          await this.updateNotificationSettings(userId, {
            email: { enabled: true },
            push: { enabled: true },
            sms: { enabled: false }
          });
          break;
        default:
          throw new ApiError(400, '不支持的设置类型');
      }

      return { success: true, settingType };
    } catch (error) {
      logger.error('重置设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 导出设置
   */
  static async exportSettings(userId: string, options: SettingsOptions) {
    try {
      const userSettings = await this.getUserSettings(userId);
      const notificationSettings = await this.getNotificationSettings(userId);
      const securitySettings = await this.getSecuritySettings(userId);

      let exportData: any = {
        user: userSettings,
        notifications: notificationSettings,
        security: securitySettings
      };

      if (options.includeSystem) {
        const systemSettings = await this.getSystemSettings();
        exportData.system = systemSettings;
      }

      return {
        data: exportData,
        format: options.format || 'json',
        exportedAt: new Date(),
        version: '1.0'
      };
    } catch (error) {
      logger.error('导出设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 导入设置
   */
  static async importSettings(userId: string, settingsData: any, overwrite: boolean) {
    try {
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      if (settingsData.user) {
        try {
          await this.updateUserSettings(userId, settingsData.user);
          imported++;
        } catch (error) {
          errors++;
        }
      }

      if (settingsData.notifications) {
        try {
          await this.updateNotificationSettings(userId, settingsData.notifications);
          imported++;
        } catch (error) {
          errors++;
        }
      }

      return {
        imported,
        skipped,
        errors,
        importedAt: new Date()
      };
    } catch (error) {
      logger.error('导入设置失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取设置历史
   */
  static async getSettingsHistory(userId: string, options: SettingsOptions) {
    try {
      // 模拟历史数据
      const history = [
        {
          id: 'history_1',
          settingType: 'user',
          changes: {
            theme: { from: 'dark', to: 'light' },
            language: { from: 'en', to: 'zh-CN' }
          },
          changedBy: userId,
          changedAt: new Date(Date.now() - 86400000) // 1天前
        },
        {
          id: 'history_2',
          settingType: 'notifications',
          changes: {
            email: { from: false, to: true }
          },
          changedBy: userId,
          changedAt: new Date(Date.now() - 172800000) // 2天前
        }
      ];

      const total = history.length;
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        history: history.slice(startIndex, endIndex),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('获取设置历史失败', error as Error);
      throw error;
    }
  }

  /**
   * 恢复设置版本
   */
  static async restoreSettingsVersion(userId: string, versionId: string) {
    try {
      // 模拟恢复操作
      logger.info(`用户 ${userId} 恢复设置版本 ${versionId}`);
      
      return {
        success: true,
        versionId,
        restoredAt: new Date(),
        restoredBy: userId
      };
    } catch (error) {
      logger.error('恢复设置版本失败', error as Error);
      throw error;
    }
  }
}