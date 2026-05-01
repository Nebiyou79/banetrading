// types/support.ts
// ── SUPPORT MODULE TYPES ──

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'general' | 'deposit' | 'withdrawal' | 'kyc' | 'trading' | 'technical' | 'other';
export type MessageSenderRole = 'user' | 'admin';

// ── SupportTicket (used by admin API) ──
export interface SupportTicket {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  assignedTo?: string | null;
  lastMessageAt: string;
  unreadByUser: number;
  unreadByAdmin: number;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string;
}

// ── TicketMessage (used by admin API) ──
export interface TicketMessage {
  _id: string;
  ticketId: string;
  senderId: string;
  senderRole: MessageSenderRole;
  body: string;
  attachments: string[];
  readAt?: string;
  createdAt: string;
}

// ── SupportConfig (used by admin API) ──
export interface SupportConfig {
  _id?: string;
  whatsappNumber: string;
  whatsappMessage: string;
  emailContact: string;
  ticketsEnabled: boolean;
  whatsappEnabled: boolean;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Legacy Ticket (used by user-facing support) ──
export interface Ticket {
  _id: string;
  userId: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  assignedTo?: string;
  lastMessageAt: string;
  unreadByUser: number;
  unreadByAdmin: number;
  closedAt?: string;
  createdAt: string;
  lastMessagePreview?: string;
}

// ── Response types ──
export interface TicketDetailResponse {
  ticket: SupportTicket;
  messages: TicketMessage[];
}

export interface TicketsListResponse {
  tickets: SupportTicket[];
}

export interface MessageResponse {
  message: TicketMessage;
}

export interface ConfigResponse {
  config: SupportConfig;
}