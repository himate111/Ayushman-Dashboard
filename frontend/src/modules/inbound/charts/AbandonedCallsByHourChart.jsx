import React from 'react';
import InboundHourlyCard from './InboundHourlyCard';

export default function AbandonedCallsByHourChart({ data = [], onViewInsight }) {
  return (
    <InboundHourlyCard
      title="Abandoned / Early Ended Calls by Hour"
      subtitle="Hourly Calls Ending Under 3s or Dropped in Queue/IVR"
      data={data}
      metric="notConnectedCalls"
      color="#6B7280"
      lineColor="#374151"
      minPercentLabel={0}
      onViewInsight={onViewInsight}
    />
  );
}
