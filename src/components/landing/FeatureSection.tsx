import { Eyebrow } from "../ui/Mark";

export function FeatureSection({
  id,
  eyebrow,
  title,
  body,
  bullets,
  chips,
  chipsLabel,
  visual,
  reverse = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  chips: React.ReactNode;
  chipsLabel: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={reverse ? "lg:order-2" : ""}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 id={headingId} className="mt-4 text-[clamp(2.25rem,4.5vw,3.5rem)] leading-[1.02]">
            {title}
          </h2>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-muted">{body}</p>
          <ul className="mt-6 space-y-2.5 text-[15px]">
            {bullets.map((b) => (
              <li key={b} className="flex gap-3">
                <span className="mt-[0.55em] h-px w-3 shrink-0 bg-accent" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <h3 className="mb-3 font-sans text-xs text-muted">{chipsLabel}</h3>
            {chips}
          </div>
        </div>
        <div className={reverse ? "lg:order-1" : ""}>{visual}</div>
      </div>
    </section>
  );
}

export function ArtFrame({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-line bg-panel">
      {children}
      <figcaption className="border-t border-line px-4 py-2.5 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
