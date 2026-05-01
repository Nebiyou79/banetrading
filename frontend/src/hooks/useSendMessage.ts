// hooks/useSendMessage.ts
// ── SEND MESSAGE MUTATION WITH OPTIMISTIC UPDATE ──

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportService } from '@/services/supportService';
import type { TicketMessage } from '@/types/support';

interface UseSendMessageReturn {
  sendMessage: (ticketId: string, body: string, file?: File | null) => Promise<TicketMessage>;
  isSending: boolean;
  error: string | null;
}

export function useSendMessage(): UseSendMessageReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ ticketId, body, file }: { ticketId: string; body: string; file?: File | null }) => {
      const formData = new FormData();
      formData.append('body', body);
      if (file) formData.append('attachment', file);
      const result = await supportService.sendMessage(ticketId, formData);
      return result.message;
    },

    // ── Optimistic update ──
    onMutate: async ({ ticketId, body }) => {
      await queryClient.cancelQueries({ queryKey: ['support', 'ticket', ticketId] });

      const previous = queryClient.getQueryData(['support', 'ticket', ticketId]);

      // Create optimistic message
      const optimisticMsg: TicketMessage = {
        _id: `temp-${Date.now()}`,
        ticketId,
        senderId: 'me',
        senderRole: 'user',
        body,
        attachments: [],
        createdAt: new Date().toISOString(),
      } as TicketMessage;

      queryClient.setQueryData(['support', 'ticket', ticketId], (old: unknown) => {
        if (!old) return old;
        const typed = old as { ticket: unknown; messages: TicketMessage[] };
        return { ...typed, messages: [...typed.messages, optimisticMsg] };
      });

      return { previous, tempId: optimisticMsg._id };
    },

    // ── On success: replace optimistic with real ──
    onSuccess: (realMsg, { ticketId }, context) => {
      queryClient.setQueryData(['support', 'ticket', ticketId], (old: unknown) => {
        if (!old) return old;
        const typed = old as { ticket: unknown; messages: TicketMessage[] };
        const updated = typed.messages.map(m =>
          m._id === context?.tempId ? realMsg : m,
        );
        return { ...typed, messages: updated };
      });
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
    },

    // ── On error: rollback ──
    onError: (_err, { ticketId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['support', 'ticket', ticketId], context.previous);
      }
    },
  });

  const sendMessage = async (ticketId: string, body: string, file?: File | null): Promise<TicketMessage> => {
    return mutation.mutateAsync({ ticketId, body, file });
  };

  return {
    sendMessage,
    isSending: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
  };
}