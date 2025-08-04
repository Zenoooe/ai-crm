import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  _id: string;
  basicInfo: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    avatar?: string;
  };
  source?: string;
  folder?: string;
  tags?: Array<{ name: string; color?: string }>;
  notes?: string;
  interactions?: Array<any>;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

const CustomerSchema = new Schema<ICustomer>({
  basicInfo: {
    name: { type: String, required: true },
    company: String,
    email: String,
    phone: String,
    avatar: String
  },
  source: String,
  folder: String,
  tags: [{
    name: { type: String, required: true },
    color: String
  }],
  notes: String,
  interactions: [Schema.Types.Mixed],
  userId: { type: String, required: true }
}, {
  timestamps: true
});

CustomerSchema.index({ userId: 1 });
CustomerSchema.index({ 'basicInfo.name': 1 });
CustomerSchema.index({ 'basicInfo.email': 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);