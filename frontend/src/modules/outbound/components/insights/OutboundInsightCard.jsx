import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  PhoneCall,
  Users,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Info,
  ExternalLink,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

function getSeverityChip(severity) {
  switch (severity) {
    case 'warning':
      return (
        <Chip
          icon={<AlertTriangle size={12} color="#D97706" />}
          label="High Attention"
          size="small"
          sx={{
            bgcolor: '#FEF3C7',
            color: '#92400E',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22
          }}
        />
      );
    case 'optimal':
      return (
        <Chip
          icon={<CheckCircle2 size={12} color="#16A34A" />}
          label="Verified 100%"
          size="small"
          sx={{
            bgcolor: '#DCFCE7',
            color: '#166534',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22
          }}
        />
      );
    default:
      return (
        <Chip
          icon={<Info size={12} color="#0284C7" />}
          label="Audited Telemetry"
          size="small"
          sx={{
            bgcolor: '#E0F2FE',
            color: '#0369A1',
            fontWeight: 700,
            fontSize: '0.7rem',
            height: 22
          }}
        />
      );
  }
}

function getCategoryIcon(id) {
  switch (id) {
    case 'sec1-volume': return <TrendingUp size={18} color="#0284C7" />;
    case 'sec2-outcomes': return <PhoneCall size={18} color="#16A34A" />;
    case 'sec3-campaigns': return <Layers size={18} color="#8B5CF6" />;
    case 'sec4-dispositions': return <Lightbulb size={18} color="#D97706" />;
    case 'sec5-shifts': return <Clock size={18} color="#2563EB" />;
    case 'sec6-agents': return <Users size={18} color="#0D9488" />;
    case 'sec7-audit': return <ShieldCheck size={18} color="#16A34A" />;
    default: return <Info size={18} color="#0284C7" />;
  }
}

export default function OutboundInsightCard({ insight, onNavigateToChart }) {
  if (!insight) return null;

  return (
    <Card
      id={`insight-${insight.id}`}
      elevation={0}
      sx={{
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        mb: 2.5,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#CBD5E1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Top Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                bgcolor: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {getCategoryIcon(insight.id)}
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.95rem', sm: '1.05rem' },
                  color: '#0D3B66',
                  lineHeight: 1.25
                }}
              >
                {insight.title}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.25 }}>
                {insight.subtitle}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={insight.category}
              size="small"
              sx={{
                bgcolor: '#F8FAFC',
                color: '#475569',
                border: '1px solid #E2E8F0',
                fontSize: '0.72rem',
                fontWeight: 600,
                height: 22
              }}
            />
            {getSeverityChip(insight.severity)}
            {onNavigateToChart && insight.chartKey && (
              <Button
                size="small"
                variant="outlined"
                endIcon={<ExternalLink size={12} />}
                onClick={() => onNavigateToChart(insight.chartKey)}
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  color: '#0D3B66',
                  borderColor: '#CBD5E1',
                  bgcolor: '#FFFFFF',
                  height: 24,
                  px: 1,
                  '&:hover': { bgcolor: '#F8FAFC' }
                }}
              >
                View Chart
              </Button>
            )}
          </Box>
        </Box>

        {/* Core Finding Narrative */}
        <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', p: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
            {insight.finding}
          </Typography>
        </Box>

        {/* 4-Column Stat Evidence Boxes */}
        {insight.metrics && insight.metrics.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: `repeat(${insight.metrics.length}, 1fr)`
              },
              gap: 1.5,
              mb: 2
            }}
          >
            {insight.metrics.map((m, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 1.25,
                  borderRadius: '8px',
                  bgcolor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {m.label}
                </Typography>
                <Typography sx={{ fontSize: '1.15rem', color: '#0F172A', fontWeight: 700, my: 0.25, lineHeight: 1.2 }}>
                  {m.value}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  {m.sub}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Specialized Agent Table for Section 6 */}
        {insight.agentData && (
          <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* Top Agents */}
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <Box sx={{ p: '8px 12px', bgcolor: '#F1F5F9', borderBottom: '1px solid #E2E8F0' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0D3B66' }}>
                  Top 5 Agents by Volume
                </Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Agent</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Total Calls</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Connected</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Conn. Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insight.agentData.top.map((a, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5, fontWeight: 600 }}>{a.agentId}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5 }}>{Number(a.totalCalls).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5, color: '#166534', fontWeight: 600 }}>{Number(a.connectedCalls).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5, color: '#0284C7', fontWeight: 700 }}>{a.connectionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            {/* Bottom Agents */}
            <Paper elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
              <Box sx={{ p: '8px 12px', bgcolor: '#FEF2F2', borderBottom: '1px solid #FEE2E2' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#991B1B' }}>
                  Bottom 5 Agents by Connection Rate (≥100 Calls)
                </Typography>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Agent</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Total Calls</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Connected</TableCell>
                    <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 600, py: 0.5 }}>Conn. Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insight.agentData.bottom.map((a, i) => (
                    <TableRow key={i} hover>
                      <TableCell sx={{ fontSize: '0.75rem', py: 0.5, fontWeight: 600 }}>{a.agentId}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5 }}>{Number(a.totalCalls).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5, color: '#166534' }}>{Number(a.connectedCalls).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5, color: '#DC2626', fontWeight: 700 }}>{a.connectionRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}

        {/* Strategic Recommendations */}
        {insight.recommendations && insight.recommendations.length > 0 && (
          <Box sx={{ pt: 1, borderTop: '1px solid #F1F5F9' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Strategic Recommendations
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {insight.recommendations.map((rec, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircle2 size={14} color="#16A34A" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                    {rec}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
