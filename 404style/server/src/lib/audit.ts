import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db.js';

interface AuditInput {
  action: string;
  entity: string;
  entityId?: string | null;
  payload?: unknown;
  userId?: string | null;
}

/** Fire-and-forget: сбой аудита не должен ломать основной запрос. Пароли в payload не передавать. */
export function audit(req: Request, a: AuditInput): void {
  void prisma.auditLog
    .create({
      data: {
        userId: a.userId ?? req.user?.id ?? null,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId ?? null,
        payload: (a.payload ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: req.ip,
      },
    })
    .catch((e) => console.error('audit failed', e));
}
