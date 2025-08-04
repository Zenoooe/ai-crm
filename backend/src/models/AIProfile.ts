import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAIProfile extends Document {
  _id: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // 基础画像信息
  personality: {
    traits: string[]; // 性格特征
    communicationStyle: string; // 沟通风格
    decisionMaking: string; // 决策风格
    workStyle: string; // 工作风格
    values: string[]; // 价值观
    motivations: string[]; // 动机
  };
  
  // 商业画像
  business: {
    industry: string;
    companySize: string;
    role: string;
    influence: 'low' | 'medium' | 'high';
    budget: {
      range: string;
      authority: 'none' | 'influencer' | 'decision_maker' | 'budget_holder';
    };
    painPoints: string[];
    goals: string[];
    challenges: string[];
  };
  
  // 关系画像
  relationship: {
    stage: 'stranger' | 'acquaintance' | 'contact' | 'friend' | 'advocate';
    trustLevel: number; // 0-100
    engagement: number; // 0-100
    responsiveness: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    preferredChannels: string[]; // 偏好的沟通渠道
    bestContactTime: {
      days: string[]; // 星期几
      hours: string[]; // 时间段
      timezone: string;
    };
  };
  
  // 销售画像
  sales: {
    stage: 'prospect' | 'lead' | 'opportunity' | 'customer' | 'advocate';
    score: number; // 0-100 销售机会评分
    probability: number; // 0-100 成交概率
    estimatedValue: number; // 预估价值
    timeline: string; // 预估成交时间
    competitors: string[]; // 竞争对手
    objections: string[]; // 常见异议
    buyingSignals: string[]; // 购买信号
  };
  
  // AI分析结果
  analysis: {
    summary: string; // 总体分析摘要
    keyInsights: string[]; // 关键洞察
    recommendations: {
      immediate: string[]; // 立即行动建议
      shortTerm: string[]; // 短期建议
      longTerm: string[]; // 长期建议
    };
    risks: string[]; // 风险点
    opportunities: string[]; // 机会点
    nextBestActions: {
      action: string;
      reason: string;
      timing: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    }[];
  };
  
  // 情感分析
  sentiment: {
    overall: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    trend: 'declining' | 'stable' | 'improving';
    factors: {
      factor: string;
      impact: 'negative' | 'neutral' | 'positive';
      confidence: number;
    }[];
  };
  
  // 客户细分
  segmentation: {
    primary: string; // 主要细分
    secondary: string[]; // 次要细分
    persona: string; // 用户画像类型
    lifecycle: 'awareness' | 'consideration' | 'decision' | 'retention' | 'advocacy';
  };
  
  // 元数据
  metadata: {
    version: string; // 画像版本
    confidence: number; // 0-100 整体置信度
    dataQuality: number; // 0-100 数据质量评分
    lastTrainingData: Date; // 最后训练数据时间
    modelVersion: string; // AI模型版本
    analysisMethod: string; // 分析方法
  };
  
  // 时间戳
  lastAnalyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIProfileSchema = new Schema<IAIProfile>({
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, '联系人ID是必填项'],
    unique: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  personality: {
    traits: [{
      type: String,
      trim: true
    }],
    communicationStyle: {
      type: String,
      trim: true,
      maxlength: [500, '沟通风格描述不能超过500个字符']
    },
    decisionMaking: {
      type: String,
      trim: true,
      maxlength: [500, '决策风格描述不能超过500个字符']
    },
    workStyle: {
      type: String,
      trim: true,
      maxlength: [500, '工作风格描述不能超过500个字符']
    },
    values: [{
      type: String,
      trim: true
    }],
    motivations: [{
      type: String,
      trim: true
    }]
  },
  
  business: {
    industry: {
      type: String,
      trim: true
    },
    companySize: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      default: 'medium'
    },
    role: {
      type: String,
      trim: true
    },
    influence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    budget: {
      range: {
        type: String,
        trim: true
      },
      authority: {
        type: String,
        enum: ['none', 'influencer', 'decision_maker', 'budget_holder'],
        default: 'none'
      }
    },
    painPoints: [{
      type: String,
      trim: true,
      maxlength: [200, '痛点描述不能超过200个字符']
    }],
    goals: [{
      type: String,
      trim: true,
      maxlength: [200, '目标描述不能超过200个字符']
    }],
    challenges: [{
      type: String,
      trim: true,
      maxlength: [200, '挑战描述不能超过200个字符']
    }]
  },
  
  relationship: {
    stage: {
      type: String,
      enum: ['stranger', 'acquaintance', 'contact', 'friend', 'advocate'],
      default: 'stranger'
    },
    trustLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    engagement: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    responsiveness: {
      type: String,
      enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
      default: 'medium'
    },
    preferredChannels: [{
      type: String,
      trim: true
    }],
    bestContactTime: {
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }],
      hours: [{
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }],
      timezone: {
        type: String,
        default: 'Asia/Shanghai'
      }
    }
  },
  
  sales: {
    stage: {
      type: String,
      enum: ['prospect', 'lead', 'opportunity', 'customer', 'advocate'],
      default: 'prospect',
      index: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    estimatedValue: {
      type: Number,
      min: 0,
      default: 0
    },
    timeline: {
      type: String,
      trim: true
    },
    competitors: [{
      type: String,
      trim: true
    }],
    objections: [{
      type: String,
      trim: true,
      maxlength: [200, '异议描述不能超过200个字符']
    }],
    buyingSignals: [{
      type: String,
      trim: true,
      maxlength: [200, '购买信号描述不能超过200个字符']
    }]
  },
  
  analysis: {
    summary: {
      type: String,
      maxlength: [2000, '分析摘要不能超过2000个字符']
    },
    keyInsights: [{
      type: String,
      maxlength: [300, '关键洞察不能超过300个字符']
    }],
    recommendations: {
      immediate: [{
        type: String,
        maxlength: [200, '立即行动建议不能超过200个字符']
      }],
      shortTerm: [{
        type: String,
        maxlength: [200, '短期建议不能超过200个字符']
      }],
      longTerm: [{
        type: String,
        maxlength: [200, '长期建议不能超过200个字符']
      }]
    },
    risks: [{
      type: String,
      maxlength: [200, '风险描述不能超过200个字符']
    }],
    opportunities: [{
      type: String,
      maxlength: [200, '机会描述不能超过200个字符']
    }],
    nextBestActions: [{
      action: {
        type: String,
        required: true,
        maxlength: [200, '行动描述不能超过200个字符']
      },
      reason: {
        type: String,
        required: true,
        maxlength: [300, '原因描述不能超过300个字符']
      },
      timing: {
        type: String,
        required: true,
        maxlength: [100, '时机描述不能超过100个字符']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      }
    }]
  },
  
  sentiment: {
    overall: {
      type: String,
      enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'],
      default: 'neutral',
      index: true
    },
    trend: {
      type: String,
      enum: ['declining', 'stable', 'improving'],
      default: 'stable'
    },
    factors: [{
      factor: {
        type: String,
        required: true,
        trim: true
      },
      impact: {
        type: String,
        enum: ['negative', 'neutral', 'positive'],
        required: true
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      }
    }]
  },
  
  segmentation: {
    primary: {
      type: String,
      trim: true,
      index: true
    },
    secondary: [{
      type: String,
      trim: true
    }],
    persona: {
      type: String,
      trim: true
    },
    lifecycle: {
      type: String,
      enum: ['awareness', 'consideration', 'decision', 'retention', 'advocacy'],
      default: 'awareness',
      index: true
    }
  },
  
  metadata: {
    version: {
      type: String,
      default: '1.0.0'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    dataQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastTrainingData: {
      type: Date,
      default: Date.now
    },
    modelVersion: {
      type: String,
      default: 'gpt-4-1106-preview'
    },
    analysisMethod: {
      type: String,
      default: 'llm_analysis'
    }
  },
  
  lastAnalyzedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
AIProfileSchema.index({ userId: 1, 'sales.score': -1 });
AIProfileSchema.index({ userId: 1, 'sales.stage': 1 });
AIProfileSchema.index({ userId: 1, 'sentiment.overall': 1 });
AIProfileSchema.index({ userId: 1, 'segmentation.primary': 1 });
AIProfileSchema.index({ userId: 1, lastAnalyzedAt: -1 });

// 文本搜索索引
AIProfileSchema.index({
  'analysis.summary': 'text',
  'analysis.keyInsights': 'text',
  'business.painPoints': 'text',
  'business.goals': 'text'
});

// 静态方法：根据用户ID获取高价值客户
AIProfileSchema.statics.getHighValueProspects = function(userId: string, limit: number = 20) {
  return this.find({
    userId: new Types.ObjectId(userId),
    'sales.score': { $gte: 70 },
    'sales.stage': { $in: ['prospect', 'lead', 'opportunity'] }
  })
  .sort({ 'sales.score': -1, lastAnalyzedAt: -1 })
  .limit(limit)
  .populate('contactId', 'basicInfo.name basicInfo.company basicInfo.position');
};

// 静态方法：获取需要跟进的客户
AIProfileSchema.statics.getFollowUpNeeded = function(userId: string) {
  return this.find({
    userId: new Types.ObjectId(userId),
    'analysis.nextBestActions.priority': { $in: ['high', 'urgent'] },
    'sales.stage': { $ne: 'customer' }
  })
  .sort({ 'analysis.nextBestActions.priority': 1, 'sales.score': -1 })
  .populate('contactId', 'basicInfo.name basicInfo.company basicInfo.position');
};

// 静态方法：获取客户细分统计
AIProfileSchema.statics.getSegmentationStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $facet: {
        byStage: [
          { $group: { _id: '$sales.stage', count: { $sum: 1 }, avgScore: { $avg: '$sales.score' } } },
          { $sort: { count: -1 } }
        ],
        bySegment: [
          { $group: { _id: '$segmentation.primary', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        bySentiment: [
          { $group: { _id: '$sentiment.overall', count: { $sum: 1 } } }
        ],
        byLifecycle: [
          { $group: { _id: '$segmentation.lifecycle', count: { $sum: 1 } } }
        ],
        scoreDistribution: [
          {
            $bucket: {
              groupBy: '$sales.score',
              boundaries: [0, 20, 40, 60, 80, 100],
              default: 'other',
              output: { count: { $sum: 1 } }
            }
          }
        ]
      }
    }
  ]);

  return stats[0];
};

// 静态方法：搜索AI画像
AIProfileSchema.statics.searchProfiles = function(userId: string, searchTerm: string, options: any = {}) {
  const {
    page = 1,
    limit = 20,
    stage,
    sentiment,
    minScore = 0
  } = options;

  const query: any = {
    userId: new Types.ObjectId(userId),
    'sales.score': { $gte: minScore },
    $text: { $search: searchTerm }
  };

  if (stage) query['sales.stage'] = stage;
  if (sentiment) query['sentiment.overall'] = sentiment;

  const skip = (page - 1) * limit;

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, 'sales.score': -1 })
    .skip(skip)
    .limit(limit)
    .populate('contactId', 'basicInfo.name basicInfo.company basicInfo.position');
};

