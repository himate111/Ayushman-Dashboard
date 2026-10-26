import React from 'react';
import { Box, Typography } from '@mui/material';

export default function InsightBanner({ insight, recommendation, severity = 'info' }) {
  if (!insight && !recommendation) return null;

  const isUrgent = severity === 'alert' || severity === 'error';
  const isWarning = severity === 'warning';

  const config = isUrgent
    ? {
        borderLeft: '#EF4444',
        bg: '#FEF2F2',
        border: '#FECACA',
        labelColor: '#B91C1C',
      }
    : isWarning
    ? {
        borderLeft: '#F59E0B',
        bg: '#FFFBEB',
        border: '#FDE68A',
        labelColor: '#B45309',
      }
    : {
        borderLeft: '#0284C7',
        bg: '#F8FAFC',
        border: '#E2E8F0',
        labelColor: '#0369A1',
      };

  return (
    <Box
      sx={{
        mt: 1.5,
        p: '7px 10px',
        borderRadius: '6px',
        bgcolor: config.bg,
        border: `1px solid ${config.border}`,
        borderLeft: `3.5px solid ${config.borderLeft}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.25,
      }}
    >
      {insight && (
        <Typography sx={{ fontSize: '12px', color: '#1E293B', lineHeight: 1.35 }}>
          <strong style={{ color: config.labelColor, fontWeight: 700 }}>Insight:</strong> {insight}
        </Typography>
      )}
      {recommendation && (
        <Typography sx={{ fontSize: '12px', color: '#475569', lineHeight: 1.35 }}>
          <strong style={{ color: config.labelColor, fontWeight: 700 }}>Action:</strong> {recommendation}
        </Typography>
      )}
    </Box>
  );
}

