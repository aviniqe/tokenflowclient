export const PASSWORD_POLICY =
  'At least 8 characters, with uppercase, lowercase, a number, and a symbol.';

export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { id: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { id: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { id: 'digit', label: 'One number', test: (value) => /\d/.test(value) },
  { id: 'symbol', label: 'One symbol', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function checkStrongPassword(password) {
  const value = String(password || '');
  return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
}

export function isStrongPassword(password) {
  return checkStrongPassword(password).length === 0;
}
