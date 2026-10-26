import React from 'react';
import InboundBarCard from './InboundBarCard';

export default function ShiftVolumeChart({ data = [], onViewInsight }) {
  return (
    <InboundBarCard
      title="Calls Per Shift"
      subtitle="Shift Load Comparison (Shift 1, 2, 3)"
      data={data}
      color="#235789"
      showPercent={true}
      showValues={true}
      barSize={40}
      onViewInsight={onViewInsight}
    />
  );
}
