export function Skeleton({ className = '' }) {
  return <span className={`skeleton ${className}`} />;
}

export function StatSkeleton({ count = 3 }) {
  return (
    <div className="cards">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat" key={i}>
          <Skeleton className="sk-line sm" />
          <Skeleton className="sk-line lg" />
          <Skeleton className="sk-line md" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ cols = 6, rows = 6 }) {
  return (
    <div className="panel table-wrap">
      <table>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton className="sk-line sm" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}><Skeleton className="sk-line" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FormSkeleton({ fields = 3 }) {
  return (
    <div className="panel form-grid">
      <Skeleton className="sk-line sm" />
      {Array.from({ length: fields }).map((_, i) => (
        <Skeleton className="sk-input" key={i} />
      ))}
      <Skeleton className="sk-btn" />
    </div>
  );
}

export function PageSkeleton({ stats = 0, form = false, cols = 6 }) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <Skeleton className="sk-line lg" />
          <Skeleton className="sk-line md" />
        </div>
      </div>
      {stats ? <StatSkeleton count={stats} /> : null}
      {form ? <FormSkeleton /> : null}
      <TableSkeleton cols={cols} />
    </div>
  );
}
