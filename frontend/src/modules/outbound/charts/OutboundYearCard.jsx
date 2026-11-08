import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Lightbulb } from 'lucide-react';

const YEAR_COLORS = ['#16A34A', '#4F81BD', '#F59E0B', '#8B5CF6'];
const FILTERED_COLORS = ['#16A34A', '#94A3B8', '#3B82F6'];

export default function OutboundYearCard({
  data = [],
  kpis = {},
  filters = {},
  height = 270,
  onViewInsight
}) {
  const isYearFiltered = filters?.year && filters.year.length > 0;
  const title = isYearFiltered ? 'Outbound Call Distribution' : 'Calls by Year';
  const subtitle = isYearFiltered
    ? 'Connected, Not Connected & Other Outcomes'
    : 'Annual Outbound Volume Share';

  // If a year is selected, derive distribution from KPIs matching original TimeBarChart
  let chartData = [];
  if (isYearFiltered) {
    const total = Number(kpis.totalCalls || 0);
    const connected = Number(kpis.connectedCalls || 0);
    const notConnected = Number(kpis.notConnectedCalls || 0);
    const others = Math.max(total - connected - notConnected, 0);

    chartData = [
      {
        name: 'Connected',
        value: connected,
        percentage: total > 0 ? (connected / total) * 100 : 0,
        color: '#16A34A'
      },
      {
        name: 'Not Connected',
        value: notConnected,
        percentage: total > 0 ? (notConnected / total) * 100 : 0,
        color: '#94A3B8'
      },
      {
        name: 'Others',
        value: others,
        percentage: total > 0 ? (others / total) * 100 : 0,
        color: '#3B82F6'
      }
    ].filter((item) => item.value > 0);
  } else {
    const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    chartData = data.map((item, idx) => ({
      name: String(item.name),
      value: Number(item.value) || 0,
      percentage: total > 0 ? (Number(item.value) / total) * 100 : 0,
      color: YEAR_COLORS[idx % YEAR_COLORS.length]
    })).filter((item) => item.value > 0);
  }

  // Outer percentage labels with thin leader lines terminating cleanly before text
  const renderYearLabel = (entry) => {
    const { cx, cy, midAngle, outerRadius, percent, percentage, value } = entry;
    if (!value || value <= 0) return null;
    const RADIAN = Math.PI / 180;
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);

    const isRight = cos >= 0;
    // Starting point just outside the outer donut ring
    const sx = cx + (outerRadius + 4) * cos;
    const sy = cy + (outerRadius + 4) * sin;
    // Elbow point
    const mx = cx + (outerRadius + 14) * cos;
    const my = cy + (outerRadius + 14) * sin;
    // Horizontal terminal point (terminates cleanly before text)
    const ex = mx + (isRight ? 1 : -1) * 14;
    const ey = my;

    // Use accurate annual percentage
    const pctVal = typeof percentage === 'number' ? percentage : (percent ? percent * 100 : 0);
    const pctStr = `${pctVal.toFixed(1)}%`;
    const textAnchor = isRight ? 'start' : 'end';

    return (
      <g>
        {/* Thin connector line terminating before text */}
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke="#94A3B8"
          strokeWidth={1}
          fill="none"
        />
        <circle cx={sx} cy={sy} r={2} fill="#64748B" />
        {/* Percentage label with adequate padding beyond the line endpoint */}
        <text
          x={ex + (isRight ? 1 : -1) * 6}
          y={ey}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fill="#0D3B66"
          fontSize={11.5}
          fontWeight={700}
        >
          {pctStr}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
            <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#0D3B66' }}>
              {item.name}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
            Volume: <strong style={{ color: '#0F172A' }}>{item.value.toLocaleString()}</strong> calls
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
            Share: <strong style={{ color: '#2563EB' }}>{item.percentage.toFixed(1)}%</strong> of total
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
            {title}
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.3 }}>
            {subtitle}
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
        {chartData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No data available for current filters</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 12, right: 28, left: 28, bottom: 4 }}>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="44%"
                innerRadius={46}
                outerRadius={68}
                paddingAngle={3}
                labelLine={false}
                label={renderYearLabel}
                isAnimationActive={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                formatter={(value) => {
                  const item = chartData.find((d) => d.name === value);
                  if (!item) return value;
                  return (
                    <span style={{ color: '#334155', fontWeight: 600, fontSize: '11px' }}>
                      {value}: <span style={{ color: '#64748B', fontWeight: 500 }}>{item.value.toLocaleString()}</span>{' '}
                      <span style={{ color: '#0D3B66', fontWeight: 700 }}>({item.percentage.toFixed(1)}%)</span>
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
