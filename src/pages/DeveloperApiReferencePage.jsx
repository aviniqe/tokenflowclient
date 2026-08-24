import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { HiOutlineClipboardDocument } from 'react-icons/hi2';

function apiBase() {
  return String(process.env.REACT_APP_API_URL || window.location.origin).replace(/\/$/, '');
}

function Example({ text, label = 'Example' }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  }
  return (
    <div>
      <pre className="mono">{text}</pre>
      <button className="btn-ghost" type="button" onClick={copy}>
        <HiOutlineClipboardDocument /> Copy example
      </button>
    </div>
  );
}

function Method({ verb }) {
  return <span className={`api-method api-method-${verb.toLowerCase()}`}>{verb}</span>;
}

export default function DeveloperApiReferencePage() {
  const base = `${apiBase()}/api/v1/developer`;

  const curlBalance = `curl -s "${base}/balance" \\
  -H "X-API-Key: YOUR_TOKEN"`;

  const curlDepositAddress = `curl -s "${base}/deposit-address" \\
  -H "X-API-Key: YOUR_TOKEN"`;

  const curlCreateLoad = `curl -s -X POST "${base}/loads" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_TOKEN" \\
  -d "{\\"amount\\":\\"100\\",\\"deposit_tx_hash\\":\\"0xYOUR64CHARBSCHASH\\"}"`;

  const curlListLoads = `curl -s "${base}/loads" \\
  -H "X-API-Key: YOUR_TOKEN"`;

  const curlCreatePayout = `curl -s -X POST "${base}/payouts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_TOKEN" \\
  -d "{\\"wallet_address\\":\\"0xYourBscAddress\\",\\"amount\\":\\"25\\",\\"idempotency_key\\":\\"unique-id-123\\"}"`;

  const curlGetPayout = `curl -s "${base}/payouts/12" \\
  -H "X-API-Key: YOUR_TOKEN"`;

  const curlListPayouts = `curl -s "${base}/payouts" \\
  -H "X-API-Key: YOUR_TOKEN"`;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>API reference</h1>
          <p>
            Use your live API token from the{' '}
            <Link to="/developer">API tokens</Link> page. All calls are BEP-20 USDT on
            BNB Smart Chain (BSC mainnet). Payout amounts may include decimals (for example 10.10)
            within min/max. Deposit ticket amounts stay whole numbers.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">On this page</h2>
        <div className="docs-toc">
          <a href="#auth">Authentication</a>
          <a href="#errors">Errors</a>
          <a href="#balance">Check balance</a>
          <a href="#deposit-address">Deposit address</a>
          <a href="#create-load">Submit a deposit</a>
          <a href="#list-loads">List deposits</a>
          <a href="#create-payout">Create a payout</a>
          <a href="#get-payout">Check payout status</a>
          <a href="#list-payouts">List payouts</a>
          <a href="#statuses">Status values</a>
        </div>
      </div>

      <div className="panel" id="auth">
        <h2 className="panel-title">Authentication</h2>
        <p className="muted">
          Base URL: <code className="mono">{base}</code>
        </p>
        <p className="muted">
          Send the token on every request. Tokens are shown only once when you create them.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Header</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">X-API-Key</td>
                <td>Your <code>tf_live_...</code> token (recommended)</td>
              </tr>
              <tr>
                <td className="mono">Authorization</td>
                <td>
                  <code>Bearer tf_live_...</code> also works. Do not send a console login JWT here.
                </td>
              </tr>
              <tr>
                <td className="mono">Content-Type</td>
                <td>
                  <code>application/json</code> on POST bodies
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" id="errors">
        <h2 className="panel-title">Errors</h2>
        <p className="muted">Failed calls return JSON like:</p>
        <pre className="mono">{`{
  "success": false,
  "error": "Human-readable message",
  "code": "UNAUTHENTICATED"
}`}</pre>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>HTTP</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>401</td>
                <td>Missing, invalid, or revoked API token</td>
              </tr>
              <tr>
                <td>403</td>
                <td>Account is not active</td>
              </tr>
              <tr>
                <td>400</td>
                <td>Validation (amount, address, hash, min/max, deposit range)</td>
              </tr>
              <tr>
                <td>404</td>
                <td>Payout id does not exist or belongs to another account</td>
              </tr>
              <tr>
                <td>409</td>
                <td>That deposit transaction hash was already submitted</td>
              </tr>
              <tr>
                <td>429</td>
                <td>Too many payout creates (5 per 15 minutes per IP)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" id="balance">
        <div className="endpoint-head">
          <Method verb="GET" />
          <code>/balance</code>
        </div>
        <h2 className="panel-title">1. Check fund wallet balance</h2>
        <p className="muted">
          Read available and reserved USDT for the account that owns the API token.
          Available is what you can pay out. Reserved is USDT held for payouts that are
          still in progress.
        </p>
        <Example text={curlBalance} />
        <p className="muted" style={{ marginTop: 12 }}>Success:</p>
        <pre className="mono">{`{
  "success": true,
  "data": {
    "available": "150",
    "reserved": "25",
    "token": "USDT"
  }
}`}</pre>
      </div>

      <div className="panel" id="deposit-address">
        <div className="endpoint-head">
          <Method verb="GET" />
          <code>/deposit-address</code>
        </div>
        <h2 className="panel-title">2. Get the company deposit address</h2>
        <p className="muted">
          Send BEP-20 USDT on BSC to this address. Then submit the on-chain hash with
          “Submit a deposit” so admin can credit your fund wallet (minus the deposit fee
          for that amount range).
        </p>
        <Example text={curlDepositAddress} />
        <p className="muted" style={{ marginTop: 12 }}>Success:</p>
        <pre className="mono">{`{
  "success": true,
  "data": {
    "addresses": ["0x..."],
    "address": "0x...",
    "network": "BSC",
    "chain_id": 56,
    "token": "USDT",
    "usdt_contract": "0x55d398326f99059fF775485246999027B3197955"
  }
}`}</pre>
        <p className="muted">Use <code>address</code> (first active treasury deposit wallet) unless you need the full <code>addresses</code> list.</p>
      </div>

      <div className="panel" id="create-load">
        <div className="endpoint-head">
          <Method verb="POST" />
          <code>/loads</code>
        </div>
        <h2 className="panel-title">3. Submit a deposit for credit</h2>
        <p className="muted">
          After you send USDT on-chain, report the amount and transaction hash. Amount
          must be a whole number and must fall in an allowed deposit range (same ranges
          as the console). Credit happens after admin approval, not when you call this.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Body field</th>
                <th>Required</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">amount</td>
                <td>Yes</td>
                <td>Integer USDT string, e.g. <code>"100"</code></td>
              </tr>
              <tr>
                <td className="mono">deposit_tx_hash</td>
                <td>Yes</td>
                <td>64-hex BSC tx hash, <code>0x</code> + 64 characters</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Example text={curlCreateLoad} />
        <p className="muted" style={{ marginTop: 12 }}>
          <code>201</code> on success. Response includes fee preview and <code>status: "pending"</code>.
          The same hash cannot be submitted twice (<code>409</code>).
        </p>
      </div>

      <div className="panel" id="list-loads">
        <div className="endpoint-head">
          <Method verb="GET" />
          <code>/loads</code>
        </div>
        <h2 className="panel-title">4. List deposit requests</h2>
        <p className="muted">
          All deposit tickets for this account. Poll until a row is <code>approved</code> or{' '}
          <code>rejected</code>. There is no get-by-id route; match on <code>id</code> or{' '}
          <code>deposit_tx_hash</code> in this list.
        </p>
        <Example text={curlListLoads} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Load status</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">pending</td>
                <td>Waiting for admin review. Fund balance is not credited yet.</td>
              </tr>
              <tr>
                <td className="mono">approved</td>
                <td>Net amount (after fee) was credited to available USDT.</td>
              </tr>
              <tr>
                <td className="mono">rejected</td>
                <td>Not credited. See <code>failure_reason</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" id="create-payout">
        <div className="endpoint-head">
          <Method verb="POST" />
          <code>/payouts</code>
        </div>
        <h2 className="panel-title">5. Create a payout (withdrawal)</h2>
        <p className="muted">
          Sends USDT from your fund wallet to a BSC address you control. Min/max and
          automatic vs manual approval follow the same settings as the console. There is
          no withdrawal fee. Save <code>payout_id</code> and poll status (next section).
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Body field</th>
                <th>Required</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">wallet_address</td>
                <td>Yes</td>
                <td>
                  Destination BSC address. Checksum or all-lowercase. Aliases:{' '}
                  <code>to</code>, <code>destination</code>
                </td>
              </tr>
              <tr>
                <td className="mono">amount</td>
                <td>Yes</td>
                <td>USDT string within configured min/max, decimals allowed (e.g. <code>"10.10"</code>)</td>
              </tr>
              <tr>
                <td className="mono">idempotency_key</td>
                <td>Yes</td>
                <td>
                  Unique string per payout. Retrying with the same key returns the original
                  payout (<code>200</code>) instead of creating another. Also accepted as
                  header <code>Idempotency-Key</code> or <code>X-Idempotency-Key</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Example text={curlCreatePayout} />
        <p className="muted" style={{ marginTop: 12 }}>
          <code>201</code> for a new payout, <code>200</code> if the idempotency key was reused.
        </p>
        <pre className="mono">{`{
  "success": true,
  "payout_id": 12,
  "status": "processing",
  "data": {
    "id": 12,
    "amount": "25",
    "payout_amount": "25",
    "wallet_address": "0x...",
    "status": "processing",
    "tx_hash": null,
    "explorer_url": null,
    "source": "api",
    "created_at": "...",
    "completed_at": null
  }
}`}</pre>
      </div>

      <div className="panel" id="get-payout">
        <div className="endpoint-head">
          <Method verb="GET" />
          <code>/payouts/:id</code>
        </div>
        <h2 className="panel-title">6. Check payout status</h2>
        <p className="muted">
          Use the <code>payout_id</code> from create. Poll every few seconds until the
          status is terminal. When <code>tx_hash</code> is set, the transfer is on-chain;
          <code>explorer_url</code> is the BscScan link.
        </p>
        <Example text={curlGetPayout} />
        <p className="muted" style={{ marginTop: 12 }}>Success wraps the payout object:</p>
        <pre className="mono">{`{ "success": true, "data": { "id": 12, "status": "completed", "tx_hash": "0x...", ... } }`}</pre>
      </div>

      <div className="panel" id="list-payouts">
        <div className="endpoint-head">
          <Method verb="GET" />
          <code>/payouts</code>
        </div>
        <h2 className="panel-title">7. List payouts</h2>
        <p className="muted">
          All withdrawals for this account (API and console). Same fields as get-by-id.
        </p>
        <Example text={curlListPayouts} />
      </div>

      <div className="panel" id="statuses">
        <h2 className="panel-title">Payout statuses</h2>
        <p className="muted">
          Stop polling on <code>completed</code>, <code>failed</code>, or <code>cancelled</code>.
          In automatic mode the job usually starts immediately. In manual mode it stays{' '}
          <code>pending</code> until an admin approves it.
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">pending</td>
                <td>Created. Waiting for admin (manual mode) or about to be queued.</td>
              </tr>
              <tr>
                <td className="mono">processing</td>
                <td>Payout claimed. <code>tx_hash</code> may still be empty.</td>
              </tr>
              <tr>
                <td className="mono">broadcasted</td>
                <td>Transaction sent to BSC.</td>
              </tr>
              <tr>
                <td className="mono">confirming</td>
                <td>Waiting for enough block confirmations.</td>
              </tr>
              <tr>
                <td className="mono">completed</td>
                <td>Done. Treat as paid. Use <code>tx_hash</code> as proof.</td>
              </tr>
              <tr>
                <td className="mono">failed</td>
                <td>Did not complete. Read <code>failure_reason</code>.</td>
              </tr>
              <tr>
                <td className="mono">cancelled</td>
                <td>Cancelled. Balance is no longer reserved for this payout.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 className="docs-subhead">Payout object fields</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">id</td>
                <td>Payout id (same as <code>payout_id</code>)</td>
              </tr>
              <tr>
                <td className="mono">amount</td>
                <td>Requested USDT</td>
              </tr>
              <tr>
                <td className="mono">payout_amount</td>
                <td>USDT sent on-chain (same as amount; no fee)</td>
              </tr>
              <tr>
                <td className="mono">wallet_address</td>
                <td>Destination you supplied</td>
              </tr>
              <tr>
                <td className="mono">status</td>
                <td>Lifecycle value above</td>
              </tr>
              <tr>
                <td className="mono">tx_hash</td>
                <td>On-chain hash after broadcast, otherwise null</td>
              </tr>
              <tr>
                <td className="mono">block_number</td>
                <td>Inclusion block when known</td>
              </tr>
              <tr>
                <td className="mono">explorer_url</td>
                <td>BscScan URL when <code>tx_hash</code> exists</td>
              </tr>
              <tr>
                <td className="mono">payout_from_address</td>
                <td>Treasury address that paid</td>
              </tr>
              <tr>
                <td className="mono">failure_reason</td>
                <td>Set when status is failed</td>
              </tr>
              <tr>
                <td className="mono">source</td>
                <td>
                  <code>api</code> for this interface, <code>manual</code> for console
                </td>
              </tr>
              <tr>
                <td className="mono">created_at / completed_at</td>
                <td>Timestamps</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
