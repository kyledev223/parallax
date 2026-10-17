/** Two offset circles: the same thing, seen from two places. */
export function Mark({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 24 18"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="8.5" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.5" cy="9" r="6.75" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2 text-sm font-medium text-accent ${className}`}>
      <Mark size={18} />
      <span>{children}</span>
    </p>
  );
}
