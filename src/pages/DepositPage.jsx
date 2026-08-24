import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { HiOutlineClipboardDocument, HiOutlinePaperAirplane } from 'react-icons/hi2';
import { api } from '../api.js';
import { formatAmount } from '../formatAmount.js';
import { formatWhen } from '../formatWhen.js';
import { sanitizeIntegerAmount } from '../integerAmount.js';
import Pagination from '../components/Pagination.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { FormSkeleton, TableSkeleton } from '../components/Skeleton.jsx';

const PAGE_SIZE = 10;

function rangeList(ranges) {
  return Array.isArray(ranges) ? ranges : [];
}

function amountInRange(value, row) {
  const min = Number(row.min);
  const max = row.max === '' || row.max == null ? null : Number(row.max);
  if (Number.isNaN(min) || value < min) return false;
  if (max != null && (Number.isNaN(max) || value > max)) return false;
  return true;
}

function previewFee(amount, ranges) {
  const list = rangeList(ranges);
  const value = Number(amount);
  if (!amount || Number.isNaN(value) || value <= 0) return { kind: 'idle' };
  if (!list.length) return { kind: 'no-ranges' };
  const match = list.find((row) => amountInRange(value, row));
  if (!match) return { kind: 'out' };
  const percent = Number(match.percent);
  if (Number.isNaN(percent)) return { kind: 'out' };
  const fee = (value * percent) / 100;
  return {
    kind: 'ok',
    percent: String(match.percent),
    fee: fee.toFixed(6).replace(/\.?0+$/, '') || '0',
    credited: (value - fee).toFixed(6).replace(/\.?0+$/, '') || '0',
    range: match,
  };
}

