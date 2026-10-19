import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Glitch } from '@/components/fx/Glitch';

const KEY = '404style:preloaded';

/** «404» с прогрессом — один раз за сессию. */
export function Preloader() {
  const [visible, setVisible] = useState(() => sessionStorage.getItem(KEY) !== '1');
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setPct((p) => Math.min(100, p + 4 + Math.round(Math.random() * 10))), 70);
    return () => clearInterval(t);
  }, [visible]);

  useEffect(() => {
    if (pct < 100) return;
    const t = setTimeout(() => { sessionStorage.setItem(KEY, '1'); setVisible(false); }, 250);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="fixed inset-0 z-[100] grid place-items-center bg-bg" role="status" aria-label="Загрузка">
          <div className="w-64 text-center">
            <Glitch scan className="font-mono text-7xl font-bold text-primary">404</Glitch>
            <div className="mt-6 h-1 overflow-hidden rounded-full bg-line"><div className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-100" style={{ width: `${pct}%` }} /></div>
            <p className="mt-3 font-mono text-xs text-muted">загружаем стиль… {pct}%</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
