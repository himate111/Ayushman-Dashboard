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

export default function OutboundOutcomeCard({
  data = [],
  height = 270,
  onViewInsight
}) {
  const filteredData = data.filter(
    (item) => item.name !== 'Call Back' && Number(item.value || 0) > 0
  );

  const total = filteredData.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const processedData = filteredData.map((item) => ({
    ...item,
    name: item.name || 'Unknown',
    value: Number(item.value) || 0,
    percentage: total > 0 ? (Number(item.value) / total) * 100 : Number(item.percentage || 0)
  }));

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
            Volume: <strong style={{ color: '#0F172A' }}>{item.value.toLocaleString()}</strong> calls
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#2563EB' }}>
            Share: <strong>{item.percentage.toFixed(2)}%</strong> of total
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
            Raw Disposition Breakdown
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.3 }}>
            Telecom Switch Dispositions (Preserves Raw CDR Codes)
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
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No data available for current filters</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 22, right: 15, left: 15, bottom: 20 }}
              barCategoryGap="28%"
            >
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                interval={0}
                tick={{ fill: '#475569', fontSize: 10.5 }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis hide domain={[0, 'dataMax + 10']} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="percentage"
                fill="#4F81BD"
                radius={[8, 8, 0, 0]}
                barSize={38}
              >
                <LabelList
                  dataKey="percentage"
                  position="top"
                  formatter={(val) => `${Number(val).toFixed(2)}%`}
                  style={{ fill: '#0F172A', fontSize: 11, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
