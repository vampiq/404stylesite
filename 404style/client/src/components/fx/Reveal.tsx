import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props { children: ReactNode; className?: string; delay?: number; y?: number; x?: number; scale?: number }

/** Scroll-triggered появление: fade-up / slide-in / scale. */
export function Reveal({ children, className, delay = 0, y = 28, x = 0, scale = 1 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x, scale: scale === 1 ? 1 : 0.94 }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
