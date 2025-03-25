// src/utils/filterParser.ts
import { Issue } from '../types/issues';

/**
 * Parse a filter string into structured key-value filters
 * e.g. "is:open priority:P0 assignee:me search term"
 */
export function parseFilterString(filterString: string): Record<string, string[]> {
  const filters: Record<string, string[]> = {};
  
  if (!filterString) return filters;
  
  // Split by spaces, but keep quoted sections together
  const parts = filterString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  
  parts.forEach(part => {
    // Check if it's a key:value pair
    const match = part.match(/^([a-zA-Z]+):(.+)$/);
    if (match) {
      const [, key, value] = match;
      if (!filters[key]) {
        filters[key] = [];
      }
      // Remove quotes if present
      const cleanValue = value.replace(/^"(.*)"$/, '$1');
      filters[key].push(cleanValue);
    } else {
      // For free text search
      if (!filters['text']) {
        filters['text'] = [];
      }
      // Remove quotes if present
      const cleanTerm = part.replace(/^"(.*)"$/, '$1');
      filters['text'].push(cleanTerm);
    }
  });
  
  return filters;
}

/**
 * Apply structured filters to issues
 */
export function applyFilters(issues: Issue[], filters: Record<string, string[]>): Issue[] {
  if (Object.keys(filters).length === 0) return issues;
  
  return issues.filter(issue => {
    // Check each filter type
    for (const [key, values] of Object.entries(filters)) {
      let matched = false;
      
      switch (key.toLowerCase()) {
        case 'is':
          // Handle status filters
          for (const value of values) {
            switch (value.toLowerCase()) {
              case 'open':
                matched = issue.status !== 'CLOSED' && issue.status !== 'WONT_FIX' && issue.status !== 'DUPLICATE';
                break;
              case 'closed':
                matched = issue.status === 'CLOSED' || issue.status === 'WONT_FIX' || issue.status === 'DUPLICATE';
                break;
              case 'assigned':
                matched = !!issue.assigneeId;
                break;
              case 'unassigned':
                matched = !issue.assigneeId;
                break;
              case 'fixed':
                matched = issue.status === 'FIXED';
                break;
              case 'verified':
                matched = issue.status === 'VERIFIED';
                break;
              default:
                matched = issue.status.toLowerCase() === value.toLowerCase();
            }
            if (matched) break;
          }
          if (!matched) return false;
          break;
          
        case 'status':
          // Direct status match
          matched = values.some(v => 
            issue.status.toLowerCase() === v.toLowerCase()
          );
          if (!matched) return false;
          break;
          
        case 'priority':
          // Handle priority filters
          matched = values.some(v => 
            issue.priority.toLowerCase() === v.toLowerCase()
          );
          if (!matched) return false;
          break;
          
        case 'severity':
          // Handle severity filters
          matched = values.some(v => 
            issue.severity.toLowerCase() === v.toLowerCase()
          );
          if (!matched) return false;
          break;
          
        case 'assignee':
          // Handle assignee filters
          for (const value of values) {
            if (value.toLowerCase() === 'me') {
              // In a real app, would check against current user
              matched = issue.assigneeId === 'user-1';
            } else {
              matched = issue.assigneeId === value;
            }
            if (matched) break;
          }
          if (!matched) return false;
          break;
          
        case 'due':
          // Handle due date filters
          if (!issue.dueDate) return false;
          
          const dueDate = new Date(issue.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (const value of values) {
            switch (value.toLowerCase()) {
              case 'today':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                matched = dueDate >= today && dueDate < tomorrow;
                break;
              case 'tomorrow':
                const tomorrowDate = new Date(today);
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                const dayAfterTomorrow = new Date(today);
                dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
                matched = dueDate >= tomorrowDate && dueDate < dayAfterTomorrow;
                break;
              case 'week':
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                matched = dueDate >= today && dueDate < nextWeek;
                break;
              case 'overdue':
                matched = dueDate < today;
                break;
              default:
                // Handle specific date in format YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                  const specificDate = new Date(value);
                  specificDate.setHours(0, 0, 0, 0);
                  const nextDay = new Date(specificDate);
                  nextDay.setDate(nextDay.getDate() + 1);
                  matched = dueDate >= specificDate && dueDate < nextDay;
                }
            }
            if (matched) break;
          }
          if (!matched) return false;
          break;
          
        case 'label':
        case 'labels':
          // Handle label filters
          if (!issue.labels || issue.labels.length === 0) return false;
          matched = values.some(v => 
            issue.labels.some(label => label.toLowerCase().includes(v.toLowerCase()))
          );
          if (!matched) return false;
          break;
          
        case 'text':
          // Enhanced free text search - all terms must match somewhere
          matched = values.every(term => {
            const searchTerm = term.toLowerCase();
            const issueText = `${issue.title} ${issue.description || ''} ${issue.reproduceSteps || ''}`.toLowerCase();
            return issueText.includes(searchTerm);
          });
          if (!matched) return false;
          break;
          
        case 'component':
          // Handle component filters
          matched = values.some(v => 
            issue.componentId.toLowerCase().includes(v.toLowerCase())
          );
          if (!matched) return false;
          break;

        case 'id':
          // Handle ID filters (partial matching)
          matched = values.some(v => 
            issue.id.toLowerCase().includes(v.toLowerCase())
          );
          if (!matched) return false;
          break;
          
        case 'reporter':
          // Handle reporter filters
          matched = values.some(v => 
            issue.reporterId.toLowerCase() === v.toLowerCase()
          );
          if (!matched) return false;
          break;
          
        case 'created':
          // Handle creation date filters - similar to due date
          const createdDate = new Date(issue.createdAt);
          for (const value of values) {
            if (value.toLowerCase() === 'today') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              matched = createdDate >= today && createdDate < tomorrow;
            } else if (value.toLowerCase() === 'yesterday') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              matched = createdDate >= yesterday && createdDate < today;
            } else if (value.toLowerCase() === 'week') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const weekAgo = new Date(today);
              weekAgo.setDate(weekAgo.getDate() - 7);
              matched = createdDate >= weekAgo;
            } else if (value.toLowerCase() === 'month') {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const monthAgo = new Date(today);
              monthAgo.setMonth(monthAgo.getMonth() - 1);
              matched = createdDate >= monthAgo;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              // Specific date in YYYY-MM-DD format
              const specificDate = new Date(value);
              specificDate.setHours(0, 0, 0, 0);
              const nextDay = new Date(specificDate);
              nextDay.setDate(nextDay.getDate() + 1);
              matched = createdDate >= specificDate && createdDate < nextDay;
            }
            if (matched) break;
          }
          if (!matched) return false;
          break;
      }
    }
    
    // If it passed all filters, include it
    return true;
  });
}