/** CSV flag = yes | no. Legacy baseline/optional/custom text migrates on read. */

export type FlagYesNo = 'yes' | 'no';

export type FlagBorderColor = 'green' | 'yellow' | 'red';

export const FLAG_BORDER_COLORS: Record<
  FlagBorderColor,
  { label: string; hex: string }
> = {
  green: { label: 'Green', hex: '#22C55E' },
  yellow: { label: 'Yellow', hex: '#EAB308' },
  red: { label: 'Red', hex: '#EF4444' },
};

export const DEFAULT_FLAG_BORDER_COLOR: FlagBorderColor = 'yellow';

export function normalizeFlagColor(raw: string | undefined): FlagBorderColor {
  const c = (raw || '').trim().toLowerCase();
  if (c === 'green' || c === 'yellow' || c === 'red') return c;
  return DEFAULT_FLAG_BORDER_COLOR;
}

export function flagBorderHex(color: FlagBorderColor | string | undefined): string {
  const key = normalizeFlagColor(color);
  return FLAG_BORDER_COLORS[key].hex;
}

export function normalizeFromCsv(
  flagRaw: string,
  flagLabelRaw?: string,
): { flag: FlagYesNo; flagLabel: string } {
  const f = (flagRaw || '').trim().toLowerCase();
  const lbl = (flagLabelRaw || '').trim();

  if (f === 'yes' || f === 'y') return { flag: 'yes', flagLabel: lbl };
  if (f === 'no' || f === '' || f === 'nan') return { flag: 'no', flagLabel: '' };

  if (f === 'baseline') return { flag: 'yes', flagLabel: lbl || 'Baseline' };
  if (f === 'optional') return { flag: 'yes', flagLabel: lbl || 'Optional' };

  if (f.length > 0) return { flag: 'yes', flagLabel: lbl || flagRaw.trim() };

  return { flag: 'no', flagLabel: '' };
}

export function isFlagYes(flag: string): boolean {
  return flag.trim().toLowerCase() === 'yes';
}

export function toCsvFlagFields(
  flag: string,
  flagLabel: string,
  flagColor?: string,
): { flag: string; flag_label: string; flag_color: string } {
  if (!isFlagYes(flag)) return { flag: 'no', flag_label: '', flag_color: '' };
  return {
    flag: 'yes',
    flag_label: flagLabel.trim(),
    flag_color: normalizeFlagColor(flagColor),
  };
}

export const FLAG_YES_NO_OPTIONS: { value: FlagYesNo; label: string }[] = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];
