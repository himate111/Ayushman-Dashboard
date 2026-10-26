import React, { useMemo, useState } from 'react';
import { 
  Box, 
  Paper, 
  Button, 
  Checkbox, 
  Typography, 
  Autocomplete, 
  TextField,
  Chip
} from '@mui/material';

/**
 * Shared reusable searchable multi-select filter component.
 * Prevents accidental selections on hover, scroll, or open/close.
 * Maintains compact 38px height matching all dashboard filter controls.
 * Strictly suppresses chips inside the input box to keep layout clean.
 */
export default function FilterMultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  singularLabel = 'Item',
  pluralLabel = 'Items',
  allCount: customAllCount,
  getOptionLabel: customGetOptionLabel,
  getOptionValue: customGetOptionValue,
  getOptionSecondary,
  minWidth = 260,
  placement = 'bottom-start',
  searchPlaceholder
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const getOptionLabel = useMemo(() => {
    if (customGetOptionLabel) return customGetOptionLabel;
    return (opt) => {
      if (!opt) return '';
      if (typeof opt === 'string') return opt;
      return opt.label || opt.name || String(opt);
    };
  }, [customGetOptionLabel]);

  const getOptionValue = useMemo(() => {
    if (customGetOptionValue) return customGetOptionValue;
    return (opt) => {
      if (!opt) return '';
      if (typeof opt === 'string') return opt;
      return opt.value !== undefined ? opt.value : (opt.name || String(opt));
    };
  }, [customGetOptionValue]);

  // Extract selected array of string keys
  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) {
      return value.filter((v) => v !== 'All' && v !== '');
    }
    if (value && value !== 'All') {
      return [value];
    }
    return [];
  }, [value]);

  const allCount = customAllCount !== undefined ? customAllCount : options.length;

  const isActive = selectedValues.length > 0 && 
    (allCount === 0 || selectedValues.length < allCount);

  // Map of values for fast lookup
  const optionValueMap = useMemo(() => {
    const map = new Map();
    options.forEach(opt => {
      const val = getOptionValue(opt);
      map.set(val, opt);
    });
    return map;
  }, [options, getOptionValue]);

  // Selected option objects for Autocomplete value prop
  const selectedOptions = useMemo(() => {
    return selectedValues.map(v => optionValueMap.get(v) || v);
  }, [selectedValues, optionValueMap]);

  // Compact placeholder text
  const displayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return `All ${pluralLabel} (${allCount})`;
    }
    if (selectedValues.length === 1) {
      const opt = optionValueMap.get(selectedValues[0]);
      return opt ? getOptionLabel(opt) : selectedValues[0];
    }
    if (selectedValues.length === allCount && allCount > 0) {
      return `All ${pluralLabel} (${allCount})`;
    }
    return `${selectedValues.length} ${pluralLabel} Selected`;
  }, [selectedValues, allCount, pluralLabel, optionValueMap, getOptionLabel]);

  // Custom sticky header Paper component
  const CustomPaper = useMemo(() => {
    return React.forwardRef((paperProps, ref) => (
      <Paper 
        ref={ref} 
        {...paperProps} 
        sx={{ 
          ...paperProps.sx, 
          width: '100%',
          minWidth: '100%', 
          maxWidth: 'calc(100vw - 32px)',
          boxSizing: 'border-box',
          bgcolor: '#FFFFFF', 
          borderRadius: '8px', 
          overflow: 'hidden', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', 
          border: '1px solid #E2E8F0' 
        }}
      >
        <Box 
          onMouseDown={(e) => e.preventDefault()}
          sx={{ 
            p: '6px 10px', 
            borderBottom: '1px solid #E2E8F0', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#F8FAFC'
          }}
        >
          <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
            {selectedValues.length === 0 
              ? `All ${pluralLabel}` 
              : selectedValues.length === allCount
              ? `All ${pluralLabel} Selected`
              : `${selectedValues.length} of ${allCount} Selected`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button 
              size="small" 
              onClick={() => {
                const allVals = options.map(getOptionValue);
                onChange(allVals);
              }}
              sx={{ 
                fontSize: '11px', 
                py: 0.2, 
                px: 0.8, 
                minWidth: 0, 
                textTransform: 'none', 
                fontWeight: 600, 
                color: '#0D3B66', 
                '&:hover': { bgcolor: '#E0F2FE' } 
              }}
            >
              Select All
            </Button>
            <Button 
              size="small" 
              onClick={() => onChange([])}
              sx={{ 
                fontSize: '11px', 
                py: 0.2, 
                px: 0.8, 
                minWidth: 0, 
                textTransform: 'none', 
                fontWeight: 600, 
                color: '#EF4444', 
                '&:hover': { bgcolor: '#FEF2F2' } 
              }}
            >
              Clear All
            </Button>
          </Box>
        </Box>
        {paperProps.children}
      </Paper>
    ));
  }, [minWidth, selectedValues.length, allCount, pluralLabel, options, getOptionValue, onChange]);

  // Custom filter logic matching label and secondary text
  const filterOptions = (opts, state) => {
    const q = (state.inputValue || '').trim().toLowerCase();
    if (!q) return opts;
    return opts.filter(opt => {
      const lbl = getOptionLabel(opt).toLowerCase();
      if (lbl.includes(q)) return true;
      if (getOptionSecondary) {
        const sec = String(getOptionSecondary(opt) || '').toLowerCase();
        if (sec.includes(q)) return true;
      }
      return false;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {label && (
        <Typography 
          sx={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: '#64748B', 
            mb: 0.5, 
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </Typography>
      )}
      <Autocomplete
        multiple
        size="small"
        options={options}
        disableCloseOnSelect
        value={selectedOptions}
        inputValue={searchQuery}
        filterOptions={filterOptions}
        onInputChange={(event, newInputValue, reason) => {
          if (reason === 'input') {
            setSearchQuery(newInputValue);
          } else if (reason === 'reset' || reason === 'clear') {
            setSearchQuery('');
          }
        }}
        onChange={(event, newSelected, reason) => {
          // Guard against Backspace deleting items when typing search query
          if (reason === 'removeOption' && event?.type === 'keydown') {
            return;
          }
          const newVals = newSelected.map(getOptionValue);
          onChange(newVals);
        }}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={(option, val) => {
          return getOptionValue(option) === getOptionValue(val);
        }}
        noOptionsText={`No matching ${pluralLabel.toLowerCase()}`}
        slots={{
          paper: CustomPaper,
        }}
        slotProps={{
          popper: {
            placement,
            popperOptions: {
              modifiers: [
                {
                  name: 'flip',
                  enabled: true,
                  options: {
                    fallbackPlacements: ['bottom-end', 'bottom-start', 'top-end', 'top-start'],
                    padding: 16
                  }
                },
                {
                  name: 'preventOverflow',
                  enabled: true,
                  options: {
                    mainAxis: true,
                    altAxis: true,
                    padding: 16,
                    rootBoundary: 'viewport'
                  }
                }
              ]
            },
            sx: {
              minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
              maxWidth: 'calc(100vw - 32px)',
              boxSizing: 'border-box',
              zIndex: 1400
            }
          },
          listbox: {
            sx: {
              maxHeight: 260,
              overflowY: 'auto',
              p: 0,
              '& .MuiAutocomplete-option': {
                minHeight: '32px',
                py: '3px',
                px: '8px',
                fontSize: '12px',
                '&:hover': {
                  bgcolor: '#F1F5F9',
                },
                '&[aria-selected="true"]': {
                  bgcolor: '#E0F2FE !important',
                },
                '&[aria-selected="true"]:hover': {
                  bgcolor: '#BAE6FD !important',
                }
              }
            }
          }
        }}
        renderOption={(optProps, option, { selected }) => {
          const { key, ...otherProps } = optProps;
          const optVal = getOptionValue(option);
          const optLbl = getOptionLabel(option);
          const secondary = getOptionSecondary ? getOptionSecondary(option) : null;

          return (
            <li 
              key={key || optVal}
              {...otherProps} 
              style={{ 
                ...otherProps.style,
                padding: '3px 8px', 
                fontSize: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
              }}
            >
              <Checkbox
                size="small"
                checked={selected}
                sx={{ 
                  p: '2px', 
                  mr: 0.75, 
                  color: '#CBD5E1', 
                  '&.Mui-checked': { color: '#0D3B66' } 
                }}
              />
              <Typography 
                sx={{ 
                  fontSize: '12px', 
                  color: '#1E293B', 
                  fontWeight: selected ? 600 : 400,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {optLbl}
              </Typography>
              {secondary && (
                <Chip
                  size="small"
                  label={secondary}
                  sx={{
                    ml: 0.5,
                    height: '18px',
                    fontSize: '10px',
                    fontWeight: 700,
                    bgcolor: secondary === 'L3' ? '#F3E8FF' : (secondary === 'L2' ? '#E0F2FE' : '#F1F5F9'),
                    color: secondary === 'L3' ? '#7E22CE' : (secondary === 'L2' ? '#0369A1' : '#475569'),
                    border: '1px solid',
                    borderColor: secondary === 'L3' ? '#D8B4FE' : (secondary === 'L2' ? '#BAE6FD' : '#E2E8F0'),
                    borderRadius: '4px'
                  }}
                />
              )}
            </li>
          );
        }}
        renderInput={(params) => {
          const { slotProps, InputProps, inputProps, ...otherParams } = params;
          const inputConfig = slotProps?.input || InputProps || {};
          const htmlInputConfig = slotProps?.htmlInput || inputProps || {};

          return (
            <TextField
              {...otherParams}
              size="small"
              placeholder={displayText}
              slotProps={{
                ...slotProps,
                input: {
                  ...inputConfig,
                  startAdornment: null, // Strictly suppress chips inside input box!
                },
                htmlInput: {
                  ...htmlInputConfig,
                  'aria-label': `Select ${pluralLabel}`,
                  onKeyDown: (event) => {
                    if (event.key === 'Backspace' && !searchQuery) {
                      // Prevent MUI from removing selected options when search input is empty
                      return;
                    }
                    if (htmlInputConfig.onKeyDown) {
                      htmlInputConfig.onKeyDown(event);
                    }
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '38px',
                  minHeight: '38px',
                  maxHeight: '38px',
                  fontSize: '12.5px',
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF',
                  p: '0 8px !important',
                  '& input': {
                    p: '4px 0 !important',
                    fontSize: '12.5px',
                    color: '#1E293B',
                    textOverflow: 'ellipsis',
                    '&::placeholder': {
                      color: isActive ? '#0D3B66' : '#64748B',
                      fontWeight: isActive ? 600 : 400,
                      opacity: 1,
                    }
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0D3B66',
                    borderWidth: '1.5px',
                  }
                }
              }}
            />
          );
        }}
      />
    </Box>
  );
}
