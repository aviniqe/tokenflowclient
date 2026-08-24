import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineEye } from 'react-icons/hi2';
import { api } from '../api.js';
import { formatAmount } from '../formatAmount.js';
import { formatWhen } from '../formatWhen.js';
import Pagination from '../components/Pagination.jsx';
import Modal from '../components/Modal.jsx';
import { PageSkeleton } from '../components/Skeleton.jsx';

function Kv({ label, children, span }) {
  return (
    <div className={span ? 'kv span' : 'kv'}>
      <span>{label}</span>
      <strong>{children}</strong>
    </div>
  );
}

function LedgerDetails({ row }) {
  const details = row.details || { kind: 'ledger' };
  const isDebit = row.direction === 'debit';

  return (
    <div className="kv-grid">
      <Kv label="Particulars">{row.description}</Kv>
      <Kv label="Type"><span className={`badge ${isDebit ? 'rejected' : 'approved'}`}>{isDebit ? 'Debit' : 'Credit'}</span></Kv>
      <Kv label="Amount">{formatAmount(row.amount)} USDT</Kv>
      <Kv label="Date">{formatWhen(row.created_at)}</Kv>
      <Kv label="Available after">{formatAmount(row.available_after)} USDT</Kv>
      <Kv label="Reserved after">{formatAmount(row.reserved_after)} USDT</Kv>
      <Kv label="Entry ID">{row.id}</Kv>
      <Kv label="Token">{row.token || 'USDT'}</Kv>

      {details.kind === 'deposit' && (
        <>
          <Kv label="Deposit ID">#{details.load_id}</Kv>
          <Kv label="Deposit status"><span className={`badge ${details.status}`}>{details.status}</span></Kv>
          <Kv label="Amount sent">{formatAmount(details.deposit_amount)} USDT</Kv>
          <Kv label="Fee">
            {details.fee_amount != null
              ? `${formatAmount(details.fee_amount)} USDT (${formatAmount(details.fee_percent)}%)`
              : '—'}
          </Kv>
          <Kv label="Credited">{formatAmount(details.credited_amount)} USDT</Kv>
          <Kv label="Sent to" span>
            <span className="mono">{details.deposit_to_address || '—'}</span>
          </Kv>
          <Kv label="Transaction hash" span>
            <span className="mono">{details.deposit_tx_hash || '—'}</span>
          </Kv>
        </>
      )}

      {(details.kind === 'withdrawal' || details.kind === 'withdrawal_returned') && (
        <>
          <Kv label="Withdrawal ID">#{details.withdrawal_id}</Kv>
          <Kv label="Payout status"><span className={`badge ${details.status}`}>{details.status}</span></Kv>
          <Kv label="Requested">{formatAmount(details.requested_amount)} USDT</Kv>
          <Kv label="Source"><span className="badge">{details.source}</span></Kv>
          <Kv label="Destination wallet" span>
            <span className="mono">{details.wallet_address || '—'}</span>
          </Kv>
          <Kv label="Payout hash" span>
            <span className="mono">{details.tx_hash || '—'}</span>
          </Kv>
          {details.failure_reason ? (
            <Kv label="Note" span>{details.failure_reason}</Kv>
          ) : null}
        </>
      )}

      {details.kind === 'admin_credit' && (
        <Kv label="Source" span>Credited by an administrator</Kv>
      )}
      {details.kind === 'admin_debit' && (
        <Kv label="Source" span>Debited by an administrator</Kv>
      )}
    </div>
  );
}

export default function LedgerPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function refresh(nextPage = page) {
    const result = await api(`/wallets/ledger?page=${nextPage}&page_size=10`);
    const data = result.data || {};
    setRows(Array.isArray(data.items) ? data.items : []);
    setPage(data.page || 1);
    setPages(data.pages || 1);
    setTotal(data.total || 0);
  }

  useEffect(() => {
    refresh(1).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton cols={7} />;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Ledger statement</h1>
          <p>
            Credits are fund deposits (and returned withdrawals). Debits are withdrawal requests reserved from your fund wallet.
            Open Details to see the linked deposit or withdrawal.
          </p>
        </div>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Date</th>
              <th>Particulars</th>
              <th>Credit</th>
              <th>Debit</th>
              <th>Balance</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>{(page - 1) * 10 + index + 1}</td>
                <td>{formatWhen(row.created_at)}</td>
                <td>{row.description}</td>
                <td className="amount-credit">{row.direction === 'credit' ? formatAmount(row.amount) : '—'}</td>
                <td className="amount-debit">{row.direction === 'debit' ? formatAmount(row.amount) : '—'}</td>
                <td>{formatAmount(row.available_after)}</td>
                <td>
                  <button className="btn-ghost" type="button" onClick={() => setSelected(row)}>
                    <HiOutlineEye /> Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          page={page}
          pages={pages}
          total={total}
          onPage={(next) => refresh(next).catch((e) => toast.error(e.message))}
        />
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected ? selected.description : 'Transaction details'}
        subtitle={selected ? `${formatWhen(selected.created_at)} · ${formatAmount(selected.amount)} USDT` : ''}
        onClose={() => setSelected(null)}
        wide
      >
        {selected ? <LedgerDetails row={selected} /> : null}
      </Modal>
    </div>
  );
}
