import React from 'react';
import InboundDonutCard from './InboundDonutCard';

export default function DispositionDistributionChart({ data = [], onViewInsight }) {
  const formattedData = data.map((item) => ({
    ...item,
    name: item.name === '-' ? 'No Disposition' : item.name
  }));

  return (
    <InboundDonutCard
      title="Disposition Distribution"
      subtitle="Primary Call Outcome Categories"
      data={formattedData}
      variant="multiCategory"
      onViewInsight={onViewInsight}
    />
  );
}
