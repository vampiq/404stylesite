import { useCursorGlow } from '@/hooks/useCursorGlow';

export function Background() {
  const glow = useCursorGlow();
  return (
    <>
      <div className="bg-grid" aria-hidden />
      <div className="bg-noise" aria-hidden />
      <div
        ref={glow}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[1] hidden h-[500px] w-[500px] will-change-transform [@media(hover:hover)]:block"
        style={{ background: 'radial-gradient(circle, rgb(var(--primary) / .16), transparent 65%)' }}
      />
    </>
  );
}
