import React from 'react';
import InboundBarCard from './InboundBarCard';

export default function SubDispositionChart({ data = [], onViewInsight }) {
  const formattedData = data.map((item) => ({
    ...item,
    name:
      item.name === 'Call Disconnected in between Conversation'
        ? 'Disconnected'
        : item.name
  }));

  return (
    <InboundBarCard
      title="Top 5 Sub Dispositions"
      subtitle="Most Frequent Beneficiary Query Types"
      data={formattedData}
      color="#235789"
      wrapLabels={true}
      barSize={32}
      showPercent={true}
      onViewInsight={onViewInsight}
    />
  );
}
