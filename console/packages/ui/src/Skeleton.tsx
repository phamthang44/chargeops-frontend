/** Loading placeholder block (pulse). Size with className, e.g. "h-6 w-32". */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-chip ${className}`} />;
}
