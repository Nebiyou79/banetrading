// components/profile/AvatarUploader.tsx
// ── Click-to-upload avatar with preview, hover overlay, and delete ──

import { ChangeEvent, useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { useProfile } from '@/hooks/useProfile';
import type { NormalizedApiError } from '@/services/apiClient';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED = 'image/jpeg,image/jpg,image/png,image/webp';

export function AvatarUploader(): JSX.Element {
  const { profile, uploadAvatar, isUploadingAvatar, deleteAvatar, isDeletingAvatar } = useProfile();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!profile) return <></>;

  const label = profile.displayName || profile.name;

  const onSelect = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ''; // allow re-selecting same file
    if (!file) return;
    if (!ACCEPTED.split(',').includes(file.type)) {
      toast.error('Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }
    try {
      await uploadAvatar(file);
      toast.success('Avatar updated');
    } catch (err) {
      const e2 = err as NormalizedApiError;
      toast.error(e2.message || 'Could not upload avatar');
    }
  };

  const onConfirmDelete = async (): Promise<void> => {
    try {
      await deleteAvatar();
      toast.success('Avatar removed');
    } catch (err) {
      const e2 = err as NormalizedApiError;
      toast.error(e2.message || 'Could not remove avatar');
    } finally {
      setConfirmOpen(false);
    }
  };

  const busy = isUploadingAvatar || isDeletingAvatar;

  return (
    <>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative">
          <Avatar src={profile.avatarUrl} name={label} size="xl" className="border-2 border-border" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            aria-label="Change avatar"
            className="absolute inset-0 inline-flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 disabled:cursor-not-allowed"
          >
            {isUploadingAvatar ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={onSelect}
          />
        </div>

        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Profile photo</h3>
            <p className="mt-1 text-xs text-text-muted max-w-xs">
              JPG, PNG, or WEBP. Up to 5 MB. Square images look best.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isUploadingAvatar}
              onClick={() => inputRef.current?.click()}
              leadingIcon={<Camera className="h-3.5 w-3.5" />}
            >
              {profile.avatarUrl ? 'Change photo' : 'Upload photo'}
            </Button>
            {profile.avatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={busy}
                leadingIcon={<Trash2 className="h-3.5 w-3.5" />}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Remove profile photo?"
        size="sm"
        footer={(
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={isDeletingAvatar}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDelete} loading={isDeletingAvatar}>
              Remove
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-text-secondary">
          Your profile photo will be deleted. You can upload a new one at any time.
        </p>
      </Modal>
    </>
  );
}