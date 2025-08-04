import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  company?: string;
  phone?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
  verificationToken?: string;
  verificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    dashboard: {
      layout: string;
      widgets: string[];
    };
  };
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    startDate?: Date;
    endDate?: Date;
    features: string[];
  };
  apiUsage: {
    aiRequests: number;
    ocrScans: number;
    resetDate: Date;
    limits: {
      aiRequests: number;
      ocrScans: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  toJSON(): any;
}

export interface IUserModel extends mongoose.Model<IUser> {
  findByEmailWithPassword(email: string): Promise<IUser | null>;
  checkApiLimit(userId: string, type: 'aiRequests' | 'ocrScans'): Promise<boolean>;
  incrementApiUsage(userId: string, type: 'aiRequests' | 'ocrScans'): Promise<IUser | null>;
  getUserStats(userId: string): Promise<any>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, '邮箱是必填项'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必填项'],
    minlength: [6, '密码至少需要6个字符'],
    select: false // 默认查询时不返回密码
  },
  name: {
    type: String,
    required: [true, '姓名是必填项'],
    trim: true,
    maxlength: [50, '姓名不能超过50个字符']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [25, '名字不能超过25个字符']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [25, '姓氏不能超过25个字符']
  },
  avatar: {
    type: String,
    default: null
  },
  company: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  preferences: {
    language: {
      type: String,
      default: 'zh-CN',
      enum: ['zh-CN', 'en-US', 'ja-JP']
    },
    timezone: {
      type: String,
      default: 'Asia/Shanghai'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    dashboard: {
      layout: {
        type: String,
        default: 'default',
        enum: ['default', 'compact', 'detailed']
      },
      widgets: {
        type: [String],
        default: ['contacts', 'interactions', 'analytics', 'tasks']
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    features: {
      type: [String],
      default: ['basic_contacts', 'basic_interactions']
    }
  },
  apiUsage: {
    aiRequests: {
      type: Number,
      default: 0
    },
    ocrScans: {
      type: Number,
      default: 0
    },
    resetDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1, 1); // 下个月1号重置
        date.setHours(0, 0, 0, 0);
        return date;
      }
    },
    limits: {
      aiRequests: {
        type: Number,
        default: 100 // 免费用户每月100次AI请求
      },
      ocrScans: {
        type: Number,
        default: 50 // 免费用户每月50次OCR扫描
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ isActive: 1 });
UserSchema.index({ 'subscription.plan': 1 });
UserSchema.index({ 'subscription.status': 1 });
UserSchema.index({ createdAt: 1 });

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 更新时间中间件
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 实例方法：比较密码
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('密码比较失败');
  }
};

// 实例方法：生成JWT令牌
UserSchema.methods.generateAuthToken = function(): string {
  const payload = {
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
    type: 'access'
  };
  
  const secret = process.env.JWT_SECRET || 'default-secret';
  
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

// 实例方法：自定义JSON序列化
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// 静态方法：根据邮箱查找用户（包含密码）
UserSchema.statics.findByEmailWithPassword = function(email: string) {
  return this.findOne({ email }).select('+password');
};

// 静态方法：检查API使用限制
UserSchema.statics.checkApiLimit = async function(userId: string, type: 'aiRequests' | 'ocrScans') {
  const user = await this.findById(userId);
  if (!user) return false;
  
  // 检查是否需要重置计数
  if (new Date() >= user.apiUsage.resetDate) {
    user.apiUsage.aiRequests = 0;
    user.apiUsage.ocrScans = 0;
    const nextResetDate = new Date();
    nextResetDate.setMonth(nextResetDate.getMonth() + 1, 1);
    nextResetDate.setHours(0, 0, 0, 0);
    user.apiUsage.resetDate = nextResetDate;
    await user.save();
  }
  
  return user.apiUsage[type] < user.apiUsage.limits[type];
};

// 静态方法：增加API使用计数
UserSchema.statics.incrementApiUsage = async function(userId: string, type: 'aiRequests' | 'ocrScans') {
  return this.findByIdAndUpdate(
    userId,
    { $inc: { [`apiUsage.${type}`]: 1 } },
    { new: true }
  );
};

// 静态方法：获取用户统计信息
UserSchema.statics.getUserStats = async function(userId: string) {
  const user = await this.findById(userId);
  if (!user) return null;
  
  const Contact = mongoose.model('Contact');
  const Interaction = mongoose.model('Interaction');
  
  const [contactCount, interactionCount] = await Promise.all([
    Contact.countDocuments({ userId }),
    Interaction.countDocuments({ userId })
  ]);
  
  return {
    contactCount,
    interactionCount,
    apiUsage: user.apiUsage,
    subscription: user.subscription
  };
};

// 虚拟属性：订阅是否有效
UserSchema.virtual('isSubscriptionActive').get(function() {
  if (this.subscription.plan === 'free') return true;
  
  return this.subscription.status === 'active' && 
         (!this.subscription.endDate || this.subscription.endDate > new Date());
});

// 虚拟属性：剩余API配额
UserSchema.virtual('remainingApiQuota').get(function() {
  return {
    aiRequests: Math.max(0, this.apiUsage.limits.aiRequests - this.apiUsage.aiRequests),
    ocrScans: Math.max(0, this.apiUsage.limits.ocrScans - this.apiUsage.ocrScans)
  };
});

export const User = mongoose.model<IUser, IUserModel>('User', UserSchema) as IUserModel;
export default User;