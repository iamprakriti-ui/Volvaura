export default function Marquee({ items = [], speed = 40 }) {
  const doubled = [...items, ...items];
  return (
    <div
      data-testid="editorial-marquee"
      className="relative overflow-hidden border-y border-white/5 bg-black py-8"
    >
      <div
        className="flex whitespace-nowrap"
        style={{ animation: `marquee ${speed}s linear infinite` }}
      >
        {doubled.map((item, i) => (
          <div key={i} className="flex shrink-0 items-center gap-8 pr-8">
            <span className="font-display text-5xl uppercase tracking-tight text-white/90 md:text-7xl">
              {item}
            </span>
            <span className="text-4xl text-violet md:text-5xl">✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
