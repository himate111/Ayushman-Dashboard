import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  OutlinedInput, 
  Button, 
  Checkbox, 
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import { Filter, RotateCcw, AlertTriangle } from 'lucide-react';
import FilterMultiSelect from './FilterMultiSelect';

export default function FilterBar({ filters, options, onChange, onReset }) {
  // 1. District options & state
  const districtOptions = useMemo(() => options.districts || [], [options.districts]);

  const selectedDistricts = useMemo(() => {
    if (Array.isArray(filters.districts)) {
      return filters.districts.filter((d) => d !== 'All');
    }
    if (filters.district && filters.district !== 'All') {
      return [filters.district];
    }
    return [];
  }, [filters.districts, filters.district]);

  const isDistrictActive = selectedDistricts.length > 0 && 
    (districtOptions.length === 0 || selectedDistricts.length < districtOptions.length);

  // 2. Category options & state
  const categoryOptions = useMemo(() => options.categories || [], [options.categories]);

  const selectedCategories = useMemo(() => {
    if (Array.isArray(filters.categories)) {
      return filters.categories.filter((c) => c !== 'All');
    }
    if (filters.category && filters.category !== 'All') {
      return [filters.category];
    }
    return [];
  }, [filters.categories, filters.category]);

  const isCategoryActive = selectedCategories.length > 0 && 
    (categoryOptions.length === 0 || selectedCategories.length < categoryOptions.length);

  // 3. Status options & state
  const statusOptions = useMemo(() => [
    { value: 'Open', label: 'Open' },
    { value: 'WIP', label: 'WIP (In-Progress)' },
    { value: 'Closed', label: 'Closed' }
  ], []);

  const selectedStatuses = useMemo(() => {
    if (Array.isArray(filters.statuses)) {
      return filters.statuses.filter((s) => s !== 'All');
    }
    if (filters.status && filters.status !== 'All') {
      if (filters.status === 'Pending') {
        return ['Open', 'WIP'];
      }
      return [filters.status];
    }
    return [];
  }, [filters.statuses, filters.status]);

  const isStatusActive = selectedStatuses.length > 0 && 
    (statusOptions.length === 0 || selectedStatuses.length < statusOptions.length);

  // 4. Officer options & state
  const officerOptions = useMemo(() => {
    if (options.officersDetailed && options.officersDetailed.length > 0) {
      return options.officersDetailed;
    }
    return (options.officers || []).map(o => ({ name: o, level: 'L1' }));
  }, [options.officersDetailed, options.officers]);

  const selectedOfficers = useMemo(() => {
    if (Array.isArray(filters.officers)) {
      return filters.officers.filter((o) => o !== 'All');
    }
    if (filters.officer && filters.officer !== 'All') {
      return [filters.officer];
    }
    return [];
  }, [filters.officers, filters.officer]);

  const isOfficerActive = selectedOfficers.length > 0 && 
    (officerOptions.length === 0 || selectedOfficers.length < officerOptions.length);

  // Overall active filter indicator
  const hasActiveFilters = 
    isDistrictActive || 
    isCategoryActive || 
    isStatusActive || 
    isOfficerActive || 
    (filters.priority && filters.priority !== 'All') || 
    Boolean(filters.riskOnly) ||
    Boolean(filters.startDate) || 
    Boolean(filters.endDate);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 1.5, md: 1.75 }, 
        mb: 2.5, 
        border: '1px solid #E2E8F0', 
        borderRadius: '12px', 
        bgcolor: '#FFFFFF' 
      }}
    >
      {/* Header bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Filter size={16} color="#0D3B66" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0D3B66', fontSize: '0.8rem', letterSpacing: '0.04em' }}>
            GLOBAL INTELLIGENCE FILTERS
          </Typography>
          {hasActiveFilters && (
            <Chip 
              label="Filtered View Active" 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} 
            />
          )}
        </Box>

        {hasActiveFilters && (
          <Button
            size="small"
            startIcon={<RotateCcw size={13} />}
            onClick={onReset}
            sx={{ 
              color: '#EF4444', 
              fontSize: '0.76rem', 
              py: 0.1, 
              px: 1, 
              textTransform: 'none', 
              fontWeight: 600,
              '&:hover': { bgcolor: '#FEF2F2' }
            }}
          >
            Reset All Filters
          </Button>
        )}
      </Box>

      {/* 8 Filter Controls in ONE Row on Desktop */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: '1.2fr 1.3fr 1.1fr 1.15fr 1fr 1fr 1.05fr 0.85fr'
          },
          gap: 1,
          alignItems: 'flex-end'
        }}
      >
        {/* 1. District Multi-Select */}
        <FilterMultiSelect
          label="District"
          options={districtOptions}
          value={selectedDistricts}
          onChange={(vals) => onChange('districts', vals)}
          singularLabel="District"
          pluralLabel="Districts"
          allCount={districtOptions.length || 75}
          minWidth={260}
        />

        {/* 2. Category Multi-Select */}
        <FilterMultiSelect
          label="Category"
          options={categoryOptions}
          value={selectedCategories}
          onChange={(vals) => onChange('categories', vals)}
          singularLabel="Category"
          pluralLabel="Categories"
          allCount={categoryOptions.length || 6}
          minWidth={280}
        />

        {/* 3. Status Multi-Select */}
        <FilterMultiSelect
          label="Status"
          options={statusOptions}
          value={selectedStatuses}
          onChange={(vals) => onChange('statuses', vals)}
          singularLabel="Status"
          pluralLabel="Statuses"
          allCount={statusOptions.length}
          getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.label}
          getOptionValue={(opt) => typeof opt === 'string' ? opt : opt.value}
          minWidth={220}
        />

        {/* 4. Assigned Officer Multi-Select */}
        <FilterMultiSelect
          label="Officer"
          options={officerOptions}
          value={selectedOfficers}
          onChange={(vals) => onChange('officers', vals)}
          singularLabel="Officer"
          pluralLabel="Officers"
          allCount={officerOptions.length || 15}
          getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.name}
          getOptionValue={(opt) => typeof opt === 'string' ? opt : opt.name}
          getOptionSecondary={(opt) => typeof opt === 'object' ? opt.level : null}
          minWidth={280}
        />

        {/* 5. From Date */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography 
            component="label"
            htmlFor="filter-from-date"
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
            From Date
          </Typography>
          <OutlinedInput
            id="filter-from-date"
            type="date"
            size="small"
            value={filters.startDate ? filters.startDate.split('T')[0] : ''}
            onChange={(e) => onChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
            sx={{
              height: '38px',
              fontSize: '12.5px',
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              '& input': {
                py: '8px',
                px: '8px',
                fontSize: '12.5px',
                color: '#1E293B',
                cursor: 'pointer'
              },
              '& input::-webkit-calendar-picker-indicator': {
                cursor: 'pointer',
                opacity: 0.7,
                padding: '2px',
                '&:hover': {
                  opacity: 1
                }
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0D3B66',
                borderWidth: '1.5px'
              }
            }}
          />
        </Box>

        {/* 6. To Date */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography 
            component="label"
            htmlFor="filter-to-date"
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
            To Date
          </Typography>
          <OutlinedInput
            id="filter-to-date"
            type="date"
            size="small"
            value={filters.endDate ? filters.endDate.split('T')[0] : ''}
            onChange={(e) => onChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
            sx={{
              height: '38px',
              fontSize: '12.5px',
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              '& input': {
                py: '8px',
                px: '8px',
                fontSize: '12.5px',
                color: '#1E293B',
                cursor: 'pointer'
              },
              '& input::-webkit-calendar-picker-indicator': {
                cursor: 'pointer',
                opacity: 0.7,
                padding: '2px',
                '&:hover': {
                  opacity: 1
                }
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#0D3B66',
                borderWidth: '1.5px'
              }
            }}
          />
        </Box>

        {/* 7. High Risk Only */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
            Risk Filter
          </Typography>
          <Tooltip 
            title="Show Only High-Risk Cases (Treatment Denial, Money Demands, Card Refusal, Admission Refusal)" 
            arrow 
            placement="top"
          >
            <Box
              onClick={() => onChange('riskOnly', !filters.riskOnly)}
              sx={{
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                px: 0.75,
                borderRadius: '8px',
                border: `1px solid ${filters.riskOnly ? '#FCA5A5' : '#E2E8F0'}`,
                bgcolor: filters.riskOnly ? '#FEF2F2' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  borderColor: filters.riskOnly ? '#EF4444' : '#CBD5E1',
                  bgcolor: filters.riskOnly ? '#FEE2E2' : '#F8FAFC',
                },
                userSelect: 'none'
              }}
            >
              <Checkbox
                checked={!!filters.riskOnly}
                onChange={(e) => onChange('riskOnly', e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                color="error"
                size="small"
                sx={{ p: 0.2, mr: 0.3 }}
              />
              <AlertTriangle size={13} color="#EF4444" style={{ flexShrink: 0, marginRight: 4 }} />
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '11.5px',
                  color: filters.riskOnly ? '#B91C1C' : '#334155',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                High Risk Only
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        {/* 8. Reset Button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Typography 
            sx={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              color: 'transparent', 
              mb: 0.5, 
              lineHeight: 1,
              userSelect: 'none'
            }}
          >
            Reset
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            onClick={onReset}
            startIcon={<RotateCcw size={14} />}
            sx={{
              height: '38px',
              fontSize: '12.5px',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#FFFFFF',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: '#0D3B66',
                color: '#0D3B66',
                bgcolor: '#F1F5F9'
              }
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
