import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInteraction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  type: 'call' | 'email' | 'meeting' | 'message' | 'social' | 'note' | 'task' | 'other';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  attachments: {
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }[];
  metadata: {
    platform?: string; // 微信、QQ、LinkedIn等
    duration?: number; // 通话时长（秒）
    location?: string; // 会议地点
    participants?: string[]; // 参与者
    tags?: string[]; // 标签
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  aiAnalysis: {
    summary?: string;
    keyPoints?: string[];
    actionItems?: string[];
    nextSteps?: string[];
    opportunities?: string[];
    risks?: string[];
    emotionalTone?: string;
    confidence?: number;
    analyzedAt?: Date;
  };
  salesStage: 'prospecting' | 'qualifying' | 'proposing' | 'negotiating' | 'closing' | 'won' | 'lost';
  outcome: {
    result?: 'successful' | 'unsuccessful' | 'follow_up_needed' | 'no_response';
    nextAction?: string;
    nextActionDate?: Date;
    dealValue?: number;
    probability?: number;
    notes?: string;
  };
  scheduledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必填项'],
    index: true
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, '联系人ID是必填项'],
    index: true
  },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'message', 'social', 'note', 'task', 'other'],
    required: [true, '互动类型是必填项'],
    index: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: [true, '互动方向是必填项']
  },
  subject: {
    type: String,
    trim: true,
    maxlength: [200, '主题不能超过200个字符']
  },
  content: {
    type: String,
    required: [true, '内容是必填项'],
    maxlength: [5000, '内容不能超过5000个字符']
  },
  attachments: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    platform: {
      type: String,
      trim: true
    },
    duration: {
      type: Number,
      min: 0
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, '地点不能超过200个字符']
    },
    participants: [{
      type: String,
      trim: true
    }],
    tags: [{
      type: String,
      trim: true
    }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rescheduled'],
      default: 'completed'
    }
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral',
    index: true
  },
  aiAnalysis: {
    summary: {
      type: String,
      maxlength: [1000, '摘要不能超过1000个字符']
    },
    keyPoints: [{
      type: String,
      maxlength: [200, '关键点不能超过200个字符']
    }],
    actionItems: [{
      type: String,
      maxlength: [200, '行动项不能超过200个字符']
    }],
    nextSteps: [{
      type: String,
      maxlength: [200, '下一步不能超过200个字符']
    }],
    opportunities: [{
      type: String,
      maxlength: [200, '机会点不能超过200个字符']
    }],
    risks: [{
      type: String,
      maxlength: [200, '风险点不能超过200个字符']
    }],
    emotionalTone: {
      type: String,
      maxlength: [100, '情感基调不能超过100个字符']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    analyzedAt: {
      type: Date
    }
  },
  salesStage: {
    type: String,
    enum: ['prospecting', 'qualifying', 'proposing', 'negotiating', 'closing', 'won', 'lost'],
    default: 'prospecting',
    index: true
  },
  outcome: {
    result: {
      type: String,
      enum: ['successful', 'unsuccessful', 'follow_up_needed', 'no_response']
    },
    nextAction: {
      type: String,
      maxlength: [500, '下一步行动不能超过500个字符']
    },
    nextActionDate: {
      type: Date
    },
    dealValue: {
      type: Number,
      min: 0
    },
    probability: {
      type: Number,
      min: 0,
      max: 100
    },
    notes: {
      type: String,
      maxlength: [1000, '备注不能超过1000个字符']
    }
  },
  scheduledAt: {
    type: Date
  },
  completedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
InteractionSchema.index({ userId: 1, contactId: 1 });
InteractionSchema.index({ userId: 1, type: 1 });
InteractionSchema.index({ userId: 1, createdAt: -1 });
InteractionSchema.index({ contactId: 1, createdAt: -1 });
InteractionSchema.index({ userId: 1, salesStage: 1 });
InteractionSchema.index({ userId: 1, sentiment: 1 });
InteractionSchema.index({ scheduledAt: 1 }, { sparse: true });
InteractionSchema.index({ 'outcome.nextActionDate': 1 }, { sparse: true });

// 文本搜索索引
InteractionSchema.index({
  subject: 'text',
  content: 'text',
  'aiAnalysis.summary': 'text',
  'aiAnalysis.keyPoints': 'text'
});

// 中间件：设置完成时间
InteractionSchema.pre('save', function(next) {
  if (this.isModified('metadata.status') && this.metadata.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

// 静态方法：根据联系人ID获取互动历史
InteractionSchema.statics.findByContactId = function(contactId: string, options: any = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    sentiment,
    salesStage,
    startDate,
    endDate
  } = options;

  const query: any = { contactId: new Types.ObjectId(contactId) };

  if (type) query.type = type;
  if (sentiment) query.sentiment = sentiment;
  if (salesStage) query.salesStage = salesStage;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('contactId', 'basicInfo.name basicInfo.company')
    .lean();
};

// 静态方法：获取用户的互动统计
InteractionSchema.statics.getUserStats = async function(userId: string, timeRange: string = '30d') {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const stats = await this.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byType: [
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        bySentiment: [
          { $group: { _id: '$sentiment', count: { $sum: 1 } } }
        ],
        bySalesStage: [
          { $group: { _id: '$salesStage', count: { $sum: 1 } } }
        ],
        timeline: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ],
        avgDealValue: [
          {
            $match: {
              'outcome.dealValue': { $exists: true, $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              avgValue: { $avg: '$outcome.dealValue' },
              totalValue: { $sum: '$outcome.dealValue' },
              count: { $sum: 1 }
            }
          }
        ]
      }
    }
  ]);

  const result = stats[0];
  return {
    total: result.total[0]?.count || 0,
    byType: result.byType,
    bySentiment: result.bySentiment,
    bySalesStage: result.bySalesStage,
    timeline: result.timeline,
    dealStats: result.avgDealValue[0] || { avgValue: 0, totalValue: 0, count: 0 }
  };
};

