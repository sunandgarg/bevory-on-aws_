export const parseFilterScalar = (value: string): string | number | boolean | null => {
  const normalized = value.toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  if (normalized === "null") return null;

  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
  }

  return value;
};
