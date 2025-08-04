import { Schema, model, Document, Types } from 'mongoose';

export interface IContactPhoto {
  url: string;
  type: 'profile' | 'event' | 'searched';
  source: string;
  uploadedAt: Date;
}

export interface IContactTag {
  name: string;
  color: string;
  category: 'priority' | 'custom' | 'industry';
}

export interface IAIProfile {
  personality?: string;
  communicationStyle?: string;
  interests: string[];
  painPoints: string[];
  lastAnalysis?: Date;
  opportunityScore?: number;
  relationshipStrength?: number;
}

export interface IContact extends Document {
  userId: Types.ObjectId;
  basicInfo: {
    name: string;
    email: string;
    phone: string;
    wechatId?: string;
    company: string;
    position: string;
    industry: string;
    ageGroup: string;
  };
  photos: IContactPhoto[];
  tags: IContactTag[];
  folder: string;
  priority: 1 | 2 | 3; // 1=high, 2=medium, 3=low
  socialProfiles: {
    linkedin?: string;
    weibo?: string;
    xiaohongshu?: string;
  };
  businessInfo: {
    companySize?: string;
    revenue?: string;
    decisionMaker: boolean;
    budget?: string;
  };
  aiProfile: IAIProfile;
  createdAt: Date;
  updatedAt: Date;
}

const ContactPhotoSchema = new Schema<IContactPhoto>({
  url: { type: String, required: true },
  type: { type: String, enum: ['profile', 'event', 'searched'], required: true },
  source: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const ContactTagSchema = new Schema<IContactTag>({
  name: { type: String, required: true },
  color: { type: String, required: true },
  category: { type: String, enum: ['priority', 'custom', 'industry'], required: true },
});

const AIProfileSchema = new Schema<IAIProfile>({
  personality: { type: String },
  communicationStyle: { type: String },
  interests: [{ type: String }],
  painPoints: [{ type: String }],
  lastAnalysis: { type: Date },
  opportunityScore: { type: Number, min: 0, max: 100 },
  relationshipStrength: { type: Number, min: 1, max: 10 },
});

const ContactSchema = new Schema<IContact>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  basicInfo: {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    wechatId: { type: String, trim: true },
    company: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    ageGroup: { type: String, required: true },
  },
  photos: [ContactPhotoSchema],
  tags: [ContactTagSchema],
  folder: { type: String, default: 'default', trim: true },
  priority: { type: Number, enum: [1, 2, 3], default: 2 },
  socialProfiles: {
    linkedin: { type: String, trim: true },
    weibo: { type: String, trim: true },
    xiaohongshu: { type: String, trim: true },
  },
  businessInfo: {
    companySize: { type: String, trim: true },
    revenue: { type: String, trim: true },
    decisionMaker: { type: Boolean, default: false },
    budget: { type: String, trim: true },
  },
  aiProfile: { type: AIProfileSchema, default: () => ({ interests: [], painPoints: [] }) },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
ContactSchema.index({ userId: 1, updatedAt: -1 });
ContactSchema.index({ userId: 1, 'basicInfo.name': 'text', 'basicInfo.company': 'text' });
ContactSchema.index({ userId: 1, folder: 1, priority: 1 });
ContactSchema.index({ userId: 1, 'basicInfo.industry': 1 });
ContactSchema.index({ userId: 1, 'tags.name': 1 });

// Virtual for full name
ContactSchema.virtual('fullName').get(function() {
  return this.basicInfo.name;
});

// Virtual for interaction count
ContactSchema.virtual('interactionCount', {
  ref: 'Interaction',
  localField: '_id',
  foreignField: 'contactId',
  count: true,
});

// Pre-save middleware
ContactSchema.pre('save', function(next) {
  if (this.isModified('basicInfo') || this.isModified('photos') || this.isModified('tags')) {
    // Mark for AI re-analysis
    this.aiProfile.lastAnalysis = undefined;
  }
  next();
});

// Static methods
ContactSchema.statics.findByUserId = function(userId: string) {
  return this.find({ userId }).sort({ updatedAt: -1 });
};

ContactSchema.statics.searchContacts = function(userId: string, query: string) {
  return this.find({
    userId,
    $or: [
      { 'basicInfo.name': { $regex: query, $options: 'i' } },
      { 'basicInfo.company': { $regex: query, $options: 'i' } },
      { 'basicInfo.position': { $regex: query, $options: 'i' } },
    ],
  }).sort({ updatedAt: -1 });
};

ContactSchema.statics.findByFolder = function(userId: string, folder: string) {
  return this.find({ userId, folder }).sort({ updatedAt: -1 });
};

ContactSchema.statics.findByPriority = function(userId: string, priority: number) {
  return this.find({ userId, priority }).sort({ updatedAt: -1 });
};

ContactSchema.statics.findByIndustry = function(userId: string, industry: string) {
  return this.find({ userId, 'basicInfo.industry': industry }).sort({ updatedAt: -1 });
};

export const Contact = model<IContact>('Contact', ContactSchema);