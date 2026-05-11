export default function SkeletonCard() {
  return (
    <div
      className="card rounded-2xl p-5 space-y-3"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="skeleton-line h-4 w-1/4" />
      <div className="skeleton-line h-3 w-2/3" />
      <div className="skeleton-line h-3 w-1/2" />
      <div className="skeleton-line h-3 w-3/4" />
    </div>
  );
}
