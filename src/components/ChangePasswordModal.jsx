import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../api.js';
import { isStrongPassword, PASSWORD_POLICY } from '../password.js';
import Modal from './Modal.jsx';
import PasswordHints from './PasswordHints.jsx';

const empty = { current_password: '', new_password: '', confirm: '' };

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  function close() {
    if (busy) return;
    setForm(empty);
    onClose();
  }

  async function submit(e) {
    e.preventDefault();
    if (!isStrongPassword(form.new_password)) {
      toast.error(PASSWORD_POLICY);
      return;
    }
    if (form.new_password !== form.confirm) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (form.current_password === form.new_password) {
      toast.error('New password must be different from the current password');
      return;
    }
    setBusy(true);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: {
          current_password: form.current_password,
          new_password: form.new_password,
        },
      });
      toast.success('Password updated');
      setForm(empty);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Change password" onClose={close}>
      <form className="form-grid" onSubmit={submit}>
        <p className="muted" style={{ margin: 0 }}>{PASSWORD_POLICY}</p>
        <div>
          <label>Current password</label>
          <input
            type="password"
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            required
            autoComplete="current-password"
          />
        </div>
        <div>
          <label>New password</label>
          <input
            type="password"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            required
            autoComplete="new-password"
          />
          <PasswordHints value={form.new_password} />
        </div>
        <div>
          <label>Confirm new password</label>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="btn-row">
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
          <button className="btn-ghost" type="button" onClick={close} disabled={busy}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
