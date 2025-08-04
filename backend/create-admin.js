const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./dist/models/User');

async function createAdmin() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/ai-crm');
    console.log('Connected to database');
    
    // 删除现有管理员账户
    await User.deleteMany({email: 'admin@crm.com'});
    console.log('Deleted existing admin accounts');
    
    // 创建新的管理员账户 - 让模型自动哈希密码
    const defaultPassword = 'Admin123!';
    console.log('Original password:', defaultPassword);
    
    const adminUser = new User({
      email: 'admin@crm.com',
      password: defaultPassword, // 使用明文密码，让pre-save中间件自动哈希
      name: '系统管理员',
      firstName: '系统',
      lastName: '管理员',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
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
          layout: 'default',
          widgets: ['contacts', 'interactions', 'analytics', 'tasks']
        }
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        features: ['unlimited_contacts', 'advanced_analytics', 'ai_assistant', 'api_access']
      }
    });
    
    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@crm.com');
    console.log('Password: Admin123!');
    
    // 验证保存的用户
    const savedAdmin = await User.findOne({email: 'admin@crm.com'}).select('+password');
    const finalTest = await bcrypt.compare(defaultPassword, savedAdmin.password);
    console.log('Final verification:', finalTest);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();