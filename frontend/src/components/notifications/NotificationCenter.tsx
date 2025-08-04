import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Button,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Fab,
  Slide,
  Fade,
  Collapse,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  MarkEmailRead,
  Clear,
  Delete,
  Info,
  CheckCircle,
  Warning,
  Error,
  Close,
  ExpandMore,
  ExpandLess,
  Refresh,
  Settings,
  VolumeUp,
  VolumeOff,
  Circle,
  Schedule,
  Person,
  Business,
  SmartToy,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { useRealtimeNotifications, Notification, WS_MESSAGE_TYPES } from '../../hooks/useWebSocket';

// 通知项组件
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onClear: (id: string) => void;
  onAction?: (action: string, data?: any) => void;
}> = ({ notification, onMarkAsRead, onClear, onAction }) => {
  const [expanded, setExpanded] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'warning': return <Warning sx={{ color: 'warning.main' }} />;
      case 'error': return <Error sx={{ color: 'error.main' }} />;
      default: return <Info sx={{ color: 'info.main' }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'success.50';
      case 'warning': return 'warning.50';
      case 'error': return 'error.50';
      default: return 'info.50';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return time.toLocaleDateString();
  };

  return (
    <Card
      sx={{
        mb: 1,
        bgcolor: notification.read ? 'background.paper' : getNotificationColor(notification.type),
        border: notification.read ? '1px solid' : '2px solid',
        borderColor: notification.read ? 'divider' : `${notification.type}.main`,
        position: 'relative',
      }}
    >
      {/* 未读指示器 */}
      {!notification.read && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: `${notification.type}.main`,
          }}
        />
      )}

      <CardContent sx={{ pb: notification.actions ? 1 : 2 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar sx={{ bgcolor: 'transparent' }}>
            {getNotificationIcon(notification.type)}
          </Avatar>
          
          <Box flexGrow={1}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
              <Typography variant="subtitle2" fontWeight="bold">
                {notification.title}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {formatTime(notification.timestamp)}
              </Typography>
            </Box>
            
            <Typography 
              variant="body2" 
              color="textSecondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: notification.message.length > 100 ? 'pointer' : 'default',
              }}
              onClick={() => notification.message.length > 100 && setExpanded(!expanded)}
            >
              {notification.message}
            </Typography>
            
            {notification.message.length > 100 && (
              <Button
                size="small"
                onClick={() => setExpanded(!expanded)}
                endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                sx={{ mt: 0.5, p: 0, minWidth: 'auto' }}
              >
                {expanded ? '收起' : '展开'}
              </Button>
            )}
          </Box>
          
          <Box display="flex" flexDirection="column" gap={0.5}>
            {!notification.read && (
              <Tooltip title="标记为已读">
                <IconButton
                  size="small"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <MarkEmailRead fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="删除通知">
              <IconButton
                size="small"
                onClick={() => onClear(notification.id)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
      
      {/* 操作按钮 */}
      {notification.actions && notification.actions.length > 0 && (
        <CardActions sx={{ pt: 0 }}>
          {notification.actions.map((action, index) => (
            <Button
              key={index}
              size="small"
              variant="outlined"
              onClick={() => onAction?.(action.action, action.data)}
            >
              {action.label}
            </Button>
          ))}
        </CardActions>
      )}
    </Card>
  );
};

// 通知设置对话框
const NotificationSettings: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [settings, setSettings] = useState({
    browserNotifications: true,
    soundEnabled: true,
    customerUpdates: true,
    reminderAlerts: true,
    aiAnalysis: true,
    systemNotifications: true,
  });

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // 保存设置到localStorage或发送到服务器
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>通知设置</DialogTitle>
      
      <DialogContent>
        <List>
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Notifications />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="浏览器通知"
              secondary="在浏览器中显示桌面通知"
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleSettingChange('browserNotifications', !settings.browserNotifications)}
              >
                {settings.browserNotifications ? <NotificationsActive /> : <NotificationsOff />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <VolumeUp />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="声音提醒"
              secondary="播放通知声音"
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
              >
                {settings.soundEnabled ? <VolumeUp /> : <VolumeOff />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Person />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="客户更新"
              secondary="客户信息变更通知"
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleSettingChange('customerUpdates', !settings.customerUpdates)}
              >
                {settings.customerUpdates ? <CheckCircle /> : <Circle />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Schedule />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="提醒通知"
              secondary="客户提醒和任务通知"
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleSettingChange('reminderAlerts', !settings.reminderAlerts)}
              >
                {settings.reminderAlerts ? <CheckCircle /> : <Circle />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <SmartToy />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="AI分析"
              secondary="AI分析完成通知"
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleSettingChange('aiAnalysis', !settings.aiAnalysis)}
              >
                {settings.aiAnalysis ? <CheckCircle /> : <Circle />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
          
          <ListItem>
            <ListItemAvatar>
              <Avatar>
                <Info />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary="系统通知"
              secondary="系统更新和维护通知"
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={() => handleSettingChange('systemNotifications', !settings.systemNotifications)}
              >
                {settings.systemNotifications ? <CheckCircle /> : <Circle />}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">保存设置</Button>
      </DialogActions>
    </Dialog>
  );
};

