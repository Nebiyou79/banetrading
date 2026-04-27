// hooks/useProfile.ts
// ── Profile query + profile-related mutations ──

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profileService';
import { normalizeError } from '@/services/apiClient';
import { tokenStore } from '@/lib/tokenStore';
import { ME_QUERY_KEY } from './useAuth';
import type {
  UserProfile,
  UpdateProfilePayload,
  AvatarResponse,
  UpdateProfileResponse,
  ChangePasswordResponse,
} from '@/types/profile';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<UpdateProfileResponse>;
  isUpdating: boolean;
  uploadAvatar: (file: File) => Promise<AvatarResponse>;
  isUploadingAvatar: boolean;
  deleteAvatar: () => Promise<AvatarResponse>;
  isDeletingAvatar: boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResponse>;
  isChangingPassword: boolean;
}

export function useProfile(): UseProfileReturn {
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' && !!tokenStore.getAccess();

  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const resp = await profileService.getProfile();
      return resp.user;
    },
    enabled: hasToken,
    staleTime: 60 * 1000,
  });

  const syncAuthUser = (user: UserProfile): void => {
    queryClient.setQueryData(PROFILE_QUERY_KEY, user);
    queryClient.setQueryData(ME_QUERY_KEY, user);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => profileService.updateProfile(payload),
    onSuccess: (resp) => syncAuthUser(resp.user),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => profileService.uploadAvatar(file),
    // Optimistic preview using an in-memory object URL
    onMutate: async (file: File) => {
      await queryClient.cancelQueries({ queryKey: PROFILE_QUERY_KEY });
      const previous = queryClient.getQueryData<UserProfile>(PROFILE_QUERY_KEY) ?? null;
      if (previous) {
        const previewUrl = URL.createObjectURL(file);
        const optimistic: UserProfile = { ...previous, avatarUrl: previewUrl };
        queryClient.setQueryData(PROFILE_QUERY_KEY, optimistic);
        queryClient.setQueryData(ME_QUERY_KEY, optimistic);
        return { previous, previewUrl };
      }
      return { previous, previewUrl: null };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(PROFILE_QUERY_KEY, ctx.previous);
        queryClient.setQueryData(ME_QUERY_KEY, ctx.previous);
      }
      if (ctx?.previewUrl) URL.revokeObjectURL(ctx.previewUrl);
    },
    onSuccess: (resp, _vars, ctx) => {
      if (ctx?.previewUrl) URL.revokeObjectURL(ctx.previewUrl);
      syncAuthUser(resp.user);
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async () => profileService.deleteAvatar(),
    onSuccess: (resp) => syncAuthUser(resp.user),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (vars: { current: string; next: string }) =>
      profileService.changePassword(vars.current, vars.next),
    onSuccess: () => {
      // Backend invalidated sessions; drop local tokens.
      tokenStore.clear();
      queryClient.setQueryData(PROFILE_QUERY_KEY, null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    try { return await updateProfileMutation.mutateAsync(payload); }
    catch (err) { throw normalizeError(err); }
  }, [updateProfileMutation]);

  const uploadAvatar = useCallback(async (file: File) => {
    try { return await uploadAvatarMutation.mutateAsync(file); }
    catch (err) { throw normalizeError(err); }
  }, [uploadAvatarMutation]);

  const deleteAvatar = useCallback(async () => {
    try { return await deleteAvatarMutation.mutateAsync(); }
    catch (err) { throw normalizeError(err); }
  }, [deleteAvatarMutation]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try { return await changePasswordMutation.mutateAsync({ current: currentPassword, next: newPassword }); }
    catch (err) { throw normalizeError(err); }
  }, [changePasswordMutation]);

  return {
    profile: (query.data ?? null) as UserProfile | null,
    isLoading: hasToken && query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? normalizeError(query.error).message : null,
    refetch,
    updateProfile,
    isUpdating: updateProfileMutation.isPending,
    uploadAvatar,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    deleteAvatar,
    isDeletingAvatar: deleteAvatarMutation.isPending,
    changePassword,
    isChangingPassword: changePasswordMutation.isPending,
  };
}