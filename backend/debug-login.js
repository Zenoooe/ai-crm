const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./dist/models/User');

async function debugLogin() {
  try {
    // 连接数据库
    await mongoose.connect('mongodb://localhost:27017/ai_crm');
    console.log('Connected to database');

    // 查找管理员用户
    const user = await User.findOne({ email: 'admin@crm.com' }).select('+password');
    
    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:');
    console.log('- Email:', user.email);
    console.log('- Name:', user.name);
    console.log('- Role:', user.role);
    console.log('- IsActive:', user.isActive);
    console.log('- IsEmailVerified:', user.isEmailVerified);
    console.log('- Password hash exists:', !!user.password);
    console.log('- Password hash length:', user.password ? user.password.length : 0);
    
    // 测试密码比较
    const testPassword = 'Admin123!';
    console.log('\nTesting password:', testPassword);
    
    // 使用bcrypt直接比较
    const directCompare = await bcrypt.compare(testPassword, user.password);
    console.log('Direct bcrypt.compare result:', directCompare);
    
    // 使用模型方法比较
    const modelCompare = await user.comparePassword(testPassword);
    console.log('Model comparePassword result:', modelCompare);
    
    // 测试错误密码
    const wrongPassword = 'WrongPassword123!';
    const wrongCompare = await user.comparePassword(wrongPassword);
    console.log('Wrong password test result:', wrongCompare);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugLogin();