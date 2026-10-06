import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@chargeops/api';
import { Button, IconSend, Modal, useToast } from '@chargeops/ui';
import { getApiErrorMessage } from '../../../i18n';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteStaffModalProps {
  open: boolean;
  onClose: () => void;
  stationId: string | null;
  stationName?: string;
}

/**
 * Owner sends a station-staff invitation (Ops-01): one email per station. The
 * backend answers `STAFF_INVITE_002` when the address already belongs to an
 * account, `STAFF_INVITE_007` when the station is not in an invitable state —
 * both surface through the shared error translator.
 */
export function InviteStaffModal({ open, onClose, stationId, stationName }: InviteStaffModalProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) setEmail('');
  }, [open]);

  const invite = useMutation({
    mutationFn: () => api.staffInvitations.invite(stationId as string, { email: email.trim() }),
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ['staffInvitations'] });
      toast(t('staff.invite.success', { email: inv.email }), 'success');
      onClose();
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  if (!open) return null;

  const valid = EMAIL_RE.test(email.trim());

  return (
    <Modal open onClose={onClose} maxWidth={460}>
      <div className="mb-1 text-[16px] font-bold text-ink">{t('staff.invite.title')}</div>
      <p className="mb-4 text-[12.5px] leading-relaxed text-muted">
        {stationName
          ? t('staff.invite.bodyWithStation', { station: stationName })
          : t('staff.invite.body')}
      </p>

      <label className="mb-1.5 block text-[12px] font-bold text-ink">
        {t('staff.invite.emailLabel')} <span className="text-bad">*</span>
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t('staff.invite.emailPlaceholder')}
        className="w-full rounded-[9px] border border-line bg-surface px-3 py-2.5 text-[13px] font-medium text-ink focus:border-owner focus:outline-none"
        autoFocus
      />
      <p className="mt-2 text-[11.5px] leading-relaxed text-faint">{t('staff.invite.hint')}</p>

      <div className="mt-[18px] flex justify-end gap-2.5">
        <Button variant="secondary" onClick={onClose} disabled={invite.isPending}>
          {t('staff.invite.cancel')}
        </Button>
        <Button
          onClick={() => invite.mutate()}
          disabled={!valid || !stationId || invite.isPending}
        >
          <IconSend size={14} />
          {invite.isPending ? t('staff.invite.submitting') : t('staff.invite.submit')}
        </Button>
      </div>
    </Modal>
  );
}
