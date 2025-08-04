import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAIScript extends Document {
  _id: mongoose.Types.ObjectId;
  contactId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // 话术基本信息
  title: string;
  methodology: 'straightLine' | 'sandler' | 'obppc' | 'custom';
  scenario: 'cold_call' | 'follow_up' | 'meeting' | 'email' | 'social' | 'presentation' | 'objection' | 'closing';
  customPrompt?: string;
  
  // 话术内容
  content: {
    opening: {
      script: string;
      keyPoints: string[];
      tone: string;
      duration?: string;
    };
    discovery: {
      questions: string[];
      probes: string[];
      listening_cues: string[];
    };
    presentation: {
      value_props: string[];
      benefits: string[];
      proof_points: string[];
      stories: string[];
    };
    objectionHandling: {
      common_objections: {
        objection: string;
        response: string;
        follow_up: string;
      }[];
      techniques: string[];
    };
    closing: {
      trial_closes: string[];
      final_close: string;
      alternatives: string[];
    };
  };
  
  // 今日建议
  todayRecommendations: {
    topics: string[]; // 今天应该聊什么
    actions: {
      action: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      timing: string;
      expected_outcome: string;
    }[];
    opportunities: {
      description: string;
      potential_value: number;
      probability: number;
      timeline: string;
    }[];
    risks: {
      risk: string;
      mitigation: string;
      impact: 'low' | 'medium' | 'high';
    }[];
  };
  
  // 关系建设建议
  relationshipBuilding: {
    rapport_builders: string[];
    trust_signals: string[];
    credibility_enhancers: string[];
    social_proof: string[];
    content_sharing: {
      type: 'article' | 'video' | 'case_study' | 'whitepaper' | 'social_post';
      title: string;
      description: string;
      timing: string;
      platform: string;
    }[];
  };
  
  // 跟进策略
  followUpStrategy: {
    next_contact_date: Date;
    preferred_method: string;
    frequency: string;
    escalation_plan: string[];
    success_metrics: string[];
  };
  
  // 成交分析
  dealAnalysis: {
    estimated_value: number;
    probability: number;
    timeline: string;
    decision_makers: string[];
    buying_process: string[];
    competition: string[];
    differentiators: string[];
  };
  
  // 个性化元素
  personalization: {
    communication_style: string;
    preferred_channels: string[];
    best_contact_times: string[];
    interests: string[];
    pain_points: string[];
    motivators: string[];
  };
  
  // 元数据
  metadata: {
    ai_model: string;
    generation_time: number; // 生成耗时（毫秒）
    confidence_score: number; // 0-100
    version: string;
    language: string;
    context_data: {
      recent_interactions: number;
      relationship_stage: string;
      sales_stage: string;
      last_contact: Date;
    };
  };
  
  // 使用统计
  usage: {
    views: number;
    used_sections: string[];
    feedback: {
      rating: number; // 1-5
      comment?: string;
      helpful_sections: string[];
      improvement_suggestions: string[];
    }[];
    success_rate?: number;
  };
  
  // 状态
  status: 'draft' | 'active' | 'used' | 'archived';
  isTemplate: boolean;
  tags: string[];
  
  generatedAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIScriptSchema = new Schema<IAIScript>({
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: [true, '联系人ID是必填项'],
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必填项'],
    index: true
  },
  
  title: {
    type: String,
    required: [true, '话术标题是必填项'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  methodology: {
    type: String,
    enum: ['straightLine', 'sandler', 'obppc', 'custom'],
    required: [true, '销售方法论是必填项'],
    index: true
  },
  scenario: {
    type: String,
    enum: ['cold_call', 'follow_up', 'meeting', 'email', 'social', 'presentation', 'objection', 'closing'],
    required: [true, '应用场景是必填项'],
    index: true
  },
  customPrompt: {
    type: String,
    maxlength: [1000, '自定义提示不能超过1000个字符']
  },
  
  content: {
    opening: {
      script: {
        type: String,
        required: true,
        maxlength: [2000, '开场白不能超过2000个字符']
      },
      keyPoints: [{
        type: String,
        maxlength: [200, '关键点不能超过200个字符']
      }],
      tone: {
        type: String,
        maxlength: [100, '语调描述不能超过100个字符']
      },
      duration: {
        type: String,
        maxlength: [50, '时长描述不能超过50个字符']
      }
    },
    discovery: {
      questions: [{
        type: String,
        maxlength: [300, '问题不能超过300个字符']
      }],
      probes: [{
        type: String,
        maxlength: [200, '探索性问题不能超过200个字符']
      }],
      listening_cues: [{
        type: String,
        maxlength: [150, '倾听要点不能超过150个字符']
      }]
    },
    presentation: {
      value_props: [{
        type: String,
        maxlength: [300, '价值主张不能超过300个字符']
      }],
      benefits: [{
        type: String,
        maxlength: [200, '利益点不能超过200个字符']
      }],
      proof_points: [{
        type: String,
        maxlength: [250, '证明点不能超过250个字符']
      }],
      stories: [{
        type: String,
        maxlength: [500, '故事不能超过500个字符']
      }]
    },
    objectionHandling: {
      common_objections: [{
        objection: {
          type: String,
          required: true,
          maxlength: [200, '异议不能超过200个字符']
        },
        response: {
          type: String,
          required: true,
          maxlength: [500, '回应不能超过500个字符']
        },
        follow_up: {
          type: String,
          maxlength: [300, '后续跟进不能超过300个字符']
        }
      }],
      techniques: [{
        type: String,
        maxlength: [200, '技巧描述不能超过200个字符']
      }]
    },
    closing: {
      trial_closes: [{
        type: String,
        maxlength: [200, '试探性成交不能超过200个字符']
      }],
      final_close: {
        type: String,
        maxlength: [300, '最终成交不能超过300个字符']
      },
      alternatives: [{
        type: String,
        maxlength: [200, '备选方案不能超过200个字符']
      }]
    }
  },
  
  todayRecommendations: {
    topics: [{
      type: String,
      maxlength: [150, '话题不能超过150个字符']
    }],
    actions: [{
      action: {
        type: String,
        required: true,
        maxlength: [200, '行动不能超过200个字符']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      timing: {
        type: String,
        maxlength: [100, '时机不能超过100个字符']
      },
      expected_outcome: {
        type: String,
        maxlength: [200, '预期结果不能超过200个字符']
      }
    }],
    opportunities: [{
      description: {
        type: String,
        maxlength: [300, '机会描述不能超过300个字符']
      },
      potential_value: {
        type: Number,
        min: 0
      },
      probability: {
        type: Number,
        min: 0,
        max: 100
      },
      timeline: {
        type: String,
        maxlength: [100, '时间线不能超过100个字符']
      }
    }],
    risks: [{
      risk: {
        type: String,
        maxlength: [200, '风险描述不能超过200个字符']
      },
      mitigation: {
        type: String,
        maxlength: [300, '缓解措施不能超过300个字符']
      },
      impact: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }]
  },
  
  relationshipBuilding: {
    rapport_builders: [{
      type: String,
      maxlength: [200, '关系建设要点不能超过200个字符']
    }],
    trust_signals: [{
      type: String,
      maxlength: [150, '信任信号不能超过150个字符']
    }],
    credibility_enhancers: [{
      type: String,
      maxlength: [200, '可信度增强不能超过200个字符']
    }],
    social_proof: [{
      type: String,
      maxlength: [250, '社会证明不能超过250个字符']
    }],
    content_sharing: [{
      type: {
        type: String,
        enum: ['article', 'video', 'case_study', 'whitepaper', 'social_post'],
        required: true
      },
      title: {
        type: String,
        required: true,
        maxlength: [150, '标题不能超过150个字符']
      },
      description: {
        type: String,
        maxlength: [300, '描述不能超过300个字符']
      },
      timing: {
        type: String,
        maxlength: [100, '时机不能超过100个字符']
      },
      platform: {
        type: String,
        maxlength: [50, '平台不能超过50个字符']
      }
    }]
  },
  
  followUpStrategy: {
    next_contact_date: {
      type: Date,
      index: true
    },
    preferred_method: {
      type: String,
      maxlength: [50, '联系方式不能超过50个字符']
    },
    frequency: {
      type: String,
      maxlength: [100, '频率描述不能超过100个字符']
    },
    escalation_plan: [{
      type: String,
      maxlength: [200, '升级计划不能超过200个字符']
    }],
    success_metrics: [{
      type: String,
      maxlength: [150, '成功指标不能超过150个字符']
    }]
  },
  
  dealAnalysis: {
    estimated_value: {
      type: Number,
      min: 0,
      default: 0
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    timeline: {
      type: String,
      maxlength: [100, '时间线不能超过100个字符']
    },
    decision_makers: [{
      type: String,
      maxlength: [100, '决策者不能超过100个字符']
    }],
    buying_process: [{
      type: String,
      maxlength: [200, '购买流程不能超过200个字符']
    }],
    competition: [{
      type: String,
      maxlength: [100, '竞争对手不能超过100个字符']
    }],
    differentiators: [{
      type: String,
      maxlength: [200, '差异化优势不能超过200个字符']
    }]
  },
  
  personalization: {
    communication_style: {
      type: String,
      maxlength: [200, '沟通风格不能超过200个字符']
    },
    preferred_channels: [{
      type: String,
      maxlength: [50, '偏好渠道不能超过50个字符']
    }],
    best_contact_times: [{
      type: String,
      maxlength: [50, '最佳联系时间不能超过50个字符']
    }],
    interests: [{
      type: String,
      maxlength: [100, '兴趣不能超过100个字符']
    }],
    pain_points: [{
      type: String,
      maxlength: [150, '痛点不能超过150个字符']
    }],
    motivators: [{
      type: String,
      maxlength: [150, '激励因素不能超过150个字符']
    }]
  },
  
  metadata: {
    ai_model: {
      type: String,
      default: 'gpt-4'
    },
    generation_time: {
      type: Number,
      min: 0
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    language: {
      type: String,
      default: 'zh-CN'
    },
    context_data: {
      recent_interactions: {
        type: Number,
        default: 0
      },
      relationship_stage: {
        type: String,
        default: 'stranger'
      },
      sales_stage: {
        type: String,
        default: 'prospect'
      },
      last_contact: {
        type: Date
      }
    }
  },
  
  usage: {
    views: {
      type: Number,
      default: 0
    },
    used_sections: [{
      type: String
    }],
    feedback: [{
      rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comment: {
        type: String,
        maxlength: [500, '评论不能超过500个字符']
      },
      helpful_sections: [{
        type: String
      }],
      improvement_suggestions: [{
        type: String,
        maxlength: [200, '改进建议不能超过200个字符']
      }]
    }],
    success_rate: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  status: {
    type: String,
    enum: ['draft', 'active', 'used', 'archived'],
    default: 'active',
    index: true
  },
  isTemplate: {
    type: Boolean,
    default: false,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, '标签不能超过50个字符']
  }],
  
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastUsedAt: {
    type: Date,
    index: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 复合索引
AIScriptSchema.index({ userId: 1, contactId: 1 });
AIScriptSchema.index({ userId: 1, methodology: 1 });
AIScriptSchema.index({ userId: 1, scenario: 1 });
AIScriptSchema.index({ userId: 1, status: 1 });
AIScriptSchema.index({ userId: 1, generatedAt: -1 });
AIScriptSchema.index({ contactId: 1, generatedAt: -1 });
AIScriptSchema.index({ isTemplate: 1, status: 1 });

// 文本搜索索引
AIScriptSchema.index({
  title: 'text',
  'content.opening.script': 'text',
  'todayRecommendations.topics': 'text',
  tags: 'text'
});

// TTL索引 - 自动删除过期的话术
AIScriptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 中间件：设置过期时间
AIScriptSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt && !this.isTemplate) {
    // 非模板话术30天后过期
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

// 静态方法：根据联系人ID获取最新话术
AIScriptSchema.statics.getLatestByContact = function(contactId: string, limit: number = 5) {
  return this.find({
    contactId: new Types.ObjectId(contactId),
    status: { $in: ['active', 'used'] }
  })
  .sort({ generatedAt: -1 })
  .limit(limit)
  .lean();
};

// 静态方法：获取用户的话术模板
AIScriptSchema.statics.getTemplates = function(userId: string, methodology?: string) {
  const query: any = {
    userId: new Types.ObjectId(userId),
    isTemplate: true,
    status: 'active'
  };
  
  if (methodology) {
    query.methodology = methodology;
  }
  
  return this.find(query)
    .sort({ generatedAt: -1 })
    .lean();
};

// 静态方法：搜索话术
AIScriptSchema.statics.searchScripts = function(userId: string, searchTerm: string, options: any = {}) {
  const {
    page = 1,
    limit = 20,
    methodology,
    scenario,
    status = 'active'
  } = options;

  const query: any = {
    userId: new Types.ObjectId(userId),
    status,
    $text: { $search: searchTerm }
  };

  if (methodology) query.methodology = methodology;
  if (scenario) query.scenario = scenario;

  const skip = (page - 1) * limit;

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, generatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('contactId', 'basicInfo.name basicInfo.company');
};

// 静态方法：获取话术统计
AIScriptSchema.statics.getScriptStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { userId: new Types.ObjectId(userId) } },
    {
      $facet: {
        total: [{ $count: 'count' }],
        byMethodology: [
          { $group: { _id: '$methodology', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        byScenario: [
          { $group: { _id: '$scenario', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        usage: [
          {
            $group: {
              _id: null,
              totalViews: { $sum: '$usage.views' },
              avgRating: { $avg: '$usage.feedback.rating' },
              avgSuccessRate: { $avg: '$usage.success_rate' }
            }
          }
        ],
        recent: [
          { $match: { status: 'active' } },
          { $sort: { generatedAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              title: 1,
              methodology: 1,
              scenario: 1,
              generatedAt: 1
            }
          }
        ]
      }
    }
  ]);

  return stats[0];
};

// 静态方法：记录话术使用
AIScriptSchema.statics.recordUsage = function(scriptId: string, section: string) {
  return this.findByIdAndUpdate(
    scriptId,
    {
      $inc: { 'usage.views': 1 },
      $addToSet: { 'usage.used_sections': section },
      $set: { lastUsedAt: new Date() }
    },
    { new: true }
  );
};

// 静态方法：添加反馈
AIScriptSchema.statics.addFeedback = function(scriptId: string, feedback: any) {
  return this.findByIdAndUpdate(
    scriptId,
    { $push: { 'usage.feedback': feedback } },
    { new: true }
  );
};

// 虚拟属性：话术有效性
AIScriptSchema.virtual('isValid').get(function() {
  if (this.expiresAt && new Date() > this.expiresAt) {
    return false;
  }
  return this.status === 'active';
});

// 虚拟属性：平均评分
AIScriptSchema.virtual('averageRating').get(function() {
  const feedback = this.usage.feedback || [];
  if (feedback.length === 0) return 0;
  
  const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
  return Math.round((totalRating / feedback.length) * 10) / 10;
});

// 虚拟属性：使用频率
AIScriptSchema.virtual('usageFrequency').get(function() {
  const daysSinceCreated = Math.max(1, Math.floor((Date.now() - this.generatedAt.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.round((this.usage.views / daysSinceCreated) * 10) / 10;
});

export const AIScript = mongoose.model<IAIScript>('AIScript', AIScriptSchema);
export default AIScript;