// 静态方法：批量更新销售阶段
AIProfileSchema.statics.updateSalesStage = function(profileIds: string[], stage: string) {
  return this.updateMany(
    { _id: { $in: profileIds.map(id => new Types.ObjectId(id)) } },
    { 
      $set: { 
        'sales.stage': stage,
        lastAnalyzedAt: new Date()
      }
    }
  );
};

// 虚拟属性：整体健康度评分
AIProfileSchema.virtual('healthScore').get(function() {
  const salesScore = this.sales.score || 0;
  const trustLevel = this.relationship.trustLevel || 0;
  const engagement = this.relationship.engagement || 0;
  const confidence = this.metadata.confidence || 0;
  
  return Math.round((salesScore * 0.4 + trustLevel * 0.3 + engagement * 0.2 + confidence * 0.1));
});

// 虚拟属性：风险等级
AIProfileSchema.virtual('riskLevel').get(function() {
  const riskCount = this.analysis.risks?.length || 0;
  const sentiment = this.sentiment.overall;
  const responsiveness = this.relationship.responsiveness;
  
  if (riskCount >= 3 || sentiment === 'very_negative' || responsiveness === 'very_low') {
    return 'high';
  } else if (riskCount >= 2 || sentiment === 'negative' || responsiveness === 'low') {
    return 'medium';
  } else {
    return 'low';
  }
});

// 虚拟属性：下一步最佳行动
AIProfileSchema.virtual('nextBestAction').get(function() {
  const actions = this.analysis.nextBestActions || [];
  return actions.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  })[0] || null;
});

export const AIProfile = mongoose.model<IAIProfile>('AIProfile', AIProfileSchema);
export default AIProfile;