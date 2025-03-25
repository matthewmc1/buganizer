# Bug Tracker Filtering System Implementation Guide

This guide explains how the filtering system in your React bug tracking application works, with a focus on lexical search and key-value filtering.

## Overview

The filtering system consists of several components working together:

1. **FilterInput Component**: The UI component that accepts user input for filters
2. **FilterParser**: A utility that parses filter strings into structured data
3. **FilterSuggestions**: A utility that provides suggestions for keys and values
4. **IssueList**: The component that displays filtered issues
5. **useIssues Hook**: A hook that applies filters to fetch/filter issues

## Key Features

- **Free Text Search**: Search across issue titles, descriptions, and reproduction steps
- **Key-Value Filtering**: Filter issues using `key:value` syntax (e.g., `is:open`, `priority:P0`)
- **Filter Chips**: Visual representation of active filters with easy removal
- **Suggestions**: Auto-suggestions for filter keys and values
- **Multiple Filters**: Combine multiple filters for precise searches

## How It Works

### 1. Parsing Filters

When a user enters a filter string like `is:open priority:P0 login error`, the `parseFilterString` function breaks it down into a structured format:

```javascript
{
  "is": ["open"],
  "priority": ["P0"],
  "text": ["login", "error"]
}
```

The key-value pairs are extracted, and any free text terms are stored under the `text` key.

### 2. Applying Filters

The `applyFilters` function takes the parsed filters and applies them to the list of issues:

- For key-value filters, it checks if the issue has the matching property value
- For free text search, it checks if all search terms appear in the issue's text fields
- If an issue passes all filters, it's included in the results

### 3. Filter UI

The `FilterInput` component provides:

- A text input for entering filters
- Suggestions for keys and values as the user types
- Chips for active filters with the option to remove them
- Help information about available filters

## Available Filters

| Filter Key | Description | Example |
|------------|-------------|---------|
| `is` | Status shortcuts | `is:open`, `is:closed`, `is:assigned` |
| `status` | Issue status | `status:NEW`, `status:IN_PROGRESS` |
| `priority` | Issue priority | `priority:P0`, `priority:P1` |
| `severity` | Issue severity | `severity:S0`, `severity:S1` |
| `assignee` | Assigned user | `assignee:me`, `assignee:user-1` |
| `due` | Due date | `due:today`, `due:week`, `due:overdue` |
| `created` | Creation date | `created:today`, `created:week` |
| `label` | Issue labels | `label:bug`, `label:feature` |
| `component` | Component ID | `component:comp-1` |
| `id` | Issue ID | `id:issue-123` |
| `reporter` | Issue reporter | `reporter:user-1` |

## Special Filters

### Status Shortcuts
- `is:open` - Not closed issues (excludes CLOSED, WONT_FIX, DUPLICATE)
- `is:closed` - Closed issues (includes CLOSED, WONT_FIX, DUPLICATE)
- `is:assigned` - Issues with an assignee
- `is:unassigned` - Issues without an assignee

### Date Filters
- `due:today` - Due today
- `due:tomorrow` - Due tomorrow
- `due:week` - Due within a week
- `due:overdue` - Past due date
- `created:today` - Created today
- `created:week` - Created within the last week
- `created:month` - Created within the last month

## Implementation Details

### Enhanced Text Search

The text search has been enhanced to match all search terms, regardless of order:

```javascript
matched = values.every(term => {
  const searchTerm = term.toLowerCase();
  const issueText = `${issue.title} ${issue.description || ''} ${issue.reproduceSteps || ''}`.toLowerCase();
  return issueText.includes(searchTerm);
});
```

This means searching for "login error" will find issues containing both "login" and "error", regardless of their order or proximity.

### Filter Chips

Active filters are displayed as chips, which users can click to remove:

```jsx
<FilterChip 
  filterKey={key}
  filterValue={value}
  onDelete={() => handleRemoveFilter(key, value)}
/>
```

The `handleRemoveFilter` function removes the specific filter value from the filter string.

### Suggestions

As users type, the `getSuggestions` function provides relevant suggestions based on the input:

- If typing a key (before a colon), it suggests matching filter keys
- If typing a value (after a colon), it suggests matching values for that key

## Examples

### Simple Search
- `login error` - Find issues containing both "login" and "error"

### Key-Value Filtering
- `priority:P0` - Find critical priority issues
- `is:open severity:S0` - Find open issues with critical severity

### Combined Search
- `is:open priority:P0 login` - Find open P0 issues containing "login"
- `assignee:me due:week` - Find issues assigned to you that are due this week

## Integration with IssueList

The `IssueList` component uses the `useIssues` hook to fetch and filter issues based on the current filter string. It passes the filter to the `fetchIssues` function, which applies the filters to the issues.

## Best Practices

1. **Keep Filters Simple**: Start with a basic filter and add more terms as needed
2. **Use Suggestions**: Use the suggestion dropdown to discover available filters
3. **Check Filter Chips**: Verify active filters by checking the filter chips
4. **Combine Filters**: Combine multiple filters for precise searches
5. **Use Free Text**: Add free text terms for lexical search across all fields

## Troubleshooting

- **No Results**: Check for typos in filter keys or values
- **Too Many Results**: Add more specific filters to narrow down the search
- **Wrong Results**: Verify active filters by checking the filter chips

## Extending the Filtering System

To add new filter types:

1. Add the new filter key to `FILTER_KEYS` in `filterSuggestions.ts`
2. Add corresponding values to `FILTER_VALUES` in `filterSuggestions.ts`
3. Add a new case to the switch statement in `applyFilters` in `filterParser.ts`

For example, to add a new filter for issue creation date:

```javascript
case 'created':
  // Handle creation date filters
  const createdDate = new Date(issue.createdAt);
  for (const value of values) {
    if (value.toLowerCase() === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      matched = createdDate >= today && createdDate < tomorrow;
    }
    // Add more date options...
    if (matched) break;
  }
  if (!matched) return false;
  break;
```

## Live Examples

### Simple Filter
```
priority:P0
```
This will show only P0 (critical) issues.

### Combined Filter
```
is:open assignee:me due:week
```
This will show open issues assigned to you that are due within a week.

### Complex Filter
```
is:open priority:P0 status:IN_PROGRESS database connection
```
This will show open P0 issues in progress that contain both "database" and "connection".

By implementing these enhancements, your bug tracking application will have a powerful and flexible filtering system that allows users to quickly find the issues they need.