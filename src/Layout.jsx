import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineHome,
  HiOutlineInboxArrowDown,
  HiOutlineDocumentText,
  HiOutlineBanknotes,
  HiOutlineKey,
  HiOutlineBookOpen,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineChevronDown,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from 'react-icons/hi2';
import { useAuth } from './AuthContext.jsx';
import { api } from './api.js';
import { formatAmount } from './formatAmount.js';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import ChangePasswordModal from './components/ChangePasswordModal.jsx';

const links = [
  { to: '/', end: true, label: 'Dashboard', icon: HiOutlineHome },
  { to: '/deposit', label: 'Deposit', icon: HiOutlineInboxArrowDown },
  { to: '/ledger', label: 'Ledger', icon: HiOutlineDocumentText },
  { to: '/withdrawals', label: 'Withdrawals', icon: HiOutlineBanknotes },
  { to: '/developer', end: true, label: 'API', icon: HiOutlineKey },
  { to: '/developer/reference', label: 'API docs', icon: HiOutlineBookOpen },
];

const titles = {
  '/': ['Dashboard', 'Internal USDT balance'],
  '/deposit': ['Deposit', 'Send USDT and request credit'],
  '/ledger': ['Ledger', 'Fund credits and withdrawal debits'],
  '/withdrawals': ['Withdrawals', 'Request a USDT payout'],
  '/developer': ['API', 'Withdrawal tokens'],
  '/developer/reference': ['API docs', 'Developer payout and deposit API'],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('tf_client_sidebar') === '1');
  const [menu, setMenu] = useState(false);
  const [available, setAvailable] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef(null);
  const [title, subtitle] = titles[location.pathname] || ['Client', ''];
  const initial = (user?.name || user?.username || 'U').slice(0, 1).toUpperCase();

  useEffect(() => {
    localStorage.setItem('tf_client_sidebar', collapsed ? '1' : '0');
  }, [collapsed]);

  useEffect(() => {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      try {
        const result = await api('/wallets/balance');
        if (!cancelled) setAvailable(result.data?.available ?? null);
      } catch {
        if (!cancelled) setAvailable(null);
      }
    }
    loadBalance();
    function onChanged() {
      loadBalance();
    }
    window.addEventListener('tokenflow-balance-changed', onChanged);
    return () => {
      cancelled = true;
      window.removeEventListener('tokenflow-balance-changed', onChanged);
    };
  }, [location.pathname]);

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
      setConfirmLogout(false);
    }
  }

  return (
    <div className={`app-shell${collapsed ? ' collapsed' : ''}`}>
      <div className={`overlay${mobileOpen ? ' show' : ''}`} onClick={() => setMobileOpen(false)} />
      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">TF</div>
          <div className="brand-copy">
            <strong>TokenFlow</strong>
            <span>Client console</span>
          </div>
        </div>
        <nav className="nav">
          {links.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} title={label} onClick={() => setMobileOpen(false)}>
              <Icon />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="collapse-btn"
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <HiOutlineChevronDoubleRight /> : <HiOutlineChevronDoubleLeft />}
          <span className="nav-label">{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>
      </aside>
      <div className="workspace">
        <header className="navbar">
          <button className="menu-btn" type="button" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <HiOutlineXMark size={20} /> : <HiOutlineBars3 size={20} />}
          </button>
          <div className="navbar-title">
            <div className="top-meta">Client console</div>
            <strong>{title}</strong>
            <span className="top-meta hide-sm">{subtitle}</span>
          </div>
          <div className="navbar-end">
            <div className="nav-balance" title="Available fund wallet balance">
              <span className="nav-balance-label">Fund</span>
              <strong>{available == null ? '—' : formatAmount(available)} USDT</strong>
            </div>
            <div className="profile-wrap" ref={menuRef}>
              <button className="profile-btn" type="button" onClick={() => setMenu((v) => !v)}>
                <span className="avatar">{initial}</span>
                <span className="profile-copy">
                  <strong>{user?.name || user?.username}</strong>
                  <small>@{user?.username}</small>
                </span>
                <HiOutlineChevronDown />
              </button>
              {menu && (
                <div className="profile-menu">
                  <div className="profile-menu-head">
                    <div className="avatar">{initial}</div>
                    <div>
                      <strong>{user?.name || user?.username}</strong>
                      <small>@{user?.username} · member</small>
                    </div>
                  </div>
                  <button className="nav-btn" type="button" onClick={() => { setMenu(false); setPasswordOpen(true); }}>
                    <HiOutlineKey />
                    Change password
                  </button>
                  <button className="nav-btn" type="button" onClick={() => { setMenu(false); setConfirmLogout(true); }}>
                    <HiOutlineArrowRightOnRectangle />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="main">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out"
        message="Sign out of the client console?"
        confirmLabel="Sign out"
        busy={signingOut}
        onConfirm={confirmSignOut}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  );
}
