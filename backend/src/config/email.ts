import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

// 邮件配置接口
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 邮件模板接口
interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// 发送邮件选项接口
interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
  template?: string;
  templateData?: Record<string, any>;
}

// 邮件配置
const emailConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

// 创建邮件传输器
const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

// 邮件模板
const emailTemplates: Record<string, (data: any) => EmailTemplate> = {
  // 欢迎邮件模板
  welcome: (data: { name: string; loginUrl: string }) => ({
    subject: '欢迎加入CRM系统',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">欢迎加入CRM系统！</h2>
        <p>亲爱的 ${data.name}，</p>
        <p>欢迎您加入我们的CRM系统！您的账户已经创建成功。</p>
        <p>请点击下面的链接登录系统：</p>
        <a href="${data.loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">立即登录</a>
        <p>如果您有任何问题，请随时联系我们的支持团队。</p>
        <p>祝您使用愉快！</p>
        <p>CRM团队</p>
      </div>
    `,
    text: `欢迎加入CRM系统！亲爱的 ${data.name}，欢迎您加入我们的CRM系统！您的账户已经创建成功。请访问 ${data.loginUrl} 登录系统。`
  }),

  // 邮箱验证模板
  emailVerification: (data: { name: string; verificationUrl: string; code: string }) => ({
    subject: '验证您的邮箱地址',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">验证您的邮箱地址</h2>
        <p>亲爱的 ${data.name}，</p>
        <p>感谢您注册我们的CRM系统！请验证您的邮箱地址以完成注册。</p>
        <p>验证码：<strong style="font-size: 18px; color: #007bff;">${data.code}</strong></p>
        <p>或者点击下面的链接进行验证：</p>
        <a href="${data.verificationUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">验证邮箱</a>
        <p>此链接将在24小时后过期。</p>
        <p>如果您没有注册我们的服务，请忽略此邮件。</p>
        <p>CRM团队</p>
      </div>
    `,
    text: `验证您的邮箱地址。亲爱的 ${data.name}，验证码：${data.code}。或访问：${data.verificationUrl}`
  }),

  // 密码重置模板
  passwordReset: (data: { name: string; resetUrl: string; code: string }) => ({
    subject: '重置您的密码',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">重置您的密码</h2>
        <p>亲爱的 ${data.name}，</p>
        <p>我们收到了重置您密码的请求。</p>
        <p>重置码：<strong style="font-size: 18px; color: #dc3545;">${data.code}</strong></p>
        <p>或者点击下面的链接重置密码：</p>
        <a href="${data.resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">重置密码</a>
        <p>此链接将在1小时后过期。</p>
        <p>如果您没有请求重置密码，请忽略此邮件，您的密码将保持不变。</p>
        <p>CRM团队</p>
      </div>
    `,
    text: `重置您的密码。亲爱的 ${data.name}，重置码：${data.code}。或访问：${data.resetUrl}`
  }),

  // 密码修改通知模板
  passwordChanged: (data: { name: string; loginUrl: string; timestamp: string }) => ({
    subject: '密码修改通知',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">密码修改通知</h2>
        <p>亲爱的 ${data.name}，</p>
        <p>您的账户密码已于 ${data.timestamp} 成功修改。</p>
        <p>如果这不是您本人的操作，请立即联系我们的支持团队。</p>
        <a href="${data.loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">登录账户</a>
        <p>为了您的账户安全，建议您：</p>
        <ul>
          <li>使用强密码</li>
          <li>定期更换密码</li>
          <li>不要在多个网站使用相同密码</li>
        </ul>
        <p>CRM团队</p>
      </div>
    `,
    text: `密码修改通知。亲爱的 ${data.name}，您的账户密码已于 ${data.timestamp} 成功修改。`
  }),

  // 登录通知模板
  loginNotification: (data: { name: string; loginTime: string; ip: string; device: string }) => ({
    subject: '新设备登录通知',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">新设备登录通知</h2>
        <p>亲爱的 ${data.name}，</p>
        <p>您的账户在新设备上登录：</p>
        <ul>
          <li><strong>登录时间：</strong>${data.loginTime}</li>
          <li><strong>IP地址：</strong>${data.ip}</li>
          <li><strong>设备信息：</strong>${data.device}</li>
        </ul>
        <p>如果这不是您本人的操作，请立即修改密码并联系我们的支持团队。</p>
        <p>CRM团队</p>
      </div>
    `,
    text: `新设备登录通知。亲爱的 ${data.name}，您的账户在新设备上登录。登录时间：${data.loginTime}，IP：${data.ip}`
  }),

  // 任务提醒模板
  taskReminder: (data: { name: string; taskTitle: string; dueDate: string; taskUrl: string }) => ({
    subject: `任务提醒：${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">任务提醒</h2>
        <p>亲爱的 ${data.name}，</p>
        <p>您有一个任务即将到期：</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin: 0; color: #495057;">${data.taskTitle}</h3>
          <p style="margin: 5px 0; color: #6c757d;">截止时间：${data.dueDate}</p>
        </div>
        <a href="${data.taskUrl}" style="background-color: #ffc107; color: #212529; padding: 10px 20px; text-decoration: none; border-radius: 5px;">查看任务</a>
        <p>请及时完成您的任务。</p>
        <p>CRM团队</p>
      </div>
    `,
    text: `任务提醒：${data.taskTitle}。截止时间：${data.dueDate}。请访问：${data.taskUrl}`
  })
};

/**
 * 邮件服务类
 */
export class EmailService {
  private static transporter = createTransporter();

  /**
   * 发送邮件
   */
  static async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const { to, subject, html, text, attachments, template, templateData } = options;
      
      let emailContent = { subject, html, text };
      
      // 如果指定了模板，使用模板生成内容
      if (template && templateData && emailTemplates[template]) {
        emailContent = {
          ...emailTemplates[template](templateData),
          text: emailTemplates[template](templateData).text || ''
        };
      }
      
      const mailOptions = {
        from: `"CRM系统" <${emailConfig.auth.user}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments
      };
      
      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('邮件发送成功', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        messageId: result.messageId
      });
      
    } catch (error) {
      logger.error(`邮件发送失败 - 收件人: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}, 主题: ${options.subject}, 错误: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * 发送欢迎邮件
   */
  static async sendWelcomeEmail(to: string, name: string, loginUrl: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: '欢迎加入CRM系统',
      template: 'welcome',
      templateData: { name, loginUrl }
    });
  }

  /**
   * 发送邮箱验证邮件
   */
  static async sendVerificationEmail(to: string, name: string, verificationUrl: string, code: string): Promise<void> {
    await this.sendEmail({
      to,
      template: 'emailVerification',
      templateData: { name, verificationUrl, code },
      subject: '验证您的邮箱地址' // 添加必需的subject字段
    });
  }

  /**
   * 发送密码重置邮件
   */
  static async sendPasswordResetEmail(to: string, name: string, resetUrl: string, code: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: '重置您的密码',
      template: 'passwordReset',
      templateData: { name, resetUrl, code }
    });
  }

  /**
   * 发送密码修改通知邮件
   */
  static async sendPasswordChangedEmail(to: string, name: string, loginUrl: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: '密码修改通知',
      template: 'passwordChanged',
      templateData: { 
        name, 
        loginUrl, 
        timestamp: new Date().toLocaleString('zh-CN')
      }
    });
  }

  /**
   * 发送登录通知邮件
   */
  static async sendLoginNotificationEmail(
    to: string, 
    name: string, 
    ip: string, 
    device: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: '新设备登录通知',
      template: 'loginNotification',
      templateData: { 
        name, 
        ip, 
        device,
        loginTime: new Date().toLocaleString('zh-CN')
      }
    });
  }

  /**
   * 发送任务提醒邮件
   */
  static async sendTaskReminderEmail(
    to: string, 
    name: string, 
    taskTitle: string, 
    dueDate: string, 
    taskUrl: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `任务提醒：${taskTitle}`,
      template: 'taskReminder',
      templateData: { name, taskTitle, dueDate, taskUrl }
    });
  }

  /**
   * 验证邮件配置
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('邮件服务连接验证成功');
      return true;
    } catch (error) {
      logger.error('邮件服务连接验证失败', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}

export default EmailService;