function formatUsdt(value) {
  const raw = formatAmount(value);
  if (!/^-?\d+$/.test(raw)) return raw;
  return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function rangeHeadline(row) {
  const from = formatUsdt(row.min);
  if (row.max === '' || row.max == null) return `${from} USDT and above`;
  return `${from} – ${formatUsdt(row.max)} USDT`;
}

function rangeToLabel(row) {
  if (row.max === '' || row.max == null) return 'and above';
  return formatUsdt(row.max);
}

const TX_HASH = /^0x[a-fA-F0-9]{64}$/;

function sanitizeTxHash(value) {
  return String(value ?? '').replace(/\s/g, '');
}

function amountError(amount, quote, ranges, submitted) {
  if (!ranges.length) return 'No deposit ranges are published.';
  if (!amount) return submitted ? 'Enter a whole-number amount.' : '';
  if (!/^[1-9]\d*$/.test(amount)) return 'Amount must be a whole number greater than zero.';
  if (quote.kind === 'out') return 'This amount is not in a listed range.';
  return '';
}

function hashError(hash, submitted) {
  const value = String(hash || '').trim();
  if (!value) return submitted ? 'Enter the BSC transaction hash.' : '';
  if (!TX_HASH.test(value)) return 'Use a valid hash: 0x followed by 64 hex characters.';
  return '';
}

export default function DepositPage() {
  const [info, setInfo] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ amount: '', deposit_tx_hash: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  async function refresh() {
    const [addressRes, loadsRes] = await Promise.all([
      api('/wallets/deposit-address'),
      api('/loads'),
    ]);
    setInfo(addressRes.data);
    setRows(Array.isArray(loadsRes.data) ? loadsRes.data : []);
  }

  useEffect(() => {
    refresh().catch((e) => toast.error(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  const ranges = rangeList(info?.deposit_fee_ranges);
  const quote = useMemo(
    () => previewFee(form.amount, info?.deposit_fee_ranges),
    [form.amount, info],
  );
  const errors = {
    amount: amountError(form.amount, quote, ranges, submitted),
    deposit_tx_hash: hashError(form.deposit_tx_hash, submitted),
  };
  const formReady = Boolean(info?.address) && ranges.length > 0;

  async function copyAddress() {
    if (!info?.address) return;
    try {
      await navigator.clipboard.writeText(info.address);
      toast.success('Deposit address copied');
    } catch {
      toast.error('Could not copy address');
    }
  }

  function askSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    const nextAmount = amountError(form.amount, quote, ranges, true);
    const nextHash = hashError(form.deposit_tx_hash, true);
    if (!formReady || nextAmount || nextHash) return;
    setConfirmOpen(true);
  }

  async function submit() {
    setSubmitting(true);
    try {
      const result = await api('/loads', {
        method: 'POST',
        body: {
          amount: form.amount,
          deposit_tx_hash: form.deposit_tx_hash.trim(),
        },
      });
      toast.success(`Deposit #${result.data.id} submitted for review`);
      setForm({ amount: '', deposit_tx_hash: '' });
      setSubmitted(false);
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

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Deposit USDT</h1>
          <p>
            Send BEP-20 USDT on BNB Smart Chain to the company address below. The amount must match a listed range.
            Then paste the transaction hash and request credit. An administrator verifies the transfer before it is added to your fund wallet.
          </p>
        </div>
      </div>

      {loading ? (
        <>
          <FormSkeleton fields={3} />
          <TableSkeleton cols={8} />
        </>
      ) : (
        <>
          <div className="panel">
            <h2 className="panel-title">Deposit address</h2>
            {info?.address ? (
              <>
                <p className="muted" style={{ margin: '0 0 10px' }}>
                  Network: BSC mainnet · Token: USDT (BEP-20)
                  {info.label ? ` · ${info.label}` : ''}
                </p>
                <div className="deposit-address-wrap">
                  <div className="qr-box">
                    <QRCodeSVG value={info.address} size={168} includeMargin />
                  </div>
                  <div>
                    <div className="copy-row">
                      <code className="mono address-box">{info.address}</code>
                      <button className="btn-ghost" type="button" onClick={copyAddress}>
                        <HiOutlineClipboardDocument /> Copy
                      </button>
                    </div>
                    <p className="muted" style={{ margin: '12px 0 0' }}>
                      Scan the QR code or copy the address. Only send USDT on BSC. Other tokens or networks will not be credited.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Deposits are not open yet. Ask your administrator to set a deposit address.
              </p>
            )}
          </div>

          <div className="panel">
            <h2 className="panel-title">Allowed deposit ranges</h2>
            {ranges.length ? (
              <>
                <p className="muted" style={{ margin: '0 0 14px' }}>
                  Send a whole-number amount inside one of these bands. The fee is taken on approval; the rest is credited to your fund wallet.
                </p>
                <div className="range-list">
                  {ranges.map((row, index) => {
                    const active = Boolean(form.amount) && amountInRange(Number(form.amount), row);
                    return (
                      <div className={`range-card${active ? ' active' : ''}`} key={`${row.min}-${row.max}-${index}`}>
                        <div className="range-card-index">{index + 1}</div>
                        <div>
                          <strong>{rangeHeadline(row)}</strong>
                          <p>
                            {active
                              ? `This band matches ${formatUsdt(form.amount)} USDT`
                              : 'Deposit this total in one transfer'}
                          </p>
                        </div>
                        <div className="range-fee">
                          <small>Fee</small>
                          {formatAmount(row.percent)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="notice-error">
                No deposit ranges are published. Credit requests are disabled until an administrator adds them in Settings.
              </p>
            )}
          </div>

          <form className="panel form-grid" onSubmit={askSubmit} noValidate>
            <div className={errors.amount ? 'field-error' : undefined}>
              <label htmlFor="deposit-amount">Amount sent (USDT)</label>
              <input
                id="deposit-amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: sanitizeIntegerAmount(e.target.value) })}
                placeholder={ranges[0]?.min ? sanitizeIntegerAmount(ranges[0].min) || '1500' : '1500'}
                inputMode="numeric"
                aria-invalid={Boolean(errors.amount)}
                disabled={!info?.address || !ranges.length}
              />
              {errors.amount ? <p className="field-error-msg">{errors.amount}</p> : null}
            </div>
            <div className={errors.deposit_tx_hash ? 'field-error' : undefined}>
              <label htmlFor="deposit-tx">Transaction hash</label>
              <input
                id="deposit-tx"
                value={form.deposit_tx_hash}
                onChange={(e) => setForm({ ...form, deposit_tx_hash: sanitizeTxHash(e.target.value) })}
                placeholder="0x…"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.deposit_tx_hash)}
                disabled={!info?.address || !ranges.length}
              />
              {errors.deposit_tx_hash ? <p className="field-error-msg">{errors.deposit_tx_hash}</p> : null}
            </div>
            {quote.kind === 'ok' && !errors.amount && (
              <p className="muted" style={{ margin: 0 }}>
                Estimated fee {formatAmount(quote.fee)} USDT ({quote.percent}%). You receive about {formatAmount(quote.credited)} USDT after approval.
              </p>
            )}
            <button className="btn-primary" type="submit" disabled={submitting || !formReady}>
              <HiOutlinePaperAirplane /> {submitting ? 'Submitting…' : 'Request credit'}
            </button>
          </form>

          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Credited</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Tx</th>
                </tr>
              </thead>
              <tbody>
                {slice.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td>{row.id}</td>
                    <td>{formatAmount(row.amount)}</td>
                    <td>{row.fee_amount != null ? `${formatAmount(row.fee_amount)} (${formatAmount(row.fee_percent)}%)` : '—'}</td>
                    <td>{formatAmount(row.credited_amount)}</td>
                    <td><span className={`badge ${row.status}`}>{row.status}</span></td>
                    <td className="muted">{formatWhen(row.created_at)}</td>
                    <td className="mono">{row.deposit_tx_hash || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pages={pages} total={rows.length} onPage={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm deposit request"
        subtitle="Check every detail before submitting. Credit is added only after an administrator approves this request."
        confirmLabel="Submit request"
        busy={submitting}
        wide
        onConfirm={submit}
        onClose={() => setConfirmOpen(false)}
      >
        <div className="stack">
          <div className="kv-grid">
            <div className="kv">
              <span>Network</span>
              <strong>BSC mainnet · USDT (BEP-20)</strong>
            </div>
            <div className="kv">
              <span>Amount sent</span>
              <strong>{formatAmount(form.amount)} USDT</strong>
            </div>
            <div className="kv span">
              <span>Deposit wallet{info?.label ? ` · ${info.label}` : ''}</span>
              <strong className="mono">{info?.address || '—'}</strong>
            </div>
            <div className="kv span">
              <span>Transaction hash</span>
              <strong className="mono">{form.deposit_tx_hash.trim() || '—'}</strong>
            </div>
          </div>
          <div className="charge-card">
            <h3>Charges breakdown</h3>
            {quote.kind === 'ok' && quote.range ? (
              <p className="muted" style={{ margin: '0 0 12px' }}>
                  Band {formatUsdt(quote.range.min)} – {rangeToLabel(quote.range)} at {formatAmount(quote.percent)}%
              </p>
            ) : null}
            <div className="charge-row">
              <span>You sent</span>
              <strong>{formatAmount(form.amount)} USDT</strong>
            </div>
            <div className="charge-row">
              <span>Deposit fee ({quote.kind === 'ok' ? `${formatAmount(quote.percent)}%` : '—'})</span>
              <strong>− {quote.kind === 'ok' ? formatAmount(quote.fee) : '—'} USDT</strong>
            </div>
            <div className="charge-row total">
              <span>Credited after approval</span>
              <strong>{quote.kind === 'ok' ? formatAmount(quote.credited) : '—'} USDT</strong>
            </div>
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}
