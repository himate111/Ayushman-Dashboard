import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  Typography,
  CircularProgress,
  Button,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Tooltip
} from '@mui/material';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, ShieldCheck, Lock } from 'lucide-react';
import InboundCallStatusBadge from './InboundCallStatusBadge';

export default function InboundCallTable({
  items = [],
  totalCount = 0,
  totalPages = 1,
  page = 1,
  pageSize = 20,
  sortBy = 'call_time',
  sortOrder = 'desc',
  loading = false,
  onPageChange,
  onPageSizeChange,
  onSort,
  onInspect
}) {
  const renderSortIcon = (columnKey) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown size={13} style={{ color: '#94A3B8', marginLeft: 4 }} />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} style={{ color: '#235789', marginLeft: 4 }} />
    ) : (
      <ArrowDown size={13} style={{ color: '#235789', marginLeft: 4 }} />
    );
  };

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF'
      }}
    >
      {/* Table Header Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
            Call Detail Records (CDR)
          </Typography>
          <Chip
            label={`${totalCount.toLocaleString()} total`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.72rem',
              fontWeight: 600,
              bgcolor: '#F1F5F9',
              color: '#475569'
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Rows per page:
            </Typography>
            <FormControl size="small">
              <Select
                value={pageSize}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                sx={{
                  height: 30,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: '#F8FAFC'
                }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
            Showing {startRecord.toLocaleString()}–{endRecord.toLocaleString()} of {totalCount.toLocaleString()}
          </Typography>
        </Box>
      </Box>

      {/* Table Content */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
          <CircularProgress size={36} sx={{ color: '#235789', mb: 1.5 }} />
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            Querying call records from database...
          </Typography>
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 9, px: 2 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 1.5
            }}
          >
            <Lock size={22} color="#94A3B8" />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
            No Call Records Found
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 440, mx: 'auto', fontSize: '0.8rem' }}>
            No call records match the selected filter criteria or search query. Try clearing filters or refining your search parameters.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
          <Table size="small" sx={{ minWidth: 1050 }}>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell
                  onClick={() => onSort?.('id')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Call ID {renderSortIcon('id')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('call_time')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Call Arrival {renderSortIcon('call_time')}
                  </Box>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ShieldCheck size={13} color="#059669" />
                    Caller (Masked)
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('call_end')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Call End / Status {renderSortIcon('call_end')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('agent_id')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Agent {renderSortIcon('agent_id')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('total_duration')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Total Time {renderSortIcon('total_duration')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('queue_duration')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Queue Wait {renderSortIcon('queue_duration')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('agent_duration')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Talk Time {renderSortIcon('agent_duration')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('group_name')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Skill Group {renderSortIcon('group_name')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('sub_disposition')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Inquiry Reason {renderSortIcon('sub_disposition')}
                  </Box>
                </TableCell>

                <TableCell
                  onClick={() => onSort?.('shift')}
                  sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Shift {renderSortIcon('shift')}
                  </Box>
                </TableCell>

                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textAlign: 'center' }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => onInspect?.(row.id)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease',
                    '&:hover': { bgcolor: '#F8FAFC' }
                  }}
                >
                  {/* Call ID */}
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.76rem', color: '#235789' }}>
                    #{row.id}
                  </TableCell>

                  {/* Arrival Time */}
                  <TableCell sx={{ fontSize: '0.75rem', color: '#334155', whiteSpace: 'nowrap' }}>
                    {row.formattedCallTime || row.callTime || '-'}
                  </TableCell>

                  {/* Caller (Masked) */}
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                    <Tooltip title="Caller phone number masked for privacy protection" arrow>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: '#F1F5F9', px: 0.8, py: 0.2, borderRadius: '4px' }}>
                        <Lock size={11} color="#64748B" />
                        <span>{row.maskedCallerNo || row.calledNo || '-'}</span>
                      </Box>
                    </Tooltip>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <InboundCallStatusBadge callEnd={row.callEnd} isConnected={row.isConnected} />
                  </TableCell>

                  {/* Agent */}
                  <TableCell sx={{ fontSize: '0.75rem', color: '#334155', fontWeight: row.agentId && row.agentId !== '-' ? 600 : 400 }}>
                    {row.agentId || '-'}
                  </TableCell>

                  {/* Total Duration */}
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                    {row.totalDuration || '00:00:00'}
                  </TableCell>

                  {/* Queue Wait */}
                  <TableCell sx={{ fontSize: '0.75rem', color: row.queueDurationSeconds > 30 ? '#D97706' : '#64748B', fontWeight: row.queueDurationSeconds > 30 ? 600 : 400 }}>
                    {row.queueDuration || '00:00:00'}
                  </TableCell>

                  {/* Talk Time */}
                  <TableCell sx={{ fontSize: '0.75rem', color: row.agentDurationSeconds > 0 ? '#059669' : '#94A3B8', fontWeight: row.agentDurationSeconds > 0 ? 600 : 400 }}>
                    {row.agentDuration || '00:00:00'}
                  </TableCell>

                  {/* Skill Group */}
                  <TableCell sx={{ fontSize: '0.74rem', color: '#475569', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.groupName || '-'}
                  </TableCell>

                  {/* Inquiry Reason (Sub-Disposition) */}
                  <TableCell sx={{ fontSize: '0.74rem', color: '#334155', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Tooltip title={row.subDisposition || '-'} arrow>
                      <span>{row.subDisposition || '-'}</span>
                    </Tooltip>
                  </TableCell>

                  {/* Shift */}
                  <TableCell sx={{ fontSize: '0.72rem', color: '#64748B' }}>
                    <Chip
                      label={row.shift || '-'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.68rem',
                        bgcolor: row.shift === 'Shift 1' ? '#EFF6FF' : row.shift === 'Shift 2' ? '#FEF3C7' : '#F1F5F9',
                        color: row.shift === 'Shift 1' ? '#1D4ED8' : row.shift === 'Shift 2' ? '#B45309' : '#475569',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>

                  {/* Inspect Action */}
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Eye size={13} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspect?.(row.id);
                      }}
                      sx={{
                        fontSize: '0.72rem',
                        py: 0.3,
                        px: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: '#CBD5E1',
                        color: '#235789',
                        '&:hover': {
                          borderColor: '#235789',
                          bgcolor: '#F0F7FF'
                        }
                      }}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Pagination Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          mt: 2.5
        }}
      >
        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
          Page {page.toLocaleString()} of {totalPages.toLocaleString()}
        </Typography>

        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, p) => onPageChange?.(p)}
          color="primary"
          shape="rounded"
          size="medium"
          showFirstButton
          showLastButton
          sx={{
            '& .Mui-selected': {
              bgcolor: '#235789 !important',
              color: '#FFFFFF'
            }
          }}
        />
      </Box>
    </Paper>
  );
}
