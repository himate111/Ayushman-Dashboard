import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { Info, Lightbulb } from 'lucide-react';

const CATEGORY_MAP = {
  'Hospital Services Issues': 'Hospital Services',
  'Ayushman Card Related Issues': 'Ayushman Card',
  'Monetary Issues': 'Monetary Issues',
  'PDDU Card Related Issues': 'PDDU Card',
  'Behavioural & Staff Conduct': 'Behaviour & Staff',
  'Enrolment Related Issues': 'Enrolment',
};

const DISTRICT_MAP = {
  'GAUTAM BUDDHA NAGAR': 'G.B. Nagar',
  'KANPUR NAGAR': 'Kanpur',
};

const formatDistrictDisplay = (name) => {
  if (!name) return '';
  const upper = name.toUpperCase();
  if (DISTRICT_MAP[upper]) return DISTRICT_MAP[upper];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const formatCategoryDisplay = (name) => {
  return CATEGORY_MAP[name] || name;
};

export default function Chart5GrievanceHotspots({ data, onDrillDown, onViewInsight }) {
  const [viewMode, setViewMode] = useState('count'); // 'count' | 'percentage'
  const districts = data?.districts || [];
  const categories = data?.categories || [];
  const points = data?.dataPoints || [];

  const maxTotal = useMemo(() => {
    return points.length > 0 ? Math.max(...points.map((p) => p.totalCount), 1) : 100;
  }, [points]);

  const maxPct = useMemo(() => {
    return points.length > 0 ? Math.max(...points.map((p) => p.percentageOfDistrictVolume), 1) : 100;
  }, [points]);

  // ECharts heatmap point: [dIdx, cIdx, displayValue, totalCount, pendingCount, pendingPct, pctOfDistrict, distTotal, district, category]
  const heatData = useMemo(() => {
    return points.map((p) => {
      const val = viewMode === 'percentage' ? p.percentageOfDistrictVolume : p.totalCount;
      const maxVal = viewMode === 'percentage' ? maxPct : maxTotal;
      const ratio = maxVal > 0 ? val / maxVal : 0;
      const isDarkBg = ratio > 0.45;

      return {
        value: [
          p.districtIndex,
          p.categoryIndex,
          val,
          p.totalCount,
          p.pendingCount,
          p.pendingPercentage,
          p.percentageOfDistrictVolume,
          p.districtTotalCount,
          p.district,
          p.category,
        ],
        label: {
          color: isDarkBg ? '#FFFFFF' : (val === 0 ? '#94A3B8' : '#1E293B'),
        },
      };
    });
  }, [points, viewMode, maxPct, maxTotal]);

  const option = useMemo(() => {
    const activeMax = viewMode === 'percentage' ? Math.max(maxPct, 1) : Math.max(maxTotal, 1);

    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; border: 1px solid #E2E8F0; max-width: 290px; pointer-events: none;',
        position: function (pos, params, dom, rect, size) {
          if (!size || !size.contentSize || !size.viewSize) return pos;
          const [x, y] = pos;
          const [tipW, tipH] = size.contentSize;
          const [viewW, viewH] = size.viewSize;

          let posX = x - tipW / 2;
          if (posX < 8) posX = 8;
          if (posX + tipW > viewW - 8) posX = Math.max(8, viewW - tipW - 8);

          let posY = y - tipH - 12;
          if (posY < 8) {
            posY = y + 16;
          }
          if (posY + tipH > viewH - 8) posY = Math.max(8, viewH - tipH - 8);

          return [posX, posY];
        },
        formatter: (params) => {
          const val = params.value;
          const dIdx = val[0];
          const cIdx = val[1];
          const tot = val[3];
          const pnd = val[4];
          const pndPct = val[5];
          const pctDist = val[6];
          const distTot = val[7];
          const fullDistrict = val[8] || districts[dIdx];
          const fullCategory = val[9] || categories[cIdx];

          return `<div style="font-family: inherit; font-size: 11px; line-height: 1.45; color: #1E293B; min-width: 220px; max-width: 280px;">
            <div style="font-weight: 700; font-size: 12px; color: #0D3B66; padding-bottom: 4px; border-bottom: 1px solid #E2E8F0; margin-bottom: 6px;">
              ${fullDistrict}
            </div>
            <div style="font-weight: 600; color: #0284C7; margin-bottom: 6px; font-size: 11px;">
              ${fullCategory}
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Grievance Count:</span>
              <span style="font-weight: 700; color: #0F172A;">${tot?.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">District Share:</span>
              <span style="font-weight: 700; color: #2563EB;">${pctDist}% <span style="font-weight: 400; font-size: 10px; color: #64748B;">(${tot} of ${distTot})</span></span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #64748B;">Pending Backlog:</span>
              <span style="font-weight: 700; color: #D97706;">${pnd?.toLocaleString()} (${pndPct}%)</span>
            </div>
            <div style="font-size: 10px; color: #94A3B8; font-style: italic; border-top: 1px dashed #E2E8F0; padding-top: 4px; margin-top: 4px;">
              Click cell to filter grievances
            </div>
          </div>`;
        },
      },
      grid: {
        left: 86,
        right: 8,
        top: 6,
        bottom: 28,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: districts.map(formatDistrictDisplay),
        splitArea: { show: false },
        axisTick: { alignWithLabel: true, lineStyle: { color: '#CBD5E1' } },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          interval: 0,
          rotate: 0,
          align: 'center',
          verticalAlign: 'top',
          lineHeight: 8.5,
          color: '#475569',
          fontSize: 6.5,
          fontWeight: 500,
          margin: 5,
          formatter: (val) => {
            switch (val) {
              case 'G.B. Nagar':
                return 'G.B.\nNagar';
              case 'Varanasi':
                return 'Varan-\nasi';
              case 'Prayagraj':
                return 'Prayag-\nraj';
              case 'Moradabad':
                return 'Morad-\nabad';
              case 'Gorakhpur':
                return 'Gorakh-\npur';
              case 'Ghaziabad':
                return 'Ghazia-\nbad';
              case 'Bareilly':
                return 'Bareil-\nly';
              default:
                return val;
            }
          },
        },
      },
      yAxis: {
        type: 'category',
        data: categories.map(formatCategoryDisplay),
        inverse: true, // Highest volume Hospital Services at top
        splitArea: { show: false },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#334155',
          fontSize: 9.2,
          fontWeight: 500,
          margin: 5,
        },
      },
      visualMap: {
        show: false,
        dimension: 2,
        min: 0,
        max: activeMax,
        inRange: {
          color: ['#F8FAFC', '#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0284C7', '#0369A1', '#0D3B66'],
        },
      },
      series: [
        {
          name: viewMode === 'percentage' ? '% of District Grievances' : 'Grievance Volume',
          type: 'heatmap',
          data: heatData,
          label: {
            show: true,
            formatter: (p) => {
              const v = p.value[2];
              if (v === undefined || v === null) return '';
              return viewMode === 'percentage' ? `${v}%` : `${v}`;
            },
            fontSize: 8.5,
            fontWeight: 600,
          },
          itemStyle: {
            borderColor: '#FFFFFF',
            borderWidth: 1,
            borderRadius: 2,
          },
          emphasis: {
            itemStyle: {
              borderColor: '#0D3B66',
              borderWidth: 2,
              shadowBlur: 8,
              shadowColor: 'rgba(13, 59, 102, 0.3)',
            },
          },
        },
      ],
    };
  }, [districts, categories, heatData, viewMode, maxPct, maxTotal]);

  const onChartClick = (params) => {
    if (onDrillDown && params.value) {
      const dIdx = params.value[0];
      const cIdx = params.value[1];
      const dName = districts[dIdx];
      const cName = categories[cIdx];
      onDrillDown({ district: dName, category: cName });
    }
  };

  return (
    <Card sx={{ height: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '10px 14px 10px !important', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 0.75, minHeight: '28px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="h6" sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D3B66', whiteSpace: 'nowrap' }}>
              District Hotspots
            </Typography>
            <Tooltip
              title="Cross-tabulates complaint categories across high-volume districts to detect localized systemic service breakdowns."
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
                onClick={() => onViewInsight('Chart5')}
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

          {/* Mode Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              View:
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(e, val) => val && setViewMode(val)}
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
              <ToggleButton value="count">Count</ToggleButton>
              <ToggleButton value="percentage">% of District</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Heatmap & Legend Area: Automatically fits available card width without scroll on desktop */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 295, width: '100%', minWidth: 0, justifyContent: 'space-between' }}>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              minWidth: 0,
              overflowX: { xs: 'auto', sm: 'hidden' },
              overflowY: 'hidden',
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-track': { bgcolor: '#F1F5F9', borderRadius: 2 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#94A3B8', borderRadius: 2 },
            }}
          >
            <Box sx={{ height: '100%', width: '100%', minWidth: { xs: 460, sm: '100%' } }}>
              <ReactECharts
                option={option}
                notMerge={true}
                style={{ height: '100%', width: '100%' }}
                onEvents={{ click: onChartClick }}
              />
            </Box>
          </Box>

          {/* Compact Sequential Color Scale Legend */}
          <Box sx={{ mt: 0.2, pt: 0.4, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, width: '100%', maxWidth: 350 }}>
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
                {viewMode === 'percentage' ? 'Low share' : 'Low count'}
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  height: 6,
                  borderRadius: '3px',
                  background: 'linear-gradient(to right, #F8FAFC, #E0F2FE, #7DD3FC, #38BDF8, #0284C7, #0D3B66)',
                  border: '1px solid #CBD5E1',
                  minWidth: 70,
                }}
              />
              <Typography sx={{ fontSize: '0.64rem', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap' }}>
                {viewMode === 'percentage' ? 'High share' : 'High count'}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.61rem', color: '#94A3B8', textAlign: 'center', letterSpacing: '0.01em' }}>
              Color intensity indicates complaint concentration across districts, not case severity.
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
