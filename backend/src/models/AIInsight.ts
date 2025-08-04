import mongoose, { Document, Schema } from 'mongoose';

export interface IAIInsight extends Document {
  userId: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  insights: {
    id: string;
    type: 'recommendation' | 'prediction' | 'analysis';
    title: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
    confidence: number;
    generatedAt: string;
    metadata?: any;
  }[];
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIInsightSchema = new Schema<IAIInsight>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  insights: [{
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['recommendation', 'prediction', 'analysis'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    actionable: {
      type: Boolean,
      default: false
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    generatedAt: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  }],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'ai_insights'
});

// 索引
AIInsightSchema.index({ userId: 1, contactId: 1 });
AIInsightSchema.index({ createdAt: -1 });
AIInsightSchema.index({ 'insights.type': 1 });
AIInsightSchema.index({ 'insights.priority': 1 });

// 虚拟字段
AIInsightSchema.virtual('contact', {
  ref: 'Contact',
  localField: 'contactId',
  foreignField: '_id',
  justOne: true
});

AIInsightSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// 实例方法
AIInsightSchema.methods.getHighPriorityInsights = function() {
  return this.insights.filter((insight: any) => insight.priority === 'high');
};

AIInsightSchema.methods.getActionableInsights = function() {
  return this.insights.filter((insight: any) => insight.actionable === true);
};

AIInsightSchema.methods.getInsightsByType = function(type: string) {
  return this.insights.filter((insight: any) => insight.type === type);
};

// 静态方法
AIInsightSchema.statics.findByContact = function(contactId: string, userId: string) {
  return this.findOne({ contactId, userId }).sort({ createdAt: -1 });
};

AIInsightSchema.statics.findRecentInsights = function(userId: string, days: number = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: -1 });
};

AIInsightSchema.statics.getInsightStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$insights' },
    {
      $group: {
        _id: '$insights.type',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$insights.confidence' },
        highPriorityCount: {
          $sum: {
            $cond: [{ $eq: ['$insights.priority', 'high'] }, 1, 0]
          }
        },
        actionableCount: {
          $sum: {
            $cond: ['$insights.actionable', 1, 0]
          }
        }
      }
    }
  ]);
};

// 中间件
AIInsightSchema.pre('save', function(next) {
  // 确保每个insight都有唯一的ID
  this.insights.forEach((insight: any) => {
    if (!insight.id) {
      insight.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  });
  next();
});

AIInsightSchema.pre('save', function(next) {
  // 限制insights数量，保持最新的50个
  if (this.insights.length > 50) {
    this.insights = this.insights.slice(-50);
  }
  next();
});

export const AIInsight = mongoose.model<IAIInsight>('AIInsight', AIInsightSchema);
export default AIInsight;