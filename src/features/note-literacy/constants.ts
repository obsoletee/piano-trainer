export const NOTE_RANGE_OPTIONS = Array.from({ length: 7 }, (_, index) => ({
  value: 36 + index * 12,
  label: `C${index + 2}`,
}));
