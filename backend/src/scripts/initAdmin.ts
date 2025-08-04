import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 初始化管理员账号
 * 默认账号信息：
 * 邮箱: admin@crm.com
 * 密码: Admin123!
 * 角色: admin
 */
async function initAdminUser() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    await mongoose.connect(mongoUri);
    logger.info('数据库连接成功');

    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({ email: 'admin@crm.com' });
    if (existingAdmin) {
      logger.info('管理员账号已存在，跳过初始化');
      console.log('管理员账号信息:');
      console.log('邮箱: admin@crm.com');
      console.log('如需重置密码，请使用忘记密码功能或直接修改数据库');
      return;
    }

    // 创建默认管理员账号
    const defaultPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const adminUser = new User({
      email: 'admin@crm.com',
      password: hashedPassword,
      name: '系统管理员',
      firstName: '系统',
      lastName: '管理员',
      role: 'admin',
      isActive: true,
      isEmailVerified: true, // 管理员账号默认已验证
      company: 'CRM系统',
      preferences: {
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        dashboard: {
          layout: 'detailed',
          widgets: ['contacts', 'interactions', 'analytics', 'tasks', 'reports']
        }
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date(),
        endDate: null, // 永久有效
        features: [
          'unlimited_contacts',
          'unlimited_interactions', 
          'advanced_analytics',
          'ai_features',
          'ocr_scanning',
          'api_access',
          'custom_fields',
          'bulk_operations',
          'advanced_reports'
        ]
      },
      apiUsage: {
        aiRequests: 0,
        ocrScans: 0,
        resetDate: new Date(),
        limits: {
          aiRequests: 10000, // 管理员高额度
          ocrScans: 5000
        }
      }
    });

    await adminUser.save();
    
    logger.info('管理员账号创建成功');
    console.log('\n=== 管理员账号信息 ===');
    console.log('邮箱: admin@crm.com');
    console.log('密码: Admin123!');
    console.log('角色: 管理员');
    console.log('状态: 已激活');
    console.log('\n请登录后立即修改默认密码！');
    console.log('========================\n');

  } catch (error) {
    logger.error('初始化管理员账号失败:', error as Error);
    console.error('初始化失败:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

/**
 * 重置管理员密码
 * 使用方法: npm run reset-admin-password
 */
async function resetAdminPassword() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    await mongoose.connect(mongoUri);
    logger.info('数据库连接成功');

    // 查找管理员账号
    const adminUser = await User.findOne({ email: 'admin@crm.com' });
    if (!adminUser) {
      logger.error('未找到管理员账号，请先运行初始化脚本');
      return;
    }

    // 重置为默认密码
    const defaultPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    adminUser.password = hashedPassword;
    await adminUser.save();
    
    logger.info('管理员密码重置成功');
    console.log('\n=== 密码重置成功 ===');
    console.log('邮箱: admin@crm.com');
    console.log('新密码: Admin123!');
    console.log('请登录后立即修改密码！');
    console.log('=====================\n');

  } catch (error) {
    logger.error('重置管理员密码失败:', error as Error);
    console.error('重置失败:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// 根据命令行参数执行不同操作
const action = process.argv[2];

if (action === 'reset') {
  resetAdminPassword();
} else {
  initAdminUser();
}

export { initAdminUser, resetAdminPassword };