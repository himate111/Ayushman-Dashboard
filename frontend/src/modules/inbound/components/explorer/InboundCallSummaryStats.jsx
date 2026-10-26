import React from 'react';
import { Paper, Grid, Box, Typography } from '@mui/material';
import { PhoneIncoming, CheckCircle2, PhoneOff, Headphones, Hourglass } from 'lucide-react';

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '0s';
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function InboundCallSummaryStats({ data = {}, loading = false }) {
  const total = data.totalCount || 0;
  const connected = data.connectedCount || 0;
  const abandoned = data.abandonedCount || 0;
  const connectedRate = total > 0 ? ((connected / total) * 100).toFixed(2) : '0.00';
  const abandonedRate = total > 0 ? ((abandoned / total) * 100).toFixed(2) : '0.00';

  const stats = [
    {
      label: 'Matching Records',
      value: total.toLocaleString(),
      subtext: 'All matching records',
      icon: PhoneIncoming,
      color: '#235789',
      bgColor: '#EFF6FF'
    },
    {
      label: 'Connected Calls (≥3s)',
      value: `${connected.toLocaleString()} (${connectedRate}%)`,
      subtext: 'Agent talk ≥ 3s',
      icon: CheckCircle2,
      color: '#059669',
      bgColor: '#ECFDF5'
    },
    {
      label: 'Early Ended / Drops (<3s)',
      value: `${abandoned.toLocaleString()} (${abandonedRate}%)`,
      subtext: 'Talk < 3s or Queue/IVR',
      icon: PhoneOff,
      color: '#DC2626',
      bgColor: '#FEF2F2'
    },
    {
      label: 'Average Agent Talk Time',
      value: formatDuration(data.avgTalkDurationSeconds),
      subtext: 'All matching records',
      icon: Headphones,
      color: '#7C3AED',
      bgColor: '#F5F3FF'
    },
    {
      label: 'Average Queue Wait',
      value: formatDuration(data.avgQueueDurationSeconds),
      subtext: 'All matching records',
      icon: Hourglass,
      color: '#D97706',
      bgColor: '#FFFBEB'
    }
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(1, minmax(0, 1fr))',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          lg: 'repeat(5, minmax(0, 1fr))',
        },
        gap: 1.5,
        mb: 2.5
      }}
    >
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <Paper
            key={idx}
            elevation={0}
            sx={{
              p: 1.25,
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              bgcolor: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              minWidth: 0,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                bgcolor: stat.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconComponent size={18} color={stat.color} />
            </Box>
            <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#64748B',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  display: 'block',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {stat.label}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  lineHeight: 1.25,
                  my: 0.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: '#94A3B8',
                  fontSize: '0.64rem',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {stat.subtext}
              </Typography>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
