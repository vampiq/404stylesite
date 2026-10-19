import { useEffect, useRef } from 'react';

/** Пятно света под курсором с инерцией (lerp). Не включается на touch и при reduced-motion. */
export function useCursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches) return;
    let tx = window.innerWidth / 2, ty = window.innerHeight / 3, x = tx, y = ty, raf = 0;
    const move = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const loop = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      el.style.transform = `translate3d(${x - 250}px, ${y - 250}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);
  return ref;
}
