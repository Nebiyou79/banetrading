// pages/admin/support.tsx
// ── Admin support page with split-pane layout ──
//
// THEME FIXES applied:
// • Send button: color was implicit white → var(--text-inverse)
// • Status <select> dropdown: added onFocus/onBlur focus ring, and
//   appearance: none is now set globally in globals.css so backgroundColor
//   renders correctly in both themes
// • Reply <input>: explicit outline: none + focus border via handlers
// • Filter tab buttons: active color was implicitly white → var(--text-inverse)
// • Ticket list selected state: borderLeft color already used var(--primary) ✅
// • Message bubbles: admin bubble uses var(--primary-muted), user uses var(--card) ✅

'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin-ui/AdminLayout';
import AdminRoute from '@/components/admin-ui/AdminRoute';
import Badge from '@/components/admin-ui/Badge';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutation } from '@/hooks/useAdminMutation';
import adminService from '@/services/adminService';
import { useQueryClient } from '@tanstack/react-query';

const TICKETS_KEY = ['admin', 'tickets'];

export default function SupportPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SupportContent />
      </AdminLayout>
    </AdminRoute>
  );
}

function SupportContent() {
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const { data: ticketsData } = useAdminData<{ tickets: any[] }>(
    [...TICKETS_KEY, { statusFilter }],
    () => adminService.fetchTickets({ status: statusFilter || undefined }),
  );

  const { data: ticketDetail } = useAdminData<{ ticket: any; messages: any[] }>(
    ['admin', 'ticket', selectedTicketId],
    () => adminService.getTicket(selectedTicketId!),
    { enabled: !!selectedTicketId },
  );

  const sendMsgMutation = useAdminMutation(
    ({ ticketId, body }: { ticketId: string; body: string }) =>
      adminService.sendMessage(ticketId, body),
    { invalidateKeys: [['admin', 'ticket', selectedTicketId]] },
  );

  const updateTicketMutation = useAdminMutation(
    ({ id, data }: { id: string; data: any }) => adminService.updateTicket(id, data),
    { invalidateKeys: [TICKETS_KEY, ['admin', 'ticket', selectedTicketId]] },
  );

  const handleSend = () => {
    if (!newMessage.trim() || !selectedTicketId) return;
    sendMsgMutation.mutateAsync({ ticketId: selectedTicketId, body: newMessage }).then(() => {
      setNewMessage('');
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!selectedTicketId) return;
    updateTicketMutation.mutate({ id: selectedTicketId, data: { status: newStatus } });
  };

  const tickets = ticketsData?.tickets || [];
  const messages = ticketDetail?.messages || [];
  const ticket = ticketDetail?.ticket;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Left: Ticket List */}
      <div
        className="w-80 flex-shrink-0 overflow-y-auto rounded-xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Tickets</h3>
          <div className="flex flex-wrap gap-2">
            {['', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: statusFilter === s ? 'var(--primary)' : 'var(--card)',
                  /* THEME FIX: was implicitly white when active → var(--text-inverse) */
                  color: statusFilter === s ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {tickets.map((t: any) => (
            <div
              key={t._id}
              onClick={() => setSelectedTicketId(t._id)}
              className="p-4 cursor-pointer transition-colors hover:opacity-90"
              style={{
                backgroundColor: selectedTicketId === t._id ? 'var(--sidebar-active-bg)' : 'transparent',
                borderLeft: selectedTicketId === t._id
                  ? '3px solid var(--primary)'
                  : '3px solid transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {t.subject}
                </span>
                <Badge
                  variant={
                    t.status === 'open' ? 'warning'
                    : t.status === 'resolved' ? 'success'
                    : 'neutral'
                  }
                >
                  {t.status}
                </Badge>
              </div>
              <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {(t as any).userId?.email || t.userId}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat Thread */}
      <div
        className="flex-1 flex flex-col rounded-xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {selectedTicketId && ticket ? (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ticket.subject}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {(ticket as any).userId?.email || ticket.userId}
                </p>
              </div>

              {/* THEME FIX: <select> needs appearance: none (set in globals.css)
                  so the backgroundColor actually renders instead of OS chrome */}
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--focus-ring)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg: any) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[70%] rounded-xl px-4 py-2"
                    style={{
                      /* Admin bubble: primary-muted tint — readable in both themes */
                      backgroundColor: msg.senderRole === 'admin'
                        ? 'var(--primary-muted)'
                        : 'var(--card)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <p className="text-sm">{msg.body}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a reply..."
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--focus-ring)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 rounded-lg font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--primary)',
                    /* THEME FIX: was implicit white → var(--text-inverse) */
                    color: 'var(--text-inverse)',
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <p>Select a ticket to view the conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}