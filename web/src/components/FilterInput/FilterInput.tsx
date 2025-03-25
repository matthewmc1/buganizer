// src/components/FilterInput/FilterInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Popper,
  ClickAwayListener,
  useTheme,
  alpha,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { getSuggestions } from '../../utils/filterSuggestions';
import { parseFilterString } from '../../utils/filterParser';
import FilterChip from '../FilterChip/FilterChip';

interface FilterInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FilterInput: React.FC<FilterInputProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Search issues...' 
}) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<{ type: 'key' | 'value', text: string, description: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [parsedFilters, setParsedFilters] = useState<Record<string, string[]>>({});
  
  // Parse the filter value into structured filters
  useEffect(() => {
    setParsedFilters(parseFilterString(value));
  }, [value]);
  
  // Update suggestions based on input
  useEffect(() => {
    if (inputValue.trim()) {
      setSuggestions(getSuggestions(inputValue));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setActiveSuggestionIndex(-1);
  }, [inputValue]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && suggestions.length > 0) {
        // Use the selected suggestion
        applyActiveSuggestion();
      } else {
        // Apply the current input as a filter
        applyCurrentInput();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); // Prevent cursor movement
      setActiveSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); // Prevent cursor movement
      setActiveSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : prev
      );
    }
  };
  
  const applyActiveSuggestion = () => {
    const suggestion = suggestions[activeSuggestionIndex];
    if (!suggestion) return;
    
    const colonPosition = inputValue.indexOf(':');
    
    // If we're suggesting a key, append colon
    if (suggestion.type === 'key') {
      setInputValue(`${suggestion.text}:`);
    } 
    // If we're suggesting a value, replace everything after colon
    else if (suggestion.type === 'value' && colonPosition !== -1) {
      const key = inputValue.substring(0, colonPosition + 1);
      setInputValue(`${key}${suggestion.text} `);
      
      // Also apply this filter
      const newFilter = getFilterWithAddition(`${key}${suggestion.text}`);
      onChange(newFilter);
      setInputValue('');
    }
  };
  
  const applyCurrentInput = () => {
    if (!inputValue.trim()) return;
    
    // Add the current input to the filter
    const newFilter = getFilterWithAddition(inputValue);
    onChange(newFilter);
    setInputValue('');
    setShowSuggestions(false);
  };
  
  const handleSuggestionClick = (suggestion: { type: 'key' | 'value', text: string }) => {
    const colonPosition = inputValue.indexOf(':');
    
    // If we're suggesting a key, append colon
    if (suggestion.type === 'key') {
      setInputValue(`${suggestion.text}:`);
      inputRef.current?.focus();
    } 
    // If we're suggesting a value, replace everything after colon and apply
    else if (suggestion.type === 'value' && colonPosition !== -1) {
      const key = inputValue.substring(0, colonPosition + 1);
      const newFilterPart = `${key}${suggestion.text}`;
      
      // Apply this filter
      const newFilter = getFilterWithAddition(newFilterPart);
      onChange(newFilter);
      setInputValue('');
      setShowSuggestions(false);
    }
  };
  
  // Add a new filter part to the existing filter
  const getFilterWithAddition = (addition: string): string => {
    const trimmedAddition = addition.trim();
    if (!trimmedAddition) return value;
    
    return value ? `${value} ${trimmedAddition}` : trimmedAddition;
  };
  
  // Remove a filter
  const handleRemoveFilter = (key: string, valueToRemove: string) => {
    // Get current filter parts
    const currentFilters = { ...parsedFilters };
    
    // Remove the specific value from the key
    if (currentFilters[key]) {
      currentFilters[key] = currentFilters[key].filter(v => v !== valueToRemove);
      
      // If no values left for this key, remove the key
      if (currentFilters[key].length === 0) {
        delete currentFilters[key];
      }
      
      // Reconstruct the filter string
      const newFilterParts: string[] = [];
      
      for (const [k, values] of Object.entries(currentFilters)) {
        if (k === 'text') {
          // Free text search
          newFilterParts.push(values.join(' '));
        } else {
          // Key:value pairs
          values.forEach(v => {
            newFilterParts.push(`${k}:${v}`);
          });
        }
      }
      
      onChange(newFilterParts.join(' '));
    }
  };

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {/* Filter Chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {Object.entries(parsedFilters).map(([key, values]) => {
          // Skip text (free search) as we don't show chips for it
          if (key === 'text') return null;
          
          return values.map((value, index) => (
            <FilterChip 
              key={`${key}-${value}-${index}`}
              filterKey={key}
              filterValue={value}
              onDelete={() => handleRemoveFilter(key, value)}
            />
          ));
        })}
      </Box>
      
      {/* Filter Input */}
      <TextField
        inputRef={inputRef}
        fullWidth
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        onFocus={() => inputValue.trim() && setShowSuggestions(true)}
        variant="outlined"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.palette.background.paper,
          }
        }}
      />
      
      {/* Suggestions Dropdown */}
      <Popper
        open={showSuggestions && suggestions.length > 0}
        anchorEl={inputRef.current}
        placement="bottom-start"
        style={{ 
          width: inputRef.current?.offsetWidth,
          zIndex: 1300,
        }}
      >
        <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
          <Paper 
            elevation={3} 
            sx={{ 
              maxHeight: 300, 
              overflow: 'auto', 
              mt: 0.5, 
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <List dense>
              {suggestions.map((suggestion, index) => (
                <Box
                  key={`${suggestion.type}-${suggestion.text}`}
                  component="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  sx={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 16px',
                    border: 'none',
                    borderLeft: index === activeSuggestionIndex ? 
                      `3px solid ${theme.palette.primary.main}` : 
                      '3px solid transparent',
                    backgroundColor: index === activeSuggestionIndex ?
                      alpha(theme.palette.primary.main, 0.1) :
                      'transparent',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                    display: 'block',
                    cursor: 'pointer'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={500}
                      sx={{ mr: 1 }}
                    >
                      {suggestion.text}
                    </Typography>
                    {suggestion.type === 'key' && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0.5,
                        }}
                      >
                        key
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {suggestion.description}
                  </Typography>
                </Box>
              ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default FilterInput;