"use client";

import { useEffect, useId, useState } from "react";
import { pp } from "@/lib/format";

export type AlertOption = { id: string; shortName: string; gapPp: number | null };
type SavedAlert = { eventId: string; thresholdPp: number; createdAt: string };

// Storage key keeps the original name so alerts saved before the rename still load.
const KEY = "parallax.alerts.v1";

function load(): SavedAlert[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedAlert[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(alerts: SavedAlert[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(alerts));
    return true;
  } catch {
    return false;
  }
}

/**
 * Alerts stub: thresholds are kept in this browser's localStorage and checked
 * against current gaps whenever the page loads. No email is sent yet.
 */
export function AlertForm({ options }: { options: AlertOption[] }) {
  const ids = { event: useId(), threshold: useId(), status: useId() };
  const [eventId, setEventId] = useState(options[0]?.id ?? "");
  const [threshold, setThreshold] = useState(5);
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAlerts(load()));
    return () => cancelAnimationFrame(raf);
  }, []);

  const byId = new Map(options.map((o) => [o.id, o]));
  const selected = byId.get(eventId);
  const open = alerts.filter((a) => {
    const g = byId.get(a.eventId)?.gapPp;
    return g != null && Math.abs(g) >= a.thresholdPp;
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const next = [
      ...alerts.filter((a) => a.eventId !== eventId),
      { eventId, thresholdPp: threshold, createdAt: new Date().toISOString() },
    ];
    if (save(next)) {
      setAlerts(next);
      setStatus(`Alert saved. You'll see it here when ${selected.shortName} reaches a ${threshold.toFixed(1)}pp gap.`);
    } else {
      setStatus("This browser blocked local storage, so the alert couldn't be saved. Try a non-private window.");
    }
  }

  function remove(id: string) {
    const next = alerts.filter((a) => a.eventId !== id);
    save(next);
    setAlerts(next);
    setStatus("Alert removed.");
  }

  if (options.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-panel p-6 text-sm text-muted">
        Alerts need at least one event with prices on both venues. None are available right now.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line bg-panel">
      <form onSubmit={onSubmit} className="space-y-6 p-5 sm:p-6" aria-describedby={ids.status}>
        <div className="space-y-2">
          <label htmlFor={ids.event} className="block text-sm text-muted">
            Event
          </label>
          <div className="relative">
            <select
              id={ids.event}
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full appearance-none rounded-md border border-line bg-bg px-3 py-2.5 pr-9 text-[15px]"
            >
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.shortName}
                </option>
              ))}
            </select>
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
            >
              <path d="M1 1l5 5 5-5" stroke="currentColor" fill="none" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="text-xs text-muted">
            Current gap <span className="num text-fg">{pp(selected?.gapPp)}</span>
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <label htmlFor={ids.threshold} className="text-sm text-muted">
              Alert when the gap reaches
            </label>
            <output htmlFor={ids.threshold} className="num text-2xl text-accent">
              {threshold.toFixed(1)}pp
            </output>
          </div>
          <input
            id={ids.threshold}
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
            aria-valuetext={`${threshold.toFixed(1)} percentage points`}
          />
          <div className="num flex justify-between text-xs text-muted" aria-hidden="true">
            <span>1pp</span>
            <span>20pp</span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2.5 text-[15px] font-medium text-bg transition-colors hover:bg-accent-hover"
        >
          Save alert
        </button>
        <p id={ids.status} role="status" aria-live="polite" className="min-h-5 text-sm text-muted">
          {status}
        </p>
      </form>

      {alerts.length > 0 && (
        <div className="border-t border-line p-5 sm:p-6">
          <h3 className="font-sans text-sm font-medium">
            Your alerts{" "}
            <span className="font-normal text-muted">
              · {open.length} of {alerts.length} open
            </span>
          </h3>
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => {
              const o = byId.get(a.eventId);
              const isOpen = open.includes(a);
              return (
                <li key={a.eventId} className="flex items-center gap-3 text-sm">
                  <span
                    className={`size-2 shrink-0 rounded-full ${isOpen ? "bg-accent" : "bg-line"}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{o?.shortName ?? a.eventId}</span>
                  <span className="num text-muted">
                    {pp(o?.gapPp)} / {a.thresholdPp.toFixed(1)}pp
                  </span>
                  <span className="sr-only">{isOpen ? "Gap has reached your threshold." : "Not reached yet."}</span>
                  <button
                    type="button"
                    onClick={() => remove(a.eventId)}
                    className="rounded px-1.5 text-muted hover:text-fg"
                    aria-label={`Remove alert for ${o?.shortName ?? a.eventId}`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="border-t border-line px-5 py-3 text-xs text-muted sm:px-6">
        Early access: alerts are saved in this browser and checked each time you visit. Email delivery is not live yet.
      </p>
    </div>
  );
}
