export function sanitizeIntegerAmount(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/^0+(?=\d)/, '');
}
