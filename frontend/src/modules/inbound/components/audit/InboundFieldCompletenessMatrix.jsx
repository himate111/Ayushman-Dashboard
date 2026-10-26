import React from 'react';
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
  LinearProgress,
  Chip,
  Tooltip
} from '@mui/material';
import { FileCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function InboundFieldCompletenessMatrix({ items = [], loading = false }) {
  const getProgressColor = (pct) => {
    if (pct >= 95) return '#10B981'; // Green
    if (pct >= 70) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getProgressBg = (pct) => {
    if (pct >= 95) return '#ECFDF5';
    if (pct >= 70) return '#FFFBEB';
    return '#FEF2F2';
  };

  const getStatusIcon = (pct) => {
    if (pct >= 95) return <CheckCircle2 size={16} color="#10B981" />;
    if (pct >= 70) return <AlertTriangle size={16} color="#F59E0B" />;
    return <XCircle size={16} color="#EF4444" />;
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #DBEAFE'
            }}
          >
            <FileCheck size={18} color="#2563EB" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 800, color: '#0D3B66' }}>
              Field Completeness Matrix
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
              Column-level population rate, nullability validation, and telephony zero-duration handling
            </Typography>
          </Box>
        </Box>

        <Chip
          label="10 Schema Fields Audited"
          size="small"
          sx={{ bgcolor: '#F8FAFC', color: '#475569', fontWeight: 600, fontSize: '0.72rem', border: '1px solid #E2E8F0' }}
        />
      </Box>

      {/* Table */}
      <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Field Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Category / Context</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Evaluated</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Complete</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Missing</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2, minWidth: 160 }}>Completeness %</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Treatment of Zero Duration</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Audit Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => {
              const pct = row.completenessPercentage;
              const color = getProgressColor(pct);
              return (
                <TableRow
                  key={row.fieldName}
                  sx={{
                    '&:hover': { bgcolor: '#F8FAFC' },
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <TableCell sx={{ py: 1.1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(pct)}
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0D3B66' }}>
                          {row.displayName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
                          {row.fieldName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <Chip
                      label={row.category}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: row.category === 'Duration' ? '#F0FDF4' : row.category === 'Metadata' ? '#F5F3FF' : '#F8FAFC',
                        color: row.category === 'Duration' ? '#166534' : row.category === 'Metadata' ? '#6B21A8' : '#334155',
                        border: '1px solid #E2E8F0',
                        height: 20
                      }}
                    />
                  </TableCell>

                  <TableCell align="right" sx={{ py: 1.1, fontSize: '0.8rem', color: '#334155' }}>
                    {row.totalRecords.toLocaleString()}
                  </TableCell>

                  <TableCell align="right" sx={{ py: 1.1, fontSize: '0.8rem', fontWeight: 600, color: '#059669' }}>
                    {row.completeRecords.toLocaleString()}
                  </TableCell>

                  <TableCell align="right" sx={{ py: 1.1, fontSize: '0.8rem', fontWeight: row.missingRecords > 0 ? 700 : 400, color: row.missingRecords > 0 ? '#DC2626' : '#94A3B8' }}>
                    {row.missingRecords.toLocaleString()}
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: '100%', minWidth: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: getProgressBg(pct),
                            '& .MuiLinearProgress-bar': { bgcolor: color }
                          }}
                        />
                      </Box>
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color, minWidth: 42, textAlign: 'right' }}>
                        {pct.toFixed(2)}%
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <Typography sx={{ fontSize: '0.75rem', color: '#475569', fontStyle: row.treatmentOfZero.includes('Valid') ? 'italic' : 'normal' }}>
                      {row.treatmentOfZero}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ py: 1.1 }}>
                    <Tooltip title={row.notes} arrow placement="left">
                      <Typography
                        sx={{
                          fontSize: '0.74rem',
                          color: '#64748B',
                          maxWidth: 180,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'default'
                        }}
                      >
                        {row.notes}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Governance & Privacy Notice */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, p: 1, bgcolor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
        <Info size={15} color="#0284C7" />
        <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.73rem' }}>
          <strong>Telephony Integrity Notice:</strong> Zero seconds in Duration fields (e.g., <code>queue_time = 0</code> for instant connects or <code>talk_time = 0</code> for abandoned calls) are legitimate operational states and not treated as missing values. Caller phone numbers are masked server-side (<code>99******55</code>) prior to transmission.
        </Typography>
      </Box>
    </Paper>
  );
}
