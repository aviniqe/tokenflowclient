import { PASSWORD_RULES } from '../password.js';

export default function PasswordHints({ value }) {
  const password = String(value || '');
  return (
    <ul className="password-hints">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.id} className={ok ? 'ok' : ''}>
            {ok ? '✓' : '•'} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
