import React, { useRef } from 'react';
import { Paper, Box, Typography, Chip, Grid } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, AlertTriangle, Calendar, Info } from 'lucide-react';

export default function InboundDataQualityTrendChart({ trend = [], loading = false }) {
  const echartsRef = useRef(null);

  const periods = trend.map(t => t.period);
  const totalCalls = trend.map(t => t.totalCalls);
  const confirmedIssues = trend.map(t => t.confirmedIssuesCount);
  const issueRates = trend.map(t => t.confirmedIssuesRate);
  const qualityRates = trend.map(t => t.qualityRate);

  const febIndex = periods.findIndex(p => p.toLowerCase().includes('feb') && p.includes('2026'));

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#94A3B8' } },
      backgroundColor: '#FFFFFF',
      borderColor: '#CBD5E1',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#1E293B', fontSize: 12 },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 8px;',
      formatter: function (params) {
        if (!params || !params.length) return '';
        const item = trend[params[0].dataIndex] || {};
        let res = `<div style="font-weight:700; color:#0D3B66; margin-bottom:6px;">${params[0].name} Telephony Audit</div>`;
        res += `<div style="display:flex; justify-content:space-between; gap:16px; font-size:11.5px; color:#475569; margin-bottom:3px;">
                  <span>Total Inbound Volume:</span>
                  <span style="font-weight:700; color:#0D3B66;">${(item.totalCalls || 0).toLocaleString()}</span>
                </div>`;
        res += `<div style="display:flex; justify-content:space-between; gap:16px; font-size:11.5px; color:#475569; margin-bottom:3px;">
                  <span>Confirmed Incomplete Records:</span>
                  <span style="font-weight:700; color:#DC2626;">${(item.confirmedIssuesCount || 0).toLocaleString()}</span>
                </div>`;
        res += `<div style="display:flex; justify-content:space-between; gap:16px; font-size:11.5px; color:#475569; margin-bottom:3px;">
                  <span>Missing Outcome (Disp):</span>
                  <span style="font-weight:600; color:#B45309;">${(item.missingOutcomeCount || 0).toLocaleString()}</span>
                </div>`;
        res += `<div style="display:flex; justify-content:space-between; gap:16px; font-size:11.5px; color:#475569; margin-bottom:3px;">
                  <span>Missing Reason (Sub-Disp):</span>
                  <span style="font-weight:600; color:#B45309;">${(item.missingReasonCount || 0).toLocaleString()}</span>
                </div>`;
        res += `<div style="display:flex; justify-content:space-between; gap:16px; font-size:11.5px; color:#475569; margin-top:4px; padding-top:4px; border-top:1px solid #E2E8F0;">
                  <span>Defect Rate:</span>
                  <span style="font-weight:700; color:#DC2626;">${(item.confirmedIssuesRate || 0).toFixed(1)}%</span>
                </div>`;
        res += `<div style="display:flex; justify-content:space-between; gap:16px; font-size:11.5px; color:#475569;">
                  <span>Data Quality Rate:</span>
                  <span style="font-weight:700; color:#059669;">${(item.qualityRate || 0).toFixed(1)}%</span>
                </div>`;
        return res;
      }
    },
    legend: {
      data: ['Total Call Volume', 'Confirmed Defect Records', 'Issue Rate %'],
      top: 0,
      right: 10,
      itemWidth: 12,
      itemHeight: 10,
      textStyle: { fontSize: 11, color: '#475569' }
    },
    grid: {
      top: 40,
      left: 10,
      right: 15,
      bottom: 25,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisTick: { alignWithLabel: true },
      axisLabel: { fontSize: 11, color: '#475569' }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Call Volume',
        nameTextStyle: { color: '#64748B', fontSize: 11, padding: [0, 0, 0, 10] },
        splitLine: { lineStyle: { stroke: '#F1F5F9', type: 'dashed' } },
        axisLabel: {
          fontSize: 10.5,
          color: '#64748B',
          formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)
        }
      },
      {
        type: 'value',
        name: 'Issue Rate %',
        min: 0,
        max: 100,
        nameTextStyle: { color: '#DC2626', fontSize: 11, padding: [0, 10, 0, 0] },
        splitLine: { show: false },
        axisLabel: {
          fontSize: 10.5,
          color: '#DC2626',
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: 'Total Call Volume',
        type: 'bar',
        barWidth: 18,
        itemStyle: {
          color: '#94A3B8',
          borderRadius: [4, 4, 0, 0]
        },
        data: totalCalls
      },
      {
        name: 'Confirmed Defect Records',
        type: 'bar',
        barWidth: 18,
        barGap: '-100%',
        itemStyle: {
          color: '#F87171',
          borderRadius: [4, 4, 0, 0],
          opacity: 0.85
        },
        data: confirmedIssues
      },
      {
        name: 'Issue Rate %',
        type: 'line',
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 3, color: '#DC2626' },
        itemStyle: { color: '#DC2626', borderWidth: 2, borderColor: '#FFFFFF' },
        data: issueRates,
        markLine: febIndex >= 0 ? {
          symbol: ['none', 'none'],
          silent: true,
          lineStyle: { color: '#B91C1C', type: 'dashed', width: 2 },
          data: [{ xAxis: periods[febIndex] }],
          label: {
            formatter: 'Feb 2026: Shift to Unrecorded Dispositions',
            position: 'insideEndTop',
            color: '#B91C1C',
            fontSize: 10.5,
            fontWeight: 700,
            backgroundColor: '#FEF2F2',
            padding: [4, 8],
            borderRadius: 4,
            borderColor: '#FECACA',
            borderWidth: 1
          }
        } : undefined
      }
    ]
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 2.5,
        bgcolor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              bgcolor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #DBEAFE'
            }}
          >
            <TrendingUp size={18} color="#2563EB" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 800, color: '#0D3B66' }}>
              Monthly Data Quality & Defect Trend (Aug 2025 – Jul 2026)
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
              Historical volume vs confirmed defect rate revealing the February 2026 disposition recording inflection
            </Typography>
          </Box>
        </Box>

        <Chip
          label="12-Month Telemetry Timeline"
          size="small"
          sx={{ bgcolor: '#F8FAFC', color: '#475569', fontWeight: 600, fontSize: '0.72rem', border: '1px solid #E2E8F0' }}
        />
      </Box>

      {/* Chart Canvas */}
      <Box sx={{ width: '100%', height: 320 }}>
        {trend.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ color: '#94A3B8', fontSize: '13px' }}>Loading monthly audit trend...</Typography>
          </Box>
        ) : (
          <ReactECharts
            ref={echartsRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        )}
      </Box>

      {/* Historical Inflection Analysis Callout */}
      <Box
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: '8px',
          bgcolor: '#FFFBEB',
          border: '1px solid #FDE68A',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25
        }}
      >
        <AlertTriangle size={18} color="#D97706" style={{ marginTop: 2, flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#92400E', mb: 0.25 }}>
            Audit Discovery: February 2026 Telephony Wrap-Up Policy Transition
          </Typography>
          <Typography sx={{ fontSize: '0.74rem', color: '#78350F', lineHeight: 1.45 }}>
            From <strong>August 2025 through January 2026</strong>, call agents maintained near 100% disposition compliance (&lt;0.1% defect rate across ~178,000 calls). Beginning in <strong>February 2026</strong>, a CRM configuration or operational change allowed agents to disconnect calls without entering disposition categories, driving unrecorded outcomes from 0.1% to <strong>53.6% in Feb 2026</strong> and peaking at <strong>72.6% in Jul 2026</strong>.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
