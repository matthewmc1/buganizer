// src/hooks/useComments.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Comment, Attachment } from '../types/issues';

export const useComments = (issueId: string | undefined) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment these
      // const commentsResponse = await axios.get(`/api/v1/issues/${issueId}/comments`);
      // setComments(commentsResponse.data);
      // const attachmentsResponse = await axios.get(`/api/v1/issues/${issueId}/attachments`);
      // setAttachments(attachmentsResponse.data);
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock comments
      const mockComments: Comment[] = Array.from({ length: 5 }, (_, i) => ({
        id: `comment-${i + 1}`,
        issueId,
        authorId: i % 2 === 0 ? 'user-1' : 'user-2',
        content: `This is comment ${i + 1}. It contains some text related to the issue.`,
        createdAt: new Date(Date.now() - (5 - i) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (5 - i) * 86400000).toISOString(),
      }));
      
      // Mock attachments
      const mockAttachments: Attachment[] = Array.from({ length: 2 }, (_, i) => ({
        id: `attachment-${i + 1}`,
        issueId,
        uploaderId: 'user-1',
        filename: `attachment-${i + 1}.${i === 0 ? 'pdf' : 'png'}`,
        fileUrl: `https://example.com/files/attachment-${i + 1}.${i === 0 ? 'pdf' : 'png'}`,
        fileSize: (i + 1) * 1024 * 1024, // 1MB, 2MB
        createdAt: new Date(Date.now() - (3 - i) * 86400000).toISOString(),
      }));
      
      setComments(mockComments);
      setAttachments(mockAttachments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments and attachments');
      console.error('Error fetching comments and attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  const addComment = useCallback(async (content: string) => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      // const response = await axios.post(`/api/v1/issues/${issueId}/comments`, { content });
      // setComments(prev => [...prev, response.data]);
      // return response.data;
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock new comment
      const newComment: Comment = {
        id: `comment-${comments.length + 1}`,
        issueId,
        authorId: 'user-1', // Current user
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setComments(prev => [...prev, newComment]);
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      console.error('Error adding comment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [issueId, comments.length]);

  const addAttachment = useCallback(async (file: File) => {
    if (!issueId) return;

    setLoading(true);
    setError(null);

    try {
      // For a real implementation, uncomment this
      /*
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`/api/v1/issues/${issueId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setAttachments(prev => [...prev, response.data]);
      return response.data;
      */
      
      // For development/demo, simulate API response
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock new attachment
      const newAttachment: Attachment = {
        id: `attachment-${attachments.length + 1}`,
        issueId,
        uploaderId: 'user-1', // Current user
        filename: file.name,
        fileUrl: `https://example.com/files/${file.name}`,
        fileSize: file.size,
        createdAt: new Date().toISOString(),
      };
      
      setAttachments(prev => [...prev, newAttachment]);
      return newAttachment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add attachment');
      console.error('Error adding attachment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [issueId, attachments.length]);

  // Initial fetch
  useEffect(() => {
    if (issueId) {
      fetchComments();
    }
  }, [issueId, fetchComments]);

  return {
    comments,
    attachments,
    loading,
    error,
    fetchComments,
    addComment,
    addAttachment,
  };
};