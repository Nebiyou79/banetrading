// hooks/useSendMessage.ts
// ── SEND-MESSAGE MUTATION HOOK ──
// Used by the TicketChatPage to send a single message to a specific ticket.
// Keeps isSending state locally so the composer disables itself during flight.

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { TicketMessage } from '@/types/support';

interface UseSendMessageReturn {
  sendMessage: (ticketId: string, body: string, file?: File | null) => Promise<TicketMessage>;
  isSending: boolean;
  error: string | null;
}

export function useSendMessage(): UseSendMessageReturn {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const sendMessage = useCallback(
    async (ticketId: string, body: string, file?: File | null): Promise<TicketMessage> => {
      setIsSending(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('body', body.trim());
        if (file) formData.append('attachment', file);

        const { message } = await supportService.sendMessage(ticketId, formData);

        // Optimistically update the react-query cache so the bubble appears immediately
        queryClient.setQueryData<{ ticket: unknown; messages: TicketMessage[] }>(
          ['support', 'ticket', ticketId],
          old => {
            if (!old) return old;
            const exists = old.messages.some(m => m._id === message._id);
            return exists
              ? old
              : { ...old, messages: [...old.messages, message] };
          },
        );

        // Invalidate so the next background refetch reconciles with server
        queryClient.invalidateQueries({ queryKey: ['support', 'ticket', ticketId] });

        return message;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send message';
        setError(msg);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [queryClient],
  );

  return { sendMessage, isSending, error };
}