// 通知中心主组件
const NotificationCenter: React.FC<{
  clientId: string;
}> = ({ clientId }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const {
    notifications,
    unreadCount,
    connectionStatus,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    sendMessage,
  } = useRealtimeNotifications(clientId);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationAction = useCallback((action: string, data?: any) => {
    switch (action) {
      case 'complete_reminder':
        // 发送完成提醒的消息
        sendMessage('complete_reminder', data);
        setSnackbar({
          open: true,
          message: '提醒已标记为完成',
          severity: 'success'
        });
        break;
        
      case 'snooze_reminder':
        // 发送延迟提醒的消息
        sendMessage('snooze_reminder', data);
        setSnackbar({
          open: true,
          message: '提醒已延迟',
          severity: 'info'
        });
        break;
        
      case 'view_analysis':
        // 跳转到客户分析页面
        window.location.href = `/customers/${data.customerId}/analysis`;
        break;
        
      default:
        console.log('未知操作:', action, data);
    }
  }, [sendMessage]);

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中';
      case 'error': return '连接错误';
      default: return '未连接';
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {/* 通知图标按钮 */}
      <Tooltip title={`通知中心 (${getConnectionStatusText()})`}>
        <IconButton
          onClick={handleClick}
          color={isConnected ? 'default' : 'error'}
        >
          <Badge badgeContent={unreadCount} color="error">
            {isConnected ? (
              unreadCount > 0 ? <NotificationsActive /> : <Notifications />
            ) : (
              <NotificationsOff />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* 通知菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            overflow: 'visible',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* 头部 */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6" fontWeight="bold">
              通知中心
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={getConnectionStatusText()}
                color={getConnectionStatusColor()}
                variant="outlined"
              />
              
              <IconButton
                size="small"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          {notifications.length > 0 && (
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">
                {unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
              </Typography>
              
              <Box display="flex" gap={1}>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    onClick={() => {
                      markAllAsRead();
                      setSnackbar({
                        open: true,
                        message: '所有通知已标记为已读',
                        severity: 'success'
                      });
                    }}
                  >
                    全部已读
                  </Button>
                )}
                
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    clearAllNotifications();
                    setSnackbar({
                      open: true,
                      message: '所有通知已清除',
                      severity: 'info'
                    });
                  }}
                >
                  清空
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* 通知列表 */}
        <Box sx={{ maxHeight: 400, overflow: 'auto', p: 1 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                暂无通知
              </Typography>
            </Box>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onClear={clearNotification}
                onAction={handleNotificationAction}
              />
            ))
          )}
        </Box>

        {/* 底部操作 */}
        {notifications.length > 0 && (
          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                // 跳转到完整的通知页面
                window.location.href = '/notifications';
                handleClose();
              }}
            >
              查看所有通知
            </Button>
          </Box>
        )}
      </Menu>

      {/* 通知设置对话框 */}
      <NotificationSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
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
    </>
  );
};

export default NotificationCenter;