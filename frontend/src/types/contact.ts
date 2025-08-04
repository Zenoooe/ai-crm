export interface Contact {
  _id: string;
  userId: string;
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
  photos: ContactPhoto[];
  tags: ContactTag[];
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
  aiProfile: AIProfile;
  latest_notes?: string; // 客户最新情况备注
  reminder?: string; // 提醒信息（JSON字符串）
  createdAt: string;
  updatedAt: string;
}

export interface ContactPhoto {
  url: string;
  type: 'profile' | 'event' | 'searched';
  source: string;
  uploadedAt: string;
}

export interface ContactTag {
  name: string;
  color: string;
  category: 'priority' | 'custom' | 'industry';
}

export interface AIProfile {
  personality?: string;
  communicationStyle?: string;
  interests: string[];
  painPoints: string[];
  lastAnalysis?: string;
  opportunityScore?: number;
  relationshipStrength?: number;
}

export interface CreateContactDto {
  basicInfo: Partial<Contact['basicInfo']>;
  folder?: string;
  priority?: Contact['priority'];
  tags?: ContactTag[];
}

export interface UpdateContactDto extends Partial<CreateContactDto> {
  _id: string;
}

export interface SearchContactsDto {
  search?: string;
  folder?: string;
  priority?: Contact['priority'];
  industry?: string;
  limit?: number;
  offset?: number;
}

export interface ContactsState {
  contacts: Contact[];
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  filters: {
    folder: string;
    priority: Contact['priority'] | '';
    industry: string;
  };
  folders: string[];
}