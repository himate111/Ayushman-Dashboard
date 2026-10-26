import React from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  LabelList
} from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Lightbulb } from 'lucide-react';

export default function InboundShiftComparisonCard({ title, subtitle, data = [], height = 270, onViewInsight }) {
  const chartData = data.map((item) => {
    const total = (Number(item.connected) || 0) + (Number(item.abandoned) || 0);
    return {
      ...item,
      connectedPct: total > 0 ? Math.round(((Number(item.connected) || 0) / total) * 100) : 0,
      abandonedPct: total > 0 ? Math.round(((Number(item.abandoned) || 0) / total) * 100) : 0
    };
  });

  // Custom rich tooltip showing exact counts, percentages, and shift total
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload || {};
      const conn = Number(item.connected) || 0;
      const aban = Number(item.abandoned) || 0;
      const total = conn + aban;
      const connPct = total > 0 ? ((conn / total) * 100).toFixed(1) : '0';
      const abanPct = total > 0 ? ((aban / total) * 100).toFixed(1) : '0';

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2F7D4F' }} />
            <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
              Connected (≥3s): <strong style={{ color: '#2F7D4F' }}>{conn.toLocaleString()}</strong> ({connPct}%)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6B7280' }} />
            <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
              Early Ended (&lt;3s): <strong style={{ color: '#6B7280' }}>{aban.toLocaleString()}</strong> ({abanPct}%)
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '11px', color: '#64748B', borderTop: '1px solid #E2E8F0', pt: 0.5 }}>
            Total Shift Calls: <strong>{total.toLocaleString()}</strong>
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

      <Box sx={{ width: '100%', height, minHeight: height }}>
        {data.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No shift data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 22, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" fontSize={11} stroke="#475569" padding={{ left: 10, right: 10 }} />
              <YAxis hide scale="log" domain={[1, 'auto']} />

              <Tooltip content={<CustomTooltip />} />

              <Legend
                iconSize={10}
                wrapperStyle={{
                  fontSize: '11px',
                  paddingTop: '8px'
                }}
              />

              <Bar
                isAnimationActive={false}
                dataKey="connected"
                fill="#2F7D4F"
                name="Connected (≥3s)"
                barSize={32}
                radius={[5, 5, 0, 0]}
              >
                <LabelList
                  dataKey="connectedPct"
                  position="top"
                  formatter={(v) => `${v}%`}
                  style={{
                    fill: '#1E293B',
                    fontWeight: 700,
                    fontSize: 10
                  }}
                />
              </Bar>

              <Bar
                isAnimationActive={false}
                dataKey="abandoned"
                minPointSize={8}
                fill="#6B7280"
                name="Early Ended (<3s)"
                barSize={32}
                radius={[5, 5, 0, 0]}
              >
                <LabelList
                  dataKey="abandonedPct"
                  position="top"
                  formatter={(v) => `${v}%`}
                  style={{
                    fill: '#1E293B',
                    fontWeight: 700,
                    fontSize: 10
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
