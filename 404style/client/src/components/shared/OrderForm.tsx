import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { ApiError, api } from '@/lib/api';
import { cn, maskPhone } from '@/lib/utils';
import type { CalcInput } from '@/lib/types';

const TYPES = ['Лендинг', 'Интернет-магазин', 'Корпоративный сайт', 'Другое'];
const BUDGETS = ['до 50 000 ₽', '50 000 – 100 000 ₽', '100 000 – 200 000 ₽', 'от 200 000 ₽'];
const DEADLINES = ['5 дней (срочно)', '7–10 дней', '14 дней', 'Не горит'];
const TYPE_BY_CALC: Record<CalcInput['type'], string> = { landing: 'Лендинг', corporate: 'Корпоративный сайт', shop: 'Интернет-магазин' };

const schema = z.object({
  projectType: z.string().min(1, 'Выберите тип проекта'),
  budget: z.string().min(1, 'Выберите бюджет'),
  deadline: z.string().min(1, 'Выберите сроки'),
  message: z.string().trim().max(2000, 'Слишком длинно').optional(),
  name: z.string().trim().min(2, 'Введите имя'),
  email: z.string().trim().email('Некорректный email'),
  phone: z.string().regex(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/, 'Введите телефон полностью'),
  website: z.string().optional(), // honeypot
});
type Values = z.infer<typeof schema>;

const STEPS: (keyof Values)[][] = [['projectType'], ['budget', 'deadline', 'message'], ['name', 'email', 'phone']];
const TITLES = ['Что строим?', 'Бюджет и сроки', 'Куда писать?'];
const DRAFT_KEY = '404style:order-draft';

const loadDraft = (): Partial<Values> => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') as Partial<Values>; } catch { return {}; }
};

export function OrderForm() {
  const state = useLocation().state as { calculator?: CalcInput; plan?: string } | null;
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, trigger, watch, setValue, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { ...loadDraft(), website: '' },
  });
  const type = watch('projectType');

  // Черновик: не теряем введённое при перезагрузке
  useEffect(() => {
    const sub = watch((v) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...v, website: undefined })); } catch { /* noop */ } });
    return () => sub.unsubscribe();
  }, [watch]);

  // Предзаполнение из калькулятора и тарифов
  useEffect(() => {
    if (state?.calculator) setValue('projectType', TYPE_BY_CALC[state.calculator.type]);
    if (state?.plan) setValue('message', `Интересует тариф «${state.plan}».`);
  }, [state, setValue]);

  const send = useMutation({
    mutationFn: (v: Values) => api('/orders', { method: 'POST', body: { ...v, message: v.message || undefined, calculator: state?.calculator } }),
    onSuccess: () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* noop */ } reset(); setDone(true); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Не удалось отправить. Проверьте соединение.'),
  });

  const next = async () => { if (await trigger(STEPS[step])) setStep((s) => s + 1); };
  const last = step === STEPS.length - 1;

  if (done) {
    return (
      <div className="card-surface p-10 text-center" role="status">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent text-[#0a0a0f] shadow-glowA"><Check size={40} strokeWidth={3} /></motion.div>
        <h3 className="mt-6 text-2xl font-bold">Заявка улетела!</h3>
        <p className="mt-2 text-muted">Свяжемся в течение рабочего дня и пришлём смету.</p>
        <Button variant="secondary" className="mt-6" onClick={() => { setDone(false); setStep(0); }}>Отправить ещё одну</Button>
      </div>
    );
  }

  return (
    <form id="order-form" noValidate onSubmit={handleSubmit((v) => send.mutate(v))} className="card-surface p-6 md:p-8">
      <div className="mb-2 flex justify-between font-mono text-xs text-muted"><span>ШАГ 0{step + 1} / 03</span><span>{TITLES[step]}</span></div>
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}>
        <motion.div className="h-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${((step + 1) / 3) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
          {step === 0 && (
            <fieldset>
              <legend className="mb-4 text-lg font-semibold">{TITLES[0]}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {TYPES.map((t) => (
                  <label key={t} className={cn('cursor-pointer rounded-2xl border p-4 text-sm font-medium transition', type === t ? 'border-accent bg-accent/10' : 'border-line hover:border-primary')}>
                    <input type="radio" value={t} className="sr-only" {...register('projectType')} />{t}
                  </label>
                ))}
              </div>
              <p role="alert" className="mt-2 min-h-4 text-xs text-red-400">{errors.projectType?.message}</p>
            </fieldset>
          )}
          {step === 1 && (
            <div className="space-y-1">
              <Field label="Бюджет" error={errors.budget?.message}><Select invalid={!!errors.budget} defaultValue="" {...register('budget')}><option value="">Выберите…</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</Select></Field>
              <Field label="Сроки" error={errors.deadline?.message}><Select invalid={!!errors.deadline} defaultValue="" {...register('deadline')}><option value="">Выберите…</option>{DEADLINES.map((d) => <option key={d}>{d}</option>)}</Select></Field>
              <Field label="Коротко о задаче" error={errors.message?.message}><Textarea placeholder="Что продаёте, кому, какой результат нужен" {...register('message')} /></Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-1">
              <Field label="Имя" error={errors.name?.message}><Input autoComplete="name" placeholder="Как к вам обращаться" invalid={!!errors.name} {...register('name')} /></Field>
              <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" placeholder="you@company.ru" invalid={!!errors.email} {...register('email')} /></Field>
              <Field label="Телефон" error={errors.phone?.message}>
                <Input inputMode="tel" autoComplete="tel" placeholder="+7 (___) ___-__-__" invalid={!!errors.phone} {...register('phone', { onChange: (e) => { e.target.value = maskPhone(e.target.value); } })} />
              </Field>
              <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" {...register('website')} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex gap-3">
        {step > 0 && <Button type="button" variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)}>Назад</Button>}
        {last ? (
          <Button type="submit" size="lg" className="flex-1" disabled={send.isPending}>{send.isPending ? <><Loader2 className="animate-spin" size={18} />Отправляем…</> : 'Отправить заявку'}</Button>
        ) : (
          <Button type="button" size="lg" className="flex-1" onClick={next}>Дальше</Button>
        )}
      </div>
    </form>
  );
}
