import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, ButtonGroup, Button, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { Info, Lightbulb } from 'lucide-react';

export default function Chart3DistrictPerformance({ data = [], onDrillDown, onViewInsight }) {
  const [sortBy, setSortBy] = useState('total'); // 'total', 'pending', 'rate'
  const [metricMode, setMetricMode] = useState('volume'); // 'volume' | 'rate'

  // Extract or calculate dynamic statewide benchmark from current filtered dataset
  const stateAvg = useMemo(() => {
    if (data && data.length > 0 && data[0].stateAvgClosureRate != null) {
      return Number(data[0].stateAvgClosureRate);
    }
    const totalCases = data.reduce((acc, d) => acc + (d.total || 0), 0);
    const totalClosed = data.reduce((acc, d) => acc + (d.closed || 0), 0);
    if (totalCases > 0) {
      return Number(((totalClosed / totalCases) * 100).toFixed(1));
    }
    return 0;
  }, [data]);

  // Sort data copy
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      if (sortBy === 'pending') return b.pending - a.pending;
      if (sortBy === 'rate') return a.closureRate - b.closureRate; // lowest closure rate first
      return b.total - a.total;
    }).slice(0, 15).reverse(); // top 15, reversed for horizontal bars (highest at top)
  }, [data, sortBy]);

  const districtNames = sorted.map((d) => d.district);
  const closedValues = sorted.map((d) => d.closed);
  const pendingValues = sorted.map((d) => d.pending);

  const tooltipFormatter = (params) => {
    const item = sorted[params[0]?.dataIndex];
    if (!item) return '';
    const variance = item.varianceFromStateAvg ?? +(item.closureRate - stateAvg).toFixed(1);
    const varianceSign = variance >= 0 ? '+' : '';
    const varianceColor = variance >= 0 ? '#10B981' : '#EF4444';
    const varianceLabel = variance >= 0 ? 'Above Benchmark' : 'Lagging Benchmark';

    return `<div style="font-weight:700;margin-bottom:5px;color:#0D3B66;font-size:11.5px;border-bottom:1px solid #E2E8F0;padding-bottom:3px;">
        District: ${item.district}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
        <span style="color:#10B981;">● Closed Cases:</span>
        <span style="font-weight:700;color:#0F172A;">${item.closed?.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
        <span style="color:#F59E0B;">● Pending Cases:</span>
        <span style="font-weight:700;color:#0F172A;">${item.pending?.toLocaleString()}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
        <span style="color:#0D3B66;">● Total Cases:</span>
        <span style="font-weight:700;color:#0F172A;">${item.total?.toLocaleString()}</span>
      </div>
      <div style="border-top:1px dashed #E2E8F0;margin:4px 0;padding-top:3px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
          <span style="color:#0284C7;font-weight:600;">Closure Rate:</span>
          <span style="font-weight:700;color:#0284C7;">${item.closureRate}%</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
          <span style="color:#64748B;">State Benchmark:</span>
          <span style="font-weight:700;color:#64748B;">${stateAvg}%</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;">
          <span style="color:${varianceColor};font-weight:600;">Benchmark Delta:</span>
          <span style="font-weight:700;color:${varianceColor};">${varianceSign}${variance}% (${varianceLabel})</span>
        </div>
      </div>
      <div style="font-size:10px;color:#64748B;margin-top:3px;font-style:italic;">Click bar to inspect district grievances</div>`;
  };

  const option = metricMode === 'rate'
    ? {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          confine: true,
          extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid #E2E8F0; max-width: 290px; white-space: normal; word-break: break-word; pointer-events: none;',
          position: function (pos, params, dom, rect, size) {
            if (!size || !size.contentSize || !size.viewSize) return pos;
            const [x, y] = pos;
            const [tipW, tipH] = size.contentSize;
            const [viewW, viewH] = size.viewSize;

            let posX = x + 15;
            if (posX + tipW > viewW - 10) {
              posX = x - tipW - 15;
            }
            if (posX < 8) posX = 8;
            if (posX + tipW > viewW - 8) posX = Math.max(8, viewW - tipW - 8);

            let posY = y - tipH / 2;
            if (posY < 8) posY = 8;
            if (posY + tipH > viewH - 8) posY = Math.max(8, viewH - tipH - 8);

            return [posX, posY];
          },
          formatter: tooltipFormatter,
        },
        legend: { show: false },
        grid: { left: 6, right: 32, bottom: 8, top: 14, containLabel: true },
        xAxis: {
          type: 'value',
          max: 100,
          axisLabel: { color: '#64748B', fontSize: 10, formatter: '{value}%' },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
        },
        yAxis: {
          type: 'category',
          data: districtNames,
          axisLabel: { color: '#334155', fontWeight: 500, fontSize: 10 },
          axisTick: { alignWithLabel: true },
        },
        series: [
          {
            name: 'Closure Rate (%)',
            type: 'bar',
            barWidth: 10,
            z: 3,
            data: sorted.map((d) => {
              const isAbove = d.closureRate >= stateAvg;
              const placeInside = d.closureRate < stateAvg && d.closureRate >= 18;
              return {
                value: d.closureRate,
                itemStyle: {
                  color: isAbove ? '#10B981' : '#EF4444',
                  borderRadius: [0, 3, 3, 0],
                },
                label: {
                  show: true,
                  position: placeInside ? 'insideRight' : 'right',
                  distance: placeInside ? 4 : 5,
                  formatter: '{c}%',
                  fontSize: placeInside ? 9 : 10,
                  fontWeight: placeInside ? 700 : 600,
                  color: placeInside ? '#FFFFFF' : '#334155',
                },
              };
            }),
            markLine: {
              z: 1,
              symbol: 'none',
              silent: true,
              data: [
                {
                  xAxis: stateAvg,
                  name: 'State Benchmark',
                  lineStyle: { color: '#0D3B66', type: 'dashed', width: 1.8 },
                  label: {
                    show: false, // Label remains outside plotting area in the legend
                  },
                },
              ],
            },
          },
        ],
      }
    : {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          confine: true,
          extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid #E2E8F0; max-width: 290px; white-space: normal; word-break: break-word; pointer-events: none;',
          position: function (pos, params, dom, rect, size) {
            if (!size || !size.contentSize || !size.viewSize) return pos;
            const [x, y] = pos;
            const [tipW, tipH] = size.contentSize;
            const [viewW, viewH] = size.viewSize;

            let posX = x + 15;
            if (posX + tipW > viewW - 10) {
              posX = x - tipW - 15;
            }
            if (posX < 8) posX = 8;
            if (posX + tipW > viewW - 8) posX = Math.max(8, viewW - tipW - 8);

            let posY = y - tipH / 2;
            if (posY < 8) posY = 8;
            if (posY + tipH > viewH - 8) posY = Math.max(8, viewH - tipH - 8);

            return [posX, posY];
          },
          formatter: tooltipFormatter,
        },
        legend: { show: false },
        grid: { left: 6, right: 16, bottom: 8, top: 14, containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#64748B', fontSize: 10 },
          splitLine: { lineStyle: { color: '#F1F5F9' } },
        },
        yAxis: {
          type: 'category',
          data: districtNames,
          axisLabel: { color: '#334155', fontWeight: 500, fontSize: 10 },
          axisTick: { alignWithLabel: true },
        },
        series: [
          {
            name: 'Closed Cases',
            type: 'bar',
            stack: 'total',
            barWidth: 9,
            data: closedValues,
            itemStyle: { color: '#10B981' },
          },
          {
            name: 'Pending Cases',
            type: 'bar',
            stack: 'total',
            barWidth: 9,
            data: pendingValues,
            itemStyle: { color: '#F59E0B', borderRadius: [0, 3, 3, 0] },
          },
        ],
      };

  const onChartClick = (params) => {
    if (onDrillDown && params.name) {
      onDrillDown({ district: params.name });
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '10px 14px 12px !important', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Header Row: Title & Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 0.75, minHeight: '30px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D3B66', whiteSpace: 'nowrap' }}>
              District Performance
            </Typography>
            <Tooltip
              title={`Compares closure efficacy across districts against the state benchmark (${stateAvg}%) to spotlight administrative bottlenecks and direct state field support.`}
              arrow
              placement="top"
            >
              <Box component="span" sx={{ display: 'inline-flex', cursor: 'pointer', color: '#94A3B8', '&:hover': { color: '#0D3B66' } }}>
                <Info size={14} />
              </Box>
            </Tooltip>
            {onViewInsight && (
              <Button
                size="small"
                startIcon={<Lightbulb size={13} color="#D97706" />}
                onClick={() => onViewInsight('Chart3')}
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
                  '&:hover': { bgcolor: '#FDE68A' },
                }}
              >
                Insights
              </Button>
            )}
          </Box>

          {/* Explicit, Compact Control Groups */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            {/* Group 1: View */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                View:
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={metricMode}
                exclusive
                onChange={(e, val) => val && setMetricMode(val)}
                sx={{
                  height: 24,
                  '& .MuiToggleButton-root': {
                    fontSize: '0.68rem',
                    py: 0.1,
                    px: 0.75,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#475569',
                    borderColor: '#CBD5E1',
                    '&.Mui-selected': {
                      bgcolor: '#0D3B66 !important',
                      color: '#FFFFFF !important',
                      '&:hover': { bgcolor: '#0B2E50 !important' },
                    },
                  },
                }}
              >
                <ToggleButton value="volume">Cases</ToggleButton>
                <ToggleButton value="rate">Closure %</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Group 2: Sort by */}
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
              <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Sort by:
              </Typography>
              <ButtonGroup
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  '& .MuiButton-root': {
                    fontSize: '0.68rem',
                    py: 0.1,
                    px: 0.65,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#CBD5E1',
                    color: '#475569',
                  },
                }}
              >
                <Button
                  variant={sortBy === 'total' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('total')}
                  sx={{
                    bgcolor: sortBy === 'total' ? '#0D3B66 !important' : 'transparent',
                    color: sortBy === 'total' ? '#FFFFFF !important' : '#475569',
                  }}
                >
                  Total Cases
                </Button>
                <Button
                  variant={sortBy === 'pending' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('pending')}
                  sx={{
                    bgcolor: sortBy === 'pending' ? '#0D3B66 !important' : 'transparent',
                    color: sortBy === 'pending' ? '#FFFFFF !important' : '#475569',
                  }}
                >
                  Pending Cases
                </Button>
                <Button
                  variant={sortBy === 'rate' ? 'contained' : 'outlined'}
                  onClick={() => setSortBy('rate')}
                  sx={{
                    bgcolor: sortBy === 'rate' ? '#0D3B66 !important' : 'transparent',
                    color: sortBy === 'rate' ? '#FFFFFF !important' : '#475569',
                  }}
                >
                  Lowest Closure %
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        </Box>

        {/* Custom Compact React Legend / Benchmark Indicator Outside Plotting Area */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 0.5, flexWrap: 'wrap', minHeight: '20px' }}>
          {metricMode === 'volume' ? (
            <>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, userSelect: 'none' }}>
                <Box sx={{ width: 12, height: 9, bgcolor: '#10B981', borderRadius: '2px' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
                  Closed Cases
                </Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, userSelect: 'none' }}>
                <Box sx={{ width: 12, height: 9, bgcolor: '#F59E0B', borderRadius: '2px' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
                  Pending Cases
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, userSelect: 'none' }}>
                <Box sx={{ width: 12, height: 9, bgcolor: '#10B981', borderRadius: '2px' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
                  ≥ State Avg ({stateAvg}%)
                </Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, userSelect: 'none' }}>
                <Box sx={{ width: 12, height: 9, bgcolor: '#EF4444', borderRadius: '2px' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
                  &lt; State Avg (Lagging)
                </Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, userSelect: 'none' }}>
                <Box sx={{ width: 16, height: 0, borderTop: '2px dashed #0D3B66' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#0D3B66' }}>
                  State Benchmark: {stateAvg}%
                </Typography>
              </Box>
            </>
          )}
        </Box>

        {/* Chart Canvas Box */}
        <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
          <ReactECharts
            option={option}
            notMerge={true}
            style={{ height: '100%', width: '100%' }}
            onEvents={{ click: onChartClick }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
