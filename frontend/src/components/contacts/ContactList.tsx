import React, { useState, useMemo } from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  MoreVert,
  Star,
  StarBorder,
  Edit,
  Delete,
  Phone,
  Email,
  Business,
  Psychology,
} from '@mui/icons-material';
import { Contact } from '../../types/contact';


interface ContactListProps {
  contacts: Contact[];
  searchTerm: string;
  onContactSelect: (contact: Contact) => void;
  onContactEdit: (contact: Contact) => void;
  onContactDelete?: (contactId: string) => void;
  onContactReorder?: (contacts: Contact[]) => void;
}

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  index: number;
  isDragging?: boolean;
}

const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  index,
  isDragging = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit();
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.();
    handleMenuClose();
  };

  const toggleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return '#f44336'; // 红色 - 高优先级
      case 2:
        return '#ff9800'; // 橙色 - 中优先级
      case 3:
        return '#4caf50'; // 绿色 - 低优先级
      default:
        return '#9e9e9e'; // 灰色 - 默认
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return '高';
      case 2:
        return '中';
      case 3:
        return '低';
      default:
        return '';
    }
  };

  const getAvatarContent = () => {
    if (contact.photos && contact.photos.length > 0) {
      return (
        <Avatar
          src={contact.photos[0].url}
          alt={contact.basicInfo.name}
          sx={{ width: 40, height: 40 }}
        />
      );
    }
    return (
      <Avatar sx={{ width: 40, height: 40, bgcolor: getPriorityColor(contact.priority) }}>
        {contact.basicInfo.name.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  return (
        <ListItem
          disablePadding
          sx={{
            mb: 0.5,
            bgcolor: isSelected ? 'primary.light' : 'transparent',
            borderRadius: 1,
          }}
        >
          <ListItemButton
            onClick={onSelect}
            sx={{
              borderRadius: 1,
              '&:hover': {
                bgcolor: isSelected ? 'primary.light' : 'action.hover',
              },
            }}
          >
            <ListItemAvatar>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  contact.aiProfile?.opportunityScore && contact.aiProfile.opportunityScore > 70 ? (
                    <Psychology
                      sx={{
                        fontSize: 16,
                        color: 'secondary.main',
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                        p: 0.2,
                      }}
                    />
                  ) : null
                }
              >
                {getAvatarContent()}
              </Badge>
            </ListItemAvatar>

            <ListItemText
              primary={contact.basicInfo.name}
              secondary={
                <React.Fragment>
                  <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block' }}>
                    {contact.basicInfo.company} • {contact.basicInfo.position}
                  </Typography>
                  <Box component="span" sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={getPriorityText(contact.priority)}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.65rem',
                        bgcolor: getPriorityColor(contact.priority),
                        color: 'white',
                      }}
                    />
                    {contact.tags.slice(0, 2).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag.name}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.65rem',
                          bgcolor: tag.color,
                          color: 'white',
                        }}
                      />
                    ))}
                    {contact.tags.length > 2 && (
                      <Chip
                        label={`+${contact.tags.length - 2}`}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: '0.65rem',
                          bgcolor: 'grey.400',
                          color: 'white',
                        }}
                      />
                    )}
                  </Box>
                </React.Fragment>
              }
              primaryTypographyProps={{
                variant: 'subtitle2',
                noWrap: true,
                sx: { display: 'flex', alignItems: 'center', gap: 1 }
              }}
              secondaryTypographyProps={{
                component: 'div'
              }}
            />

            {/* 收藏按钮移到右侧 */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mr: 1 }}>
              <IconButton
                size="small"
                onClick={toggleFavorite}
                sx={{ p: 0.2 }}
              >
                {isFavorite ? (
                  <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                ) : (
                  <StarBorder sx={{ fontSize: 16, color: 'text.secondary' }} />
                )}
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              {contact.aiProfile?.opportunityScore && (
                <Typography
                  variant="caption"
                  sx={{
                    color: contact.aiProfile.opportunityScore > 70 ? 'success.main' : 'text.secondary',
                    fontWeight: 'bold',
                  }}
                >
                  {contact.aiProfile.opportunityScore}%
                </Typography>
              )}
              <IconButton
                size="small"
                onClick={handleMenuOpen}
                sx={{ p: 0.5 }}
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Box>
          </ListItemButton>

          {/* 上下文菜单 */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
          >
            <MenuItem onClick={handleEdit}>
              <Edit fontSize="small" sx={{ mr: 1 }} />
              编辑
            </MenuItem>
            <MenuItem onClick={() => window.open(`tel:${contact.basicInfo.phone}`)}>
              <Phone fontSize="small" sx={{ mr: 1 }} />
              拨打电话
            </MenuItem>
            <MenuItem onClick={() => window.open(`mailto:${contact.basicInfo.email}`)}>
              <Email fontSize="small" sx={{ mr: 1 }} />
              发送邮件
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <Delete fontSize="small" sx={{ mr: 1 }} />
              删除
            </MenuItem>
          </Menu>
        </ListItem>
  );
};

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  searchTerm,
  onContactSelect,
  onContactEdit,
  onContactDelete,
  onContactReorder,
}) => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // 过滤和搜索联系人
  const filteredContacts = useMemo(() => {
    if (!contacts || !Array.isArray(contacts)) {
      return [];
    }
    
    return contacts.filter((contact) => {
      if (!contact || !contact.basicInfo) {
        return false;
      }
      
      const searchLower = searchTerm?.toLowerCase() || '';
      if (!searchLower) {
        return true;
      }
      
      return (
        (contact.basicInfo.name?.toLowerCase() || '').includes(searchLower) ||
        (contact.basicInfo.company?.toLowerCase() || '').includes(searchLower) ||
        (contact.basicInfo.position?.toLowerCase() || '').includes(searchLower) ||
        (contact.basicInfo.email?.toLowerCase() || '').includes(searchLower) ||
        (contact.tags && Array.isArray(contact.tags) && contact.tags.some((tag) => tag?.name?.toLowerCase()?.includes(searchLower)))
      );
    });
  }, [contacts, searchTerm]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    onContactSelect(contact);
  };

  const handleReorder = (reorderedContacts: Contact[]) => {
    if (onContactReorder) {
      onContactReorder(reorderedContacts);
    }
  };

  if (filteredContacts.length === 0) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <Business sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
        <Typography variant="body2">
          {searchTerm ? '未找到匹配的联系人' : '暂无联系人'}
        </Typography>
        {searchTerm && (
          <Typography variant="caption">
            尝试调整搜索条件
          </Typography>
        )}
      </Box>
    );
  }

  if (filteredContacts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {searchTerm ? '没有找到匹配的联系人' : '还没有联系人'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight: '100%', overflow: 'auto' }}>
      {filteredContacts.map((contact, index) => (
        <ContactItem
          key={contact._id}
          contact={contact}
          index={index}
          isSelected={selectedContact?._id === contact._id}
          onSelect={() => handleContactSelect(contact)}
          onEdit={() => onContactEdit(contact)}
          onDelete={onContactDelete ? () => onContactDelete(contact._id) : undefined}
          isDragging={false}
        />
      ))}
    </Box>
  );
};

export default ContactList;