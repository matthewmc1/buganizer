// src/components/AttachmentItem/AttachmentItem.tsx
import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { 
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  Archive as ArchiveIcon,
  AudioFile as AudioIcon,
  VideoFile as VideoIcon,
  InsertDriveFile as GenericFileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Attachment } from '../../types/issues';

interface AttachmentItemProps {
  attachment: Attachment;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const AttachmentItem: React.FC<AttachmentItemProps> = ({ 
  attachment, 
  onDelete,
  canDelete = false,
}) => {
  const getFileIcon = () => {
    const ext = attachment.filename.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'pdf':
        return <PdfIcon color="error" fontSize="large" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <ImageIcon color="primary" fontSize="large" />;
      case 'doc':
      case 'docx':
      case 'txt':
      case 'rtf':
        return <DocumentIcon color="primary" fontSize="large" />;
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'html':
      case 'css':
      case 'go':
      case 'c':
      case 'cpp':
        return <CodeIcon color="secondary" fontSize="large" />;
      case 'zip':
      case 'rar':
      case 'tar':
      case 'gz':
        return <ArchiveIcon color="action" fontSize="large" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <AudioIcon color="primary" fontSize="large" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return <VideoIcon color="secondary" fontSize="large" />;
      default:
        return <GenericFileIcon color="action" fontSize="large" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(attachment.id);
    }
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
          <Box sx={{ mb: 1 }}>
            {getFileIcon()}
          </Box>
          
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center', 
              fontWeight: 'medium',
              mb: 0.5,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {attachment.filename}
          </Typography>
          
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            {formatFileSize(attachment.fileSize)}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto' }}>
            <Tooltip title="Download">
              <IconButton 
                size="small" 
                color="primary"
                component="a"
                href={attachment.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            
            {canDelete && (
              <Tooltip title="Delete">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={handleDelete}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AttachmentItem;