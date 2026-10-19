import { useEffect } from 'react';
import { Outlet, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Background } from '@/components/fx/Background';
import { Seo, organizationLd } from '@/lib/seo';
import { Footer } from './Footer';
import { Header } from './Header';

/** Скролл к якорю или наверх при смене маршрута. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export default function Layout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  return (
    <>
      <Seo jsonLd={[organizationLd()]} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-[#0a0a0f]">К содержимому</a>
      <Background />
      <ScrollManager />
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          id="main"
          key={pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative z-10 min-h-screen pt-16"
        >
          {outlet ?? <Outlet />}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </>
  );
}
