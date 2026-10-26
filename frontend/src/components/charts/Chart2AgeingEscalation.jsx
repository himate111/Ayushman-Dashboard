import React from 'react';
import { Card, CardContent, Typography, Box, Button, Tooltip } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { ExternalLink, Info, Lightbulb } from 'lucide-react';

export default function Chart2AgeingEscalation({ data = [], onDrillDown, onViewInsight }) {
  const buckets = data.map((d) => d.bucket);
  const counts = data.map((d) => d.count);
  const percentages = data.map((d) => d.percentage);

  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#EF4444'];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const item = data[params[0]?.dataIndex];
        return `<div style="font-weight:700;margin-bottom:4px;">Age Bracket: ${item?.bucket}</div>
          <div style="font-size:12px;color:#1E293B;">Pending Cases: <b>${item?.count?.toLocaleString()}</b></div>
          <div style="font-size:12px;color:#64748B;">Share of Unresolved: <b>${item?.percentage}%</b></div>
          <div style="font-size:11px;color:#EF4444;margin-top:4px;">Click bar to inspect grievances</div>`;
      },
    },
    grid: { left: 8, right: 12, bottom: 8, top: 36, containLabel: true },
    xAxis: {
      type: 'category',
      data: buckets,
      axisLabel: { color: '#475569', fontWeight: 600, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: 'Cases',
      nameTextStyle: { color: '#64748B', fontSize: 11, align: 'left', padding: [0, 0, 4, 0] },
      axisLabel: { color: '#64748B', fontSize: 11 },
      splitLine: { lineStyle: { color: '#F1F5F9' } },
    },
    series: [
      {
        name: 'Pending Cases',
        type: 'bar',
        data: counts.map((val, idx) => ({
          value: val,
          itemStyle: { color: colors[idx % colors.length], borderRadius: [5, 5, 0, 0] },
        })),
        barMaxWidth: 44,
        label: {
          show: true,
          position: 'top',
          formatter: (p) => `${p.value?.toLocaleString()} (${percentages[p.dataIndex]}%)`,
          fontSize: 10,
          fontWeight: 600,
          color: '#1E293B',
        },
      },
    ],
  };

  const onChartClick = (params) => {
    if (onDrillDown && params.name) {
      onDrillDown({ ageBucket: params.name, status: 'Pending' });
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <CardContent sx={{ p: '14px 16px !important', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minHeight: '34px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="h6" sx={{ fontSize: '0.96rem', fontWeight: 700, color: '#0D3B66' }}>
              Grievance Ageing
            </Typography>
            <Tooltip
              title="Stratifies unresolved beneficiary grievances by duration elapsed since registration. Cases exceeding 30 days represent operational ageing requiring expedited review."
              arrow
              placement="top"
            >
              <Box component="span" sx={{ display: 'inline-flex', cursor: 'pointer', color: '#94A3B8', '&:hover': { color: '#0D3B66' } }}>
                <Info size={14} />
              </Box>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {onViewInsight && (
              <Button
                size="small"
                startIcon={<Lightbulb size={13} color="#D97706" />}
                onClick={() => onViewInsight('Chart2')}
                sx={{
                  fontSize: '0.72rem',
                  color: '#92400E',
                  bgcolor: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  py: 0.2,
                  px: 0.9,
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
                sx={{ fontSize: '0.72rem', color: '#0D3B66', py: 0.2, px: 0.8, textTransform: 'none', fontWeight: 600 }}
              >
                View Overdue
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            onEvents={{ click: onChartClick }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
