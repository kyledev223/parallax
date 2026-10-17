import { SITE } from "@/lib/site";

export function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** A two-tone capsule, drawn for this site (not the venue's logo file). */
export function PumpFunIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" className={className}>
      <g transform="rotate(-45 12 12)">
        <rect x="3" y="8" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 8h5a4 4 0 0 1 0 8h-5z" fill="currentColor" />
      </g>
    </svg>
  );
}

export type SocialLink = { key: "twitter" | "pumpfun"; href: string; label: string; Icon: typeof XIcon };

/** Configured social links only, in display order. */
export function socialLinks(): SocialLink[] {
  const out: SocialLink[] = [];
  if (SITE.social.twitter) out.push({ key: "twitter", href: SITE.social.twitter, label: "Plax on X", Icon: XIcon });
  if (SITE.social.pumpfun) out.push({ key: "pumpfun", href: SITE.social.pumpfun, label: "Plax on pump.fun", Icon: PumpFunIcon });
  return out;
}
