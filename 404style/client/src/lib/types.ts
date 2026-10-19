export type Role = 'CLIENT' | 'ADMIN' | 'MANAGER';
export interface User { id: string; email: string; name: string; phone: string | null; role: Role; createdAt: string }
export interface AuthResponse { user: User; accessToken: string; csrfToken: string }

export interface Service { id: string; title: string; slug: string; description: string; icon: string; priceFrom: number; features: string[]; order: number }
export interface Project {
  id: string; title: string; slug: string; description: string; coverImage: string; images: string[]; category: string;
  tags: string[]; clientName: string; year: number; resultMetrics: Record<string, string> | null;
}
export interface PricingPlan { id: string; name: string; price: number; description: string; features: string[]; isPopular: boolean }
export interface Review { id: string; authorName: string; authorCompany: string | null; text: string; rating: number; avatar: string | null }
export interface FaqItem { id: string; question: string; answer: string }
export interface TeamMember { id: string; name: string; role: string; photo: string; bio: string; socials: Record<string, string> | null }

export interface SiteSettings {
  contacts?: { email?: string; telegram?: string; phone?: string; hours?: string };
  social?: { telegram?: string; vk?: string; github?: string };
}

export type CalcType = 'landing' | 'corporate' | 'shop';
export type CalcExtra = 'seo' | 'copywriting' | 'crm' | 'animations' | 'multilang';
export type CalcUrgency = 'normal' | 'fast' | 'urgent';
export interface CalcInput { type: CalcType; extras: CalcExtra[]; urgency: CalcUrgency }
export interface Quote { total: number; subtotal: number; multiplier: number; days: number; base: number }

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export interface Message { id: string; orderId: string; senderId: string | null; senderRole: Role; text: string; createdAt: string; isRead: boolean; sender?: { name: string } | null }
export interface OrderQuote extends Quote { type: CalcType; urgency: CalcUrgency; extras: { key: string; price: number }[] }
export interface Order {
  id: string; name: string; email: string; phone: string; projectType: string; budget: string | null; deadline: string | null; message: string | null;
  status: OrderStatus; calculatorData: OrderQuote | null; createdAt: string; updatedAt: string;
  user?: { id: string; name: string; email?: string; phone?: string | null } | null;
  unread?: number; lastMessage?: Message | null; reviews?: { id: string; isApproved: boolean }[];
}
export interface Paged<T> { items: T[]; total: number; page: number; limit: number; pages: number }
export interface AuditEntry { id: string; action: string; entity: string; entityId: string | null; payload: unknown; ip: string | null; createdAt: string; user: { name: string; email: string } | null }
export interface Stats {
  periodDays: number;
  kpi: { orders: number; newOrders: number; conversion: number; avgCheck: number; newClients: number; unreadMessages: number };
  byStatus: Record<OrderStatus, number>;
  ordersByDay: { date: string; count: number }[];
  topServices: { type: string; count: number }[];
  recentOrders: Order[];
}
