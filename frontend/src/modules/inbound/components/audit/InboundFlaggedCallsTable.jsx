import React, { useState } from 'react';
import {
  Paper,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  FileSearch,
  Filter,
  CheckCircle2,
  Lock
} from 'lucide-react';
import InboundCallStatusBadge from '../explorer/InboundCallStatusBadge';
import InboundCallDetailDrawer from '../explorer/InboundCallDetailDrawer';

const RULE_TABS = [
  { id: 'all', label: 'All Flagged Records' },
  { id: 'confirmed', label: 'Confirmed Issues' },
  { id: 'missing_disp', label: 'Missing Outcome (Disp)' },
  { id: 'missing_sub_disp', label: 'Missing Reason (Sub-Disp)' },
  { id: 'unexpected_agent', label: 'Unexpected Missing Agent' },
  { id: 'mismatch', label: 'Status/Talk Mismatches' },
  { id: 'review', label: 'Review Anomalies' }
];

const RULE_DESCRIPTIONS = {
  R1: 'R1: Handled call without recorded disposition (call_end=Agent AND disposition IS NULL)',
  R2: 'R2: Handled call without recorded sub-disposition (call_end=Agent AND sub_disposition IS NULL)',
  R3: 'R3: Handled call without assigned agent name (call_end=Agent AND agent IS NULL)',
  R4: 'R4: Agent connection with short talk time (call_end=Agent AND talk_time < 3s)',
  R5: 'R5: Queue termination with recorded talk time (call_end=Queue AND talk_time >= 3s)',
  O1: 'O1: Unassigned Queue Drop (Expected telephony behavior)'
};

