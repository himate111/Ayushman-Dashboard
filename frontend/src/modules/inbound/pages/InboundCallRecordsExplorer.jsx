import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  PhoneCall,
  PhoneOff,
  Clock,
  Voicemail,
  ShieldAlert
} from 'lucide-react';
import { useInboundCallRecords } from '../hooks/useInboundCallRecords';
import { fetchInboundFilters } from '../services/inboundApi';
import InboundFilterBar from '../components/InboundFilterBar';
import InboundCallSummaryStats from '../components/explorer/InboundCallSummaryStats';
import InboundCallTable from '../components/explorer/InboundCallTable';
import InboundCallDetailDrawer from '../components/explorer/InboundCallDetailDrawer';

export default function InboundCallRecordsExplorer({ initialFilters }) {
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    months: [],
    groups: [],
    agents: [],
    dispositions: [],
    subDispositions: [],
    shifts: []
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const {
    query,
    data,
    loading,
    error,
    selectedCallId,
    selectedCall,
    detailLoading,
    detailError,
    inspectCall,
    closeDetail,
    setPage,
    setPageSize,
    setSort,
    setSearch,
    setCallEndFilter,
    setGlobalFilters,
    resetAllFilters,
    refresh
  } = useInboundCallRecords(initialFilters);

  // Load filter options on mount
  useEffect(() => {
    let active = true;
    const loadFilters = async () => {
      try {
        const opts = await fetchInboundFilters();
        if (active && opts) {
          setFilterOptions(opts);
        }
      } catch (err) {
        console.error('Failed to load inbound filter options:', err);
      }
    };
    loadFilters();
    return () => {
      active = false;
    };
  }, []);

  // Sync search input with query search
  useEffect(() => {
    setSearchInput(query.search || '');
  }, [query.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  const handleFilterChange = (field, val) => {
    const nextFilters = {
      ...query,
      [field]: val
    };
    setGlobalFilters(nextFilters);
  };

  // Build active chips for applied filters
  const activeChips = [];
  if (query.search) {
    activeChips.push({
      key: 'search',
      label: `Search: "${query.search}"`,
      onRemove: handleClearSearch
    });
  }
  if (query.callEnd && query.callEnd !== 'All') {
    let statusLabel = query.callEnd;
    if (query.callEnd === 'Connected') statusLabel = 'Connected (≥3s)';
    else if (query.callEnd === 'EarlyEnded') statusLabel = 'Early Ended (<3s)';
    else if (query.callEnd === 'Queue') statusLabel = 'Queue Drops';
    else if (query.callEnd === 'IVR') statusLabel = 'IVR Drops';
    activeChips.push({
      key: 'callEnd',
      label: `Status: ${statusLabel}`,
      onRemove: () => setCallEndFilter('All')
    });
  }
  if (query.groupName && query.groupName.length > 0) {
    const valStr = Array.isArray(query.groupName) ? query.groupName.join(', ') : query.groupName;
    activeChips.push({
      key: 'group',
      label: `Group: ${valStr}`,
      onRemove: () => handleFilterChange('groupName', [])
    });
  }
  if (query.agent && query.agent.length > 0) {
    const valStr = Array.isArray(query.agent) ? query.agent.join(', ') : query.agent;
    activeChips.push({
      key: 'agent',
      label: `Agent: ${valStr}`,
      onRemove: () => handleFilterChange('agent', [])
    });
  }
  if (query.shift && query.shift.length > 0) {
    const valStr = Array.isArray(query.shift) ? query.shift.join(', ') : query.shift;
    activeChips.push({
      key: 'shift',
      label: `Shift: ${valStr}`,
      onRemove: () => handleFilterChange('shift', [])
    });
  }
  if (query.disposition && query.disposition.length > 0) {
    const valStr = Array.isArray(query.disposition) ? query.disposition.join(', ') : query.disposition;
    activeChips.push({
      key: 'disposition',
      label: `Disposition: ${valStr}`,
      onRemove: () => handleFilterChange('disposition', [])
    });
  }
  if (query.subDisposition && query.subDisposition.length > 0) {
    const valStr = Array.isArray(query.subDisposition) ? query.subDisposition.join(', ') : query.subDisposition;
    activeChips.push({
      key: 'subDisposition',
      label: `Inquiry Reason: ${valStr}`,
      onRemove: () => handleFilterChange('subDisposition', [])
    });
  }
  if (query.year && query.year.length > 0) {
    const valStr = Array.isArray(query.year) ? query.year.join(', ') : query.year;
    activeChips.push({
      key: 'year',
      label: `Year: ${valStr}`,
      onRemove: () => handleFilterChange('year', [])
    });
  }
  if (query.month && query.month.length > 0) {
    const valStr = Array.isArray(query.month) ? query.month.join(', ') : query.month;
    activeChips.push({
      key: 'month',
      label: `Month: ${valStr}`,
      onRemove: () => handleFilterChange('month', [])
    });
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100%' }}>
      {/* Page Title & Navigation Banner */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
            Inbound Call Records Explorer
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            Search, inspect, and analyze granular telephony call detail records (CDR) with caller privacy protection.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RotateCcw size={14} />}
            onClick={refresh}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.78rem',
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#FFFFFF',
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
            }}
          >
            Refresh
          </Button>

          <Button
            size="small"
            variant={showAdvancedFilters ? 'contained' : 'outlined'}
            startIcon={<SlidersHorizontal size={14} />}
            endIcon={showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.78rem',
              bgcolor: showAdvancedFilters ? '#235789' : '#FFFFFF',
              borderColor: showAdvancedFilters ? '#235789' : '#CBD5E1',
              color: showAdvancedFilters ? '#FFFFFF' : '#235789',
              '&:hover': {
                bgcolor: showAdvancedFilters ? '#1D456C' : '#F0F7FF',
                borderColor: '#235789'
              }
            }}
          >
            {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
          </Button>
        </Box>
      </Box>

      {/* Quick Search & Status Segment Controls */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: '12px', border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Grid container spacing={2} alignItems="center">
          {/* Free-text Search */}
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search Caller Phone (e.g. 8853065920), Agent ID (e.g. S1026), Inquiry Reason, or Call ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} color="#64748B" />
                      </InputAdornment>
                    ),
                    endAdornment: searchInput ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={handleClearSearch} edge="end">
                          <X size={15} color="#94A3B8" />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }
                }}
              />
            </form>
          </Grid>

          {/* Quick Call End Filter Chips */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mr: 0.5 }}>
                Status:
              </Typography>

              <Chip
                label="All Calls"
                size="small"
                clickable
                onClick={() => setCallEndFilter('All')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  bgcolor: !query.callEnd || query.callEnd === 'All' ? '#235789' : '#F1F5F9',
                  color: !query.callEnd || query.callEnd === 'All' ? '#FFFFFF' : '#475569'
                }}
              />

              <Chip
                icon={<PhoneCall size={12} color={query.callEnd === 'Connected' ? '#FFFFFF' : '#059669'} />}
                label="Connected (≥3s)"
                size="small"
                clickable
                onClick={() => setCallEndFilter('Connected')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  bgcolor: query.callEnd === 'Connected' ? '#059669' : '#ECFDF5',
                  color: query.callEnd === 'Connected' ? '#FFFFFF' : '#065F46',
                  border: '1px solid #A7F3D0'
                }}
              />

              <Chip
                icon={<Clock size={12} color={query.callEnd === 'EarlyEnded' ? '#FFFFFF' : '#D97706'} />}
                label="Early Ended (<3s)"
                size="small"
                clickable
                onClick={() => setCallEndFilter('EarlyEnded')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  bgcolor: query.callEnd === 'EarlyEnded' ? '#D97706' : '#FFFBEB',
                  color: query.callEnd === 'EarlyEnded' ? '#FFFFFF' : '#92400E',
                  border: '1px solid #FDE68A'
                }}
              />

              <Chip
                icon={<PhoneOff size={12} color={query.callEnd === 'Queue' ? '#FFFFFF' : '#DC2626'} />}
                label="Queue Drops"
                size="small"
                clickable
                onClick={() => setCallEndFilter('Queue')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  bgcolor: query.callEnd === 'Queue' ? '#DC2626' : '#FEF2F2',
                  color: query.callEnd === 'Queue' ? '#FFFFFF' : '#991B1B',
                  border: '1px solid #FECACA'
                }}
              />

              <Chip
                icon={<Voicemail size={12} color={query.callEnd === 'IVR' ? '#FFFFFF' : '#4F46E5'} />}
                label="IVR Drops"
                size="small"
                clickable
                onClick={() => setCallEndFilter('IVR')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  bgcolor: query.callEnd === 'IVR' ? '#4F46E5' : '#EEF2FF',
                  color: query.callEnd === 'IVR' ? '#FFFFFF' : '#3730A3',
                  border: '1px solid #C7D2FE'
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Collapsible Advanced Filters */}
        <Collapse in={showAdvancedFilters}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #F1F5F9' }}>
            <InboundFilterBar
              filters={query}
              options={filterOptions}
              onChange={handleFilterChange}
              onReset={resetAllFilters}
            />
          </Box>
        </Collapse>
      </Paper>

      {/* Active Drill-Down Filter Chips Banner */}
      {activeChips.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            mb: 2,
            bgcolor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1E40AF', mr: 0.5 }}>
              ACTIVE FILTERS:
            </Typography>
            {activeChips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                onDelete={chip.onRemove}
                size="small"
                sx={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  bgcolor: '#DBEAFE',
                  color: '#1E3A8A'
                }}
              />
            ))}
          </Box>
          <Button
            size="small"
            onClick={resetAllFilters}
            sx={{ fontSize: '0.72rem', color: '#EF4444', textTransform: 'none', fontWeight: 600 }}
          >
            Clear All Filters
          </Button>
        </Paper>
      )}

      {/* Summary KPI Ribbon */}
      <InboundCallSummaryStats data={data} loading={loading} />

      {/* Error Alert */}
      {error && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShieldAlert size={20} color="#DC2626" />
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#991B1B', fontWeight: 700 }}>
              Error loading call records
            </Typography>
            <Typography variant="body2" sx={{ color: '#7F1D1D', fontSize: '0.8rem' }}>
              {error}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Paginated CDR Data Table */}
      <InboundCallTable
        items={data.items}
        totalCount={data.totalCount}
        totalPages={data.totalPages}
        page={query.page}
        pageSize={query.pageSize}
        sortBy={query.sortBy}
        sortOrder={query.sortOrder}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSort={setSort}
        onInspect={inspectCall}
      />

      {/* Slide-out Detail Drawer */}
      <InboundCallDetailDrawer
        open={Boolean(selectedCallId)}
        call={selectedCall}
        loading={detailLoading}
        error={detailError}
        onClose={closeDetail}
      />
    </Box>
  );
}
