// src/components/IssueDetail/IssueDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Paper, 
  Box, 
  Typography, 
  Divider, 
  Grid, 
  Button, 
  IconButton, 
  TextField, 
  MenuItem, 
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  Avatar,
  Card,
  CardHeader,
  CardContent,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  History as HistoryIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';

import { Issue, Comment, Attachment, Priority, Severity, Status } from '../../types/issues';
import { User } from '../../types/users';
import { useIssue } from '../../hooks/useIssue';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import IssueStatusChip from '../IssueStatusChip/IssueStatusChip';
import PriorityChip from '../PriorityChip/PriorityChip';
import SeverityChip from '../SeverityChip/SeverityChip';
import Markdown from '../Markdown/Markdown';
import AttachmentItem from '../AttachmentItem/AttachmentItem';
import UserSelect from '../UserSelect/UserSelect';

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
      id={`issue-tabpanel-${index}`}
      aria-labelledby={`issue-tab-${index}`}
      {...other}
    >
      {value === index && (
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              InputProps={{
                endAdornment: (
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<SendIcon />}
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim()}
                  >
                    Comment
                  </Button>
                ),
              }}
            />
          </Box>
          
          {commentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : comments.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </Box>
          ) : (
            <Typography color="textSecondary" align="center">
              No comments yet. Be the first to comment!
            </Typography>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Upload Attachment
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFileIcon />}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={(e) => e.target.files && setAttachmentFile(e.target.files[0])}
                />
              </Button>
              {attachmentFile && (
                <>
                  <Typography variant="body2">
                    {attachmentFile.name} ({formatFileSize(attachmentFile.size)})
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAttachmentSubmit}
                  >
                    Upload
                  </Button>
                </>
              )}
            </Box>
          </Box>
          
          {commentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : attachments.length > 0 ? (
            <Grid container spacing={2}>
              {attachments.map((attachment) => (
                <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                  <AttachmentItem attachment={attachment} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="textSecondary" align="center">
              No attachments yet.
            </Typography>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <HistoryIcon sx={{ mr: 1 }} color="action" />
            <Typography variant="subtitle1">
              Issue History
            </Typography>
          </Box>
          
          {/* In a real app, we would fetch and display the issue history */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <HistoryItem
              action="created"
              user="John Doe"
              timestamp={issue.createdAt}
            />
            {issue.assigneeId && (
              <HistoryItem
                action="assigned to"
                target={issue.assigneeId /* Would show actual user name */}
                user="Jane Smith"
                timestamp={issue.updatedAt}
              />
            )}
            <HistoryItem
              action="changed status to"
              target={issue.status}
              user="Alice Johnson"
              timestamp={issue.updatedAt}
            />
          </Box>
        </TabPanel>
      </Paper>
      
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteClose}
      >
        <DialogTitle>Delete Issue</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this issue? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>
            Cancel
          </Button>
          <Button 
            color="error" 
            onClick={handleDeleteConfirm}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  return (
    <Card variant="outlined">
      <CardHeader
        avatar={
          <Avatar>{comment.authorId.charAt(0).toUpperCase()}</Avatar>
        }
        title={comment.authorId /* Would show actual user name */}
        subheader={`${formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}`}
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent>
        <Markdown>{comment.content}</Markdown>
      </CardContent>
    </Card>
  );
};

interface HistoryItemProps {
  action: string;
  target?: string;
  user: string;
  timestamp: string;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ action, target, user, timestamp }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
        {user.charAt(0).toUpperCase()}
      </Avatar>
      <Typography variant="body2">
        <strong>{user}</strong> {action} {target && <strong>{target}</strong>}
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Tooltip title={format(new Date(timestamp), 'PPpp')}>
        <Typography variant="caption" color="textSecondary">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </Typography>
      </Tooltip>
    </Box>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default IssueDetail;<Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedIssue, setEditedIssue] = useState<Partial<Issue>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { issue, loading, error, fetchIssue, updateIssue, deleteIssue } = useIssue(id);
  const { comments, attachments, loading: commentsLoading, fetchComments, addComment, addAttachment } = useComments(id);

  useEffect(() => {
    if (id) {
      fetchIssue();
      fetchComments();
    }
  }, [id, fetchIssue, fetchComments]);

  useEffect(() => {
    if (issue) {
      setEditedIssue({
        title: issue.title,
        description: issue.description,
        reproduceSteps: issue.reproduceSteps,
        priority: issue.priority,
        severity: issue.severity,
        status: issue.status,
        assigneeId: issue.assigneeId,
      });
    }
  }, [issue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
    try {
      await addComment(commentText);
      setCommentText('');
      setSuccessMessage('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment', error);
    }
  };

  const handleAttachmentSubmit = async () => {
    if (!attachmentFile) return;
    
    try {
      await addAttachment(attachmentFile);
      setAttachmentFile(null);
      setSuccessMessage('Attachment added successfully');
    } catch (error) {
      console.error('Failed to add attachment', error);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditChange = (field: keyof Issue, value: any) => {
    setEditedIssue({
      ...editedIssue,
      [field]: value,
    });
  };

  const handleEditSave = async () => {
    try {
      await updateIssue(editedIssue);
      setIsEditing(false);
      setSuccessMessage('Issue updated successfully');
    } catch (error) {
      console.error('Failed to update issue', error);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    // Reset to original values
    if (issue) {
      setEditedIssue({
        title: issue.title,
        description: issue.description,
        reproduceSteps: issue.reproduceSteps,
        priority: issue.priority,
        severity: issue.severity,
        status: issue.status,
        assigneeId: issue.assigneeId,
      });
    }
  };

  const handleDeleteOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteIssue();
      setDeleteDialogOpen(false);
      setSuccessMessage('Issue deleted successfully');
      // Navigate back to the issues list
      navigate('/issues');
    } catch (error) {
      console.error('Failed to delete issue', error);
    }
  };

  const handleSnackbarClose = () => {
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !issue) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading issue: {error || 'Issue not found'}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/issues')}
          sx={{ mt: 2 }}
        >
          Back to Issues
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={successMessage}
      />
      
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link color="inherit" href="#" onClick={() => navigate('/')}>
            Home
          </Link>
          <Link color="inherit" href="#" onClick={() => navigate('/issues')}>
            Issues
          </Link>
          <Typography color="textPrimary">Issue {issue.id.slice(0, 8)}</Typography>
        </Breadcrumbs>
      </Box>
      
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'background.default', display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/issues')}
          >
            Back to Issues
          </Button>
          
          <Box>
            {isEditing ? (
              <>
                <Button 
                  color="primary" 
                  startIcon={<CheckCircleIcon />} 
                  onClick={handleEditSave}
                  sx={{ mr: 1 }}
                >
                  Save
                </Button>
                <Button 
                  color="error" 
                  startIcon={<CancelIcon />} 
                  onClick={handleEditCancel}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  startIcon={<EditIcon />} 
                  onClick={handleEditToggle}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button 
                  color="error" 
                  startIcon={<DeleteIcon />} 
                  onClick={handleDeleteOpen}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {isEditing ? (
            <TextField
              fullWidth
              label="Title"
              value={editedIssue.title}
              onChange={(e) => handleEditChange('title', e.target.value)}
              variant="outlined"
              sx={{ mb: 2 }}
            />
          ) : (
            <>
              <Typography variant="h5" component="h1" gutterBottom>
                {issue.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                  ID: {issue.id.slice(0, 8)}
                </Typography>
                <IconButton size="small">
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Box>
            </>
          )}
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Description
                </Typography>
                
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    value={editedIssue.description}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    variant="outlined"
                  />
                ) : (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Markdown>{issue.description || 'No description provided.'}</Markdown>
                  </Paper>
                )}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  Steps to Reproduce
                </Typography>
                
                {isEditing ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    value={editedIssue.reproduceSteps}
                    onChange={(e) => handleEditChange('reproduceSteps', e.target.value)}
                    variant="outlined"
                  />
                ) : (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Markdown>{issue.reproduceSteps || 'No steps provided.'}</Markdown>
                  </Paper>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Status
                </Typography>
                {isEditing ? (
                  <TextField
                    select
                    fullWidth
                    value={editedIssue.status}
                    onChange={(e) => handleEditChange('status', e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    {Object.values(Status).map((status) => (
                      <MenuItem key={status} value={status}>
                        <IssueStatusChip status={status} />
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <IssueStatusChip status={issue.status} />
                  </Box>
                )}
                
                <Typography variant="subtitle2" gutterBottom>
                  Priority
                </Typography>
                {isEditing ? (
                  <TextField
                    select
                    fullWidth
                    value={editedIssue.priority}
                    onChange={(e) => handleEditChange('priority', e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    {Object.values(Priority).map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        <PriorityChip priority={priority} />
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <PriorityChip priority={issue.priority} />
                  </Box>
                )}
                
                <Typography variant="subtitle2" gutterBottom>
                  Severity
                </Typography>
                {isEditing ? (
                  <TextField
                    select
                    fullWidth
                    value={editedIssue.severity}
                    onChange={(e) => handleEditChange('severity', e.target.value)}
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    {Object.values(Severity).map((severity) => (
                      <MenuItem key={severity} value={severity}>
                        <SeverityChip severity={severity} />
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <SeverityChip severity={issue.severity} />
                  </Box>
                )}
                
                <Typography variant="subtitle2" gutterBottom>
                  Assignee
                </Typography>
                {isEditing ? (
                  <UserSelect
                    value={editedIssue.assigneeId || ""}
                    onChange={(value) => handleEditChange('assigneeId', value)}
                    fullWidth
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    {issue.assigneeId ? (
                      <>
                        <Avatar 
                          sx={{ width: 24, height: 24, mr: 1 }}
                        >
                          {issue.assigneeId.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">
                          {issue.assigneeId /* Would show actual user name */}
                        </Typography>
                      </>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                          Unassigned
                        </Typography>
                        <Button 
                          startIcon={<PersonAddIcon />} 
                          size="small" 
                          variant="outlined"
                          onClick={handleEditToggle}
                        >
                          Assign
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Dates
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="textSecondary">
                        Created:
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Tooltip title={format(new Date(issue.createdAt), 'PPpp')}>
                        <Typography variant="body2">
                          {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                        </Typography>
                      </Tooltip>
                    </Grid>
                    
                    <Grid item xs={4}>
                      <Typography variant="caption" color="textSecondary">
                        Updated:
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Tooltip title={format(new Date(issue.updatedAt), 'PPpp')}>
                        <Typography variant="body2">
                          {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                        </Typography>
                      </Tooltip>
                    </Grid>
                    
                    {issue.dueDate && (
                      <>
                        <Grid item xs={4}>
                          <Typography variant="caption" color="textSecondary">
                            Due:
                          </Typography>
                        </Grid>
                        <Grid item xs={8}>
                          <Tooltip title={format(new Date(issue.dueDate), 'PPpp')}>
                            <Typography 
                              variant="body2" 
                              color={new Date(issue.dueDate) < new Date() ? 'error.main' : 'text.primary'}
                            >
                              {formatDistanceToNow(new Date(issue.dueDate), { addSuffix: true })}
                            </Typography>
                          </Tooltip>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Labels
                  </Typography>
                  {issue.labels && issue.labels.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {issue.labels.map((label) => (
                        <Chip key={label} label={label} size="small" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No labels
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="issue tabs"
          >
            <Tab label={`Comments (${comments.length})`} id="issue-tab-0" />
            <Tab label={`Attachments (${attachments.length})`} id="issue-tab-1" />
            <Tab label="History" id="issue-tab-2" />
          </Tabs>
        </Box>
        