import React from 'react';
import InboundHourlyCard from './InboundHourlyCard';

export default function CallDropRateByHourChart({ data = [], onViewInsight }) {
  return (
    <InboundHourlyCard
      title="Early Ended Rate by Hour"
      subtitle="Percentage of Calls Ending Under 3s or Dropped (Talk < 3s)"
      data={data}
      metric="dropRate"
      color="#C44949"
      lineColor="#7F1D1D"
      unit="%"
      minPercentLabel={1}
      onViewInsight={onViewInsight}
    />
  );
}
