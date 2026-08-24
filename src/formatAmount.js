export function formatAmount(value) {
  if (value == null || value === '') return '—';
  const raw = String(value).trim();
  if (raw === '—') return raw;
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return raw;
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [wholeRaw, fracRaw = ''] = unsigned.split('.');
  const whole = wholeRaw.replace(/^0+(?=\d)/, '') || '0';
  const frac = fracRaw.replace(/0+$/, '');
  const formatted = frac ? `${whole}.${frac}` : whole;
  return negative ? `-${formatted}` : formatted;
}
