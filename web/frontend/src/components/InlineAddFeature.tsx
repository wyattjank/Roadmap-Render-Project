import { useState } from 'react';
import { TAG_COLORS, type TagColorId } from '../lib/roadmap-data';

interface Props {
  defaultColumn: string;
  releaseColumns: { id: string; label: string }[];
  defaultFeatureGroup: string;
  onAdd: (title: string, tagColor: TagColorId, column: string, featureGroup: string) => void;
  onCancel: () => void;
}

export function InlineAddFeature({
  defaultColumn,
  releaseColumns,
  defaultFeatureGroup,
  onAdd,
  onCancel,
}: Props) {
  const [title, setTitle] = useState('');
  const [tagColor, setTagColor] = useState<TagColorId>('blue');
  const [column, setColumn] = useState(defaultColumn);
  const [featureGroup, setFeatureGroup] = useState(defaultFeatureGroup);

  const submit = () => {
    const t = title.trim();
    if (!t) return;
    onAdd(t, tagColor, column, featureGroup.trim() || defaultFeatureGroup);
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-white p-3 shadow-md">
      <input
        autoFocus
        className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        placeholder="Task name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <input
        className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder="Feature group"
        value={featureGroup}
        onChange={(e) => setFeatureGroup(e.target.value)}
      />
      <div className="mb-2 flex flex-wrap gap-1">
        {(Object.keys(TAG_COLORS) as TagColorId[]).map((id) => (
          <button
            key={id}
            type="button"
            title={TAG_COLORS[id].label}
            onClick={() => setTagColor(id)}
            className={`h-6 w-6 rounded-sm border-2 transition ${
              tagColor === id ? 'border-gray-800 scale-110' : 'border-transparent'
            }`}
            style={{ backgroundColor: TAG_COLORS[id].hex }}
          />
        ))}
      </div>
      <select
        className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        value={column}
        onChange={(e) => setColumn(e.target.value)}
      >
        {releaseColumns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          className="flex-1 rounded-lg bg-blue-500 py-1.5 text-sm font-medium text-white hover:bg-blue-600"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
