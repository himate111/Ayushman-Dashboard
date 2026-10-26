import React from 'react';
import InboundHourlyCard from './InboundHourlyCard';

export default function IncomingCallsByHourChart({ data = [], onViewInsight }) {
  // In original Inbound, hourly cards filter out rows with very low counts if applicable
  const filteredData = data.filter((item) => (Number(item.totalCalls) || 0) >= 0);

  return (
    <InboundHourlyCard
      title="Incoming Calls by Hour"
      subtitle="24-Hour Overall Call Volume"
      data={filteredData}
      metric="totalCalls"
      color="#235789"
      lineColor="#0F2F57"
      minPercentLabel={1}
      onViewInsight={onViewInsight}
    />
  );
}
