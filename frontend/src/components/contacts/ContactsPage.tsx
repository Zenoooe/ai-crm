import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  FilterList,
  Upload,
  CameraAlt,
  Person,
  Business,
  Phone,
  Email,
  Star,
  StarBorder,
  Edit,
  Delete,
  Psychology,
  Chat,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux.ts';
import { Contact } from '../../types/contact';
import ContactList from './ContactList.tsx';
import ContactDetail from './ContactDetail.tsx';
import ContactForm from './ContactForm.tsx';
import OCRScanner from '../ai/OCRScanner.tsx';
import FolderTree from './FolderTree.tsx';

const ContactsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { contacts, selectedContact, loading, filters } = useAppSelector(
    (state) => state.contacts
  );

  const [showContactForm, setShowContactForm] = useState(false);
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 模拟数据 - 在实际应用中这些会从API获取
  const mockContacts: Contact[] = [
    {
      _id: '1',
      userId: 'user1',
      basicInfo: {
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '+86 138 0013 8000',
        wechatId: 'zhangsan_wx',
        company: '阿里巴巴',
        position: '产品总监',
        industry: '互联网',
        ageGroup: '30-40',
      },
      photos: [
        {
          url: '/api/placeholder/150/150',
          type: 'profile',
          source: 'upload',
          uploadedAt: '2024-01-15T10:00:00Z',
        },
      ],
      tags: [
        { name: '高优先级', color: '#f44336', category: 'priority' },
        { name: '决策者', color: '#2196f3', category: 'custom' },
      ],
      folder: '互联网行业',
      priority: 1,
      socialProfiles: {
        linkedin: 'https://linkedin.com/in/zhangsan',
      },
      businessInfo: {
        companySize: '10000+',
        revenue: '1000万+',
        decisionMaker: true,
        budget: '100万+',
      },
      aiProfile: {
        personality: '理性决策者，注重数据和ROI',
        communicationStyle: '直接、高效',
        interests: ['产品创新', '数字化转型', '团队管理'],
        painPoints: ['成本控制', '效率提升', '人才招聘'],
        lastAnalysis: '2024-01-15T10:00:00Z',
        opportunityScore: 85,
        relationshipStrength: 7,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      _id: '2',
      userId: 'user1',
      basicInfo: {
        name: '李四',
        email: 'lisi@example.com',
        phone: '+86 139 0013 9000',
        company: '腾讯',
        position: '技术经理',
        industry: '互联网',
        ageGroup: '25-35',
      },
      photos: [],
      tags: [
        { name: '中优先级', color: '#ff9800', category: 'priority' },
        { name: '技术专家', color: '#4caf50', category: 'custom' },
      ],
      folder: '互联网行业',
      priority: 2,
      socialProfiles: {},
      businessInfo: {
        companySize: '10000+',
        decisionMaker: false,
      },
      aiProfile: {
        personality: '技术导向，喜欢深入讨论技术细节',
        communicationStyle: '详细、专业',
        interests: ['新技术', '架构设计', '性能优化'],
        painPoints: ['技术债务', '系统稳定性', '团队协作'],
        opportunityScore: 65,
        relationshipStrength: 5,
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
  ];

  const handleCreateContact = () => {
    setEditingContact(null);
    setShowContactForm(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const handleCloseContactForm = () => {
    setShowContactForm(false);
    setEditingContact(null);
  };

  const handleOCRScan = () => {
    setShowOCRScanner(true);
  };

  const handleCloseOCRScanner = () => {
    setShowOCRScanner(false);
  };

  const handleOCRResult = (extractedData: any) => {
    // 处理OCR提取的数据，创建新联系人
    console.log('OCR提取的数据:', extractedData);
    setShowOCRScanner(false);
    // 这里可以预填充联系人表单
    setShowContactForm(true);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      {/* 左侧边栏 - 文件夹树和联系人列表 */}
      <Paper
        sx={{
          width: 350,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* 搜索和操作栏 */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="搜索联系人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateContact}
              size="small"
              sx={{ flex: 1 }}
            >
              新建
            </Button>
            <Tooltip title="扫描名片">
              <IconButton
                onClick={handleOCRScan}
                size="small"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <CameraAlt fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="批量导入">
              <IconButton size="small">
                <Upload fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 文件夹树 */}
        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <FolderTree 
            folders={[
              '全部联系人',
              '互联网行业',
              '金融行业',
              '制造业'
            ]}
            selectedFolder="全部联系人"
            onFolderSelect={(folder) => {
              console.log('选中文件夹:', folder);
              // 这里添加文件夹选择的处理逻辑
            }}
          />
        </Box>

        {/* 联系人列表 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <ContactList
            contacts={mockContacts}
            searchTerm={searchTerm}
            onContactSelect={(contact) => console.log('选中联系人:', contact)}
            onContactEdit={handleEditContact}
          />
        </Box>
      </Paper>

      {/* 右侧主内容区 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedContact || mockContacts[0] ? (
          <ContactDetail 
            contact={mockContacts[0]} 
            onEdit={handleEditContact}
            onDelete={(contact) => {
              // 处理删除联系人的逻辑
              console.log('删除联系人:', contact);
            }}
          />
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
            }}
          >
            <Person sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              选择一个联系人
            </Typography>
            <Typography variant="body2">
              从左侧列表中选择联系人以查看详细信息
            </Typography>
          </Box>
        )}
      </Box>

      {/* 联系人表单对话框 */}
      <Dialog
        open={showContactForm}
        onClose={handleCloseContactForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingContact ? '编辑联系人' : '新建联系人'}
        </DialogTitle>
        <DialogContent>
          <ContactForm
            open={showContactForm}
            onClose={handleCloseContactForm}
            contact={editingContact}
            onSubmit={(data) => {
              console.log('提交联系人数据:', data);
              handleCloseContactForm();
            }}
            // 移除onCancel属性，改为在onSubmit中处理取消逻辑
          />
        </DialogContent>
      </Dialog>

      {/* OCR扫描对话框 */}
      <Dialog
        open={showOCRScanner}
        onClose={handleCloseOCRScanner}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>扫描名片</DialogTitle>
        <DialogContent>
          <OCRScanner
            onResult={handleOCRResult}
            onCancel={handleCloseOCRScanner}
          />
        </DialogContent>
      </Dialog>

      {/* 浮动操作按钮 */}
      <Fab
        color="primary"
        aria-label="add contact"
        onClick={handleCreateContact}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' }, // 只在移动端显示
        }}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default ContactsPage;