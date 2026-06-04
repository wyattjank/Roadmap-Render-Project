import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { TagColorId } from '../lib/roadmap-data';
import type { Feature } from '../lib/roadmap-data';
import { FeatureCard } from './FeatureCard';
import { InlineAddFeature } from './InlineAddFeature';

interface Props {
  columnId: string;
  columnLabel: string;
  releaseColumns: { id: string; label: string }[];
  features: Feature[];
  defaultFeatureGroup: string;
  onFeatureClick: (id: string) => void;
  onAddFeature: (
    title: string,
    tagColor: TagColorId,
    column: string,
    featureGroup: string,
  ) => void;
}

export function ColumnCell({
  columnId,
  columnLabel,
  releaseColumns,
  features,
  defaultFeatureGroup,
  onFeatureClick,
  onAddFeature,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="min-h-[72px] rounded-lg bg-gray-100 p-2 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mb-1 text-[10px] font-medium text-gray-400 sm:hidden">{columnLabel}</div>
      <div className="flex flex-col gap-2">
        {features.map((f) => (
          <FeatureCard
            key={`${f.id}-${columnId}`}
            feature={f}
            onClick={() => onFeatureClick(f.id)}
          />
        ))}
        {adding ? (
          <InlineAddFeature
            defaultColumn={columnId}
            releaseColumns={releaseColumns}
            defaultFeatureGroup={defaultFeatureGroup}
            onAdd={(title, tag, col, group) => {
              onAddFeature(title, tag, col, group);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={`flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 transition ${
              hovered ? 'opacity-100' : 'opacity-0'
            } hover:border-blue-400 hover:bg-white hover:text-blue-600`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
