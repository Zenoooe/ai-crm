const mongoose = require('mongoose');
const User = require('./dist/models/User').User;

async function checkAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/crm');
    console.log('Connected to database');
    
    const admin = await User.findOne({email: 'admin@crm.com'}).select('+password');
    
    if (admin) {
      console.log('Admin user found:');
      console.log('- Email:', admin.email);
      console.log('- Name:', admin.name);
      console.log('- Role:', admin.role);
      console.log('- isActive:', admin.isActive);
      console.log('- isEmailVerified:', admin.isEmailVerified);
      console.log('- Password hash exists:', !!admin.password);
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

checkAdmin();