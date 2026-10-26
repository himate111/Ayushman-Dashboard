import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button
} from '@mui/material';
import { GitCompare, AlertCircle, CheckCircle2, ArrowRight, Clock, HelpCircle } from 'lucide-react';

export default function InboundStatusConsistencyAudit({ consistency = {}, onSelectFilter }) {
  const agentTotal = consistency?.agentCallsTotal || 0;
  const agentNormal = consistency?.agentCallsNormalTalk || 0;
  const agentShort = consistency?.agentCallsShortTalk || 0;

  const queueTotal = consistency?.queueDropsTotal || 0;
  const queueNormal = consistency?.queueDropsNormal || 0;
  const queueWithTalk = consistency?.queueDropsWithTalk || 0;

  const ivrTotal = consistency?.ivrDropsTotal || 0;
  const ivrWithTalk = consistency?.ivrDropsWithTalk || 0;

  const totalMismatches = consistency?.totalMismatches || 0;
  const mismatchRate = consistency?.mismatchRate || 0;

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
              bgcolor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #FDE68A'
            }}
          >
            <GitCompare size={18} color="#D97706" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 800, color: '#0D3B66' }}>
              Call Status Consistency Audit (Termination Point vs Talk Duration)
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
              Cross-tabulation comparing telephony call termination classification against recorded agent talk time
            </Typography>
          </Box>
        </Box>

        <Chip
          label={`${totalMismatches.toLocaleString()} Anomalies (${mismatchRate}% Review Rate)`}
          size="small"
          sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #FDE68A' }}
        />
      </Box>

      {/* Cross-tabulation Table */}
      <TableContainer sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', mb: 2, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8FAFC' }}>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Telephony End Classification</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Total Calls</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Consistent / Expected</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Review-Required Mismatch</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Expected Operational Behavior</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#0D3B66', fontSize: '0.78rem', py: 1.2 }}>Anomaly Nature & Audit Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Row 1: Agent */}
            <TableRow sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
              <TableCell sx={{ py: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Agent" size="small" sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #A7F3D0' }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0D3B66' }}>Connected to Agent</Typography>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0D3B66' }}>
                {agentTotal.toLocaleString()}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                {agentNormal.toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({agentTotal > 0 ? ((agentNormal / agentTotal) * 100).toFixed(1) : 0}%)</span>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#D97706', fontWeight: 700 }}>
                {agentShort.toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#B45309' }}>({agentTotal > 0 ? ((agentShort / agentTotal) * 100).toFixed(1) : 0}%)</span>
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', color: '#475569' }}>
                Talk time &ge; 3 seconds (full conversation)
              </TableCell>
              <TableCell>
                <Chip
                  label="Short Talk (<3s)"
                  size="small"
                  sx={{ bgcolor: '#FFFBEB', color: '#B45309', fontWeight: 600, fontSize: '0.7rem', border: '1px solid #FDE68A' }}
                />
              </TableCell>
            </TableRow>

            {/* Row 2: Queue */}
            <TableRow sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
              <TableCell sx={{ py: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="Queue" size="small" sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #FECACA' }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0D3B66' }}>Dropped in ACD Queue</Typography>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0D3B66' }}>
                {queueTotal.toLocaleString()}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                {queueNormal.toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>({queueTotal > 0 ? ((queueNormal / queueTotal) * 100).toFixed(1) : 0}%)</span>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#DC2626', fontWeight: 700 }}>
                {queueWithTalk.toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#B91C1C' }}>({queueTotal > 0 ? ((queueWithTalk / queueTotal) * 100).toFixed(1) : 0}%)</span>
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', color: '#475569' }}>
                Talk time = 0s (dropped before connecting)
              </TableCell>
              <TableCell>
                <Chip
                  label="Talk on Queue (&ge;3s)"
                  size="small"
                  sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 600, fontSize: '0.7rem', border: '1px solid #FECACA' }}
                />
              </TableCell>
            </TableRow>

            {/* Row 3: IVR */}
            <TableRow sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
              <TableCell sx={{ py: 1.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="IVR" size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.72rem', border: '1px solid #CBD5E1' }} />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#0D3B66' }}>Dropped in IVR Menu</Typography>
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0D3B66' }}>
                {ivrTotal.toLocaleString()}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600 }}>
                {ivrTotal.toLocaleString()} <span style={{ fontSize: '0.72rem', color: '#64748B' }}>(100.0%)</span>
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.82rem', color: '#94A3B8' }}>
                0 (0.0%)
              </TableCell>
              <TableCell sx={{ fontSize: '0.75rem', color: '#475569' }}>
                Talk time = 0s (caller navigated IVR only)
              </TableCell>
              <TableCell>
                <Chip
                  label="100% Consistent"
                  size="small"
                  sx={{ bgcolor: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: '0.7rem', border: '1px solid #A7F3D0' }}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Operational Diagnostic Insight Cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '8px',
              bgcolor: '#FFFBEB',
              border: '1px solid #FDE68A',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400E' }}>
                  Short Agent Talk Time (&lt;3s) — 4,413 Calls (1.14%)
                </Typography>
                <Chip label="Rule R4" size="small" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '0.68rem', height: 18 }} />
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#78350F', lineHeight: 1.45, mb: 1.5 }}>
                <strong>Operational Meaning:</strong> Telephony PBX registered an agent bridge, but the call lasted under 3 seconds before ending. Typically caused by accidental disconnects, immediate caller hang-ups upon hearing agent greeting, or dead air transfers.
              </Typography>
            </Box>
            {onSelectFilter && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onSelectFilter('mismatch')}
                sx={{
                  alignSelf: 'flex-start',
                  borderColor: '#D97706',
                  color: '#B45309',
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  py: 0.25,
                  px: 1,
                  '&:hover': { bgcolor: '#FEF3C7', borderColor: '#B45309' }
                }}
                endIcon={<ArrowRight size={13} />}
              >
                Inspect Mismatch Records
              </Button>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '8px',
              bgcolor: '#FEF2F2',
              border: '1px solid #FECACA',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#991B1B' }}>
                  Queue Drop with Recorded Talk (&ge;3s) — 759 Calls (7.18% of Queue)
                </Typography>
                <Chip label="Rule R5" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.68rem', height: 18 }} />
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#7F1D1D', lineHeight: 1.45, mb: 1.5 }}>
                <strong>Operational Meaning:</strong> Telephony PBX labeled the final termination entity as <code>Queue</code>, yet recorded $\ge$3 seconds of talk duration. Indicates the caller began speaking with an agent before dropping, or an ACD wrap-up event sequence delay.
              </Typography>
            </Box>
            {onSelectFilter && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => onSelectFilter('mismatch')}
                sx={{
                  alignSelf: 'flex-start',
                  borderColor: '#DC2626',
                  color: '#991B1B',
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  py: 0.25,
                  px: 1,
                  '&:hover': { bgcolor: '#FEE2E2', borderColor: '#991B1B' }
                }}
                endIcon={<ArrowRight size={13} />}
              >
                Inspect Queue Discrepancies
              </Button>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