export default function InboundFlaggedCallsTable({
  flaggedHook
}) {
  const {
    auditRule,
    setAuditRule,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    sortOrder,
    handleSort,
    search,
    handleSearchChange,
    data,
    loading,
    error,
    inspectRecord,
    drawerOpen,
    setDrawerOpen,
    selectedRecord,
    drawerLoading,
    drawerError
  } = flaggedHook;

  const [searchInput, setSearchInput] = useState('');

  const onSearch = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    handleSearchChange(val);
  };

  const getSeverityChip = (severity) => {
    if (severity === 'critical') {
      return (
        <Chip
          label="Critical"
          size="small"
          sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.68rem', border: '1px solid #FECACA', height: 20 }}
        />
      );
    }
    if (severity === 'warning' || severity === 'review') {
      return (
        <Chip
          label="Review"
          size="small"
          sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 700, fontSize: '0.68rem', border: '1px solid #FDE68A', height: 20 }}
        />
      );
    }
    return (
      <Chip
        label="Info"
        size="small"
        sx={{ bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700, fontSize: '0.68rem', border: '1px solid #DBEAFE', height: 20 }}
      />
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 2.5,
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      {/* Section Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #FECACA'
            }}
          >
            <ShieldAlert size={18} color="#DC2626" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 800, color: '#0D3B66' }}>
              Flagged Call Records Explorer
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
              Server-side paginated audit logs for calls triggered by completeness rules and operational anomalies
            </Typography>
          </Box>
        </Box>

        <Chip
          label={`${(data?.totalCount || 0).toLocaleString()} Matching Flagged Calls`}
          size="small"
          sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #FECACA' }}
        />
      </Box>

      {/* Audit Rule Filter Tabs */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
        {RULE_TABS.map((tab) => {
          const isActive = auditRule === tab.id;
          return (
            <Button
              key={tab.id}
              size="small"
              onClick={() => {
                setAuditRule(tab.id);
                setPage(1);
              }}
              sx={{
                borderRadius: '20px',
                px: 1.5,
                py: 0.35,
                fontSize: '0.74rem',
                fontWeight: isActive ? 700 : 500,
                textTransform: 'none',
                bgcolor: isActive ? '#0D3B66' : '#F8FAFC',
                color: isActive ? '#FFFFFF' : '#475569',
                border: '1px solid',
                borderColor: isActive ? '#0D3B66' : '#E2E8F0',
                '&:hover': {
                  bgcolor: isActive ? '#0A2D4E' : '#F1F5F9',
                  borderColor: isActive ? '#0A2D4E' : '#CBD5E1'
                }
              }}
            >
              {tab.label}
            </Button>
          );
        })}
      </Box>

      {/* Search & Actions Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by agent, phone, or skill group..."
          value={searchInput}
          onChange={onSearch}
          sx={{
            minWidth: 260,
            maxWidth: 380,
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              fontSize: '0.8rem',
              bgcolor: '#F8FAFC'
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#94A3B8" />
                </InputAdornment>
              )
            }
          }}
        />

        {/* Page Size Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Rows per page:</Typography>
          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              sx={{ height: 32, fontSize: '0.78rem', borderRadius: '6px', bgcolor: '#F8FAFC' }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Flagged Calls Table */}
      <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflowX: 'auto', minHeight: 280, position: 'relative' }}>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'rgba(255, 255, 255, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2
            }}
          >
            <CircularProgress size={32} sx={{ color: '#0D3B66' }} />
          </Box>
        )}

        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Call ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Masked Caller</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Agent / Group</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Termination Point</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Talk Time</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Queue Wait</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Triggered Rules</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Severity</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.75rem', py: 1.1 }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(!data?.items || data.items.length === 0) && !loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                    No flagged records match the selected audit criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              (data?.items || []).map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    '&:hover': { bgcolor: '#F8FAFC' },
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {/* Call ID */}
                  <TableCell sx={{ py: 1, fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: '#0D3B66' }}>
                    #{row.id}
                  </TableCell>

                  {/* Timestamp */}
                  <TableCell sx={{ py: 1, fontSize: '0.75rem', color: '#334155', whiteSpace: 'nowrap' }}>
                    {row.callTime ? new Date(row.callTime).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }) : '—'}
                  </TableCell>

                  {/* Caller Phone (Masked) */}
                  <TableCell sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Lock size={11} color="#64748B" />
                      <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#334155' }}>
                        {row.maskedCallerNo || row.calledNo || '—'}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Agent & Group */}
                  <TableCell sx={{ py: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: (row.agentId && row.agentId !== '-') ? '#0D3B66' : '#DC2626' }}>
                      {row.agentId && row.agentId !== '-' ? row.agentId : '— Unassigned Agent —'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>
                      {row.groupName || 'No Group'}
                    </Typography>
                  </TableCell>

                  {/* Termination Point */}
                  <TableCell sx={{ py: 1 }}>
                    <InboundCallStatusBadge callEnd={row.callEnd} isConnected={row.isConnected} />
                  </TableCell>

                  {/* Talk Time */}
                  <TableCell align="right" sx={{ py: 1, fontSize: '0.78rem', color: '#334155', fontFamily: 'monospace' }}>
                    {row.agentDuration || (row.agentDurationSeconds ? `${Math.floor(row.agentDurationSeconds / 60)}m ${row.agentDurationSeconds % 60}s` : '0s')}
                  </TableCell>

                  {/* Queue Wait */}
                  <TableCell align="right" sx={{ py: 1, fontSize: '0.78rem', color: '#334155', fontFamily: 'monospace' }}>
                    {row.queueDuration || (row.queueDurationSeconds ? `${Math.floor(row.queueDurationSeconds / 60)}m ${row.queueDurationSeconds % 60}s` : '0s')}
                  </TableCell>

                  {/* Triggered Rules */}
                  <TableCell sx={{ py: 1 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(row.triggeredRules || []).map((rule) => (
                        <Tooltip key={rule} title={RULE_DESCRIPTIONS[rule] || rule} arrow placement="top">
                          <Chip
                            label={rule}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: rule.startsWith('R') ? '#FEF2F2' : '#EFF6FF',
                              color: rule.startsWith('R') ? '#DC2626' : '#2563EB',
                              border: '1px solid',
                              borderColor: rule.startsWith('R') ? '#FECACA' : '#DBEAFE',
                              cursor: 'pointer'
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </TableCell>

                  {/* Severity */}
                  <TableCell sx={{ py: 1 }}>
                    {getSeverityChip(row.auditSeverity)}
                  </TableCell>

                  {/* Action: Inspect */}
                  <TableCell align="center" sx={{ py: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => inspectRecord(row)}
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        py: 0.25,
                        px: 1,
                        borderRadius: '6px',
                        color: '#0D3B66',
                        borderColor: '#CBD5E1',
                        minWidth: 0,
                        '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' }
                      }}
                      startIcon={<Eye size={12} />}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>
          Showing <strong>{data?.items?.length ? ((page - 1) * pageSize + 1).toLocaleString() : 0}</strong> to{' '}
          <strong>{Math.min(page * pageSize, data?.totalCount || 0).toLocaleString()}</strong> of{' '}
          <strong>{(data?.totalCount || 0).toLocaleString()}</strong> flagged calls
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            disabled={page <= 1 || loading}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            sx={{ textTransform: 'none', fontSize: '0.74rem', minWidth: 32, px: 1, borderColor: '#CBD5E1' }}
            startIcon={<ChevronLeft size={14} />}
          >
            Prev
          </Button>

          <Typography sx={{ fontSize: '0.75rem', color: '#0D3B66', fontWeight: 600, px: 1 }}>
            Page {page} of {Math.max(1, data?.totalPages || 1)}
          </Typography>

          <Button
            size="small"
            variant="outlined"
            disabled={!data?.hasNext || loading}
            onClick={() => setPage(prev => prev + 1)}
            sx={{ textTransform: 'none', fontSize: '0.74rem', minWidth: 32, px: 1, borderColor: '#CBD5E1' }}
            endIcon={<ChevronRight size={14} />}
          >
            Next
          </Button>
        </Box>
      </Box>

      {/* Detail Drawer (Reused from Phase 4B) */}
      <InboundCallDetailDrawer
        open={drawerOpen}
        call={selectedRecord}
        loading={drawerLoading}
        error={drawerError}
        onClose={() => setDrawerOpen(false)}
      />
    </Paper>
  );
}
