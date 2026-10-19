import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

/** Count-up при появлении в зоне видимости. */
export function CountUp({ to, suffix = '', duration = 1.6 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    const c = animate(0, to, { duration, ease: 'easeOut', onUpdate: (v) => { el.textContent = Math.round(v).toLocaleString('ru-RU') + suffix; } });
    return () => c.stop();
  }, [inView, to, suffix, duration]);
  return <span ref={ref}>0{suffix}</span>;
}

/** Плавная смена цены (от предыдущего значения к новому). */
export function AnimatedPrice({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const c = animate(prev.current, value, { duration: 0.6, ease: 'easeOut', onUpdate: (v) => { prev.current = v; el.textContent = formatPrice(Math.round(v)); } });
    return () => c.stop();
  }, [value]);
  return <span ref={ref}>{formatPrice(value)}</span>;
}
