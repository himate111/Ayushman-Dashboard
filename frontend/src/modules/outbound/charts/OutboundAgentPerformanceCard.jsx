import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LabelList
} from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Lightbulb, Info } from 'lucide-react';

export default function OutboundAgentPerformanceCard({
  title = 'Top 5 Agents',
  subtitle = 'Highest Volume Outbound Responders (Total vs. Connected)',
  data = [],
  isBottomAgents = false,
  height = 270,
  onViewInsight
}) {
  const chartData = (data || []).slice(0, 5).map((item) => {
    const totalCalls = Number(item.totalCalls || 0);
    const connectedCalls = Number(item.connectedCalls || 0);
    const notConnectedCalls = Number(item.notConnectedCalls || Math.max(totalCalls - connectedCalls, 0));
    const connectRate = totalCalls > 0 ? (connectedCalls / totalCalls) * 100 : Number(item.connectionRate || 0);

    return {
      agentId: item.agentId || 'Unassigned',
      totalCalls,
      connectedCalls,
      notConnectedCalls,
      connectRate: Number(connectRate.toFixed(1)),
      avgDuration: item.avgDuration || '0s'
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload || {};
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
            Agent: {row.agentId}
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#4F81BD', mb: 0.25 }}>
            Total Calls: <strong style={{ color: '#0F172A' }}>{row.totalCalls.toLocaleString()}</strong>
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#16A34A', mb: 0.25 }}>
            Connected Calls: <strong style={{ color: '#166534' }}>{row.connectedCalls.toLocaleString()}</strong>
          </Typography>
          <Typography sx={{ fontSize: '11.5px', color: '#2563EB', mb: 0.25 }}>
            Connection Rate: <strong>{row.connectRate}%</strong>
          </Typography>
          {row.avgDuration && (
            <Typography sx={{ fontSize: '10.5px', color: '#64748B' }}>
              Avg Talk Duration: {row.avgDuration}
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
      {/* 1. Header with clear separation of bold title and subtitle */}
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
          {isBottomAgents && chartData.length > 0 && chartData.length < 5 && (
            <Typography
              variant="caption"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '10px',
                color: '#D97706',
                fontWeight: 600,
                mt: 0.25
              }}
            >
              <Info size={11} /> Only {chartData.length} agent(s) meet the ≥100 calls threshold in current filter scope.
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

      {/* 2. Paired Bar Chart */}
      <Box sx={{ width: '100%', flex: 1, minHeight: height }}>
        {chartData.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
            <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 600, textAlign: 'center' }}>
              {isBottomAgents
                ? 'No agents with at least 100 calls found in the current filter scope.'
                : 'No agent performance data available for current filters.'}
            </Typography>
            {isBottomAgents && (
              <Typography sx={{ fontSize: '11px', color: '#94A3B8', mt: 0.5, textAlign: 'center' }}>
                Expand date range or clear filter restrictions to include active outbound dialers.
              </Typography>
            )}
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 26, right: 15, left: 15, bottom: 5 }}
              barGap={4}
            >
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="agentId"
                interval={0}
                tick={{ fill: '#475569', fontSize: 10.5 }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis hide domain={[0, 'dataMax + 200']} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                content={() => (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2.5, pt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#4F81BD' }} />
                      <Typography sx={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                        Total Calls
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#2F7D4F' }} />
                      <Typography sx={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                        Connected Calls
                      </Typography>
                    </Box>
                  </Box>
                )}
              />

              <Bar
                name="Total Calls"
                dataKey="totalCalls"
                fill="#4F81BD"
                radius={[4, 4, 0, 0]}
                barSize={24}
                minPointSize={18}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="totalCalls"
                  position="top"
                  offset={5}
                  formatter={(val) => Number(val).toLocaleString()}
                  style={{ fill: '#0F172A', fontSize: 10, fontWeight: 700 }}
                />
              </Bar>

              <Bar
                name="Connected Calls"
                dataKey="connectedCalls"
                fill="#2F7D4F"
                radius={[4, 4, 0, 0]}
                barSize={24}
                minPointSize={18}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="connectedCalls"
                  position="top"
                  offset={5}
                  formatter={(val) => Number(val).toLocaleString()}
                  style={{ fill: '#0F172A', fontSize: 10, fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
