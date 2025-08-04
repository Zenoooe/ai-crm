import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Folder,
  FolderOpen,
  ExpandLess,
  ExpandMore,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';

interface FolderNode {
  name: string;
  path: string;
  children?: FolderNode[];
  count?: number;
}

interface FolderTreeProps {
  folders: string[];
  selectedFolder: string;
  onFolderSelect: (folder: string) => void;
  onFolderCreate?: (folderName: string, parentPath?: string) => void;
  onFolderRename?: (oldPath: string, newName: string) => void;
  onFolderDelete?: (folderPath: string) => void;
}

const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolder,
  onFolderSelect,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [parentFolder, setParentFolder] = useState('');

  // 构建文件夹树结构
  const buildFolderTree = (folders: string[]): FolderNode[] => {
    const tree: FolderNode[] = [];
    const folderMap = new Map<string, FolderNode>();

    // 添加根文件夹
    const rootNode: FolderNode = {
      name: '全部联系人',
      path: '',
      children: [],
      count: 0,
    };
    tree.push(rootNode);
    folderMap.set('', rootNode);

    // 处理其他文件夹
    if (folders && Array.isArray(folders)) {
      folders.forEach(folderPath => {
      if (!folderPath) return;
      
      const parts = folderPath.split('/');
      let currentPath = '';
      
      parts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!folderMap.has(currentPath)) {
          const node: FolderNode = {
            name: part,
            path: currentPath,
            children: [],
            count: 0,
          };
          
          folderMap.set(currentPath, node);
          
          const parent = folderMap.get(parentPath);
          if (parent) {
            parent.children!.push(node);
          }
        }
      });
    });
    }

    return tree;
  };

  const folderTree = buildFolderTree(folders);

  const handleToggleExpand = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && onFolderCreate) {
      const fullPath = parentFolder ? `${parentFolder}/${newFolderName.trim()}` : newFolderName.trim();
      onFolderCreate(fullPath, parentFolder);
      setNewFolderName('');
      setCreateDialogOpen(false);
    }
  };

  const renderFolderNode = (node: FolderNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFolder === node.path;

    return (
      <React.Fragment key={node.path}>
        <ListItem
          disablePadding
          sx={{
            pl: level * 2,
            backgroundColor: isSelected ? 'action.selected' : 'transparent',
          }}
        >
          <ListItemButton
            onClick={() => onFolderSelect(node.path)}
            sx={{ py: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {hasChildren ? (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(node.path);
                  }}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              ) : (
                <Box sx={{ width: 24 }} />
              )}
            </ListItemIcon>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {hasChildren && isExpanded ? <FolderOpen /> : <Folder />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">{node.name}</Typography>
                  {node.count !== undefined && (
                    <Typography variant="caption" color="textSecondary">
                      {node.count}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children!.map(child => renderFolderNode(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={1}>
        <Typography variant="h6">文件夹</Typography>
        {onFolderCreate && (
          <IconButton
            size="small"
            onClick={() => {
              setParentFolder(selectedFolder);
              setCreateDialogOpen(true);
            }}
          >
            <Add />
          </IconButton>
        )}
      </Box>
      <List dense>
        {folderTree.map(node => renderFolderNode(node))}
      </List>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>创建新文件夹</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文件夹名称"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
          {parentFolder && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              将在 "{parentFolder}" 下创建
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderTree;