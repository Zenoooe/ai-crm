import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper,
  Fab,
} from '@mui/material';
import {
  Phone,
  Email,
  Business,
  Edit,
  Delete,
  Save,
  Cancel,
  NotificationsActive,
  Schedule,
  Notes,
  Add,
  AccessTime,
  Notifications,
} from '@mui/icons-material';
// 注意：需要安装以下依赖包
// npm install @mui/x-date-pickers date-fns react-quill
// import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { zhCN } from 'date-fns/locale';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import { Contact } from '../../types/contact';
import ContactAISalesAssistant from './ContactAISalesAssistant';
import { apiService } from '../../services/api';

interface ContactDetailEnhancedProps {
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

interface ReminderData {
  time: string;
  term: string;
  type: string;
  priority: string;
  notification_methods: string[];
  repeat_type: string;
  status: string;
  created_at: string;
  created_by: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contact-tabpanel-${index}`}
      aria-labelledby={`contact-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ContactDetailEnhanced: React.FC<ContactDetailEnhancedProps> = ({
  contact,
  onEdit,
  onDelete,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderData, setReminderData] = useState<ReminderData | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [loading, setLoading] = useState(false);

  // 提醒表单状态
  const [reminderForm, setReminderForm] = useState({
    time: new Date(),
    term: '',
    reminder_type: 'follow_up',
    priority: 'medium',
    notification_methods: ['system'],
    repeat_type: 'none'
  });

  // 富文本编辑器配置
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'blockquote'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'blockquote'
  ];

  // 加载客户备注和提醒
  useEffect(() => {
    if (contact) {
      // 加载备注
      if (contact.latest_notes) {
        setNotes(contact.latest_notes);
      }
      
      // 加载提醒
      loadReminder();
    }
  }, [contact]);

  const loadReminder = async () => {
    if (!contact) return;
    
    try {
      const response = await apiService.get(`/api/customers/${contact._id}/reminders`);
      if (response.data.reminder) {
        setReminderData(response.data.reminder);
      }
    } catch (error) {
      console.error('加载提醒失败:', error);
    }
  };

  const handleSaveNotes = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      await apiService.post(`/api/customers/${contact._id}/notes`, {
        customer_id: parseInt(contact._id),
        notes: notes
      });
      
