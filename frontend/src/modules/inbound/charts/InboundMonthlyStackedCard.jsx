import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Lightbulb } from 'lucide-react';

export default function InboundMonthlyStackedCard({ title, subtitle, data = [], height = 270, onViewInsight }) {
  // Custom clean tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const connectedVal = payload.find(p => p.dataKey === 'connected')?.value || 0;
      const abandonedVal = payload.find(p => p.dataKey === 'abandoned')?.value || 0;

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
            {label} Resolution Split
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2F7D4F' }} />
            <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
              Connected Calls: <strong style={{ color: '#166534' }}>{connectedVal}%</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#C44949' }} />
            <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
              Abandoned / Early Ended: <strong style={{ color: '#991B1B' }}>{abandonedVal}%</strong>
            </Typography>
          </Box>
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

      {/* 2. Stacked Bar Chart */}
      <Box sx={{ width: '100%', flex: 1, minHeight: height }}>
        {data.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No monthly data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barSize={26}
              barCategoryGap="12%"
              margin={{ top: 16, right: 14, left: 6, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="month"
                interval={0}
                tick={{ fontSize: 10.5, fill: '#475569' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                content={() => (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2.5, pt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2F7D4F' }} />
                      <Typography sx={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                        Connected Calls
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#C44949' }} />
                      <Typography sx={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                        Abandoned / Early Ended
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
              <Bar
                isAnimationActive={false}
                dataKey="connected"
                stackId="a"
                fill="#2F7D4F"
                name="Connected Calls"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                isAnimationActive={false}
                dataKey="abandoned"
                stackId="a"
                fill="#C44949"
                stroke="#FFFFFF"
                strokeWidth={1}
                name="Abandoned / Early Ended"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
