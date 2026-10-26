import React from 'react';
import InboundBarCard from './InboundBarCard';

export default function BottomAgentsChart({ data = [], onViewInsight }) {
  return (
    <InboundBarCard
      title="Bottom 10 Agents"
      subtitle="Lowest Volume Call Responders"
      data={data}
      color="#6B7280"
      barSize={32}
      percentFontSize={9}
      labelFontSize={9}
      showValues={true}
      showPercent={true}
      onViewInsight={onViewInsight}
    />
  );
}
