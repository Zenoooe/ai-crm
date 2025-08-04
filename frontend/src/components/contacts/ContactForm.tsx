import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Contact, CreateContactDto, UpdateContactDto } from '../../types/contact';

interface ContactFormProps {
  open: boolean;
  contact?: Contact | null;
  onClose: () => void;
  onSubmit: (data: CreateContactDto | UpdateContactDto) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  open,
  contact,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    industry: '',
    ageGroup: '',
    wechatId: '',
    folder: '',
    priority: 2 as 1 | 2 | 3,
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.basicInfo.name || '',
        email: contact.basicInfo.email || '',
        phone: contact.basicInfo.phone || '',
        company: contact.basicInfo.company || '',
        position: contact.basicInfo.position || '',
        industry: contact.basicInfo.industry || '',
        ageGroup: contact.basicInfo.ageGroup || '',
        wechatId: contact.basicInfo.wechatId || '',
        folder: contact.folder || '',
        priority: contact.priority || 2,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        industry: '',
        ageGroup: '',
        wechatId: '',
        folder: '',
        priority: 2,
      });
    }
  }, [contact, open]);

  const handleChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = () => {
    const submitData = {
      basicInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        position: formData.position,
        industry: formData.industry,
        ageGroup: formData.ageGroup,
        wechatId: formData.wechatId,
      },
      folder: formData.folder,
      priority: formData.priority,
    };

    if (contact) {
      onSubmit({ ...submitData, _id: contact._id } as UpdateContactDto);
    } else {
      onSubmit(submitData as CreateContactDto);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {contact ? '编辑联系人' : '新建联系人'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="姓名"
              value={formData.name}
              onChange={handleChange('name')}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="邮箱"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="电话"
              value={formData.phone}
              onChange={handleChange('phone')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="微信号"
              value={formData.wechatId}
              onChange={handleChange('wechatId')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="公司"
              value={formData.company}
              onChange={handleChange('company')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="职位"
              value={formData.position}
              onChange={handleChange('position')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="行业"
              value={formData.industry}
              onChange={handleChange('industry')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>年龄段</InputLabel>
              <Select
                value={formData.ageGroup}
                onChange={handleChange('ageGroup')}
                label="年龄段"
              >
                <MenuItem value="18-25">18-25</MenuItem>
                <MenuItem value="26-35">26-35</MenuItem>
                <MenuItem value="36-45">36-45</MenuItem>
                <MenuItem value="46-55">46-55</MenuItem>
                <MenuItem value="55+">55+</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="文件夹"
              value={formData.folder}
              onChange={handleChange('folder')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>优先级</InputLabel>
              <Select
                value={formData.priority}
                onChange={handleChange('priority')}
                label="优先级"
              >
                <MenuItem value={1}>高</MenuItem>
                <MenuItem value={2}>中</MenuItem>
                <MenuItem value={3}>低</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained">
          {contact ? '更新' : '创建'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContactForm;