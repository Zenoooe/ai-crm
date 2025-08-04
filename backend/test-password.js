const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./dist/models/User').User;

async function testPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/crm');
    console.log('Connected to database');
    
    const admin = await User.findOne({email: 'admin@crm.com'}).select('+password');
    
    if (admin) {
      console.log('Admin found:', admin.email);
      console.log('Password hash:', admin.password);
      
      const testPassword = 'Admin123!';
      console.log('Testing password:', testPassword);
      
      // 直接使用bcrypt比较
      const directCompare = await bcrypt.compare(testPassword, admin.password);
      console.log('Direct bcrypt compare:', directCompare);
      
      // 使用模型方法比较
      const modelCompare = await admin.comparePassword(testPassword);
      console.log('Model comparePassword:', modelCompare);
      
      // 测试错误密码
      const wrongCompare = await admin.comparePassword('wrongpassword');
      console.log('Wrong password compare:', wrongCompare);
      
    } else {
      console.log('Admin user not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testPassword();