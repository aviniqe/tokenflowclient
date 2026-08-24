import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiOutlineBanknotes, HiOutlineLockClosed, HiOutlineSparkles } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { formatAmount } from '../formatAmount.js';
import { StatSkeleton } from '../components/Skeleton.jsx';

export default function DashboardPage() {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    api('/wallets/balance')
      .then((d) => setBalance(d.data))
      .catch((e) => toast.error(e.message));
  }, []);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>This is your internal USDT balance. Deposit BEP-20 USDT to the company address, then request credit. After admin approval it appears here. Withdrawals pay out from treasury to a BSC address you paste.</p>
        </div>
      </div>
      {!balance ? (
        <StatSkeleton count={3} />
      ) : (
        <div className="cards">
          <motion.div className="stat" whileHover={{ y: -4 }}>
            <div className="stat-label"><span className="stat-icon"><HiOutlineBanknotes /></span> Available USDT</div>
            <div className="stat-value">{formatAmount(balance.available)}</div>
          </motion.div>
          <motion.div className="stat" whileHover={{ y: -4 }}>
            <div className="stat-label"><span className="stat-icon"><HiOutlineLockClosed /></span> Reserved USDT</div>
            <div className="stat-value">{formatAmount(balance.reserved)}</div>
          </motion.div>
          <motion.div className="stat" whileHover={{ y: -4 }}>
            <div className="stat-label"><span className="stat-icon"><HiOutlineSparkles /></span> Network</div>
            <div className="stat-value" style={{ fontSize: 22 }}>BSC mainnet</div>
          </motion.div>
        </div>
      )}
      <div className="panel">
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Deposit USDT</h2>
        <p className="muted" style={{ margin: '0 0 14px' }}>
          Copy the company BSC address, send USDT, then submit the transaction hash for review.
        </p>
        <Link className="btn-primary" to="/deposit">Go to deposit</Link>
      </div>
      <div className="panel">
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Withdrawals</h2>
        <p className="muted" style={{ margin: '0 0 14px' }}>
          Paste a BNB Smart Chain address and request USDT. The company pays from its treasury. You never sign a transaction in this app.
        </p>
        <Link className="btn-primary" to="/withdrawals">Request USDT withdrawal</Link>
      </div>
      <div className="panel">
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Ledger statement</h2>
        <p className="muted" style={{ margin: '0 0 14px' }}>
          See every fund credit and withdrawal debit on your statement.
        </p>
        <Link className="btn-primary" to="/ledger">View ledger</Link>
      </div>
      <div className="panel">
        <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Withdrawal API</h2>
        <p className="muted" style={{ margin: '0 0 14px' }}>
          Create API tokens and request payouts from your own systems.
        </p>
        <div className="btn-row">
          <Link className="btn-primary" to="/developer">Manage API tokens</Link>
          <Link className="btn-ghost" to="/developer/reference">API reference</Link>
        </div>
      </div>
    </div>
  );
}
