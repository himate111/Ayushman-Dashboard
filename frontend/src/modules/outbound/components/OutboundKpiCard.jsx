import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip } from '@mui/material';

export default function OutboundKpiCard({
  title,
  value,
  subtitle,
  tooltip,
  rate,
  rateLabel,
  icon: Icon,
  color = '#0284C7',
  bgLight = '#F0F9FF'
}) {
  const cardElement = (
    <Card
      sx={{
        height: 92,
        minHeight: 92,
        maxHeight: 92,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${color}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        transition: 'all 0.15s ease-in-out',
        cursor: tooltip ? 'help' : 'default',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }
      }}
    >
      <CardContent
        sx={{
          p: '8px 10px !important',
          '&:last-child': { pb: '8px !important' },
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Header: Title and Icon */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minWidth: 0, gap: '6px' }}>
          <Typography
            sx={{
              fontSize: '9.5px',
              fontWeight: 600,
              color: '#64748B',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              minWidth: 0,
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '6px',
                bgcolor: bgLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
                flexShrink: 0
              }}
            >
              <Icon size={12} strokeWidth={2.2} />
            </Box>
          )}
        </Box>

        {/* Center: Main KPI Value */}
        <Typography
          sx={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.1,
            my: '2px',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {value ?? '—'}
        </Typography>

        {/* Bottom Subtitle / Rate */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
          {subtitle && (
            <Typography
              sx={{
                fontSize: '9.5px',
                color: '#64748B',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {subtitle}
            </Typography>
          )}
          {rate !== undefined && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: '5px',
                py: '1px',
                borderRadius: '4px',
                bgcolor: bgLight,
                fontSize: '9px',
                fontWeight: 600,
                color: color,
                lineHeight: 1.2,
                flexShrink: 0
              }}
            >
              {rate}% {rateLabel || ''}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return tooltip ? (
    <Tooltip title={tooltip} arrow placement="top">
      {cardElement}
    </Tooltip>
  ) : (
    cardElement
  );
}
