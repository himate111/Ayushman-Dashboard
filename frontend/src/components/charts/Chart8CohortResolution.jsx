import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { Info, Lightbulb } from 'lucide-react';

export default function Chart8CohortResolution({ data = [], onDrillDown, onViewInsight }) {
  const cohorts = useMemo(() => data.map((d) => d.registrationCohort), [data]);
  const closedPcts = useMemo(() => data.map((d) => Number(d.closedPercentage) || 0), [data]);
  // Calculate pending percentage so stacked bar always totals exactly 100%
  const pendingPcts = useMemo(() => data.map((d) => {
    const c = Number(d.closedPercentage) || 0;
    return Number((100 - c).toFixed(1));
  }), [data]);

  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid #E2E8F0; max-width: 290px; pointer-events: none;',
        position: function (pos, params, dom, rect, size) {
          if (!size || !size.contentSize || !size.viewSize) return pos;
          const [x, y] = pos;
          const [tipW, tipH] = size.contentSize;
          const [viewW, viewH] = size.viewSize;

          let posX = x + 15;
          if (posX + tipW > viewW - 10) posX = x - tipW - 15;
          if (posX < 8) posX = 8;
          if (posX + tipW > viewW - 8) posX = Math.max(8, viewW - tipW - 8);

          let posY = y - tipH / 2;
          if (posY < 8) posY = 8;
          if (posY + tipH > viewH - 8) posY = Math.max(8, viewH - tipH - 8);

          return [posX, posY];
        },
        formatter: (params) => {
          const item = data[params[0]?.dataIndex];
          if (!item) return '';
          return `<div style="font-family: inherit; font-size: 11px; line-height: 1.45; color: #1E293B; min-width: 220px; max-width: 280px;">
            <div style="font-weight: 700; font-size: 12px; color: #0D3B66; padding-bottom: 4px; border-bottom: 1px solid #E2E8F0; margin-bottom: 6px;">
              Cohort: ${item.registrationCohort}
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Total Registered:</span>
              <span style="font-weight: 700; color: #0D3B66;">${item.totalRegistered?.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #0D9488;">Closed (%):</span>
              <span style="font-weight: 700; color: #0D9488;">${item.currentClosed?.toLocaleString()} (${item.closedPercentage}%)</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #D97706;">Still Pending (%):</span>
              <span style="font-weight: 700; color: #D97706;">${item.currentPending?.toLocaleString()} (${item.pendingPercentage}%)</span>
            </div>
            <div style="font-size: 10px; color: #94A3B8; font-style: italic; border-top: 1px dashed #E2E8F0; padding-top: 4px; margin-top: 4px;">
              Current cumulative closure status of cases registered in this cohort
            </div>
          </div>`;
        },
      },
      legend: { show: false }, // Dedicated React layout legend row above chart canvas
      grid: {
        left: 8,
        right: 12,
        bottom: 8,
        top: 12,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: cohorts,
        axisTick: { alignWithLabel: true, lineStyle: { color: '#CBD5E1' } },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          interval: 0,
          color: '#475569',
          fontSize: 10,
          fontWeight: 500,
          formatter: (val) => {
            // "Jan 2026" -> "Jan\n'26" for clear multi-line formatting without collisions
            return val.replace(' 2026', "\n'26");
          },
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        interval: 20,
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: '{value}%',
        },
        splitLine: {
          lineStyle: {
            color: '#F1F5F9',
          },
        },
      },
      series: [
        {
          name: 'Closed (%)',
          type: 'bar',
          stack: 'pct',
          barWidth: 22,
          data: closedPcts,
          itemStyle: { color: '#0D9488' }, // Teal / Green consistent with dashboard
        },
        {
          name: 'Still Pending (%)',
          type: 'bar',
          stack: 'pct',
          barWidth: 22,
          data: pendingPcts,
          itemStyle: { color: '#F59E0B', borderRadius: [3, 3, 0, 0] }, // Amber consistent with dashboard
        },
      ],
    };
  }, [cohorts, closedPcts, pendingPcts, data]);

  const onChartClick = (params) => {
    if (onDrillDown && params.name) {
      onDrillDown({ status: 'Pending' });
    }
  };

  return (
    <Card sx={{ height: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '10px 14px 10px !important', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', mb: '6px' }}>
          {/* Row 1: Title, Info, and Insights Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '26px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="h6" sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D3B66', whiteSpace: 'nowrap' }}>
                Cohort Closure Status
              </Typography>
              <Tooltip
                title="Visualizes cumulative closure status of complaints partitioned by registration month. Methodological limitation: Shows cumulative resolution standing as of today. Because historical resolution timestamps are omitted in 93.3% of closed records, historical resolution velocity cannot be established from missing resolution dates."
                arrow
                placement="top"
              >
                <Box component="span" sx={{ display: 'inline-flex', cursor: 'pointer', color: '#94A3B8', '&:hover': { color: '#0D3B66' } }}>
                  <Info size={14} />
                </Box>
              </Tooltip>
            </Box>

            {onViewInsight && (
              <Button
                size="small"
                startIcon={<Lightbulb size={13} color="#D97706" />}
                onClick={() => onViewInsight('Chart8')}
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

          {/* Row 2: Subtitle on Left, Dedicated React Legend on Right */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, minHeight: '18px' }}>
            <Typography sx={{ fontSize: '0.62rem', color: '#94A3B8', letterSpacing: '0.01em' }}>
              Closure status of grievances grouped by registration month.
            </Typography>

            {/* Dedicated React Legend Row — completely outside chart canvas */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: '#0D9488' }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                  Closed (%)
                </Typography>
              </Box>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: '#F59E0B' }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#475569' }}>
                  Still Pending (%)
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Chart Area */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 285, width: '100%', minWidth: 0, justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minHeight: 0, width: '100%', minWidth: 0 }}>
            <ReactECharts
              option={option}
              notMerge={true}
              style={{ height: '100%', width: '100%' }}
              onEvents={{ click: onChartClick }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
