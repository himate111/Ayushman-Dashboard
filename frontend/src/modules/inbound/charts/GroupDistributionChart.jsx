import React from 'react';
import InboundDonutCard from './InboundDonutCard';

export default function GroupDistributionChart({ data = [], onViewInsight }) {
  return (
    <InboundDonutCard
      title="Group Distribution"
      subtitle="Inbound Queue & Campaign Routing"
      data={data}
      variant="multiCategory"
      onViewInsight={onViewInsight}
    />
  );
}
