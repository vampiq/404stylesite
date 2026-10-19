import type { ComponentType } from 'react';
import { Link, createBrowserRouter, useRouteError, type RouteObject } from 'react-router-dom';
import { Glitch } from '@/components/fx/Glitch';
import Layout from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Glitch className="font-mono text-6xl font-bold text-primary">500</Glitch>
        <h1 className="mt-4 text-2xl font-bold">Что-то пошло не так. Стильно.</h1>
        <Link to="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 font-semibold text-[#0a0a0f]">На главную</Link>
      </div>
    </div>
  );
}

// Ленивая загрузка: страницы с экспортом Component или именованным экспортом
const page = (loader: () => Promise<{ Component: ComponentType }>): Pick<RouteObject, 'lazy'> => ({ lazy: loader });
const named = <M extends Record<string, ComponentType>, K extends keyof M>(loader: () => Promise<M>, key: K): Pick<RouteObject, 'lazy'> => ({
  lazy: async () => ({ Component: (await loader())[key] }),
});
const cruds = () => import('@/pages/admin/Cruds');

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, ...page(() => import('@/pages/Home')) },
      { path: 'services', ...page(() => import('@/pages/Services')) },
      { path: 'portfolio', ...page(() => import('@/pages/Portfolio')) },
      { path: 'portfolio/:slug', ...page(() => import('@/pages/Case')) },
      { path: 'pricing', ...page(() => import('@/pages/Pricing')) },
      { path: 'calculator', ...page(() => import('@/pages/CalculatorPage')) },
      { path: 'about', ...page(() => import('@/pages/About')) },
      { path: 'contacts', ...page(() => import('@/pages/Contacts')) },
      { path: 'login', ...page(() => import('@/pages/Auth')) },
      { path: 'register', ...named(() => import('@/pages/Auth'), 'Register') },
      {
        path: 'dashboard',
        element: <ProtectedRoute />,
        children: [{
          ...page(() => import('@/pages/dashboard/DashboardLayout')),
          children: [
            { index: true, ...page(() => import('@/pages/dashboard/Orders')) },
            { path: 'orders/:id', ...page(() => import('@/pages/dashboard/OrderDetail')) },
            { path: 'profile', ...page(() => import('@/pages/dashboard/Profile')) },
          ],
        }],
      },
      { path: '404', ...page(() => import('@/pages/NotFound')) },
      { path: '*', ...page(() => import('@/pages/NotFound')) },
    ],
  },
  {
    // Админка — вне публичного Layout. Менеджер видит только заказы, остальное — ADMIN.
    path: 'admin',
    element: <ProtectedRoute roles={['ADMIN', 'MANAGER']} />,
    errorElement: <RouteError />,
    children: [{
      ...page(() => import('@/components/admin/AdminLayout')),
      children: [
        { index: true, ...page(() => import('@/pages/admin/Dashboard')) },
        { path: 'orders', ...page(() => import('@/pages/admin/Orders')) },
        { path: 'orders/:id', ...page(() => import('@/pages/admin/OrderDetail')) },
        {
          element: <ProtectedRoute roles={['ADMIN']} />,
          children: [
            { path: 'projects', ...named(cruds, 'ProjectsAdmin') },
            { path: 'services', ...named(cruds, 'ServicesAdmin') },
            { path: 'pricing', ...named(cruds, 'PricingAdmin') },
            { path: 'reviews', ...named(cruds, 'ReviewsAdmin') },
            { path: 'faq', ...named(cruds, 'FaqAdmin') },
            { path: 'team', ...named(cruds, 'TeamAdmin') },
            { path: 'settings', ...page(() => import('@/pages/admin/Settings')) },
            { path: 'audit', ...page(() => import('@/pages/admin/Audit')) },
          ],
        },
      ],
    }],
  },
]);
