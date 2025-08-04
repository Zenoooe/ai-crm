/**
 * 任务模型
 * 定义任务的数据结构和业务逻辑
 */
import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  dueDate?: Date;
  completedAt?: Date;
  estimatedDuration?: number; // 预估时长（分钟）
  actualDuration?: number; // 实际时长（分钟）
  assignedTo: mongoose.Types.ObjectId;
  assignedBy?: mongoose.Types.ObjectId;
  contact?: mongoose.Types.ObjectId;
  opportunity?: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
  relatedTasks?: mongoose.Types.ObjectId[];
  dependencies?: mongoose.Types.ObjectId[];
  tags?: string[];
  location?: string;
  reminder?: {
    enabled: boolean;
    time: Date;
    sent: boolean;
  };
  recurrence?: {
    enabled: boolean;
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    nextOccurrence?: Date;
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }[];
  comments?: {
    content: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }[];
  timeTracking?: {
    startTime?: Date;
    endTime?: Date;
    totalTime: number; // 总时长（分钟）
    sessions: {
      startTime: Date;
      endTime?: Date;
      duration?: number;
    }[];
  };
  customFields?: Map<string, any>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
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
  type: {
    type: String,
    required: true,
    enum: ['call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedDuration: {
    type: Number,
    min: 1
  },
  actualDuration: {
    type: Number,
    min: 0
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  contact: {
    type: Schema.Types.ObjectId,
    ref: 'Contact'
  },
  opportunity: {
    type: Schema.Types.ObjectId,
    ref: 'Opportunity'
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  relatedTasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  dependencies: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  location: {
    type: String,
    trim: true
  },
  reminder: {
    enabled: {
      type: Boolean,
      default: false
    },
    time: {
      type: Date
    },
    sent: {
      type: Boolean,
      default: false
    }
  },
  recurrence: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1,
      default: 1
    },
    endDate: {
      type: Date
    },
    nextOccurrence: {
      type: Date
    }
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
  comments: [{
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
  timeTracking: {
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    totalTime: {
      type: Number,
      default: 0,
      min: 0
    },
    sessions: [{
      startTime: {
        type: Date,
        required: true
      },
      endTime: {
        type: Date
      },
      duration: {
        type: Number,
        min: 0
      }
    }]
  },
  customFields: {
    type: Map,
    of: Schema.Types.Mixed
  },
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
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ contact: 1 });
TaskSchema.index({ opportunity: 1 });
TaskSchema.index({ company: 1 });
TaskSchema.index({ tags: 1 });
TaskSchema.index({ createdAt: -1 });
TaskSchema.index({ 'reminder.time': 1, 'reminder.enabled': 1, 'reminder.sent': 1 });

// 虚拟字段
TaskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

TaskSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

TaskSchema.virtual('hoursUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const diffTime = this.dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60));
});

TaskSchema.virtual('completionRate').get(function() {
  if (!this.timeTracking || !this.estimatedDuration) return null;
  return (this.timeTracking.totalTime / this.estimatedDuration) * 100;
});

// 中间件
TaskSchema.pre('save', function(next) {
  // 自动设置完成时间
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  // 自动设置逾期状态
  if (this.dueDate && new Date() > this.dueDate && 
      this.status !== 'completed' && this.status !== 'cancelled') {
    this.status = 'overdue';
  }
  
  // 计算实际时长
  if (this.timeTracking && this.timeTracking.sessions.length > 0) {
    let totalTime = 0;
    this.timeTracking.sessions.forEach(session => {
      if (session.endTime) {
        const duration = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60);
        session.duration = duration;
        totalTime += duration;
      }
    });
    this.timeTracking.totalTime = totalTime;
    this.actualDuration = totalTime;
  }
  
  next();
});

// 静态方法
TaskSchema.statics.getByAssignee = function(userId: string) {
  return this.find({ assignedTo: userId });
};

TaskSchema.statics.getOverdueTasks = function(userId?: string) {
  const query: any = {
    dueDate: { $lt: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  };
  
  if (userId) {
    query.assignedTo = userId;
  }
  
  return this.find(query);
};

TaskSchema.statics.getUpcomingTasks = function(userId?: string, days: number = 7) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  const query: any = {
    dueDate: { $gte: new Date(), $lte: endDate },
    status: { $nin: ['completed', 'cancelled'] }
  };
  
  if (userId) {
    query.assignedTo = userId;
  }
  
  return this.find(query).sort({ dueDate: 1 });
};

