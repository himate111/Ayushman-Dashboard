import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Paper, Typography, Box, Button, Tooltip as MuiTooltip } from '@mui/material';
import { Lightbulb } from 'lucide-react';
import { INBOUND_CHART_COLORS } from '../utils/inboundFormatters';

export default function InboundDonutCard({
  title,
  subtitle,
  data = [],
  height = 270,
  variant,
  onViewInsight
}) {
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  // Auto-detect variant if not explicitly provided
  const resolvedVariant =
    variant ||
    (data.length > 4
      ? 'multiCategory'
      : title.toLowerCase().includes('year')
      ? 'year'
      : title.toLowerCase().includes('ending')
      ? 'callEnd'
      : 'standard');

  // Custom clean tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const val = Number(item.value) || 0;
      const pctNum = total > 0 ? (val / total) * 100 : 0;
      const pctStr =
        pctNum >= 1 ? `${pctNum.toFixed(1)}%` : pctNum > 0 ? `${pctNum.toFixed(2)}%` : '0%';

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
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: item.payload.fill || item.color
              }}
            />
            <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#0D3B66' }}>
              {item.name}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
            Volume: <strong style={{ color: '#0F172A' }}>{val.toLocaleString()}</strong> calls
          </Typography>
          <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
            Share: <strong style={{ color: '#2563EB' }}>{pctStr}</strong> of total
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // 1. Calls By Year: Outer labels with clean leader lines (e.g. "2025 — 32%", "2026 — 68%")
  const renderYearLabel = (entry) => {
    const { cx, cy, midAngle, outerRadius, percent, name, value } = entry;
    if (!value || value <= 0) return null;
    const RADIAN = Math.PI / 180;
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);

    const isRight = cos >= 0;
    const sx = cx + (outerRadius + 3) * cos;
    const sy = cy + (outerRadius + 3) * sin;
    const mx = cx + (outerRadius + 16) * cos;
    const my = cy + (outerRadius + 16) * sin;
    const ex = mx + (isRight ? 1 : -1) * 20;
    const ey = my;

    const pctStr = `${Math.round(percent * 100)}%`;
    const textAnchor = isRight ? 'start' : 'end';

    return (
      <g>
        <path
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
          stroke="#94A3B8"
          strokeWidth={1.2}
          fill="none"
        />
        <circle cx={sx} cy={sy} r={2.5} fill="#64748B" />
        <text
          x={ex + (isRight ? 1 : -1) * 5}
          y={ey}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fill="#0D3B66"
          fontSize={11.5}
          fontWeight={700}
        >
          {`${name} — ${pctStr}`}
        </text>
      </g>
    );
  };

  const renderYearLegend = (value) => {
    const item = data.find((d) => d.name === value);
    if (!item) return value;
    const val = Number(item.value) || 0;
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    return (
      <span style={{ color: '#334155', fontWeight: 600, fontSize: '11px' }}>
        {value}: <span style={{ color: '#64748B', fontWeight: 500 }}>{val.toLocaleString()}</span>{' '}
        <span style={{ color: '#0D3B66', fontWeight: 700 }}>({pct}%)</span>
      </span>
    );
  };

  // 2. Call Ending Point: Category + percentage outside with non-colliding leader lines
  const renderCallEndLabel = (entry) => {
    const { cx, cy, midAngle, outerRadius, name, value } = entry;
    if (!value || value <= 0) return null;
    const RADIAN = Math.PI / 180;
    const cos = Math.cos(-midAngle * RADIAN);
    const sin = Math.sin(-midAngle * RADIAN);

    const pctNum = total > 0 ? (value / total) * 100 : 0;
    const pctStr =
      pctNum >= 1 ? `${pctNum.toFixed(1)}%` : pctNum > 0 ? `${pctNum.toFixed(2)}%` : '0%';

    const isRight = cos >= 0;
    const sx = cx + (outerRadius + 3) * cos;
    const sy = cy + (outerRadius + 3) * sin;

    // Guaranteed collision prevention:
    // Queue is shifted to upper-right (ey = cy - 24)
    // IVR is shifted to lower-right (ey = cy + 24)
    // Agent is at natural slice on the left
    let targetY = cy + (outerRadius + 18) * sin;
    let mx = cx + (outerRadius + 18) * cos;

    if (name === 'Queue') {
      targetY = cy - 24;
      mx = cx + (outerRadius + 22) * Math.max(cos, 0.4);
    } else if (name === 'IVR') {
      targetY = cy + 24;
      mx = cx + (outerRadius + 22) * Math.max(cos, 0.4);
    }

    const ex = mx + (isRight ? 1 : -1) * 20;
    const ey = targetY;
    const textAnchor = isRight ? 'start' : 'end';

    return (
      <g>
        <path
          d={`M${sx},${sy}L${mx},${ey}L${ex},${ey}`}
          stroke="#94A3B8"
          strokeWidth={1.2}
          fill="none"
        />
        <circle cx={sx} cy={sy} r={2.5} fill="#64748B" />
        <text
          x={ex + (isRight ? 1 : -1) * 5}
          y={ey}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fill="#0D3B66"
          fontSize={11.5}
          fontWeight={700}
        >
          {`${name} — ${pctStr}`}
        </text>
      </g>
    );
  };

  const renderCallEndLegend = (value) => {
    const item = data.find((d) => d.name === value);
    if (!item) return value;
    const val = Number(item.value) || 0;
    const pctNum = total > 0 ? (val / total) * 100 : 0;
    const pctStr =
      pctNum >= 1 ? `${pctNum.toFixed(1)}%` : pctNum > 0 ? `${pctNum.toFixed(2)}%` : '0%';
    return (
      <span style={{ color: '#334155', fontWeight: 600, fontSize: '11px' }}>
        {value}: <span style={{ color: '#64748B', fontWeight: 500 }}>{val.toLocaleString()}</span>{' '}
        <span style={{ color: '#0D3B66', fontWeight: 700 }}>({pctStr})</span>
      </span>
    );
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
      {/* 1. Header with clear separation of bold title and subtitle on its own line */}
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

      {/* 2. Content */}
      <Box sx={{ width: '100%', flex: 1, minHeight: height }}>
        {data.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>
              No data available for current filters
            </Typography>
          </Box>
        ) : resolvedVariant === 'multiCategory' ? (
          /* Multi-category Donut Layout (Group Distribution, Disposition Distribution) */
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              height: '100%',
              gap: 1.5
            }}
          >
            {/* Donut Chart: 40% width, centered */}
            <Box
              sx={{
                width: { xs: '100%', sm: '38%', md: '40%' },
                height: { xs: 180, sm: '100%' },
                minHeight: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    isAnimationActive={false}
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={entry.name || index}
                        fill={INBOUND_CHART_COLORS[index % INBOUND_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Structured Legend List: 60% width with wrapping and full names */}
            <Box
              sx={{
                width: { xs: '100%', sm: '62%', md: '60%' },
                maxHeight: height - 10,
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: 0.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: '4px' }
              }}
            >
              {data.map((entry, index) => {
                const color = INBOUND_CHART_COLORS[index % INBOUND_CHART_COLORS.length];
                const val = Number(entry.value) || 0;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return (
                  <MuiTooltip
                    key={entry.name || index}
                    title={`${entry.name}: ${val.toLocaleString()} calls (${pct}%)`}
                    arrow
                    placement="left"
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1,
                        py: '3.5px',
                        borderRadius: '4px',
                        bgcolor: index % 2 === 0 ? '#F8FAFC' : '#FFFFFF',
                        border: '1px solid #F1F5F9',
                        fontSize: '11px',
                        cursor: 'default',
                        transition: 'background-color 0.1s ease',
                        '&:hover': { bgcolor: '#F1F5F9' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0, flex: 1, pr: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                        <Typography
                          sx={{
                            fontSize: '11px',
                            color: '#334155',
                            fontWeight: 500,
                            lineHeight: 1.25,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {entry.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: '10.5px', color: '#64748B', fontFamily: 'monospace' }}>
                          {val.toLocaleString()}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#0D3B66',
                            minWidth: 40,
                            textAlign: 'right'
                          }}
                        >
                          {pct}%
                        </Typography>
                      </Box>
                    </Box>
                  </MuiTooltip>
                );
              })}
            </Box>
          </Box>
        ) : resolvedVariant === 'year' ? (
          /* Calls By Year Layout: Centered donut with dynamic "Year — %" outer leader lines */
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 12, right: 24, bottom: 8, left: 24 }}>
              <Pie
                isAnimationActive={false}
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={3}
                label={renderYearLabel}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name || index}
                    fill={INBOUND_CHART_COLORS[index % INBOUND_CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={renderYearLegend}
                wrapperStyle={{
                  fontSize: '11px',
                  paddingTop: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : resolvedVariant === 'callEnd' ? (
          /* Call Ending Point Layout: Centered donut with dynamic "Category — %" outer non-colliding leader lines */
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 12, right: 24, bottom: 8, left: 24 }}>
              <Pie
                isAnimationActive={false}
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="46%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={2}
                label={renderCallEndLabel}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name || index}
                    fill={INBOUND_CHART_COLORS[index % INBOUND_CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                formatter={renderCallEndLegend}
                wrapperStyle={{
                  fontSize: '11px',
                  paddingTop: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          /* Standard Donut Layout */
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                isAnimationActive={false}
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={76}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name || index}
                    fill={INBOUND_CHART_COLORS[index % INBOUND_CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '11px',
                  paddingTop: '10px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
