import { useTranslation } from 'react-i18next';
import type { StationStaffMember } from '@chargeops/api';
import { Button, IconAlertTriangle, Modal } from '@chargeops/ui';

interface RevokeStaffModalProps {
  member: StationStaffMember | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (member: StationStaffMember) => void;
  isPending: boolean;
}

export function RevokeStaffModal({
  member,
  open,
  onClose,
  onConfirm,
  isPending,
}: RevokeStaffModalProps) {
  const { t } = useTranslation('owner');

  if (!member) return null;

  const staffName = member.displayName || member.name || member.email;

  return (
    <Modal open={open} onClose={isPending ? () => {} : onClose} maxWidth={460}>
      <div className="flex flex-col gap-4">
        {/* Header with warning icon */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <IconAlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-ink leading-tight">
              {t('staff.revokeModal.title')}
            </h3>
            <p className="mt-1 text-[12.5px] leading-snug text-muted">
              {t('staff.revokeModal.warning', {
                name: staffName,
                station: member.stationName,
              })}
            </p>
          </div>
        </div>

        {/* Consequences Box */}
        <div className="rounded-xl border border-danger/20 bg-danger-soft/40 p-3.5 text-[12px] leading-relaxed text-ink">
          <p className="font-semibold text-danger-deep mb-1">
            {t('staff.revokeModal.consequence')}
          </p>
          <p className="text-[11.5px] text-muted leading-normal">
            {t('staff.revokeModal.auditNote')}
          </p>
        </div>

        {/* Member preview summary */}
        <div className="rounded-lg border border-hairline bg-surface-2 px-3.5 py-2.5 flex items-center justify-between text-[12px]">
          <span className="font-medium text-muted">Tài khoản:</span>
          <span className="font-mono text-ink font-semibold">{member.email}</span>
        </div>

        {/* Actions */}
        <div className="mt-1 flex items-center justify-end gap-2.5 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            {t('staff.revokeModal.cancelBtn')}
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => onConfirm(member)}
          >
            {isPending ? t('staff.revokeModal.revoking') : t('staff.revokeModal.confirmBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
