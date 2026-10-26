import React from 'react';
import { Card, CardContent, Typography, Box, Tooltip } from '@mui/material';

export default function InboundKpiCard({
  title,
  value,
  subtitle,
  tooltip,
  rate,
  rateLabel,
  icon: Icon,
  color = '#235789',
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
              flex: 1
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              width: 22,
              height: 22,
              minWidth: 22,
              minHeight: 22,
              borderRadius: '4px',
              bgcolor: bgLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {Icon && <Icon size={14} color={color} />}
          </Box>
        </Box>

        {/* Center: Bold Primary Number */}
        <Typography
          sx={{
            fontSize: '23.5px',
            fontWeight: 700,
            color: '#0F172A',
            lineHeight: 1.1,
            my: 0,
            letterSpacing: '-0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>

        {/* Bottom: Subtitle & Optional Rate Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', minWidth: 0 }}>
          <Typography
            sx={{
              color: '#64748B',
              fontSize: '9px',
              fontWeight: 500,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flex: 1
            }}
          >
            {subtitle}
          </Typography>

          {rate !== undefined && rate !== null && (
            <Box
              sx={{
                px: 0.5,
                py: '1px',
                borderRadius: '3px',
                bgcolor: bgLight,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              <Typography sx={{ fontWeight: 700, color, fontSize: '8.5px', lineHeight: 1.2 }}>
                {rate}% {rateLabel}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow placement="top">
        {cardElement}
      </Tooltip>
    );
  }

  return cardElement;
}
