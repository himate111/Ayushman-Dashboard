import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList
} from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Lightbulb } from 'lucide-react';

export default function InboundHourlyCard({
  title,
  subtitle,
  data = [],
  metric = 'totalCalls',
  color = '#235789',
  lineColor = '#0F2F57',
  unit = '',
  minPercentLabel = 0,
  height = 270,
  onViewInsight
}) {
  const isRate = unit === '%';

  // Calculate total across all 24 hours for share percentages
  const total = data.reduce((sum, item) => sum + (Number(item[metric]) || 0), 0);

  const chartData = data.map((item) => {
    const val = Number(item[metric]) || 0;
    const rawPercent = total > 0 ? (val / total) * 100 : 0;

    let labelText = '';
    if (isRate) {
      // Task 5: Hourly call drop rate percentage
      labelText = `${val.toFixed(1)}%`;
    } else {
      // Tasks 2, 3, 4: Hourly volume share percentage
      if (rawPercent >= 1) {
        labelText = `${Math.round(rawPercent)}%`;
      } else if (rawPercent > 0) {
        labelText = `${rawPercent.toFixed(1)}%`;
      } else {
        labelText = '0%';
      }
    }

    return {
      ...item,
      rawPercent,
      labelText,
      percent: Math.round(rawPercent)
    };
  });

  // Staggered two-tier label renderer preventing collisions across 24 hours
  const renderStaggeredLabel = (props) => {
    const { x, y, width, index, value } = props;
    if (x == null || y == null) return null;

    const text = value ?? chartData[index]?.labelText ?? '';
    if (!text) return null;

    const cx = x + (width || 0) / 2;
    // Even hours (0, 2, 4, ...): Tier 0 closer to bar top (y - 5)
    // Odd hours (1, 3, 5, ...): Tier 1 elevated to eliminate horizontal overlap (y - 18)
    const isOdd = index % 2 === 1;
    const yPos = isOdd ? y - 18 : y - 5;

    return (
      <text
        x={cx}
        y={yPos}
        textAnchor="middle"
        fill="#1E293B"
        fontSize={7.5}
        fontWeight={600}
        letterSpacing="-0.025em"
      >
        {text}
      </text>
    );
  };

  // Custom rich tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload || {};
      const val = Number(item[metric]) || 0;
      const hourNum = item.hour !== undefined ? item.hour : (label ? Number(label.split(':')[0]) : 0);
      const hourDisplay = `${String(hourNum).padStart(2, '0')}:00 – ${String(hourNum).padStart(2, '0')}:59`;

      return (
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            p: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: '12px'
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#0D3B66', mb: 0.5 }}>
            {hourDisplay}
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
            {isRate ? 'Drop Rate: ' : 'Call Volume: '}
            <strong style={{ color: isRate ? '#DC2626' : '#0D3B66' }}>
              {isRate ? `${val.toFixed(2)}%` : `${val.toLocaleString()} calls`}
            </strong>
          </Typography>
          {!isRate && (
            <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
              Daily Share: <strong style={{ color: '#2563EB' }}>{item.labelText || `${item.percent}%`}</strong>
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: '14px 16px',
        bgcolor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: height + 60,
        boxSizing: 'border-box'
      }}
    >
      {/* 1. Header with clear separation of bold title and subtitle on separate line */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, minHeight: 38 }}>
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography
            variant="subtitle2"
            component="h2"
            sx={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#0D3B66',
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
              m: 0
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontSize: '11px',
                color: '#64748B',
                lineHeight: 1.25,
                mt: 0.3
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {onViewInsight && (
          <Button
            size="small"
            startIcon={<Lightbulb size={13} color="#D97706" />}
            onClick={onViewInsight}
            sx={{
              fontSize: '0.72rem',
              color: '#92400E',
              bgcolor: '#FEF3C7',
              border: '1px solid #FDE68A',
              py: 0.2,
              px: 0.8,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '6px',
              flexShrink: 0,
              '&:hover': { bgcolor: '#FDE68A' },
            }}
          >
            Insights
          </Button>
        )}
      </Box>

      {/* 2. Composed Bar and Line Chart */}
      <Box sx={{ width: '100%', flex: 1, minHeight: height }}>
        {data.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No hourly data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 30, right: 10, left: 6, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                interval={1}
                tickFormatter={(val) => (val ? `${Number(val.split(':')[0])}h` : '')}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                hide
                domain={[0, (dataMax) => (isRate ? Math.max(dataMax * 1.25, 18) : Math.max(dataMax * 1.22, 10))]}
              />
              <Tooltip content={<CustomTooltip />} />

              <Line
                isAnimationActive={false}
                type="monotone"
                dataKey={metric}
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
              />

              <Bar
                isAnimationActive={false}
                dataKey={metric}
                fill={color}
                radius={[3, 3, 0, 0]}
                barSize={13}
              >
                <LabelList
                  dataKey="labelText"
                  content={renderStaggeredLabel}
                />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