TaskSchema.statics.getTasksByPriority = function(priority: string, userId?: string) {
  const query: any = { priority };
  
  if (userId) {
    query.assignedTo = userId;
  }
  
  return this.find(query);
};

TaskSchema.statics.getTasksForReminder = function() {
  return this.find({
    'reminder.enabled': true,
    'reminder.sent': false,
    'reminder.time': { $lte: new Date() },
    status: { $nin: ['completed', 'cancelled'] }
  });
};

// 实例方法
TaskSchema.methods.addComment = function(content: string, userId: string) {
  this.comments.push({
    content,
    createdBy: userId,
    createdAt: new Date()
  });
  return this.save();
};

TaskSchema.methods.addAttachment = function(attachment: {
  name: string;
  url: string;
  type: string;
  size: number;
}) {
  this.attachments.push({
    ...attachment,
    uploadedAt: new Date()
  });
  return this.save();
};

TaskSchema.methods.startTimeTracking = function() {
  if (!this.timeTracking) {
    this.timeTracking = {
      totalTime: 0,
      sessions: []
    };
  }
  
  const now = new Date();
  this.timeTracking.startTime = now;
  this.timeTracking.sessions.push({
    startTime: now
  });
  
  if (this.status === 'pending') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

TaskSchema.methods.stopTimeTracking = function() {
  if (!this.timeTracking || !this.timeTracking.startTime) {
    throw new Error('Time tracking not started');
  }
  
  const now = new Date();
  this.timeTracking.endTime = now;
  
  // 更新最后一个会话
  const lastSession = this.timeTracking.sessions[this.timeTracking.sessions.length - 1];
  if (lastSession && !lastSession.endTime) {
    lastSession.endTime = now;
  }
  
  return this.save();
};

TaskSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // 停止时间跟踪
  if (this.timeTracking && this.timeTracking.startTime && !this.timeTracking.endTime) {
    this.stopTimeTracking();
  }
  
  return this.save();
};

TaskSchema.methods.cancel = function() {
  this.status = 'cancelled';
  
  // 停止时间跟踪
  if (this.timeTracking && this.timeTracking.startTime && !this.timeTracking.endTime) {
    this.stopTimeTracking();
  }
  
  return this.save();
};

TaskSchema.methods.setReminder = function(reminderTime: Date) {
  this.reminder = {
    enabled: true,
    time: reminderTime,
    sent: false
  };
  return this.save();
};

TaskSchema.methods.markReminderSent = function() {
  if (this.reminder) {
    this.reminder.sent = true;
  }
  return this.save();
};

TaskSchema.methods.createRecurringTask = function() {
  if (!this.recurrence || !this.recurrence.enabled) {
    throw new Error('Recurrence not enabled for this task');
  }
  
  const nextDueDate = this.calculateNextOccurrence();
  if (!nextDueDate) {
    return null;
  }
  
  const newTask = new (this.constructor as any)({
    title: this.title,
    description: this.description,
    type: this.type,
    priority: this.priority,
    dueDate: nextDueDate,
    estimatedDuration: this.estimatedDuration,
    assignedTo: this.assignedTo,
    assignedBy: this.assignedBy,
    contact: this.contact,
    opportunity: this.opportunity,
    company: this.company,
    tags: this.tags,
    location: this.location,
    recurrence: this.recurrence,
    createdBy: this.createdBy
  });
  
  return newTask.save();
};

TaskSchema.methods.calculateNextOccurrence = function(): Date | null {
  if (!this.recurrence || !this.recurrence.enabled || !this.dueDate) {
    return null;
  }
  
  const { pattern, interval } = this.recurrence;
  const nextDate = new Date(this.dueDate);
  
  switch (pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (interval * 7));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
    default:
      return null;
  }
  
  // 检查是否超过结束日期
  if (this.recurrence.endDate && nextDate > this.recurrence.endDate) {
    return null;
  }
  
  return nextDate;
};

export const Task = mongoose.model<ITask>('Task', TaskSchema);
export default Task;