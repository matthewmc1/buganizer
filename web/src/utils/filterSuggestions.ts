// src/utils/filterSuggestions.ts

// Available filter keys with descriptions
export const FILTER_KEYS = [
    { key: 'is', description: 'Status shortcuts (open, closed, assigned, etc.)' },
    { key: 'status', description: 'Issue status (NEW, IN_PROGRESS, FIXED, etc.)' },
    { key: 'priority', description: 'Issue priority (P0, P1, P2, etc.)' },
    { key: 'severity', description: 'Issue severity (S0, S1, S2, etc.)' },
    { key: 'assignee', description: 'Assigned user (me, user-1, etc.)' },
    { key: 'due', description: 'Due date (today, tomorrow, week, overdue)' },
    { key: 'label', description: 'Issue labels' },
    { key: 'component', description: 'Component ID' },
    { key: 'id', description: 'Issue ID' },
  ];
  
  // Common values for each filter key
  export const FILTER_VALUES: Record<string, { value: string, description: string }[]> = {
    'is': [
      { value: 'open', description: 'Not closed issues' },
      { value: 'closed', description: 'Closed issues' },
      { value: 'assigned', description: 'Issues with assignee' },
      { value: 'unassigned', description: 'Issues without assignee' },
      { value: 'fixed', description: 'Fixed issues' },
      { value: 'verified', description: 'Verified issues' },
    ],
    'status': [
      { value: 'NEW', description: 'Newly created' },
      { value: 'ASSIGNED', description: 'Assigned but not started' },
      { value: 'IN_PROGRESS', description: 'Currently being worked on' },
      { value: 'FIXED', description: 'Fix implemented' },
      { value: 'VERIFIED', description: 'Fix verified' },
      { value: 'CLOSED', description: 'Issue closed' },
      { value: 'DUPLICATE', description: 'Marked as duplicate' },
      { value: 'WONT_FIX', description: 'Won\'t be fixed' },
    ],
    'priority': [
      { value: 'P0', description: 'Critical' },
      { value: 'P1', description: 'High' },
      { value: 'P2', description: 'Medium' },
      { value: 'P3', description: 'Low' },
      { value: 'P4', description: 'Trivial' },
    ],
    'severity': [
      { value: 'S0', description: 'Critical' },
      { value: 'S1', description: 'Major' },
      { value: 'S2', description: 'Moderate' },
      { value: 'S3', description: 'Minor' },
    ],
    'assignee': [
      { value: 'me', description: 'Assigned to me' },
      { value: 'user-1', description: 'Admin User' },
      { value: 'user-2', description: 'Developer User' },
      { value: 'user-3', description: 'Manager User' },
    ],
    'due': [
      { value: 'today', description: 'Due today' },
      { value: 'tomorrow', description: 'Due tomorrow' },
      { value: 'week', description: 'Due within a week' },
      { value: 'overdue', description: 'Overdue issues' },
    ],
    'label': [
      { value: 'bug', description: 'Bug issues' },
      { value: 'feature', description: 'Feature requests' },
      { value: 'documentation', description: 'Documentation issues' },
      { value: 'enhancement', description: 'Enhancement issues' },
      { value: 'critical', description: 'Critical issues' },
    ],
    'component': [
      { value: 'comp-1', description: 'Component 1' },
      { value: 'comp-2', description: 'Component 2' },
      { value: 'comp-3', description: 'Component 3' },
      { value: 'comp-4', description: 'Component 4' },
      { value: 'comp-5', description: 'Component 5' },
    ],
  };
  
  /**
   * Get suggestions based on the current input
   */
  export function getSuggestions(input: string): { type: 'key' | 'value', text: string, description: string }[] {
    // If input is empty or just spaces, suggest keys
    if (!input.trim()) {
      return FILTER_KEYS.map(k => ({
        type: 'key' as const,
        text: k.key,
        description: k.description,
      }));
    }
    
    // Check if we're typing a key or value
    const colonPosition = input.indexOf(':');
    
    // If no colon, we're typing a key
    if (colonPosition === -1) {
      const inputLower = input.toLowerCase();
      return FILTER_KEYS
        .filter(k => k.key.toLowerCase().includes(inputLower))
        .map(k => ({
          type: 'key' as const,
          text: k.key,
          description: k.description,
        }));
    }
    
    // We're typing a value
    const key = input.substring(0, colonPosition).trim();
    const valuePrefix = input.substring(colonPosition + 1).trim().toLowerCase();
    
    // If key is not recognized, return empty array
    if (!FILTER_VALUES[key]) return [];
    
    // Filter values by the entered prefix
    return FILTER_VALUES[key]
      .filter(v => v.value.toLowerCase().includes(valuePrefix))
      .map(v => ({
        type: 'value' as const,
        text: v.value,
        description: v.description,
      }));
  }