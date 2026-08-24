import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArrowPath, HiOutlinePaperAirplane } from 'react-icons/hi2';
import { api } from '../api.js';
import { formatAmount } from '../formatAmount.js';
import { formatWhen } from '../formatWhen.js';
import { sanitizeIntegerAmount } from '../integerAmount.js';
import Pagination from '../components/Pagination.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { FormSkeleton, TableSkeleton } from '../components/Skeleton.jsx';

const PAGE_SIZE = 10;

function formatUsdt(value) {
  const raw = formatAmount(value);
  if (!/^-?\d+$/.test(raw)) return raw;
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function ellipsize(value) {
  const text = String(value || '').trim();
  if (!text) return '—';
  if (text.length <= 10) return text;
  return `${text.slice(0, 5)}....${text.slice(-5)}`;
}

export default function WithdrawalsPage() {
  const [rows, setRows] = useState([]);
  const [balance, setBalance] = useState(null);
  const [form, setForm] = useState({ wallet_address: '', amount: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function refresh({ skeleton } = {}) {
    if (skeleton) setRefreshing(true);
    try {
      const [listRes, balanceRes] = await Promise.all([
        api('/withdrawals'),
        api('/wallets/balance'),
      ]);
      setRows(Array.isArray(listRes.data) ? listRes.data : []);
      setBalance(balanceRes.data || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh().catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  function askSubmit(e) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const data = await api('/withdrawals', {
        method: 'POST',
        body: {
          wallet_address: form.wallet_address.trim(),
          amount: form.amount,
          idempotency_key: crypto.randomUUID(),
        },
      });
      toast.success(`Withdrawal #${data.withdrawal_id} submitted (${data.status}).`);
      setForm({ wallet_address: '', amount: '' });
      setConfirmOpen(false);
      window.dispatchEvent(new Event('tokenflow-balance-changed'));
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE) || 1);
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const available = Number(balance?.available || 0);
  const requested = Number(form.amount || 0);
  const remaining = Number.isFinite(available) && Number.isFinite(requested)
    ? String(Math.max(0, available - requested))
    : null;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Withdraw USDT</h1>
          <p>
            Enter any BSC address that can receive BEP-20 USDT. The full requested amount is paid. There is no withdrawal fee and no daily cap.
          </p>
        </div>
        <button
          className="btn-ghost"
          type="button"
          disabled={loading || refreshing}
          onClick={() => refresh({ skeleton: true }).catch((e) => toast.error(e.message))}
        >
          <HiOutlineArrowPath /> {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {loading ? (
        <>
          <FormSkeleton fields={2} />
          <TableSkeleton cols={7} />
        </>
      ) : (
        <>
          <form className="panel form-grid" onSubmit={askSubmit}>
            <div>
              <label>Destination BSC address</label>
              <input
                value={form.wallet_address}
                onChange={(e) => setForm({ ...form, wallet_address: e.target.value })}
                placeholder="0x…"
                required
                autoComplete="off"
              />
            </div>
            <div>
              <label>Amount (USDT)</label>
              <input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: sanitizeIntegerAmount(e.target.value) })}
                placeholder="25"
                inputMode="numeric"
                pattern="[1-9][0-9]*"
                required
              />
            </div>
            <button className="btn-primary" type="submit" disabled={submitting}>
              <HiOutlinePaperAirplane /> Request withdrawal
            </button>
          </form>
          {refreshing ? (
            <TableSkeleton cols={7} />
          ) : (
            <div className="panel table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Source</th>
                    <th>Wallet</th>
                    <th>Tx</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((row, index) => (
                    <tr key={row.id}>
                      <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                      <td className="muted">{formatWhen(row.created_at)}</td>
                      <td>{formatAmount(row.amount)}</td>
                      <td><span className="badge">{row.source === 'api' ? 'api' : 'manual'}</span></td>
                      <td className="mono" title={row.wallet_address || ''}>{ellipsize(row.wallet_address)}</td>
                      <td className="mono" title={row.tx_hash || ''}>{ellipsize(row.tx_hash)}</td>
                      <td><span className={`badge ${row.status}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} pages={pages} total={rows.length} onPage={setPage} />
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm withdrawal"
        subtitle="Review where the USDT will go. There is no fee — the full amount leaves your fund wallet and is paid on-chain."
        confirmLabel="Send request"
        busy={submitting}
        wide
        onConfirm={submit}
        onClose={() => setConfirmOpen(false)}
      >
        <div className="stack">
          <div className="confirm-hero">
            <small>You are sending</small>
            <strong>{formatUsdt(form.amount || '0')} USDT</strong>
            <p>BNB Smart Chain · BEP-20 USDT · no withdrawal fee</p>
          </div>

          <div className="kv-grid">
            <div className="kv span">
              <span>Pays to this BSC address</span>
              <strong className="mono">{form.wallet_address.trim() || '—'}</strong>
            </div>
            <div className="kv">
              <span>Your available fund</span>
              <strong>{balance ? `${formatUsdt(balance.available)} USDT` : '—'}</strong>
            </div>
            <div className="kv">
              <span>Left after this request</span>
              <strong>{remaining != null ? `${formatUsdt(remaining)} USDT` : '—'}</strong>
            </div>
          </div>

          <div className="charge-card">
            <h3>Payout breakdown</h3>
            <div className="charge-row">
              <span>Reserved from your fund</span>
              <strong>{formatUsdt(form.amount || '0')} USDT</strong>
            </div>
            <div className="charge-row">
              <span>Withdrawal fee</span>
              <strong>0 USDT</strong>
            </div>
            <div className="charge-row total">
              <span>Paid to the address above</span>
              <strong>{formatUsdt(form.amount || '0')} USDT</strong>
            </div>
          </div>

          <ol className="confirm-steps">
            <li>
              <b>1</b>
              <span>This amount is held in your fund wallet right away, so it cannot be spent twice.</span>
            </li>
            <li>
              <b>2</b>
              <span>After approval (if required), the company sends this USDT from treasury to the address above.</span>
            </li>
            <li>
              <b>3</b>
              <span>If the payout fails or is rejected, the held amount is returned to your available fund.</span>
            </li>
          </ol>
        </div>
      </ConfirmDialog>
    </div>
  );
}
