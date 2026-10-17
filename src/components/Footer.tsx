import Link from "next/link";
import { Wordmark } from "./Nav";
import { socialLinks } from "./SocialLinks";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/events", label: "Screener" },
      { href: "/#spreads", label: "Spreads" },
      { href: "/#movers", label: "Movers" },
      { href: "/#alerts", label: "Alerts" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "/about", label: "Methodology" },
      { href: "/#faq", label: "FAQ" },
      ...socialLinks().map((s) => ({
        href: s.href,
        label: s.key === "twitter" ? "X (Twitter)" : "pump.fun",
        external: true,
      })),
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/risk", label: "Risk disclaimer" },
      { href: "/about#limitations", label: "Data limitations" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Wordmark />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            A free terminal for comparing prediction-market odds on the same event across venues.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="font-sans text-sm font-medium text-fg">{col.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {col.links.map((l) => (
                <li key={l.label}>
                  {"external" in l ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="hover:text-fg">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-muted sm:px-6">
          Plax shows public market prices for information only. It is not financial advice, and it does not offer
          trading. Prices can be delayed or wrong; check the venue before acting.
        </p>
      </div>
    </footer>
  );
}
