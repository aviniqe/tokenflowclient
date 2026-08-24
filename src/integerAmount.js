export function sanitizeIntegerAmount(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/^0+(?=\d)/, '');
}

export function sanitizeDecimalAmount(value) {
  let text = String(value ?? '').replace(/[^\d.]/g, '');
  const dot = text.indexOf('.');
  if (dot !== -1) {
    text = `${text.slice(0, dot + 1)}${text.slice(dot + 1).replace(/\./g, '')}`;
    const [whole, frac = ''] = text.split('.');
    text = `${whole}.${frac.slice(0, 18)}`;
  }
  if (text.startsWith('.')) text = `0${text}`;
  return text;
}
