import { useEffect, useState } from 'react';

export default function Pagination({ page, pages, total, onPage }) {
  const [jump, setJump] = useState(String(page || 1));

  useEffect(() => {
    setJump(String(page || 1));
  }, [page]);

  if (!total) return <p className="muted">No records.</p>;

  function go(value) {
    const next = Math.min(pages, Math.max(1, Number(value) || 1));
    if (next !== page) onPage(next);
  }

  return (
    <div className="pager">
      <span className="muted">Page {page} of {pages} · {total} records</span>
      <div className="pager-controls">
        <button className="btn-ghost" type="button" disabled={page <= 1} onClick={() => go(1)}>First</button>
        <button className="btn-ghost" type="button" disabled={page <= 1} onClick={() => go(page - 1)}>Prev</button>
        <form className="pager-jump" onSubmit={(e) => { e.preventDefault(); go(jump); }}>
          <label>Go to</label>
          <input value={jump} onChange={(e) => setJump(e.target.value)} inputMode="numeric" />
          <button className="btn-ghost" type="submit">Go</button>
        </form>
        <button className="btn-ghost" type="button" disabled={page >= pages} onClick={() => go(page + 1)}>Next</button>
        <button className="btn-ghost" type="button" disabled={page >= pages} onClick={() => go(pages)}>Last</button>
      </div>
    </div>
  );
}
