import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Banknote, Inbox, TrendingUp, UserPlus } from 'lucide-react';
import { AdminTitle } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Select } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/card';
import { CountUp } from '@/components/fx/Counters';
import { api } from '@/lib/api';
import { StatusBadge } from '@/lib/status';
import { formatDate, formatPrice } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import type { Stats } from '@/lib/types';

const COLORS = ['#8b5cf6', '#22d3ee', '#a3e635', '#f43f8e', '#facc15'];
const tooltipStyle = { background: 'rgb(var(--surface))', border: '1px solid rgb(var(--line) / .15)', borderRadius: 12, fontSize: 12 };

function Kpi({ label, Icon, children, hint }: { label: string; Icon: typeof Inbox; children: React.ReactNode; hint?: string }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between text-muted"><span className="font-mono text-xs uppercase tracking-wider">{label}</span><Icon size={18} className="text-primary" /></div>
      <p className="mt-3 font-mono text-3xl font-bold">{children}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Component() {
  const role = useAuth((s) => s.user?.role);
  const [days, setDays] = useState(30);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats', days], queryFn: () => api<Stats>('/admin/stats', { query: { days } }), enabled: role === 'ADMIN' });
  if (role === 'MANAGER') return <Navigate to="/admin/orders" replace />; // у менеджера нет дашборда

  return (
    <>
      <AdminTitle title="Дашборд" sub={`Период: последние ${days} дней`} action={
        <Select aria-label="Период" className="w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 дней</option><option value={30}>30 дней</option><option value={90}>90 дней</option></Select>
      } />
      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Заявки" Icon={Inbox} hint={`новых: ${data.kpi.newOrders} · непрочитанных сообщений: ${data.kpi.unreadMessages}`}><CountUp to={data.kpi.orders} /></Kpi>
            <Kpi label="Конверсия" Icon={TrendingUp} hint="заявки, дошедшие до «Готово»">{data.kpi.conversion}%</Kpi>
            <Kpi label="Средний чек" Icon={Banknote} hint="по данным калькулятора">{data.kpi.avgCheck ? formatPrice(data.kpi.avgCheck) : '—'}</Kpi>
            <Kpi label="Новые клиенты" Icon={UserPlus}><CountUp to={data.kpi.newClients} /></Kpi>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <section className="card-surface p-5 xl:col-span-2" aria-label="Заявки по дням">
              <h2 className="mb-4 font-semibold">Заявки по дням</h2>
              <div className="h-72 text-muted">
                <ResponsiveContainer>
                  <AreaChart data={data.ordersByDay} margin={{ left: -20, right: 8 }}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'currentColor', fontSize: 11 }} tickFormatter={(d: string) => d.slice(5)} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={(d: string) => formatDate(d, false)} formatter={(v: number) => [v, 'Заявок']} />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
            <section className="card-surface p-5" aria-label="Типы проектов">
              <h2 className="mb-4 font-semibold">Типы проектов</h2>
              {data.topServices.length === 0 ? <p className="py-20 text-center text-sm text-muted">Данных пока нет</p> : (
                <>
                  <div className="h-52"><ResponsiveContainer><PieChart><Pie data={data.topServices} dataKey="count" nameKey="type" innerRadius={52} outerRadius={80} paddingAngle={3} stroke="none">{data.topServices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div>
                  <ul className="mt-2 space-y-1.5 text-sm">{data.topServices.map((s, i) => <li key={s.type} className="flex items-center justify-between"><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.type}</span><span className="font-mono text-muted">{s.count}</span></li>)}</ul>
                </>
              )}
            </section>
          </div>

          <div className="mb-3 mt-8 flex items-center justify-between"><h2 className="font-semibold">Последние заявки</h2><Link to="/admin/orders" className="text-sm text-secondary hover:underline">Все заявки →</Link></div>
          <DataTable rows={data.recentOrders} page={1} pages={1} total={data.recentOrders.length} onPage={() => undefined} onRowClick={(o) => navigate(`/admin/orders/${o.id}`)} columns={[
            { key: 'createdAt', header: 'Дата', cell: (o) => <span className="font-mono text-xs">{formatDate(o.createdAt)}</span> },
            { key: 'name', header: 'Клиент', cell: (o) => <span className="font-medium">{o.name}</span> },
            { key: 'projectType', header: 'Тип' },
            { key: 'status', header: 'Статус', cell: (o) => <StatusBadge status={o.status} /> },
          ]} />
        </>
      )}
    </>
  );
}
