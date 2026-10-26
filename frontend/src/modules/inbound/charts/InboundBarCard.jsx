import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LabelList
} from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Lightbulb } from 'lucide-react';

export default function InboundBarCard({
  title,
  subtitle,
  data = [],
  color = '#235789',
  wrapLabels = false,
  barSize = 32,
  percentFontSize = 10,
  labelFontSize = 10,
  showValues = false,
  showPercent = false,
  height = 270,
  onViewInsight
}) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const chartData = data.map((item) => ({
    ...item,
    percent: total > 0 ? Math.round((Number(item.value) / total) * 100) : 0
  }));

  // Custom rich tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload || {};
      const val = Number(item.value) || 0;
      const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';

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
            {item.name || label}
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
            Volume: <strong style={{ color: '#0D3B66' }}>{val.toLocaleString()}</strong> calls
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
            Share: <strong style={{ color: '#2563EB' }}>{pct}%</strong> of total
          </Typography>
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

      {/* 2. Bar Chart */}
      <Box sx={{ width: '100%', flex: 1, minHeight: height }}>
        {data.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No data available for current filters</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 12, left: 4, bottom: wrapLabels ? 25 : 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              {wrapLabels ? (
                <XAxis
                  dataKey="name"
                  interval={0}
                  height={55}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  tick={({ x, y, payload }) => {
                    const raw = String(payload.value || '');
                    const words = raw
                      .replaceAll('/', ' / ')
                      .replaceAll('-', '- ')
                      .split(' ')
                      .filter(Boolean);

                    return (
                      <g transform={`translate(${x},${y + 8})`}>
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          fill="#475569"
                          fontSize={9.5}
                          fontWeight={500}
                        >
                          {words.slice(0, 3).map((word, index) => (
                            <tspan key={index} x="0" dy={index === 0 ? 0 : 10}>
                              {word}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    );
                  }}
                />
              ) : (
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: labelFontSize, fill: '#475569' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  height={32}
                />
              )}

              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />

              <Bar
                isAnimationActive={false}
                dataKey="value"
                fill={color}
                radius={[4, 4, 0, 0]}
                barSize={barSize}
              >
                {/* Show clean percentage on top */}
                {showPercent && (
                  <LabelList
                    dataKey="percent"
                    position="top"
                    formatter={(val) => (Number(val) > 0 ? `${val}%` : '')}
                    style={{
                      fill: '#1E293B',
                      fontWeight: 700,
                      fontSize: percentFontSize
                    }}
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
