import React from 'react';
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
} from '@mui/material';
import {
  Phone,
  Email,
  Business,
  Edit,
  Delete,
} from '@mui/icons-material';
import { Contact } from '../../types/contact';
import ContactAISalesAssistant from './ContactAISalesAssistant.tsx';

interface ContactDetailProps {
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

const ContactDetail: React.FC<ContactDetailProps> = ({
  contact,
  onEdit,
  onDelete,
}) => {
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
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

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
          </CardContent>
        </Card>
      </Grid>

      {/* AI销售助手 */}
      <Grid item xs={12} md={6}>
        <ContactAISalesAssistant contact={contact} />
      </Grid>
    </Grid>
  );
};

export default ContactDetail;