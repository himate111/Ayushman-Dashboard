import React from 'react';
import InboundMonthlyStackedCard from './InboundMonthlyStackedCard';

export default function CallsByMonthChart({ data = [], onViewInsight }) {
  return (
    <InboundMonthlyStackedCard
      title="Calls By Month"
      subtitle="Monthly Connected vs Early Ended Calls"
      data={data}
      onViewInsight={onViewInsight}
    />
  );
}
