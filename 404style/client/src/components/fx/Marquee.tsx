export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="marquee overflow-hidden border-y border-line py-4" aria-hidden>
      <div className="marquee-track">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="mx-6 whitespace-nowrap font-mono text-sm uppercase tracking-widest text-muted">
            {t}
            <span className="grad-text ml-12">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
