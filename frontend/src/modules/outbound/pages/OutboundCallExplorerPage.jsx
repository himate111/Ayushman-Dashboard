import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Search, Eye, PhoneCall, CheckCircle, XCircle } from 'lucide-react';
import { outboundApi } from '../services/outboundApi';

export default function OutboundCallExplorerPage() {
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await outboundApi.getCallRecords({
        page: page + 1,
        pageSize,
        search
      });
      setRecords(data?.items || []);
      setTotalCount(data?.totalCount || 0);
    } catch (err) {
      console.error('Failed to fetch outbound call records:', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', p: { xs: 1.5, sm: 2 } }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
            Outbound Call Records Explorer
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#64748B', mt: '2px' }}>
            Inspect, search, and audit individual outbound telephony attempts
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search by phone, agent, group, disposition..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#94A3B8" />
              </InputAdornment>
            )
          }}
          sx={{ width: 320, bgcolor: '#FFFFFF', borderRadius: '6px' }}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Campaign / Group</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Agent ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Talk Time</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Disposition</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '11px', color: '#475569' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#94A3B8', fontSize: '12px' }}>
                    {loading ? 'Loading records...' : 'No call records found.'}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontSize: '11.5px', color: '#64748B' }}>
                      {row.callTime ? new Date(row.callTime).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>
                      {row.calledNo || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11.5px', color: '#475569' }}>
                      {row.groupName || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11.5px', color: '#0284C7', fontWeight: 600 }}>
                      {row.agentId || '—'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11.5px', color: '#475569' }}>
                      {row.totalDuration || '0s'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11.5px', color: '#059669', fontWeight: 600 }}>
                      {row.agentDuration || '0s'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '11.5px', color: '#475569' }}>
                      {row.disposition || '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={row.isConnected ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        label={row.isConnected ? 'Connected' : 'Not Connected'}
                        size="small"
                        sx={{
                          fontSize: '10px',
                          height: '20px',
                          bgcolor: row.isConnected ? '#ECFDF5' : '#FEF2F2',
                          color: row.isConnected ? '#059669' : '#DC2626',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedRecord(row)}
                        sx={{ color: '#0284C7', '&:hover': { bgcolor: '#F0F9FF' } }}
                      >
                        <Eye size={14} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: '1px solid #E2E8F0', fontSize: '12px' }}
        />
      </Paper>

      {/* Record Detail Modal */}
      <Dialog
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '16px', color: '#0F172A' }}>
          Call Record Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: '12px' }}>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Record ID</Typography>
                <Typography sx={{ fontWeight: 600 }}>#{selectedRecord.id}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Timestamp</Typography>
                <Typography sx={{ fontWeight: 600 }}>
                  {selectedRecord.callTime ? new Date(selectedRecord.callTime).toLocaleString() : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Called Number</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRecord.calledNo || '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>DID Number</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRecord.didNo || '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Campaign / Group</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRecord.groupName || '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Agent ID</Typography>
                <Typography sx={{ fontWeight: 600, color: '#0284C7' }}>{selectedRecord.agentId || '—'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Ring Duration</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRecord.ringDuration || '0s'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Talk Duration</Typography>
                <Typography sx={{ fontWeight: 600, color: '#059669' }}>{selectedRecord.agentDuration || '0s'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Total Duration</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRecord.totalDuration || '0s'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Disposition</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRecord.disposition || '—'}</Typography>
              </Box>
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography sx={{ color: '#64748B', fontSize: '11px' }}>Sub-Disposition</Typography>
                <Typography sx={{ fontWeight: 600 }}>{selectedRecord.subDisposition || '—'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRecord(null)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
