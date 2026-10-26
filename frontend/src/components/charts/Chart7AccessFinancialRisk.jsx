import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, Chip, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { AlertCircle, Info, Lightbulb } from 'lucide-react';

export default function Chart7AccessFinancialRisk({ data = [], onDrillDown, onViewInsight }) {
  const reversed = useMemo(() => [...data].reverse(), [data]);
  const categories = useMemo(() => reversed.map((d) => d.riskCategory), [reversed]);
  const pendingCounts = useMemo(() => reversed.map((d) => d.pendingComplaints), [reversed]);
  const totalPendingRisk = useMemo(() => pendingCounts.reduce((acc, curr) => acc + curr, 0), [pendingCounts]);

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
          const item = reversed[params[0]?.dataIndex];
          if (!item) return '';
          return `<div style="font-family: inherit; font-size: 11px; line-height: 1.45; color: #1E293B; min-width: 220px; max-width: 280px;">
            <div style="font-weight: 700; font-size: 12px; color: #DC2626; padding-bottom: 4px; border-bottom: 1px solid #FECACA; margin-bottom: 6px;">
              ${item.riskCategory}
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Total Reported:</span>
              <span style="font-weight: 700; color: #0D3B66;">${item.totalComplaints?.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #0D9488;">Resolved Cases:</span>
              <span style="font-weight: 700; color: #0D9488;">${item.closedComplaints?.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #DC2626;">Pending Cases:</span>
              <span style="font-weight: 700; color: #DC2626;">${item.pendingComplaints?.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Pending Share:</span>
              <span style="font-weight: 700; color: #D97706;">${item.pendingRate}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748B;">Consequence Severity:</span>
              <span style="font-weight: 700; color: #DC2626;">${item.consequenceSeverity}</span>
            </div>
            <div style="font-size: 10px; color: #94A3B8; font-style: italic; border-top: 1px dashed #E2E8F0; padding-top: 4px; margin-top: 4px;">
              Click bar to inspect matching high-risk records
            </div>
          </div>`;
        },
      },
      grid: {
        left: 14,
        right: 48,
        bottom: 8,
        top: 14,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
          formatter: (val) => (val >= 1000 ? `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k` : val),
        },
        splitLine: { lineStyle: { color: '#F1F5F9' } },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisTick: { alignWithLabel: true, lineStyle: { color: '#CBD5E1' } },
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#334155',
          fontWeight: 500,
          fontSize: 10.5,
          margin: 8,
        },
      },
      series: [
        {
          name: 'Pending Risk Cases',
          type: 'bar',
          barWidth: 13,
          data: pendingCounts.map((val) => ({
            value: val,
            itemStyle: {
              color: '#EF4444',
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: 'right',
            distance: 6,
            formatter: (p) => `${p.value?.toLocaleString()}`,
            fontSize: 10,
            fontWeight: 600,
            color: '#B91C1C',
          },
        },
      ],
    };
  }, [reversed, categories, pendingCounts]);

  const onChartClick = (params) => {
    if (onDrillDown && params.name) {
      onDrillDown({ riskCategory: params.name, status: 'Pending', riskOnly: true });
    }
  };

  return (
    <Card sx={{ height: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '10px 14px 10px !important', minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', mb: '6px' }}>
          {/* Row 1: Title, Info, Insights, and Compact Chip */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, minHeight: '26px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AlertCircle size={15} color="#DC2626" />
              <Typography variant="h6" sx={{ fontSize: '0.92rem', fontWeight: 700, color: '#0D3B66', whiteSpace: 'nowrap' }}>
                Beneficiary Risk
              </Typography>
              <Tooltip
                title="Isolates complaints involving monetary extortion, illegal billing, treatment refusals, or admission denials. Classification rules are mutually exclusive with zero duplicate double-counting across categories."
                arrow
                placement="top"
              >
                <Box component="span" sx={{ display: 'inline-flex', cursor: 'pointer', color: '#94A3B8', '&:hover': { color: '#0D3B66' } }}>
                  <Info size={14} />
                </Box>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              {onViewInsight && (
                <Button
                  size="small"
                  startIcon={<Lightbulb size={13} color="#D97706" />}
                  onClick={() => onViewInsight('Chart7')}
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
              <Chip
                label={`${totalPendingRisk.toLocaleString()} Distinct Pending High-Risk`}
                size="small"
                sx={{
                  fontSize: '10.5px',
                  fontWeight: 600,
                  bgcolor: '#FEE2E2',
                  color: '#991B1B',
                  border: '1px solid #FCA5A5',
                  height: 23,
                  px: 0.4,
                }}
              />
            </Box>
          </Box>

          {/* Row 2: Subtitle explaining distinct counting */}
          <Typography sx={{ fontSize: '0.62rem', color: '#94A3B8', letterSpacing: '0.01em' }}>
            Unresolved high-risk grievances partitioned by mutually exclusive risk category.
          </Typography>
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
