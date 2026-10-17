import type { NewsResult } from "@/lib/news";
import { ExternalIcon } from "../PageShell";
import { RelativeTime } from "../ui/RelativeTime";

export function NewsList({ result }: { result: NewsResult }) {
  if (result.status === "disabled") {
    return (
      <p className="rounded-xl border border-line bg-panel p-6 text-sm text-muted">
        Related headlines are turned off on this site. Prices and history above are unaffected.
      </p>
    );
  }
  if (result.status === "error") {
    return (
      <p role="status" className="rounded-xl border border-line bg-panel p-6 text-sm text-muted">
        Headlines couldn&apos;t be loaded right now. The news source may be busy; this page tries again within a few
        minutes.
      </p>
    );
  }
  if (result.items.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-panel p-6 text-sm text-muted">
        No recent headlines matched this event&apos;s keywords.
      </p>
    );
  }
  return (
    <ol className="divide-y divide-line rounded-xl border border-line bg-panel">
      {result.items.map((item) => (
        <li key={item.url} className="px-5 py-4">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group inline-flex gap-2 text-fg hover:text-accent-hover"
          >
            <span className="underline-offset-4 group-hover:underline">{item.title}</span>
            <ExternalIcon className="mt-1.5 shrink-0 text-muted" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <p className="mt-1 text-xs text-muted">
            {item.source}
            {item.publishedAt && (
              <>
                {" "}
                · <RelativeTime iso={item.publishedAt} />
              </>
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function NewsListSkeleton() {
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-panel" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 px-5 py-4">
          <div className="skeleton h-3.5 w-4/5" />
          <div className="skeleton h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
