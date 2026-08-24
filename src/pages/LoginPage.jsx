import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiOutlineShieldCheck } from 'react-icons/hi2';
import { useAuth } from '../AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username, password);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth-hero">
        <div>
          <div className="brand-mark" style={{ width: 48, height: 48 }}>TF</div>
          <h2>Deposit USDT to your fund wallet and request withdrawals.</h2>
          <p className="muted">Send BEP-20 USDT to the company address, submit the transaction hash, and wait for admin approval. You never connect a wallet on this platform.</p>
        </div>
        <p className="muted">TokenFlow Client</p>
      </section>
      <div className="auth-card-wrap">
        <motion.form className="panel auth-card" onSubmit={onSubmit} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <div className="stat-icon" style={{ marginBottom: 16 }}><HiOutlineShieldCheck size={22} /></div>
          <h1 style={{ margin: '0 0 8px' }}>Sign in</h1>
          <p className="muted">Use the username and password issued by your administrator.</p>
          <div className="form-grid" style={{ marginTop: 18 }}>
            <div>
              <label>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
          </div>
          <button className="btn-primary" type="submit" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
