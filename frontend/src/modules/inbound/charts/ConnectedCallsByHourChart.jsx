import React from 'react';
import InboundHourlyCard from './InboundHourlyCard';

export default function ConnectedCallsByHourChart({ data = [], onViewInsight }) {
  return (
    <InboundHourlyCard
      title="Connected Calls by Hour"
      subtitle="Hourly Calls with Agent Talk ≥ 3s"
      data={data}
      metric="connectedCalls"
      color="#2F7D4F"
      lineColor="#14532D"
      minPercentLabel={1}
      onViewInsight={onViewInsight}
    />
  );
}
