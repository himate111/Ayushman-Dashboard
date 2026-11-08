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

export default function OutboundShiftCard({
  data = [],
  height = 270,
  onViewInsight
}) {
  const totalCalls = data.reduce((sum, item) => sum + (Number(item.totalCalls || item.value || 0)), 0);

  const processedData = data.map((item) => {
    const val = Number(item.totalCalls || item.value || 0);
    const percentage = totalCalls > 0 ? (val / totalCalls) * 100 : 0;
    return {
      name: item.shift || item.name || 'Shift',
      totalCalls: val,
      connectedCalls: Number(item.connectedCalls || 0),
      notConnectedCalls: Number(item.notConnectedCalls || 0),
      connectionRate: Number(item.connectionRate || 0),
      percentage
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload || {};
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
            {item.name}
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
            Total Calls: <strong style={{ color: '#0F172A' }}>{item.totalCalls.toLocaleString()}</strong>
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#16A34A' }}>
            Connected: <strong>{item.connectedCalls.toLocaleString()} ({item.connectionRate.toFixed(1)}%)</strong>
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#2563EB' }}>
            Shift Share: <strong>{item.percentage.toFixed(2)}%</strong> of total volume
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, minHeight: 38 }}>
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#0D3B66', lineHeight: 1.25 }}>
            Calls By Shift
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.3 }}>
            Morning (07:00–14:59), Evening (15:00–22:59) & Night (23:00–06:59)
          </Typography>
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
              '&:hover': { bgcolor: '#FDE68A' }
            }}
          >
            Insights
          </Button>
        )}
      </Box>

      <Box sx={{ width: '100%', flex: 1, minHeight: height }}>
        {processedData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No shift data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 22, right: 15, left: 15, bottom: 20 }}
              barCategoryGap="30%"
            >
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#475569', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis hide domain={[0, 'dataMax + 12']} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentage"
                fill="#4F81BD"
                radius={[8, 8, 0, 0]}
                barSize={40}
              >
                <LabelList
                  dataKey="percentage"
                  position="top"
                  formatter={(val) => `${Number(val).toFixed(2)}%`}
                  style={{ fill: '#0F172A', fontSize: 11.5, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
