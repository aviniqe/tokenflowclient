import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { HiOutlineClipboardDocument, HiOutlineKey, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import { api } from '../api.js';
import Pagination from '../components/Pagination.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Modal from '../components/Modal.jsx';
import { FormSkeleton, TableSkeleton } from '../components/Skeleton.jsx';
import { formatWhen } from '../formatWhen.js';

const PAGE_SIZE = 10;

export default function DeveloperApiPage() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('Withdrawal API');
  const [ips, setIps] = useState(['']);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [revokeId, setRevokeId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editIps, setEditIps] = useState(['']);
  const [page, setPage] = useState(1);

  async function refresh() {
    const result = await api('/developer-tokens');
    setRows(Array.isArray(result.data) ? result.data : []);
  }

  useEffect(() => {
    refresh().catch((e) => toast.error(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  function setIp(list, setter, index, value) {
    setter(list.map((item, i) => (i === index ? value : item)));
  }

  function addIp(list, setter) {
    setter([...list, '']);
  }

  function removeIp(list, setter, index) {
    setter(list.length <= 1 ? [''] : list.filter((_, i) => i !== index));
  }

  function collectIps(list) {
    return list.map((item) => item.trim()).filter(Boolean);
  }

  function askCreate(e) {
    e.preventDefault();
    setConfirmCreate(true);
  }

  async function create() {
    setCreating(true);
    try {
      const result = await api('/developer-tokens', {
        method: 'POST',
        body: {
          name: name.trim() || 'Withdrawal API',
          allowed_ips: collectIps(ips),
        },
      });
      setCreatedToken(result.data?.token || null);
      setConfirmCreate(false);
      setIps(['']);
      toast.success('API token created. Copy it now.');
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function revoke() {
    setBusy(true);
    try {
      await api(`/developer-tokens/${revokeId}`, { method: 'DELETE' });
      toast.success('Token revoked');
      setRevokeId(null);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveIps() {
    if (!editRow) return;
    setBusy(true);
    try {
      await api(`/developer-tokens/${editRow.id}`, {
        method: 'PATCH',
        body: { allowed_ips: collectIps(editIps) },
      });
      toast.success('IP whitelist updated');
      setEditRow(null);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  }

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE) || 1);
  const slice = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Withdrawal API</h1>
          <p>
            Generate an API token to call the payout and deposit APIs from your own systems. You can whitelist
            multiple IPs; leave the list empty to allow any IP. Full request examples live on the{' '}
            <Link to="/developer/reference">API reference</Link> page.
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
          <form className="panel form-grid" onSubmit={askCreate}>
            <div>
              <label>Token name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Withdrawal API" />
            </div>
            <div>
              <label>Whitelisted IPs</label>
              {ips.map((ip, index) => (
                <div className="copy-row" key={index} style={{ marginBottom: 8 }}>
                  <input
                    value={ip}
                    onChange={(e) => setIp(ips, setIps, index, e.target.value)}
                    placeholder="203.0.113.10"
                    autoComplete="off"
                  />
                  <button className="btn-ghost" type="button" onClick={() => removeIp(ips, setIps, index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button className="btn-ghost" type="button" onClick={() => addIp(ips, setIps)}>
                <HiOutlinePlus /> Add IP
              </button>
              <p className="muted" style={{ margin: '8px 0 0' }}>
                Requests using this token must come from one of these addresses when the list is not empty.
              </p>
            </div>
            <button className="btn-primary" type="submit">
              <HiOutlineKey /> Generate token
            </button>
          </form>

          <div className="panel">
            <h2 className="panel-title">API reference</h2>
            <p className="muted">
              Endpoints, curl examples, payout status polling, and deposit tickets are documented separately so
              this page stays focused on tokens.
            </p>
            <Link className="btn-primary" to="/developer/reference">
              Open API reference
            </Link>
          </div>

          <div className="panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>IPs</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slice.map((row, index) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td>{row.name}</td>
                    <td className="mono">{row.token_prefix}</td>
                    <td className="mono">
                      {Array.isArray(row.allowed_ips) && row.allowed_ips.length
                        ? row.allowed_ips.join(', ')
                        : 'Any IP'}
                    </td>
                    <td className="muted">{formatWhen(row.created_at)}</td>
                    <td className="muted">{formatWhen(row.last_used_at)}</td>
                    <td><span className={`badge ${row.active ? 'active' : 'rejected'}`}>{row.active ? 'active' : 'revoked'}</span></td>
                    <td>
                      {row.active ? (
                        <div className="btn-row">
                          <button className="btn-ghost" type="button" onClick={() => {
                            setEditRow(row);
                            setEditIps(row.allowed_ips?.length ? [...row.allowed_ips] : ['']);
                          }}>
                            IPs
                          </button>
                          <button className="btn-danger" type="button" onClick={() => setRevokeId(row.id)}>
                            <HiOutlineTrash /> Revoke
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pages={pages} total={rows.length} onPage={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmCreate}
        title="Generate API token"
        message="Create a withdrawal API token? The full token is shown only once. Store it securely."
        confirmLabel="Generate"
        busy={creating}
        onConfirm={create}
        onClose={() => setConfirmCreate(false)}
      />
      <ConfirmDialog
        open={Boolean(revokeId)}
        title="Revoke token"
        message="Revoke this API token? Existing integrations using it will stop working immediately."
        confirmLabel="Revoke"
        danger
        busy={busy}
        onConfirm={revoke}
        onClose={() => setRevokeId(null)}
      />

      <Modal open={Boolean(createdToken)} title="Copy your API token" onClose={() => setCreatedToken(null)}>
        {createdToken && (
          <div className="form-grid">
            <p className="muted" style={{ margin: 0 }}>This value will not be shown again.</p>
            <code className="mono address-box">{createdToken}</code>
            <div className="btn-row">
              <button className="btn-primary" type="button" onClick={() => copy(createdToken, 'Token')}>
                <HiOutlineClipboardDocument /> Copy token
              </button>
              <button className="btn-ghost" type="button" onClick={() => setCreatedToken(null)}>Done</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(editRow)} title="Whitelist IPs" onClose={() => setEditRow(null)}>
        {editRow && (
          <div className="form-grid">
            <p className="muted" style={{ margin: 0 }}>Token: {editRow.name}</p>
            {editIps.map((ip, index) => (
              <div className="copy-row" key={index}>
                <input
                  value={ip}
                  onChange={(e) => setIp(editIps, setEditIps, index, e.target.value)}
                  placeholder="203.0.113.10"
                />
                <button className="btn-ghost" type="button" onClick={() => removeIp(editIps, setEditIps, index)}>Remove</button>
              </div>
            ))}
            <button className="btn-ghost" type="button" onClick={() => addIp(editIps, setEditIps)}>
              <HiOutlinePlus /> Add IP
            </button>
            <div className="btn-row">
              <button className="btn-primary" type="button" onClick={saveIps} disabled={busy}>
                {busy ? 'Saving…' : 'Save IPs'}
              </button>
              <button className="btn-ghost" type="button" onClick={() => setEditRow(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
