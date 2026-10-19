import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Preloader } from '@/components/layout/Preloader';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useTheme } from '@/store/theme';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // 4xx не повторяем — это не сетевой сбой
      retry: (count, e) => !(e instanceof ApiError && e.status < 500) && count < 2,
    },
  },
});

export default function App() {
  const theme = useTheme((s) => s.theme);
  const init = useAuth((s) => s.init);
  useEffect(() => { void init(); }, [init]);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Preloader />
          <RouterProvider router={router} />
          <Toaster theme={theme} position="bottom-right" richColors closeButton />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