      setIsEditingNotes(false);
      setSnackbar({ open: true, message: '备注保存成功', severity: 'success' });
    } catch (error) {
      console.error('保存备注失败:', error);
      setSnackbar({ open: true, message: '保存备注失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetReminder = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      await apiService.post(`/api/customers/${contact._id}/reminders`, {
        customer_id: parseInt(contact._id),
        time: reminderForm.time.toISOString(),
        term: reminderForm.term,
        reminder_type: reminderForm.reminder_type,
        priority: reminderForm.priority,
        notification_methods: reminderForm.notification_methods,
        repeat_type: reminderForm.repeat_type
      });
      
      setReminderDialogOpen(false);
      setSnackbar({ open: true, message: '提醒设置成功', severity: 'success' });
      loadReminder(); // 重新加载提醒
    } catch (error) {
      console.error('设置提醒失败:', error);
      setSnackbar({ open: true, message: '设置提醒失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async () => {
    if (!contact) return;
    
    setLoading(true);
    try {
      await apiService.delete(`/api/customers/${contact._id}/reminders`);
      setReminderData(null);
      setSnackbar({ open: true, message: '提醒删除成功', severity: 'success' });
    } catch (error) {
      console.error('删除提醒失败:', error);
      setSnackbar({ open: true, message: '删除提醒失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!contact) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
        minHeight={400}
      >
        <Typography variant="h6" color="textSecondary">
          选择一个联系人查看详情
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* 联系人详情 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar
                  sx={{ width: 80, height: 80, mr: 2 }}
                  src={contact.photos?.[0]?.url}
                >
                  {contact.basicInfo.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h5" gutterBottom>
                    {contact.basicInfo.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {contact.basicInfo.company}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label={`优先级: ${contact.priority === 1 ? '高' : contact.priority === 2 ? '中' : '低'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    {contact.tags?.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag.name}
                        size="small"
                        sx={{ ml: 1, backgroundColor: tag.color }}
                      />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <IconButton onClick={() => onEdit(contact)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => onDelete(contact._id)} color="error">
                    <Delete />
                  </IconButton>
                  {reminderData && (
                    <IconButton color="warning">
                      <NotificationsActive />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 标签页 */}
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                <Tab label="基本信息" />
                <Tab label="情况备注" />
                <Tab label="提醒设置" />
              </Tabs>

              {/* 基本信息标签页 */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom>
                  联系信息
                </Typography>
                <List>
                  {contact.basicInfo.phone && (
                    <ListItem>
                      <ListItemIcon>
                        <Phone />
                      </ListItemIcon>
                      <ListItemText primary={contact.basicInfo.phone} secondary="电话" />
                    </ListItem>
                  )}
                  {contact.basicInfo.email && (
                    <ListItem>
                      <ListItemIcon>
                        <Email />
                      </ListItemIcon>
                      <ListItemText primary={contact.basicInfo.email} secondary="邮箱" />
                    </ListItem>
                  )}
                  {contact.basicInfo.company && (
                    <ListItem>
                      <ListItemIcon>
                        <Business />
                      </ListItemIcon>
                      <ListItemText primary={contact.basicInfo.company} secondary="公司" />
                    </ListItem>
                  )}
                  {contact.basicInfo.position && (
                    <ListItem>
                      <ListItemIcon>
                        <Business />
                      </ListItemIcon>
                      <ListItemText primary={contact.basicInfo.position} secondary="职位" />
                    </ListItem>
                  )}
                </List>

                {contact.aiProfile?.personality && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      AI分析
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {contact.aiProfile.personality}
                    </Typography>
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="textSecondary">
                    创建时间: {new Date(contact.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    更新时间: {new Date(contact.updatedAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </TabPanel>

              {/* 情况备注标签页 */}
              <TabPanel value={tabValue} index={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    客户情况备注
                  </Typography>
                  <Button
                    startIcon={isEditingNotes ? <Save /> : <Edit />}
                    onClick={isEditingNotes ? handleSaveNotes : () => setIsEditingNotes(true)}
                    disabled={loading}
                  >
                    {isEditingNotes ? '保存' : '编辑'}
                  </Button>
                </Box>
                
                {isEditingNotes ? (
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="记录客户的最新情况、沟通记录、需求变化等..."
                      variant="outlined"
                    />
                    <Box mt={2} display="flex" gap={1}>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSaveNotes}
                        disabled={loading}
                      >
                        保存备注
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={() => setIsEditingNotes(false)}
                      >
                        取消
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Paper sx={{ p: 2, minHeight: '200px', bgcolor: 'grey.50' }}>
                    {notes ? (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {notes}
                      </Typography>
                    ) : (
                      <Typography color="textSecondary" style={{ fontStyle: 'italic' }}>
                        暂无备注，点击编辑按钮添加客户情况记录
                      </Typography>
                    )}
                  </Paper>
                )}
              </TabPanel>

              {/* 提醒设置标签页 */}
              <TabPanel value={tabValue} index={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    提醒设置
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={() => setReminderDialogOpen(true)}
                  >
                    设置提醒
                  </Button>
                </Box>

                {reminderData ? (
                  <Paper sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          <Schedule sx={{ mr: 1, verticalAlign: 'middle' }} />
                          {reminderData.term}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          提醒时间: {new Date(reminderData.time).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          优先级: {reminderData.priority === 'high' ? '高' : reminderData.priority === 'medium' ? '中' : '低'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          通知方式: {reminderData.notification_methods.join(', ')}
                        </Typography>
                      </Box>
                      <Box>
                        <Chip
                          label={reminderData.status === 'active' ? '激活' : '已完成'}
                          color={reminderData.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                        <IconButton
                          onClick={handleDeleteReminder}
                          color="error"
                          size="small"
                          sx={{ ml: 1 }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Schedule sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography color="textSecondary">
                      暂无提醒设置，点击上方按钮添加提醒
                    </Typography>
                  </Paper>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* AI销售助手 */}
        <Grid item xs={12} md={6}>
          <ContactAISalesAssistant contact={contact} />
        </Grid>
      </Grid>

      {/* 提醒设置对话框 */}
      <Dialog open={reminderDialogOpen} onClose={() => setReminderDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <NotificationsActive sx={{ mr: 1 }} />
            设置客户提醒
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="提醒事项"
              value={reminderForm.term}
              onChange={(e) => setReminderForm({ ...reminderForm, term: e.target.value })}
              margin="normal"
              placeholder="例如：跟进产品需求、发送报价单等"
            />
            
            <TextField
              fullWidth
              label="提醒时间"
              type="datetime-local"
              value={reminderForm.time.toISOString().slice(0, 16)}
              onChange={(e) => setReminderForm({ ...reminderForm, time: new Date(e.target.value) })}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>提醒类型</InputLabel>
              <Select
                value={reminderForm.reminder_type}
                onChange={(e) => setReminderForm({ ...reminderForm, reminder_type: e.target.value })}
              >
                <MenuItem value="follow_up">跟进提醒</MenuItem>
                <MenuItem value="meeting">会议提醒</MenuItem>
                <MenuItem value="call">通话提醒</MenuItem>
                <MenuItem value="email">邮件提醒</MenuItem>
                <MenuItem value="custom">自定义</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>优先级</InputLabel>
              <Select
                value={reminderForm.priority}
                onChange={(e) => setReminderForm({ ...reminderForm, priority: e.target.value })}
              >
                <MenuItem value="low">低</MenuItem>
                <MenuItem value="medium">中</MenuItem>
                <MenuItem value="high">高</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>重复类型</InputLabel>
              <Select
                value={reminderForm.repeat_type}
                onChange={(e) => setReminderForm({ ...reminderForm, repeat_type: e.target.value })}
              >
                <MenuItem value="none">不重复</MenuItem>
                <MenuItem value="daily">每日</MenuItem>
                <MenuItem value="weekly">每周</MenuItem>
                <MenuItem value="monthly">每月</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReminderDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleSetReminder}
            variant="contained"
            disabled={!reminderForm.term || loading}
          >
            设置提醒
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactDetailEnhanced;