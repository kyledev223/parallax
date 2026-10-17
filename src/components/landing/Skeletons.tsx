/** Placeholders that hold each landing block's shape while live data loads. */

export function PreviewSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-line" />
          ))}
        </div>
        <div className="skeleton mx-auto h-5 w-full max-w-sm" />
      </div>
      <div className="space-y-4 p-5">
        <div className="skeleton h-5 w-24" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex gap-6">
            <div className="skeleton h-3.5 flex-1" />
            <div className="skeleton h-3.5 w-14" />
            <div className="skeleton h-3.5 w-14" />
            <div className="skeleton h-3.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChipsSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-wrap gap-2">
      {[120, 150, 132, 140, 118, 126].map((w, i) => (
        <div key={i} className="skeleton h-8 rounded-full" style={{ width: w }} />
      ))}
    </div>
  );
}

export function ArtSkeleton() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="skeleton aspect-[480/420] w-full rounded-none" />
      <div className="border-t border-line px-4 py-2.5">
        <div className="skeleton h-3 w-56" />
      </div>
    </div>
  );
}

export function AlertFormSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6 rounded-xl border border-line bg-panel p-6">
      <div className="space-y-2">
        <div className="skeleton h-3 w-12" />
        <div className="skeleton h-10 w-full" />
      </div>
      <div className="space-y-2">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-2 w-full" />
      </div>
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
