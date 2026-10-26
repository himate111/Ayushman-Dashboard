import React from 'react';
import InboundBarCard from './InboundBarCard';

export default function TopAgentsChart({ data = [], onViewInsight }) {
  return (
    <InboundBarCard
      title="Top 10 Agents"
      subtitle="Highest Volume Call Responders"
      data={data}
      color="#235789"
      barSize={32}
      percentFontSize={9}
      labelFontSize={9}
      showValues={true}
      showPercent={true}
      onViewInsight={onViewInsight}
    />
  );
}