// 静态方法：获取待跟进的互动
InteractionSchema.statics.getPendingFollowUps = function(userId: string) {
  const now = new Date();
  
  return this.find({
    userId: new Types.ObjectId(userId),
    'outcome.nextActionDate': { $lte: now },
    'metadata.status': { $ne: 'completed' }
  })
  .populate('contactId', 'basicInfo.name basicInfo.company basicInfo.phone basicInfo.email')
  .sort({ 'outcome.nextActionDate': 1 })
  .limit(50);
};

// 静态方法：搜索互动记录
InteractionSchema.statics.searchInteractions = function(userId: string, searchTerm: string, options: any = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    sentiment,
    startDate,
    endDate
  } = options;

  const query: any = {
    userId: new Types.ObjectId(userId),
    $text: { $search: searchTerm }
  };

  if (type) query.type = type;
  if (sentiment) query.sentiment = sentiment;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('contactId', 'basicInfo.name basicInfo.company');
};

// 静态方法：批量更新销售阶段
InteractionSchema.statics.updateSalesStage = function(interactionIds: string[], salesStage: string) {
  return this.updateMany(
    { _id: { $in: interactionIds.map(id => new Types.ObjectId(id)) } },
    { $set: { salesStage } }
  );
};

// 虚拟属性：是否逾期
InteractionSchema.virtual('isOverdue').get(function() {
  if (!this.outcome?.nextActionDate) return false;
  return new Date() > this.outcome.nextActionDate;
});

// 虚拟属性：互动时长（格式化）
InteractionSchema.virtual('formattedDuration').get(function() {
  if (!this.metadata?.duration) return null;
  
  const duration = this.metadata.duration;
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`;
  } else {
    return `${seconds}秒`;
  }
});

// 虚拟属性：附件总大小
InteractionSchema.virtual('totalAttachmentSize').get(function() {
  return this.attachments.reduce((total, attachment) => total + attachment.size, 0);
});

export const Interaction = mongoose.model<IInteraction>('Interaction', InteractionSchema);
export default Interaction;