import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, Typography, Box, Button, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { Info, Lightbulb } from 'lucide-react';

export default function Chart4RootCauseGap({ data = [], onDrillDown, onViewInsight }) {
  const echartsRef = useRef(null);
  const [showAll, setShowAll] = useState(false); // default: Top 10
  const [legendState, setLegendState] = useState({
    'Closed Cases': true,
    'Pending Cases': true,
  });

  // Sort and slice: default Top 10, or All 15, then reverse for horizontal bar order (top at top)
  const visibleData = useMemo(() => {
    const list = [...data].sort((a, b) => (b.total || 0) - (a.total || 0));
    const sliced = showAll ? list.slice(0, 15) : list.slice(0, 10);
    return sliced.reverse();
  }, [data, showAll]);

  const reasons = visibleData.map((d) => d.reason);
  const closedVals = visibleData.map((d) => d.closed);
  const pendingVals = visibleData.map((d) => d.pending);

  const handleLegendToggle = (name) => {
    setLegendState((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      const echartInstance = echartsRef.current?.getEchartsInstance();
      if (echartInstance) {
        echartInstance.dispatchAction({
          type: 'legendToggleSelect',
          name,
        });
      }
      return next;
    });
  };

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true,
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid #E2E8F0; max-width: 300px; white-space: normal; word-break: break-word; pointer-events: none;',
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
      formatter: (params) => {
        const item = visibleData[params[0]?.dataIndex];
        if (!item) return '';
        const closedPct = item.total > 0 ? ((item.closed / item.total) * 100).toFixed(1) : '0.0';
        const pendingPct = item.total > 0 ? ((item.pending / item.total) * 100).toFixed(1) : '0.0';
        return `<div style="font-weight:700;margin-bottom:4px;color:#0D3B66;font-size:11.5px;border-bottom:1px solid #E2E8F0;padding-bottom:3px;white-space:normal;word-break:break-word;">
            ${item.reason}
          </div>
          <div style="font-size:10.5px;color:#64748B;margin:3px 0;">Category: <b style="color:#1E293B;">${item.category}</b></div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
            <span style="color:#0D9488;">● Closed Cases:</span>
            <span style="font-weight:700;color:#0F172A;">${item.closed?.toLocaleString()} (${closedPct}%)</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
            <span style="color:#F59E0B;">● Pending Cases:</span>
            <span style="font-weight:700;color:#0F172A;">${item.pending?.toLocaleString()} (${pendingPct}%)</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:2px;">
            <span style="color:#475569;">● Total Cases:</span>
            <span style="font-weight:700;color:#0F172A;">${item.total?.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;border-top:1px dashed #E2E8F0;margin-top:3px;padding-top:3px;">
            <span style="color:#EF4444;font-weight:600;">Pending Backlog %:</span>
            <span style="font-weight:700;color:#EF4444;">${pendingPct}%</span>
          </div>
          <div style="font-size:10px;color:#64748B;margin-top:3px;font-style:italic;">Click bar to inspect matching complaints</div>`;
      },
    },
    legend: {
      show: false,
      data: ['Closed Cases', 'Pending Cases'],
      selected: legendState,
    },
    grid: { left: 8, right: 38, bottom: 8, top: 14, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: '#64748B', fontSize: 10 },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    yAxis: {
      type: 'category',
      data: reasons,
      axisLabel: {
        color: '#334155',
        fontSize: 9.5,
        fontWeight: 500,
        lineHeight: 12,
        formatter: (val) => {
          if (!val) return '';
          if (val.length <= 26) return val;
          const words = val.split(' ');
          let line1 = '';
          let line2 = '';
          for (let i = 0; i < words.length; i++) {
            const next = line1 ? `${line1} ${words[i]}` : words[i];
            if (next.length <= 26) {
              line1 = next;
            } else {
              line2 = words.slice(i).join(' ');
              break;
            }
          }
          if (line2.length > 30) {
            line2 = `${line2.substring(0, 28)}…`;
          }
          return line2 ? `${line1}\n${line2}` : line1;
        },
      },
      axisTick: { alignWithLabel: true },
    },
    series: [
      {
        name: 'Closed Cases',
        type: 'bar',
        stack: 'total',
        barWidth: 9,
        data: closedVals,
        itemStyle: { color: '#0D9488' },
      },
      {
        name: 'Pending Cases',
        type: 'bar',
        stack: 'total',
        barWidth: 9,
        data: pendingVals,
        itemStyle: { color: '#F59E0B', borderRadius: [0, 3, 3, 0] },
        label: {
          show: true,
          position: 'right',
          distance: 6,
          formatter: (params) => {
            const item = visibleData[params.dataIndex];
            return item && item.total > 0 ? item.total.toLocaleString() : '';
          },
          fontSize: 10,
          fontWeight: 600,
          color: '#475569',
        },
      },
    ],
  };

  const onChartClick = (params) => {
    if (onDrillDown && params.name) {
      onDrillDown({ grievanceType: params.name });
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '10px 14px 12px !important', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, flexWrap: 'wrap', gap: 0.75, minHeight: '30px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="h6" sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D3B66', whiteSpace: 'nowrap' }}>
              Root Cause Analysis
            </Typography>
            <Tooltip
              title="Quantifies the resolution deficit across grievance subcategories to isolate operational process hurdles versus easily resolved requests."
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
                onClick={() => onViewInsight('Chart4')}
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

          {/* Compact Top 10 / All 15 Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Show:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={showAll ? 'all' : 'top10'}
              exclusive
              onChange={(e, val) => val && setShowAll(val === 'all')}
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
              <ToggleButton value="top10">Top 10</ToggleButton>
              <ToggleButton value="all">All 15</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Custom Compact Legend Row */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 0.5, flexWrap: 'wrap', minHeight: '20px' }}>
          <Box
            onClick={() => handleLegendToggle('Closed Cases')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              opacity: legendState['Closed Cases'] ? 1 : 0.4,
              transition: 'opacity 0.2s',
              userSelect: 'none',
            }}
          >
            <Box sx={{ width: 12, height: 9, bgcolor: '#0D9488', borderRadius: '2px' }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
              Closed Cases
            </Typography>
          </Box>

          <Box
            onClick={() => handleLegendToggle('Pending Cases')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              opacity: legendState['Pending Cases'] ? 1 : 0.4,
              transition: 'opacity 0.2s',
              userSelect: 'none',
            }}
          >
            <Box sx={{ width: 12, height: 9, bgcolor: '#F59E0B', borderRadius: '2px' }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
              Pending Cases
            </Typography>
          </Box>
        </Box>

        {/* Chart Canvas Box */}
        <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
          <ReactECharts
            ref={echartsRef}
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
