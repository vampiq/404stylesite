export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
export const badRequest = (m = 'Некорректный запрос', d?: unknown) => new AppError(400, 'BAD_REQUEST', m, d);
export const unauthorized = (m = 'Требуется авторизация') => new AppError(401, 'UNAUTHORIZED', m);
export const forbidden = (m = 'Недостаточно прав') => new AppError(403, 'FORBIDDEN', m);
export const notFound = (m = 'Не найдено') => new AppError(404, 'NOT_FOUND', m);
export const conflict = (m = 'Конфликт данных') => new AppError(409, 'CONFLICT', m);
