import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Badge,
  Tabs,
  Tab,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  Schedule,
  Person,
  Business,
  Phone,
  Email,
  Event,
  Today,
  DateRange,
  AccessTime,
  Flag,
  Edit,
  Delete,
  Done,
  Snooze,
  Add,
  FilterList,
  Sort,
  Search,
  MoreVert,
  Warning,
  CheckCircle,
  Cancel,
  Refresh,
  Settings,
  VolumeUp,
  VolumeOff,
  Vibration,
  ExpandMore,
  PlayArrow,
  Pause,
  Stop,
} from '@mui/icons-material';
// Note: DateTimePicker requires @mui/x-date-pickers package
// For now, using regular TextField for date input

// 提醒接口定义
interface Reminder {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_company?: string;
  title: string;
  description: string;
  reminder_time: string;
  reminder_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'custom';
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  notification_methods: ('browser' | 'email' | 'sms')[];
  repeat_type?: 'none' | 'daily' | 'weekly' | 'monthly';
  snooze_until?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// 提醒创建表单接口
interface ReminderForm {
  customer_id: string;
  title: string;
  description: string;
  reminder_time: Date;
  reminder_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'custom';
  priority: 'high' | 'medium' | 'low';
  notification_methods: ('browser' | 'email' | 'sms')[];
  repeat_type: 'none' | 'daily' | 'weekly' | 'monthly';
}

// 客户选择接口
interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

// 提醒卡片组件
const ReminderCard: React.FC<{
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onComplete: (id: string) => void;
  onSnooze: (id: string, snoozeTime: Date) => void;
  onDelete: (id: string) => void;
}> = ({ reminder, onEdit, onComplete, onSnooze, onDelete }) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [snoozeTime, setSnoozeTime] = useState<Date>(new Date(Date.now() + 30 * 60 * 1000)); // 默认30分钟后

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone />;
      case 'email': return <Email />;
      case 'meeting': return <Event />;
      case 'follow_up': return <Person />;
      default: return <Schedule />;
    }
  };

  const getReminderTypeText = (type: string) => {
    switch (type) {
      case 'call': return '电话联系';
      case 'email': return '邮件跟进';
      case 'meeting': return '会议安排';
      case 'follow_up': return '客户跟进';
      default: return '自定义提醒';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级';
      case 'medium': return '中优先级';
      case 'low': return '低优先级';
      default: return '普通';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'primary';
      case 'snoozed': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'pending': return '待处理';
      case 'snoozed': return '已延迟';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const isOverdue = new Date(reminder.reminder_time) < new Date() && reminder.status === 'pending';
  const timeUntil = new Date(reminder.reminder_time).getTime() - new Date().getTime();
  const isUpcoming = timeUntil > 0 && timeUntil < 60 * 60 * 1000; // 1小时内

  const handleSnooze = () => {
    onSnooze(reminder.id, snoozeTime);
    setSnoozeDialogOpen(false);
    setMenuAnchor(null);
  };

  return (
    <>
      <Card
        sx={{
          mb: 2,
          border: isOverdue ? '2px solid' : '1px solid',
          borderColor: isOverdue ? 'error.main' : 'divider',
          bgcolor: isUpcoming ? 'warning.50' : 'background.paper',
          position: 'relative',
        }}
      >
        {/* 优先级指示器 */}
        {reminder.priority === 'high' && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 4,
              height: '100%',
              bgcolor: 'error.main',
            }}
          />
        )}

        <CardContent>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
              <Avatar sx={{ bgcolor: getPriorityColor(reminder.priority) + '.main' }}>
                {getReminderTypeIcon(reminder.reminder_type)}
              </Avatar>
              
              <Box flexGrow={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="h6" fontWeight="bold">
                    {reminder.title}
                  </Typography>
                  {isOverdue && (
                    <Chip
                      icon={<Warning />}
                      label="已逾期"
                      color="error"
                      size="small"
                    />
                  )}
                  {isUpcoming && (
                    <Chip
                      icon={<NotificationsActive />}
                      label="即将到期"
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {reminder.description}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {reminder.customer_name}
                      {reminder.customer_company && ` (${reminder.customer_company})`}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {new Date(reminder.reminder_time).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Chip
                    label={getReminderTypeText(reminder.reminder_type)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={getPriorityText(reminder.priority)}
                    size="small"
                    color={getPriorityColor(reminder.priority)}
                    variant="outlined"
                  />
                  <Chip
                    label={getStatusText(reminder.status)}
                    size="small"
                    color={getStatusColor(reminder.status)}
                    variant="filled"
                  />
                </Box>
              </Box>
            </Box>
            
            <IconButton
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              size="small"
            >
              <MoreVert />
            </IconButton>
          </Box>
        </CardContent>
        
        {reminder.status === 'pending' && (
          <CardActions>
            <Button
              size="small"
              startIcon={<Done />}
              onClick={() => onComplete(reminder.id)}
              color="success"
            >
              完成
            </Button>
            <Button
              size="small"
              startIcon={<Snooze />}
              onClick={() => setSnoozeDialogOpen(true)}
              color="warning"
            >
              延迟
            </Button>
            <Button
              size="small"
              startIcon={<Edit />}
              onClick={() => onEdit(reminder)}
            >
              编辑
            </Button>
          </CardActions>
        )}
      </Card>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItemComponent onClick={() => { onEdit(reminder); setMenuAnchor(null); }}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>编辑提醒</ListItemText>
        </MenuItemComponent>
        
        {reminder.status === 'pending' && (
          <MenuItemComponent onClick={() => { onComplete(reminder.id); setMenuAnchor(null); }}>
            <ListItemIcon><Done /></ListItemIcon>
            <ListItemText>标记完成</ListItemText>
          </MenuItemComponent>
        )}
        
        {reminder.status === 'pending' && (
          <MenuItemComponent onClick={() => { setSnoozeDialogOpen(true); setMenuAnchor(null); }}>
            <ListItemIcon><Snooze /></ListItemIcon>
            <ListItemText>延迟提醒</ListItemText>
          </MenuItemComponent>
        )}
        
        <Divider />
        
        <MenuItemComponent 
          onClick={() => { onDelete(reminder.id); setMenuAnchor(null); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText>删除提醒</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* 延迟对话框 */}
      <Dialog open={snoozeDialogOpen} onClose={() => setSnoozeDialogOpen(false)}>
        <DialogTitle>延迟提醒</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="datetime-local"
              label="延迟到"
              value={snoozeTime.toISOString().slice(0, 16)}
              onChange={(e) => setSnoozeTime(new Date(e.target.value))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().slice(0, 16) }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnoozeDialogOpen(false)}>取消</Button>
          <Button onClick={handleSnooze} variant="contained">确认延迟</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// 提醒创建表单
const ReminderCreateForm: React.FC<{
  open: boolean;
  initialData?: Partial<ReminderForm>;
  customers: Customer[];
  onClose: () => void;
  onSave: (data: ReminderForm) => void;
}> = ({ open, initialData, customers, onClose, onSave }) => {
  const [formData, setFormData] = useState<ReminderForm>({
    customer_id: '',
    title: '',
    description: '',
    reminder_time: new Date(Date.now() + 60 * 60 * 1000), // 默认1小时后
    reminder_type: 'follow_up',
    priority: 'medium',
    notification_methods: ['browser'],
    repeat_type: 'none',
    ...initialData,
  });
  const [loading, setLoading] = useState(false);

  const reminderTypes = [
    { value: 'call', label: '电话联系', icon: <Phone /> },
    { value: 'email', label: '邮件跟进', icon: <Email /> },
    { value: 'meeting', label: '会议安排', icon: <Event /> },
    { value: 'follow_up', label: '客户跟进', icon: <Person /> },
    { value: 'custom', label: '自定义提醒', icon: <Schedule /> },
  ];

  const quickTimeOptions = [
    { label: '30分钟后', minutes: 30 },
    { label: '1小时后', minutes: 60 },
    { label: '2小时后', minutes: 120 },
    { label: '明天上午9点', minutes: null, time: 'tomorrow_9am' },
    { label: '下周一上午9点', minutes: null, time: 'next_monday_9am' },
  ];

  const handleQuickTime = (option: any) => {
    let newTime: Date;
    
    if (option.minutes) {
      newTime = new Date(Date.now() + option.minutes * 60 * 1000);
    } else if (option.time === 'tomorrow_9am') {
      newTime = new Date();
      newTime.setDate(newTime.getDate() + 1);
      newTime.setHours(9, 0, 0, 0);
    } else if (option.time === 'next_monday_9am') {
      newTime = new Date();
      const daysUntilMonday = (8 - newTime.getDay()) % 7 || 7;
      newTime.setDate(newTime.getDate() + daysUntilMonday);
      newTime.setHours(9, 0, 0, 0);
    } else {
      return;
    }
    
    setFormData(prev => ({ ...prev, reminder_time: newTime }));
  };

  const handleSave = async () => {
    if (!formData.customer_id || !formData.title.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('保存提醒失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === formData.customer_id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? '编辑提醒' : '创建新提醒'}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* 客户选择 */}
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>选择客户</InputLabel>
              <Select
                value={formData.customer_id}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                label="选择客户"
              >
                {customers.map(customer => (
                  <MenuItem key={customer.id} value={customer.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {customer.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{customer.name}</Typography>
                        {customer.company && (
                          <Typography variant="caption" color="textSecondary">
                            {customer.company}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* 提醒类型 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>提醒类型</InputLabel>
              <Select
                value={formData.reminder_type}
                onChange={(e) => setFormData(prev => ({ ...prev, reminder_type: e.target.value as any }))}
                label="提醒类型"
              >
                {reminderTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {type.icon}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* 优先级 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>优先级</InputLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                label="优先级"
              >
                <MenuItem value="high">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Flag sx={{ color: 'error.main' }} />
                    高优先级
                  </Box>
                </MenuItem>
                <MenuItem value="medium">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Flag sx={{ color: 'warning.main' }} />
                    中优先级
                  </Box>
                </MenuItem>
                <MenuItem value="low">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Flag sx={{ color: 'info.main' }} />
                    低优先级
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* 标题 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="提醒标题"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="例如：给张三打电话讨论合作方案"
            />
          </Grid>
          
          {/* 描述 */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="详细描述"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="添加提醒的详细信息..."
            />
          </Grid>
          
          {/* 提醒时间 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              提醒时间
            </Typography>
            
            {/* 快速时间选择 */}
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              {quickTimeOptions.map((option, index) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickTime(option)}
                >
                  {option.label}
                </Button>
              ))}
            </Box>
            
            <TextField
              fullWidth
              type="datetime-local"
              label="自定义时间"
              value={formData.reminder_time.toISOString().slice(0, 16)}
              onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().slice(0, 16) }}
            />
          </Grid>
          
          {/* 通知方式 */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              通知方式
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notification_methods.includes('browser')}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...formData.notification_methods, 'browser' as const]
                        : formData.notification_methods.filter(m => m !== 'browser');
                      setFormData(prev => ({ ...prev, notification_methods: methods as ('browser' | 'email' | 'sms')[] }));
                    }}
                  />
                }
                label="浏览器通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notification_methods.includes('email')}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...formData.notification_methods, 'email' as const]
                        : formData.notification_methods.filter(m => m !== 'email');
                      setFormData(prev => ({ ...prev, notification_methods: methods as ('browser' | 'email' | 'sms')[] }));
                    }}
                  />
                }
                label="邮件通知"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notification_methods.includes('sms')}
                    onChange={(e) => {
                      const methods = e.target.checked
                        ? [...formData.notification_methods, 'sms' as const]
                        : formData.notification_methods.filter(m => m !== 'sms');
                      setFormData(prev => ({ ...prev, notification_methods: methods as ('browser' | 'email' | 'sms')[] }));
                    }}
                  />
                }
                label="短信通知"
              />
            </Box>
          </Grid>
          
          {/* 重复设置 */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>重复频率</InputLabel>
              <Select
                value={formData.repeat_type}
                onChange={(e) => setFormData(prev => ({ ...prev, repeat_type: e.target.value as any }))}
                label="重复频率"
              >
                <MenuItem value="none">不重复</MenuItem>
                <MenuItem value="daily">每天</MenuItem>
                <MenuItem value="weekly">每周</MenuItem>
                <MenuItem value="monthly">每月</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.customer_id || !formData.title.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Schedule />}
        >
          {loading ? '保存中...' : (initialData ? '更新提醒' : '创建提醒')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 主提醒系统组件
const ReminderSystem: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('reminder_time');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // 模拟客户数据
  const customers: Customer[] = [
    { id: '1', name: '张三', company: '阿里巴巴', email: 'zhangsan@alibaba.com', phone: '+86 138 0013 8000' },
    { id: '2', name: '李四', company: '腾讯科技', email: 'lisi@tencent.com', phone: '+86 139 0013 9000' },
    { id: '3', name: '王五', company: '百度', email: 'wangwu@baidu.com', phone: '+86 137 0013 7000' },
    { id: '4', name: '赵六', company: '字节跳动', email: 'zhaoliu@bytedance.com', phone: '+86 136 0013 6000' },
  ];

  // 模拟提醒数据
  useEffect(() => {
    const mockReminders: Reminder[] = [
      {
        id: '1',
        customer_id: '1',
        customer_name: '张三',
        customer_company: '阿里巴巴',
        title: '讨论合作方案',
        description: '与张三讨论Q4合作方案的具体细节，包括预算和时间安排',
        reminder_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟后
        reminder_type: 'call',
        priority: 'high',
        status: 'pending',
        notification_methods: ['browser', 'email'],
        repeat_type: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '2',
        customer_id: '2',
        customer_name: '李四',
        customer_company: '腾讯科技',
        title: '发送产品演示邮件',
        description: '发送最新的产品演示视频和相关资料',
        reminder_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小时后
        reminder_type: 'email',
        priority: 'medium',
        status: 'pending',
        notification_methods: ['browser'],
        repeat_type: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '3',
        customer_id: '3',
        customer_name: '王五',
        customer_company: '百度',
        title: '会议跟进',
        description: '上次会议后的跟进，确认项目进展',
        reminder_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分钟前（逾期）
        reminder_type: 'follow_up',
        priority: 'high',
        status: 'pending',
        notification_methods: ['browser', 'email', 'sms'],
        repeat_type: 'weekly',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '4',
        customer_id: '4',
        customer_name: '赵六',
        customer_company: '字节跳动',
        title: '合同签署提醒',
        description: '提醒客户签署合同并返回',
        reminder_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
        reminder_type: 'custom',
        priority: 'medium',
        status: 'completed',
        notification_methods: ['browser'],
        repeat_type: 'none',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
    ];
    
    setReminders(mockReminders);
  }, []);

  // 检查通知权限
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setSnackbar({
          open: true,
          message: '通知权限已开启',
          severity: 'success'
        });
      }
    }
  };

  // 过滤和排序提醒
  useEffect(() => {
    let filtered = reminders;
    
    // 按状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    // 按搜索查询过滤
    if (searchQuery) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'reminder_time':
          return new Date(a.reminder_time).getTime() - new Date(b.reminder_time).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
    
    setFilteredReminders(filtered);
  }, [reminders, filterStatus, searchQuery, sortBy]);

  // 获取不同状态的提醒数量
  const getStatusCounts = () => {
    return {
      all: reminders.length,
      pending: reminders.filter(r => r.status === 'pending').length,
      completed: reminders.filter(r => r.status === 'completed').length,
      overdue: reminders.filter(r => 
        r.status === 'pending' && new Date(r.reminder_time) < new Date()
      ).length,
    };
  };

  const statusCounts = getStatusCounts();

  // 创建提醒
  const handleCreateReminder = async (data: ReminderForm) => {
    const customer = customers.find(c => c.id === data.customer_id);
    if (!customer) return;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      customer_id: data.customer_id,
      customer_name: customer.name,
      customer_company: customer.company,
      title: data.title,
      description: data.description,
      reminder_time: data.reminder_time.toISOString(),
      reminder_type: data.reminder_type,
      priority: data.priority,
      status: 'pending',
      notification_methods: data.notification_methods,
      repeat_type: data.repeat_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setReminders(prev => [newReminder, ...prev]);
    
    setSnackbar({
      open: true,
      message: '提醒创建成功',
      severity: 'success'
    });
  };

  // 编辑提醒
  const handleEditReminder = async (data: ReminderForm) => {
    if (!editingReminder) return;

    const customer = customers.find(c => c.id === data.customer_id);
    if (!customer) return;

    const updatedReminder: Reminder = {
      ...editingReminder,
      customer_id: data.customer_id,
      customer_name: customer.name,
      customer_company: customer.company,
      title: data.title,
      description: data.description,
      reminder_time: data.reminder_time.toISOString(),
      reminder_type: data.reminder_type,
      priority: data.priority,
      notification_methods: data.notification_methods,
      repeat_type: data.repeat_type,
      updated_at: new Date().toISOString(),
    };

    setReminders(prev => prev.map(r => r.id === editingReminder.id ? updatedReminder : r));
    setEditingReminder(null);
    
    setSnackbar({
      open: true,
      message: '提醒更新成功',
      severity: 'success'
    });
  };

  // 完成提醒
  const handleCompleteReminder = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id 
        ? { ...r, status: 'completed' as const, completed_at: new Date().toISOString() }
        : r
    ));
    
    setSnackbar({
      open: true,
      message: '提醒已标记为完成',
      severity: 'success'
    });
  };

  // 延迟提醒
  const handleSnoozeReminder = (id: string, snoozeTime: Date) => {
    setReminders(prev => prev.map(r => 
      r.id === id 
        ? { 
            ...r, 
            status: 'snoozed' as const, 
            snooze_until: snoozeTime.toISOString(),
            reminder_time: snoozeTime.toISOString(),
            updated_at: new Date().toISOString()
          }
        : r
    ));
    
    setSnackbar({
      open: true,
      message: `提醒已延迟到 ${snoozeTime.toLocaleString()}`,
      severity: 'info'
    });
  };

  // 删除提醒
  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    
    setSnackbar({
      open: true,
      message: '提醒已删除',
      severity: 'info'
    });
  };

  const tabLabels = [
    { label: '全部', value: 'all', count: statusCounts.all },
    { label: '待处理', value: 'pending', count: statusCounts.pending },
    { label: '已完成', value: 'completed', count: statusCounts.completed },
    { label: '已逾期', value: 'overdue', count: statusCounts.overdue },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题和操作 */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            提醒系统
          </Typography>
          <Typography variant="body1" color="textSecondary">
            管理客户提醒，确保重要事项不被遗漏
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={2}>
          {/* 通知权限状态 */}
          <Tooltip title={notificationPermission === 'granted' ? '通知已开启' : '点击开启通知'}>
            <IconButton
              onClick={requestNotificationPermission}
              color={notificationPermission === 'granted' ? 'success' : 'default'}
            >
              {notificationPermission === 'granted' ? <NotificationsActive /> : <NotificationsOff />}
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateFormOpen(true)}
          >
            创建提醒
          </Button>
        </Box>
      </Box>

      {/* 搜索和过滤 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="搜索提醒..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>状态筛选</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="状态筛选"
              >
                <MenuItem value="all">全部状态</MenuItem>
                <MenuItem value="pending">待处理</MenuItem>
                <MenuItem value="completed">已完成</MenuItem>
                <MenuItem value="snoozed">已延迟</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>排序方式</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="排序方式"
              >
                <MenuItem value="reminder_time">按时间排序</MenuItem>
                <MenuItem value="priority">按优先级排序</MenuItem>
                <MenuItem value="created_at">按创建时间排序</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setSortBy('reminder_time');
              }}
            >
              重置
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 状态标签页 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, newValue) => {
            setCurrentTab(newValue);
            const tabValue = tabLabels[newValue].value;
            setFilterStatus(tabValue === 'overdue' ? 'pending' : tabValue);
          }}
          variant="fullWidth"
        >
          {tabLabels.map((tab, index) => (
            <Tab
              key={tab.value}
              label={
                <Badge badgeContent={tab.count} color="primary">
                  {tab.label}
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* 提醒列表 */}
      <Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredReminders.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchQuery || filterStatus !== 'all' ? '没有找到匹配的提醒' : '暂无提醒'}
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              {searchQuery || filterStatus !== 'all' 
                ? '尝试调整搜索条件或筛选器' 
                : '创建第一个提醒来开始管理客户关系'
              }
            </Typography>
            {!searchQuery && filterStatus === 'all' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateFormOpen(true)}
              >
                创建提醒
              </Button>
            )}
          </Paper>
        ) : (
          filteredReminders.map(reminder => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={setEditingReminder}
              onComplete={handleCompleteReminder}
              onSnooze={handleSnoozeReminder}
              onDelete={handleDeleteReminder}
            />
          ))
        )}
      </Box>

      {/* 浮动操作按钮 */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateFormOpen(true)}
      >
        <Add />
      </Fab>

      {/* 创建/编辑表单 */}
      <ReminderCreateForm
        open={createFormOpen || !!editingReminder}
        initialData={editingReminder ? {
          customer_id: editingReminder.customer_id,
          title: editingReminder.title,
          description: editingReminder.description,
          reminder_time: new Date(editingReminder.reminder_time),
          reminder_type: editingReminder.reminder_type,
          priority: editingReminder.priority,
          notification_methods: editingReminder.notification_methods,
          repeat_type: editingReminder.repeat_type || 'none',
        } : undefined}
        customers={customers}
        onClose={() => {
          setCreateFormOpen(false);
          setEditingReminder(null);
        }}
        onSave={editingReminder ? handleEditReminder : handleCreateReminder}
      />

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReminderSystem;