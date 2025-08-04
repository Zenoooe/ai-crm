import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux.ts';
import { updateProfile } from '../../store/slices/authSlice.ts';
import { UpdateProfileRequest } from '../../types/auth';

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    company: user?.profile?.company || '',
    position: user?.profile?.position || '',
  });
  
  const [notifications, setNotifications] = useState({
    email: user?.settings?.notifications?.email || true,
    push: user?.settings?.notifications?.push || true,
    sms: user?.settings?.notifications?.sms || false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSave = () => {
    const updateData = {
      profile: {
        ...user?.profile,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        position: formData.position,
      },
    };
    dispatch(updateProfile(updateData));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      company: user?.profile?.company || '',
      position: user?.profile?.position || '',
    });
    setIsEditing(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        设置
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        管理您的账户设置和偏好
      </Typography>

      <Grid container spacing={3}>
        {/* 个人信息 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                个人信息
              </Typography>
              {!isEditing ? (
                <IconButton onClick={() => setIsEditing(true)}>
                  <Edit />
                </IconButton>
              ) : (
                <Box>
                  <IconButton onClick={handleSave} color="primary">
                    <Save />
                  </IconButton>
                  <IconButton onClick={handleCancel}>
                    <Cancel />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 2 }}
                src={user?.profile?.avatar}
              >
                {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </Typography>
                <Typography color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="名字"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'outlined' : 'standard'}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="姓氏"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'outlined' : 'standard'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="公司"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'outlined' : 'standard'}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="职位"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  variant={isEditing ? 'outlined' : 'standard'}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 通知设置 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              通知设置
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.email}
                    onChange={() => handleNotificationChange('email')}
                  />
                }
                label="邮件通知"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                接收重要更新和提醒的邮件通知
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.push}
                    onChange={() => handleNotificationChange('push')}
                  />
                }
                label="推送通知"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                接收浏览器推送通知
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.sms}
                    onChange={() => handleNotificationChange('sms')}
                  />
                }
                label="短信通知"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                接收重要事件的短信提醒
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 安全设置 */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              安全设置
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      修改密码
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      定期更新密码以保护账户安全
                    </Typography>
                    <Button variant="outlined" size="small">
                      修改密码
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      两步验证
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      为账户添加额外的安全保护
                    </Typography>
                    <Button variant="outlined" size="small">
                      启用两步验证
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;