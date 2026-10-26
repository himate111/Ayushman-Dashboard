import React from 'react';
import InboundShiftComparisonCard from './InboundShiftComparisonCard';

export default function ShiftComparisonChart({ data = [], onViewInsight }) {
  return (
    <InboundShiftComparisonCard
      title="Call Outcome by Shift"
      subtitle="Connected (≥3s) vs Early Ended (<3s) Volumes"
      data={data}
      onViewInsight={onViewInsight}
    />
  );
}
