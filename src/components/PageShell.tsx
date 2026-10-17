import { AutoRefresh } from "./AutoRefresh";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

/** `live` keeps the page's server data current with periodic refreshes. */
export function PageShell({ children, live = false }: { children: React.ReactNode; live?: boolean }) {
  return (
    <>
      {live && <AutoRefresh />}
      <Nav />
      <main id="main" className="min-h-[70vh]">
        {children}
      </main>
      <Footer />
    </>
  );
}

export function ExternalIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" className={className}>
      <path d="M4.5 2.5h5v5M9.5 2.5 3 9" />
    </svg>
  );
}
