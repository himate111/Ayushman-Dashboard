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
import { Lightbulb, Info } from 'lucide-react';

// Visual column floor (~20–25px rendered height) so low-volume campaigns (<1%) remain visible
const MIN_VISUAL_PERCENTAGE = 6.5;

// Intelligent word wrapping for campaign names across a maximum of 2–3 clean lines,
// breaking long hyphenated names at appropriate hyphen boundaries and spaced names at word boundaries
export const formatCampaignLabel = (name) => {
  if (!name || typeof name !== 'string') return ['Unknown'];
  const trimmed = name.trim();

  // 1. If string contains hyphens and no spaces (e.g. 'NHMOB-SACHIS-Outbound')
  // Break on hyphens, keeping the hyphen attached to the preceding token:
  // e.g. ["NHMOB-", "SACHIS-", "Outbound"]
  if (!trimmed.includes(' ') && trimmed.includes('-')) {
    const segments = [];
    let cur = '';
    for (let i = 0; i < trimmed.length; i++) {
      cur += trimmed[i];
      if (trimmed[i] === '-' && i < trimmed.length - 1) {
        segments.push(cur);
        cur = '';
      }
    }
    if (cur) segments.push(cur);

    if (segments.length <= 3) {
      return segments;
    }
    // For more than 3 segments, group into at most 3 readable lines
    return [segments[0], segments.slice(1, -1).join(''), segments[segments.length - 1]];
  }

  // 2. If string contains spaces (e.g. 'Sachis Outbound-', 'Sachis Inbound-')
  if (trimmed.includes(' ')) {
    const parts = trimmed.split(/\s+/);
    if (parts.length === 2) {
      return parts;
    }
    if (parts.length === 3) {
      if (parts[0].length + parts[1].length <= 13) {
        return [`${parts[0]} ${parts[1]}`, parts[2]];
      }
      return [parts[0], `${parts[1]} ${parts[2]}`];
    }
    // For 4+ words, group into 2 or 3 lines
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
  }

  return [trimmed];
};

export default function OutboundGroupCard({
  data = [],
  height = 290,
  onViewInsight
}) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const processedData = data
    .map((item) => {
      const val = Number(item.value || 0);
      const percentage = total > 0 ? (val / total) * 100 : Number(item.percentage || 0);
      const actualPct = Number(percentage.toFixed(2));
      return {
        ...item,
        name: item.name || 'Unknown',
        value: val,
        percentage: actualPct,
        // Visual column height with ~20-25px floor for low percentage visibility (0.70%, 0.41%)
        visualPercentage: Math.max(actualPct, MIN_VISUAL_PERCENTAGE),
        isAdjusted: actualPct < MIN_VISUAL_PERCENTAGE
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const hasAdjustedBars = processedData.some((d) => d.isAdjusted);

  // Custom Recharts X-axis tick component using SVG <text> and <tspan> elements,
  // ensuring each label is visually centered directly underneath its corresponding bar
  const renderXAxisTick = (props) => {
    const { x, y, payload } = props;
    const lines = formatCampaignLabel(payload?.value || '');

    return (
      <g transform={`translate(${x},${y})`}>
        <title>{payload?.value}</title>
        <text
          x={0}
          y={0}
          textAnchor="middle"
          fill="#334155"
          fontSize={10.5}
          fontWeight={600}
        >
          {lines.map((line, idx) => (
            <tspan
              key={idx}
              x={0}
              dy={idx === 0 ? 12 : 13}
            >
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

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
          <Typography sx={{ fontSize: '11px', color: '#16A34A' }}>
            Actual Share: <strong>{item.percentage.toFixed(2)}%</strong> of total
          </Typography>
          {item.isAdjusted && (
            <Typography sx={{ fontSize: '10px', color: '#D97706', mt: 0.3, fontStyle: 'italic' }}>
              (Column height adjusted ~20–25px for visual visibility)
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
        minHeight: height + 70,
        boxSizing: 'border-box'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, minHeight: 38 }}>
        <Box sx={{ minWidth: 0, pr: 1 }}>
          <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#0D3B66', lineHeight: 1.25 }}>
            Outbound Call Name Distribution
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748B', mt: 0.3 }}>
            Top 5 Campaign Categories by Call Volume
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

      <Box
        sx={{
          width: '100%',
          flex: 1,
          minHeight: height - (hasAdjustedBars ? 28 : 0),
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {processedData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No data available for current filters</Typography>
          </Box>
        ) : (
          <>
            {/* Plotting area: ResponsiveContainer width="100%" with zero horizontal scrollbar */}
            <Box
              sx={{
                flex: 1,
                width: '100%',
                minHeight: height,
                overflow: 'hidden'
              }}
            >
              <ResponsiveContainer width="100%" height={height}>
                <BarChart
                  data={processedData}
                  margin={{ top: 22, right: 16, left: -6, bottom: 8 }}
                  barSize={32}
                >
                  <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    tick={renderXAxisTick}
                    height={50}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 70]}
                    ticks={[0, 20, 40, 60]}
                    tickFormatter={(val) => `${val}%`}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    width={38}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="visualPercentage"
                    fill="#16A34A"
                    minPointSize={22}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="percentage"
                      position="top"
                      offset={6}
                      formatter={(val) => `${Number(val).toFixed(2)}%`}
                      style={{ fill: '#0F172A', fontSize: 10.5, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* Clear Disclosure Footnote for Visual Minimum */}
            {hasAdjustedBars && (
              <Box
                sx={{
                  mt: 0.5,
                  pt: 0.75,
                  borderTop: '1px dashed #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                <Info size={12} color="#64748B" style={{ flexShrink: 0 }} />
                <Typography sx={{ fontSize: '10px', color: '#64748B', fontStyle: 'italic', lineHeight: 1.25 }}>
                  * Note: Visual column heights for low-volume campaigns (&lt;1%) include a ~20–25px visual floor for chart legibility; percentages shown represent actual proportions.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}
