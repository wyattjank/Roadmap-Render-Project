/** CSV flag = yes | no. Legacy baseline/optional/custom text migrates on read. */

export type FlagYesNo = 'yes' | 'no';

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
): { flag: string; flag_label: string } {
  if (!isFlagYes(flag)) return { flag: 'no', flag_label: '' };
  return { flag: 'yes', flag_label: flagLabel.trim() };
}

export const FLAG_YES_NO_OPTIONS: { value: FlagYesNo; label: string }[] = [
  { value: 'no', label: 'No' },
  { value: 'yes', label: 'Yes' },
];
