/**
 * 销售机会模型
 * 定义销售机会的数据结构和业务逻辑
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface IOpportunity extends Document {
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  closedAt?: Date;
  source: string;
  assignedTo: mongoose.Types.ObjectId;
  contact: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
  products?: {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }[];
  competitors?: string[];
  lossReason?: string;
  tags?: string[];
  customFields?: Map<string, any>;
  activities?: mongoose.Types.ObjectId[];
  documents?: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];
  notes?: {
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OpportunitySchema = new Schema<IOpportunity>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD',
    uppercase: true,
    minlength: 3,
    maxlength: 3
  },
  stage: {
    type: String,
    required: true,
    enum: ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'lead'
  },
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10
  },
  expectedCloseDate: {
    type: Date
  },
  actualCloseDate: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    type: Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  products: [{
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  }],
  competitors: [{
    type: String,
    trim: true
  }],
  lossReason: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  customFields: {
    type: Map,
    of: Schema.Types.Mixed
  },
  activities: [{
    type: Schema.Types.ObjectId,
    ref: 'Interaction'
  }],
  documents: [{
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
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
OpportunitySchema.index({ assignedTo: 1, stage: 1 });
OpportunitySchema.index({ contact: 1 });
OpportunitySchema.index({ company: 1 });
OpportunitySchema.index({ expectedCloseDate: 1 });
OpportunitySchema.index({ createdAt: -1 });
OpportunitySchema.index({ value: -1 });
OpportunitySchema.index({ tags: 1 });

// 虚拟字段
OpportunitySchema.virtual('weightedValue').get(function() {
  return (this.value * this.probability) / 100;
});

OpportunitySchema.virtual('daysToClose').get(function() {
  if (!this.expectedCloseDate) return null;
  const now = new Date();
  const diffTime = this.expectedCloseDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

OpportunitySchema.virtual('isOverdue').get(function() {
  if (!this.expectedCloseDate || this.stage.startsWith('closed_')) return false;
  return new Date() > this.expectedCloseDate;
});

// 中间件
OpportunitySchema.pre('save', function(next) {
  // 自动设置关闭日期
  if (this.stage.startsWith('closed_') && !this.closedAt) {
    this.closedAt = new Date();
    this.actualCloseDate = new Date();
  }
  
  // 根据阶段设置概率
  if (this.isModified('stage')) {
    switch (this.stage) {
      case 'lead':
        this.probability = 10;
        break;
      case 'qualified':
        this.probability = 25;
        break;
      case 'proposal':
        this.probability = 50;
        break;
      case 'negotiation':
        this.probability = 75;
        break;
      case 'closed_won':
        this.probability = 100;
        break;
      case 'closed_lost':
        this.probability = 0;
        break;
    }
  }
  
  next();
});

// 静态方法
OpportunitySchema.statics.getByStage = function(stage: string) {
  return this.find({ stage });
};

OpportunitySchema.statics.getByAssignee = function(userId: string) {
  return this.find({ assignedTo: userId });
};

OpportunitySchema.statics.getActiveOpportunities = function() {
  return this.find({ 
    stage: { $nin: ['closed_won', 'closed_lost'] }
  });
};

OpportunitySchema.statics.getRevenueForecast = function(userId?: string) {
  const match: any = {
    stage: { $nin: ['closed_won', 'closed_lost'] }
  };
  
  if (userId) {
    match.assignedTo = userId;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalValue: { $sum: '$value' },
        weightedValue: { $sum: { $multiply: ['$value', { $divide: ['$probability', 100] }] } },
        count: { $sum: 1 }
      }
    }
  ]);
};

// 实例方法
OpportunitySchema.methods.addNote = function(content: string, userId: string) {
  this.notes.push({
    content,
    createdBy: userId,
    createdAt: new Date()
  });
  return this.save();
};

OpportunitySchema.methods.addDocument = function(document: {
  name: string;
  url: string;
  type: string;
}) {
  this.documents.push({
    ...document,
    uploadedAt: new Date()
  });
  return this.save();
};

OpportunitySchema.methods.moveToNextStage = function() {
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won'];
  const currentIndex = stages.indexOf(this.stage);
  
  if (currentIndex >= 0 && currentIndex < stages.length - 1) {
    this.stage = stages[currentIndex + 1];
  }
  
  return this.save();
};

OpportunitySchema.methods.close = function(won: boolean, reason?: string) {
  this.stage = won ? 'closed_won' : 'closed_lost';
  this.closedAt = new Date();
  this.actualCloseDate = new Date();
  
  if (!won && reason) {
    this.lossReason = reason;
  }
  
  return this.save();
};

export const Opportunity = mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
export default Opportunity;