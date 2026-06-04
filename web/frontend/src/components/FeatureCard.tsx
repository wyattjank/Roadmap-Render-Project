import { isFlagYes } from '../lib/flags';
import { TAG_COLORS, type Feature } from '../lib/roadmap-data';

interface Props {
  feature: Feature;
  onClick: () => void;
  /** Full-width bar spanning multiple release columns */
  stretched?: boolean;
}

function badgeText(feature: Feature): string {
  const label = (feature.flagLabel || '').trim();
  if (label) return label;
  return 'Flagged';
}

export function FeatureCard({ feature, onClick, stretched }: Props) {
  const hex = feature.color || TAG_COLORS[feature.tagColor].hex;
  const flagged = isFlagYes(feature.flag);
  const badge = badgeText(feature);

  return (
    <button
      type="button"
      onClick={onClick}
      title={flagged ? `Flag: ${badge}` : undefined}
      className={`group flex w-full flex-col gap-0.5 rounded-lg text-left shadow-sm transition hover:shadow-md ${
        stretched ? 'min-h-[44px] px-3 py-2.5' : 'px-3 py-2'
      } ${flagged ? 'theme-task-dashed' : 'theme-task-solid'}`}
      style={{ backgroundColor: 'var(--app-task-bg)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <span className="line-clamp-2 text-sm font-medium" style={{ color: 'var(--app-text)' }}>
          {feature.title}
        </span>
        {flagged && (
          <span
            className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
            style={{
              color: 'var(--app-task-border-flag)',
              border: '1px dashed var(--app-task-border-flag)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {feature.featureGroup !== feature.title && (
        <span className="pl-5 text-[10px]" style={{ color: 'var(--app-text-muted)' }}>
          {feature.featureGroup}
        </span>
      )}
    </button>
  );
}
