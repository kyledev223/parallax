export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class VenueError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VenueError";
  }
}

const USER_AGENT = "Parallax/0.1 (read-only market data)";

type GetOptions = {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  retries?: number;
  /** Extra fetch options, e.g. `{ next: { revalidate } }` to use the shared fetch cache. */
  init?: RequestInit;
};

/**
 * GET with a timeout and a single retry on 429/5xx. Errors are thrown as
 * VenueError so callers can mark that source unavailable without crashing.
 */
async function get<T>(
  url: string,
  accept: string,
  read: (res: Response) => Promise<T>,
  { fetchImpl = fetch, timeoutMs = 8000, retries = 1, init }: GetOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchImpl(url, {
        // Venue prices must be fetched fresh: freshness is owned by the `use cache`
        // wrappers in data.ts (30s for prices). Without an explicit no-store, Next
        // stores these responses in its fetch cache with a 15-minute default, so a
        // "refreshed" snapshot could silently reuse old prices. Callers that want
        // the shared fetch cache (news) pass `init.next` instead.
        ...(init?.next || init?.cache ? {} : { cache: "no-store" as const }),
        ...init,
        headers: { accept, "user-agent": USER_AGENT },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return await read(res);
      lastError = new VenueError(`${res.status} from ${new URL(url).host}`, res.status);
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      lastError = e instanceof VenueError ? e : new VenueError(`request to ${new URL(url).host} failed: ${String(e)}`);
    }
    if (attempt < retries) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw lastError;
}

export function getJson<T>(url: string, opts?: GetOptions): Promise<T> {
  return get(url, "application/json", (res) => res.json() as Promise<T>, opts);
}

export function getText(url: string, opts?: GetOptions): Promise<string> {
  return get(url, "application/rss+xml, application/xml, text/xml, */*", (res) => res.text(), opts);
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
