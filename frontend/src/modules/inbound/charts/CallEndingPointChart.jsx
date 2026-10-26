import React from 'react';
import InboundDonutCard from './InboundDonutCard';

export default function CallEndingPointChart({ data = [], onViewInsight }) {
  return (
    <InboundDonutCard
      title="Call Ending Point"
      subtitle="Termination Channel (Agent, Queue, IVR)"
      data={data}
      variant="callEnd"
      onViewInsight={onViewInsight}
    />
  );
}
