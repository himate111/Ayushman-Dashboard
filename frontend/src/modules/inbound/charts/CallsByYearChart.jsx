import React from 'react';
import InboundDonutCard from './InboundDonutCard';

export default function CallsByYearChart({ data = [], onViewInsight }) {
  return (
    <InboundDonutCard
      title="Calls By Year"
      subtitle="Annual Volume Distribution"
      data={data}
      variant="year"
      onViewInsight={onViewInsight}
    />
  );
}
