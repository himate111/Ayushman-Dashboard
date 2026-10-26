import React, { useState, useRef } from 'react';
import { Card, CardContent, Typography, Box, Button, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { ExternalLink, Info, Lightbulb } from 'lucide-react';

export default function Chart1BacklogMovement({ data = [], onDrillDown, onViewInsight }) {
  const echartsRef = useRef(null);
  const [legendState, setLegendState] = useState({
    'Intake': true,
    'Unresolved': true,
    'Cumulative Unresolved': true,
  });

  const periods = data.map((d) => d.period);
  const registrations = data.map((d) => d.registrations);
  const currentPending = data.map((d) => d.currentPendingRegisteredInPeriod);
  const cumulativeBacklog = data.map((d) => d.cumulativeBacklog);

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
      axisPointer: { type: 'cross', label: { fontSize: 10 } },
      confine: true,
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid #E2E8F0; max-width: 280px; white-space: normal; word-break: break-word; pointer-events: none;',
      position: function (pos, params, dom, rect, size) {
        if (!size || !size.contentSize || !size.viewSize) return pos;
        const [x, y] = pos;
        const [tipW, tipH] = size.contentSize;
        const [viewW, viewH] = size.viewSize;

        // Place to the right of cursor by default; flip to left if near right edge
        let posX = x + 15;
        if (posX + tipW > viewW - 10) {
          posX = x - tipW - 15;
        }
        // Strict boundary protection for left and right
        if (posX < 8) posX = 8;
        if (posX + tipW > viewW - 8) posX = Math.max(8, viewW - tipW - 8);

        // Vertical positioning centered on cursor, clamped to chart viewport
        let posY = y - tipH / 2;
        if (posY < 8) posY = 8;
        if (posY + tipH > viewH - 8) posY = Math.max(8, viewH - tipH - 8);

        return [posX, posY];
      },
      formatter: (params) => {
        if (!params || !params.length) return '';
        let html = `<div style="font-weight:700;margin-bottom:6px;color:#0D3B66;font-size:12px;border-bottom:1px solid #E2E8F0;padding-bottom:4px;">Intake Cohort: ${params[0]?.axisValue}</div>`;
        const fullNameMap = {
          'Intake': 'Registration Intake',
          'Unresolved': 'Currently Unresolved',
          'Cumulative Unresolved': 'Cumulative Unresolved',
        };
        params.forEach((p) => {
          const displayName = fullNameMap[p.seriesName] || p.seriesName;
          html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:11px;margin-bottom:3px;">
            <span style="color:#475569;">${p.marker} ${displayName}:</span>
            <span style="font-weight:700;color:#0F172A;margin-left:auto;">${p.value != null ? p.value.toLocaleString() : '0'}</span>
          </div>`;
        });
        return html;
      },
    },
    legend: {
      show: false,
      data: ['Intake', 'Unresolved', 'Cumulative Unresolved'],
      selected: legendState,
    },
    grid: { 
      left: 6, 
      right: 12, 
      bottom: 8, 
      top: 30, 
      containLabel: true 
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: { 
        color: '#64748B', 
        fontSize: 10.5, 
        fontWeight: 500,
        formatter: (val) => val ? val.replace(' 20', " '") : val,
      },
      axisTick: { alignWithLabel: true },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Complaints',
        nameGap: 8,
        nameTextStyle: { color: '#64748B', fontSize: 10.5, fontWeight: 600, align: 'left' },
        axisLabel: { color: '#64748B', fontSize: 10.5 },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      {
        type: 'value',
        name: 'Unresolved',
        nameGap: 8,
        nameTextStyle: { color: '#EF4444', fontSize: 10.5, fontWeight: 600, align: 'right' },
        axisLabel: { 
          color: '#EF4444', 
          fontSize: 10.5,
          formatter: (val) => (val === 0 ? '0' : val >= 1000 ? `${val / 1000}k` : val),
        },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Intake',
        type: 'bar',
        data: registrations,
        itemStyle: { color: '#0D3B66', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 24,
      },
      {
        name: 'Unresolved',
        type: 'bar',
        data: currentPending,
        itemStyle: { color: '#F59E0B', borderRadius: [3, 3, 0, 0] },
        barMaxWidth: 24,
      },
      {
        name: 'Cumulative Unresolved',
        type: 'line',
        yAxisIndex: 1,
        data: cumulativeBacklog,
        itemStyle: { color: '#EF4444' },
        lineStyle: { width: 2.5, type: 'solid' },
        symbol: 'circle',
        symbolSize: 6,
      },
    ],
  };

  const onChartClick = (params) => {
    if (onDrillDown && params.name) {
      const isPendingSeries = params.seriesName === 'Unresolved' || params.seriesName === 'Cumulative Unresolved';
      onDrillDown({
        status: isPendingSeries ? 'Pending' : 'All',
      });
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '10px 14px 12px !important', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, minHeight: '30px', flexWrap: 'wrap', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D3B66', whiteSpace: 'nowrap' }}>
              Grievance Intake & Backlog
            </Typography>
            <Tooltip
              title="Methodological Limitation: The red cumulative line represents currently unresolved complaints accumulated across registration cohorts, NOT historical month-end backlog. Primary source provides explicit closure dates for only 94 of 5,154 cases (1.8%), so historical resolution velocity cannot be established from missing resolution dates."
              arrow
              placement="top"
            >
              <Box component="span" sx={{ display: 'inline-flex', cursor: 'pointer', color: '#94A3B8', '&:hover': { color: '#0D3B66' } }}>
                <Info size={14} />
              </Box>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexShrink: 0 }}>
            {onViewInsight && (
              <Button
                size="small"
                startIcon={<Lightbulb size={13} color="#D97706" />}
                onClick={() => onViewInsight('Chart1')}
                sx={{
                  fontSize: '0.72rem',
                  color: '#92400E',
                  bgcolor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  py: 0.2,
                  px: { xs: 0.6, sm: 0.8 },
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '6px',
                  '&:hover': { bgcolor: '#FDE68A' },
                }}
              >
                Insights
              </Button>
            )}
            {onDrillDown && (
              <Button
                size="small"
                endIcon={<ExternalLink size={13} />}
                onClick={() => onDrillDown({ status: 'Pending' })}
                sx={{ fontSize: '0.72rem', color: '#0D3B66', py: 0.2, px: { xs: 0.6, sm: 0.8 }, textTransform: 'none', fontWeight: 600 }}
              >
                Drill-down
              </Button>
            )}
          </Box>
        </Box>

        {/* Custom Compact React Legend */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 }, mb: 0.5, flexWrap: 'wrap' }}>
          <Box
            onClick={() => handleLegendToggle('Intake')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              opacity: legendState['Intake'] ? 1 : 0.4,
              transition: 'opacity 0.2s',
              userSelect: 'none',
            }}
          >
            <Box sx={{ width: 12, height: 10, bgcolor: '#0D3B66', borderRadius: '2px' }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
              Intake
            </Typography>
          </Box>

          <Box
            onClick={() => handleLegendToggle('Unresolved')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              opacity: legendState['Unresolved'] ? 1 : 0.4,
              transition: 'opacity 0.2s',
              userSelect: 'none',
            }}
          >
            <Box sx={{ width: 12, height: 10, bgcolor: '#F59E0B', borderRadius: '2px' }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
              Unresolved
            </Typography>
          </Box>

          <Box
            onClick={() => handleLegendToggle('Cumulative Unresolved')}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              cursor: 'pointer',
              opacity: legendState['Cumulative Unresolved'] ? 1 : 0.4,
              transition: 'opacity 0.2s',
              userSelect: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: 16 }}>
              <Box sx={{ width: '100%', height: 2, bgcolor: '#EF4444' }} />
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EF4444', ml: -1.2 }} />
            </Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 500, color: '#475569' }}>
              Cumulative Unresolved
            </Typography>
          </Box>
        </Box>

        {/* Chart Canvas Box */}
        <Box sx={{ height: 295, width: '100%', overflow: 'hidden' }}>
          <ReactECharts
            ref={echartsRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            onEvents={{ click: onChartClick }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
