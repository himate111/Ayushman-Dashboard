import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Lightbulb } from 'lucide-react';

const monthOrder = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
};

const shortMonthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fullMonthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function OutboundMonthlyStackedCard({
  title = 'Calls By Month',
  subtitle = 'Monthly Connected vs Not Connected Outbound Proportions',
  data = [],
  fullDatasetDateBoundary = null,
  filters = {},
  height = 270,
  onViewInsight
}) {
  // Parse active filter selections
  const selectedYears = Array.isArray(filters?.year)
    ? filters.year.map(String).filter(Boolean)
    : (filters?.year ? [String(filters.year)] : []);

  const selectedMonths = Array.isArray(filters?.month)
    ? filters.month.map(String).filter(Boolean)
    : (filters?.month ? [String(filters.month)] : []);

  const selectedMonthNumbers = selectedMonths.map((m) => {
    const num = Number(m);
    if (!isNaN(num) && num >= 1 && num <= 12) return num;
    return monthOrder[m] || 0;
  }).filter((n) => n >= 1 && n <= 12);

  const isAllYears = selectedYears.length === 0;
  const isSingleYear = selectedYears.length === 1;
  const isAllMonths = selectedMonthNumbers.length === 0;

  // Active records with genuine uploaded call activity
  const activeRecords = (data || []).filter((d) => Number(d.totalCalls) > 0);

  // Helper to determine the latest uploaded month & year in a record set
  const getLatestUploadedMonthYear = (records) => {
    if (!records || records.length === 0) return null;
    let maxVal = -1;
    let latest = null;
    for (const r of records) {
      const y = Number(r.year || 0);
      const m = Number(r.monthNumber) || monthOrder[r.month] || 0;
      const val = y * 12 + m;
      if (val > maxVal) {
        maxVal = val;
        latest = { year: y, monthNumber: m };
      }
    }
    return latest;
  };

  let slots = [];
  let dynamicSubtitle = subtitle;

  // -------------------------------------------------------------------------
  // Case D: When Month is specifically selected (with or without a Year filter)
  // -------------------------------------------------------------------------
  if (!isAllMonths) {
    // When specific month(s) are filtered, display only matching year/month buckets
    let targetYears = [];
    if (isSingleYear) {
      targetYears = [Number(selectedYears[0])];
    } else if (!isAllYears) {
      targetYears = selectedYears.map(Number).sort((a, b) => a - b);
    } else {
      // All years: take distinct years present in the dataset
      const yearsInData = Array.from(new Set((data || []).map((d) => Number(d.year)).filter(Boolean))).sort((a, b) => a - b);
      targetYears = yearsInData.length > 0 ? yearsInData : [new Date().getFullYear()];
    }

    targetYears.forEach((y) => {
      selectedMonthNumbers.forEach((m) => {
        slots.push({ year: y, monthNumber: m });
      });
    });

    slots.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.monthNumber - b.monthNumber));

    if (slots.length === 1) {
      dynamicSubtitle = `${fullMonthNames[slots[0].monthNumber]} ${slots[0].year} Outbound Performance: Connected vs Not Connected Proportion`;
    } else {
      dynamicSubtitle = 'Filtered Monthly Outbound Performance: Connected vs Not Connected Proportions';
    }
  }

  // -------------------------------------------------------------------------
  // Case B: When a single Year is selected (and Month = All Months)
  // -------------------------------------------------------------------------
  else if (isSingleYear) {
    const selectedYear = Number(selectedYears[0]);
    // Find all records for this year that have uploaded records
    const recordsForYear = activeRecords.filter(
      (d) => Number(d.year) === selectedYear
    );

    // Requirement 2:
    // - Select 2025 -> Show only 2025 months.
    // - Select 2026 -> Show only 2026 months for which data is available.
    // - Never include another year's months when a specific year is selected.
    // - Never generate future months without uploaded records.
    const latestInYear = getLatestUploadedMonthYear(recordsForYear);
    const maxMonth = latestInYear ? latestInYear.monthNumber : 0;

    if (maxMonth > 0) {
      for (let m = 1; m <= maxMonth; m++) {
        slots.push({ year: selectedYear, monthNumber: m });
      }
      dynamicSubtitle = `${selectedYear} Monthly Breakdown (${maxMonth} Month${maxMonth > 1 ? 's' : ''}): Connected vs Not Connected Outbound Proportions`;
    } else {
      // If no data exists for this year in the dataset
      dynamicSubtitle = `${selectedYear} Monthly Breakdown: No Call Data Available`;
    }
  }

  // -------------------------------------------------------------------------
  // Case C: When multiple specific Years are selected (and Month = All Months)
  // -------------------------------------------------------------------------
  else if (!isAllYears) {
    selectedYears.map(Number).sort((a, b) => a - b).forEach((y) => {
      const recordsForYear = activeRecords.filter(
        (d) => Number(d.year) === y
      );
      const latestInYear = getLatestUploadedMonthYear(recordsForYear);
      const maxMonth = latestInYear ? latestInYear.monthNumber : 0;
      if (maxMonth > 0) {
        for (let m = 1; m <= maxMonth; m++) {
          slots.push({ year: y, monthNumber: m });
        }
      }
    });
    dynamicSubtitle = `Selected Years Monthly Breakdown (${slots.length} Months): Connected vs Not Connected Outbound Proportions`;
  }

  // -------------------------------------------------------------------------
  // Case A: Default (Year = All Years and Month = All Months)
  // -------------------------------------------------------------------------
  else {
    // Requirement 1: Display exactly the latest 12 consecutive calendar months,
    // ending with the most recent month containing uploaded call data.
    // Examples:
    // - Latest data October 2026 -> November 2025 to October 2026.
    // - Upload November 2026 -> December 2025 to November 2026.
    // - Upload December 2026 -> January 2026 to December 2026.
    // This must update automatically after a successful upload and dashboard refresh. No hardcoded years or months.
    // Anchored to full dataset boundary (e.g. from props or full uploaded dataset) or genuine active records
    const latest = fullDatasetDateBoundary
      ? { year: fullDatasetDateBoundary.year, monthNumber: fullDatasetDateBoundary.month }
      : (getLatestUploadedMonthYear(activeRecords) || getLatestUploadedMonthYear(data));

    if (!latest) {
      dynamicSubtitle = 'No Monthly Call Data Available';
      slots = [];
    } else {
      const latestYear = latest.year;
      const latestMonth = latest.monthNumber;

      for (let offset = 11; offset >= 0; offset--) {
        let m = latestMonth - offset;
        let y = latestYear;
        while (m <= 0) {
          m += 12;
          y -= 1;
        }
        slots.push({ year: y, monthNumber: m });
      }

      if (slots[0].year !== slots[11].year) {
        dynamicSubtitle = `Rolling 12 Months (${shortMonthNames[slots[0].monthNumber]} '${String(slots[0].year).slice(-2)} – ${shortMonthNames[slots[11].monthNumber]} '${String(slots[11].year).slice(-2)}): Connected vs Not Connected Proportions`;
      } else {
        dynamicSubtitle = `${slots[0].year} Monthly Breakdown (12 Months): Connected vs Not Connected Proportions`;
      }
    }
  }

  // Determine whether visible slots span across multiple calendar years
  const distinctYearsInSlots = Array.from(new Set(slots.map((s) => s.year)));
  const hasMultipleYears = distinctYearsInSlots.length > 1;

  // Map each slot to real filtered metrics or zero-safe values
  const chartData = slots.map((slot) => {
    // Match against backend data (which has all active filters applied)
    const match = (data || []).find((d) => {
      const dYear = Number(d.year || 0);
      const dMonthNum = Number(d.monthNumber) || monthOrder[d.month] || 0;
      return dYear === slot.year && dMonthNum === slot.monthNumber;
    });

    const total = match ? Number(match.totalCalls || 0) : 0;
    const connectedCalls = match ? Number(match.connectedCalls || 0) : 0;
    const notConnectedCalls = match
      ? Number(match.notConnectedCalls || Math.max(total - connectedCalls, 0))
      : 0;

    const connectedPct = total > 0 ? (connectedCalls / total) * 100 : 0;
    const notConnectedPct = total > 0 ? (notConnectedCalls / total) * 100 : 0;

    const shortMonth = shortMonthNames[slot.monthNumber] || '';
    const fullMonth = fullMonthNames[slot.monthNumber] || match?.month || shortMonth;
    const shortYear = `'${String(slot.year).slice(-2)}`;

    // If multiple years are visible in chart, include year on label
    const label = hasMultipleYears ? `${shortMonth} ${shortYear}` : shortMonth;

    return {
      key: `${slot.year}-${slot.monthNumber}`,
      label,
      shortMonth,
      shortYear,
      fullMonth,
      year: slot.year,
      monthNumber: slot.monthNumber,
      totalCalls: total,
      connectedCalls,
      notConnectedCalls,
      connected: Number(connectedPct.toFixed(1)),
      notConnected: Number(notConnectedPct.toFixed(1)),
      hasData: total > 0
    };
  });

  // Custom X-axis tick renderer ensuring clean readability with zero label collisions
  const renderCustomXAxisTick = ({ x, y, payload }) => {
    const row = chartData.find((d) => d.label === payload.value || d.key === payload.value);
    if (hasMultipleYears && row?.shortYear) {
      return (
        <g transform={`translate(${x},${y})`}>
          <text textAnchor="middle" fill="#475569" fontSize={10}>
            <tspan x={0} dy={10} fontWeight={600}>
              {row.shortMonth}
            </tspan>
            <tspan x={0} dy={12} fill="#64748B" fontSize={8.5}>
              {row.shortYear}
            </tspan>
          </text>
        </g>
      );
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={11} textAnchor="middle" fill="#475569" fontSize={10.5} fontWeight={600}>
          {payload.value}
        </text>
      </g>
    );
  };

  // Custom rich tooltip matching Inbound exactly
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload || {};
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
          <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#0D3B66', mb: 0.5 }}>
            {row.fullMonth} {row.year} Resolution Split
          </Typography>
          {row.totalCalls === 0 ? (
            <Typography sx={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>
              No Outbound Dialing Activity (0 Calls)
            </Typography>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.35 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2F7D4F' }} />
                <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
                  Connected Calls: <strong style={{ color: '#166534' }}>{row.connectedCalls.toLocaleString()} ({row.connected}%)</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.35 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#C44949' }} />
                <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
                  Not Connected: <strong style={{ color: '#991B1B' }}>{row.notConnectedCalls.toLocaleString()} ({row.notConnected}%)</strong>
                </Typography>
              </Box>
              <Box sx={{ borderTop: '1px solid #F1F5F9', pt: 0.5, mt: 0.5 }}>
                <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                  Total Dialed: <strong style={{ color: '#0F172A' }}>{row.totalCalls.toLocaleString()}</strong> calls
                </Typography>
              </Box>
            </>
          )}
        </Box>
      );
    }
    return null;
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
      {/* 1. Header with clear separation of bold title and dynamic subtitle */}
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
            {dynamicSubtitle}
          </Typography>
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

      {/* 2. Stacked Bar Chart */}
      <Box sx={{ width: '100%', height: height, minHeight: height, overflow: 'hidden' }}>
        {chartData.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>No monthly data available</Typography>
          </Box>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              barSize={slots.length <= 3 ? 42 : slots.length <= 6 ? 32 : 24}
              barCategoryGap="12%"
              margin={{ top: 16, right: 14, left: 6, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                interval={0}
                tick={renderCustomXAxisTick}
                height={hasMultipleYears ? 36 : 24}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 10, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                align="center"
                content={() => (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2.5, pt: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2F7D4F' }} />
                      <Typography sx={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                        Connected Calls
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#C44949' }} />
                      <Typography sx={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                        Not Connected Calls
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
              <Bar
                isAnimationActive={false}
                dataKey="connected"
                stackId="a"
                fill="#2F7D4F"
                name="Connected Calls"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                isAnimationActive={false}
                dataKey="notConnected"
                stackId="a"
                fill="#C44949"
                stroke="#FFFFFF"
                strokeWidth={1}
                name="Not Connected Calls"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
}
