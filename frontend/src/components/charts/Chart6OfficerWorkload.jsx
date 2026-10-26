import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { Info, Lightbulb } from 'lucide-react';

export default function Chart6OfficerWorkload({ data = [], onDrillDown, onViewInsight }) {
  // Default selection: Cases + Highest Pending
  const [viewMode, setViewMode] = useState('cases'); // 'cases' | 'pending' | 'rate'
  const [sortBy, setSortBy] = useState('highest_pending'); // 'highest_pending' | 'total_cases' | 'lowest_pending'

  // Sort data copy: bottom-to-top rendering so #1 ranked is at the top of the horizontal chart
  const sorted = useMemo(() => {
    const list = [...data];
    list.sort((a, b) => {
      if (sortBy === 'highest_pending') {
        return (b.pendingCases || 0) - (a.pendingCases || 0) || (b.assignedTotal || 0) - (a.assignedTotal || 0);
      }
      if (sortBy === 'lowest_pending') {
        return (a.pendingCases || 0) - (b.pendingCases || 0) || (a.assignedTotal || 0) - (b.assignedTotal || 0);
      }
      // 'total_cases'
      return (b.assignedTotal || 0) - (a.assignedTotal || 0) || (b.pendingCases || 0) - (a.pendingCases || 0);
    });
    return list.reverse();
  }, [data, sortBy]);

  const officerNames = useMemo(() => {
    return sorted.map((d) => `${d.officerName} (${d.officerLevel})`);
  }, [sorted]);

  const option = useMemo(() => {
    const isCases = viewMode === 'cases';
    const isPending = viewMode === 'pending';
    const isRate = viewMode === 'rate';

    let series = [];
    if (isCases) {
      series = [
        {
          name: 'Closed',
          type: 'bar',
          stack: 'workload',
          barWidth: 9,
          data: sorted.map((d) => d.closedCases || 0),
          itemStyle: { color: '#10B981' }, // Green / Emerald
        },
        {
          name: 'WIP',
          type: 'bar',
          stack: 'workload',
          barWidth: 9,
          data: sorted.map((d) => d.wipCases || 0),
          itemStyle: { color: '#F59E0B' }, // Amber
        },
      ];
    } else if (isPending) {
      series = [
        {
          name: 'WIP',
          type: 'bar',
          barWidth: 9,
          data: sorted.map((d) => d.wipCases || 0),
          itemStyle: { color: '#F59E0B', borderRadius: [0, 3, 3, 0] },
          label: {
            show: true,
            position: 'right',
            distance: 4,
            formatter: (p) => (p.value > 0 ? p.value.toLocaleString() : '0'),
            fontSize: 9.5,
            fontWeight: 600,
            color: '#475569',
          },
        },
      ];
    } else {
      // isRate
      series = [
        {
          name: 'Pending Share (%)',
          type: 'bar',
          barWidth: 9,
          data: sorted.map((d) => d.pendingRate || 0),
          itemStyle: { color: '#F59E0B', borderRadius: [0, 3, 3, 0] },
          label: {
            show: true,
            position: 'right',
            distance: 4,
            formatter: '{c}%',
            fontSize: 9.5,
            fontWeight: 600,
            color: '#475569',
          },
        },
      ];
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        confine: true,
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid #E2E8F0; max-width: 300px; pointer-events: none;',
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
          const item = sorted[params[0]?.dataIndex];
          if (!item) return '';
          return `<div style="font-family: inherit; font-size: 11px; line-height: 1.45; color: #1E293B; min-width: 230px; max-width: 290px;">
            <div style="font-weight: 700; font-size: 12px; color: #0D3B66; padding-bottom: 4px; border-bottom: 1px solid #E2E8F0; margin-bottom: 6px;">
              ${item.officerName} <span style="font-size: 10px; font-weight: 600; color: #64748B;">(${item.officerLevel})</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Assigned Workload:</span>
              <span style="font-weight: 700; color: #0D3B66;">${item.assignedTotal?.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #10B981; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #10B981; border-radius: 2px;"></span>
                Closed:
              </span>
              <span style="font-weight: 700; color: #10B981;">${(item.closedCases || 0).toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #D97706; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #F59E0B; border-radius: 2px;"></span>
                WIP (In Progress):
              </span>
              <span style="font-weight: 700; color: #D97706;">${(item.wipCases || 0).toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px; border-top: 1px dotted #E2E8F0; padding-top: 3px;">
              <span style="color: #475569; font-weight: 600;">Pending Share:</span>
              <span style="font-weight: 700; color: #D97706;">${(item.pendingCases || 0).toLocaleString()} (${item.pendingRate}%)</span>
            </div>
            ${item.averagePendingAgeDays > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Avg Pending Age:</span>
              <span style="font-weight: 700; color: #EF4444;">${item.averagePendingAgeDays} days</span>
            </div>` : ''}
            <div style="font-size: 10px; color: #94A3B8; font-style: italic; border-top: 1px dashed #E2E8F0; padding-top: 4px; margin-top: 4px;">
              Click bar to inspect officer grievances
            </div>
          </div>`;
        },
      },
      legend: isCases
        ? {
            show: true,
            data: ['Closed', 'WIP'],
            top: 0,
            right: 8,
            itemGap: 10,
            itemWidth: 10,
            itemHeight: 7,
            textStyle: { color: '#475569', fontSize: 9.5, fontWeight: 600 },
          }
        : { show: false },
      grid: {
        left: 12,
        right: isCases ? 14 : 36,
        bottom: 6,
        top: isCases ? 18 : 6,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: isRate ? 100 : undefined,
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: isRate ? '{value}%' : (val) => (val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val),
        },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      yAxis: {
        type: 'category',
        data: officerNames,
        axisTick: { alignWithLabel: true, lineStyle: { color: '#CBD5E1' } },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#334155',
          fontWeight: 500,
          fontSize: 10,
          margin: 6,
        },
      },
      series,
    };
  }, [sorted, officerNames, viewMode]);

  const onChartClick = (params) => {
    if (onDrillDown && params.dataIndex !== undefined) {
      const item = sorted[params.dataIndex];
      if (item) {
        onDrillDown({ officer: item.officerName });
      }
    }
  };

  return (
    <Card sx={{ height: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '10px 14px 10px !important', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', mb: '7px' }}>
          {/* Row 1: Officer Workload title + info icon on the left, Insights button on the far right */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '26px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="h6" sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D3B66', whiteSpace: 'nowrap' }}>
                Officer Workload
              </Typography>
              <Tooltip
                title="Examines case load distribution and ageing across assigned grievance officers (5,146 assigned cases). Unassigned intake complaints (8 open cases) are tracked in the intake queue and reflected in overall KPIs."
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
                onClick={() => onViewInsight('Chart6')}
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

          {/* Row 2: VIEW: [Cases] [Pending Only] [Pending %] — Left-aligned, compact 23px buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
            <Typography sx={{ width: 54, minWidth: 54, fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              VIEW:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(e, val) => val && setViewMode(val)}
              sx={{
                height: 23.5,
                '& .MuiToggleButton-root': {
                  fontSize: '10px',
                  fontWeight: 500,
                  py: 0,
                  px: '7.5px',
                  textTransform: 'none',
                  color: '#475569',
                  bgcolor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  '&:hover': { bgcolor: '#F8FAFC' },
                  '&.Mui-selected': {
                    bgcolor: '#0D3B66 !important',
                    color: '#FFFFFF !important',
                    borderColor: '#0D3B66',
                    '&:hover': { bgcolor: '#0B2E50 !important' },
                  },
                },
              }}
            >
              <ToggleButton value="cases">Cases</ToggleButton>
              <ToggleButton value="pending">Pending Only</ToggleButton>
              <ToggleButton value="rate">Pending %</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Row 3: SORT BY: [Highest Pending] [Total Cases] [Lowest Pending] — Left-aligned with identical starting position */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
            <Typography sx={{ width: 54, minWidth: 54, fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              SORT BY:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={sortBy}
              exclusive
              onChange={(e, val) => val && setSortBy(val)}
              sx={{
                height: 23.5,
                '& .MuiToggleButton-root': {
                  fontSize: '10px',
                  fontWeight: 500,
                  py: 0,
                  px: '7.5px',
                  textTransform: 'none',
                  color: '#475569',
                  bgcolor: '#FFFFFF',
                  borderColor: '#CBD5E1',
                  '&:hover': { bgcolor: '#F8FAFC' },
                  '&.Mui-selected': {
                    bgcolor: '#0D3B66 !important',
                    color: '#FFFFFF !important',
                    borderColor: '#0D3B66',
                    '&:hover': { bgcolor: '#0B2E50 !important' },
                  },
                },
              }}
            >
              <ToggleButton value="highest_pending">Highest Pending</ToggleButton>
              <ToggleButton value="total_cases">Total Cases</ToggleButton>
              <ToggleButton value="lowest_pending">Lowest Pending</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Chart Area: Placed below controls with compact separation */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 285, width: '100%', minWidth: 0, justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minHeight: 0, width: '100%', minWidth: 0 }}>
            <ReactECharts
              option={option}
              notMerge={true}
              style={{ height: '100%', width: '100%' }}
              onEvents={{ click: onChartClick }}
            />
          </Box>
          <Typography sx={{ fontSize: '0.61rem', color: '#64748B', textAlign: 'center', letterSpacing: '0.01em', pt: 0.2 }}>
            {viewMode === 'rate'
              ? 'Pending share reflects queue proportion, influenced by case assignment volume and stage of resolution, not officer efficiency.'
              : 'Workload reflects grievances assigned to active officers (5,146 cases). Unassigned intake (8 open cases) is excluded.'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
