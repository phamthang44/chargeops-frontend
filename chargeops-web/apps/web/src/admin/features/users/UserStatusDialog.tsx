import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, FormField, IconAlertTriangle, IconInfo, Modal } from '@chargeops/ui';
import type { AdminUserProfile } from '@chargeops/api';

export type UserStatusAction = 'suspend' | 'resume';

export interface UserStatusDialogProps {
  open: boolean;
  type: UserStatusAction | null;
  user: AdminUserProfile | null;
  pending: boolean;
  onClose: () => void;
  /** Receives the trimmed reason; the page generates commandId + expectedVersion. */
  onConfirm: (reason: string) => void;
}

/**
 * UM-04: confirm dialog for PATCH /admin/users/{id}/status.
 * Reason is required (≥5, ≤500 chars) for both transitions; pending blocks double-submit.
 */
export function UserStatusDialog({ open, type, user, pending, onClose, onConfirm }: UserStatusDialogProps) {
  const { t } = useTranslation('admin');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setErr(false);
    }
  }, [open, type, user?.profileId]);

  if (!type || !user) return null;

  const isSuspend = type === 'suspend';
  const config = isSuspend
    ? {
        title: t('users.dialog.suspend.title', 'Tạm khóa tài khoản'),
        subtitle: t('users.dialog.suspend.subtitle', {
          name: user.displayName,
          defaultValue: `Tạm khóa tài khoản của ${user.displayName}. Mọi API sẽ trả AUTH_006 cho tới khi kích hoạt lại.`,
        }),
        notice: t(
          'users.dialog.suspend.notice',
          'Không thể tạm khóa khi người dùng còn booking đang hiệu lực (PENDING còn hạn, CONFIRMED sắp tới, CHECKED_IN/CHARGING) hoặc vé hỗ trợ đang xử lý. Token hiện tại vẫn sống tối đa TTL rồi hết hạn.'
        ),
        confirmBtn: t('users.dialog.suspend.confirmBtn', 'Xác nhận tạm khóa'),
        confirmVariant: 'danger' as const,
        tone: 'bad' as const,
        presets: [
          { key: 'policy', defaultText: 'Vi phạm chính sách sử dụng nền tảng ChargeOps' },
          { key: 'abuse', defaultText: 'Lạm dụng hệ thống hoặc hành vi quấy rối' },
          { key: 'payment', defaultText: 'Tranh chấp thanh toán chưa được giải quyết' },
          { key: 'request', defaultText: 'Yêu cầu tạm khóa từ chính người dùng' },
        ],
      }
    : {
        title: t('users.dialog.resume.title', 'Kích hoạt lại tài khoản'),
        subtitle: t('users.dialog.resume.subtitle', {
          name: user.displayName,
          defaultValue: `Khôi phục quyền truy cập cho ${user.displayName}.`,
        }),
        notice: t(
          'users.dialog.resume.notice',
          'Người dùng có thể tiếp tục đăng nhập và sử dụng mọi chức năng sau khi được kích hoạt lại.'
        ),
        confirmBtn: t('users.dialog.resume.confirmBtn', 'Xác nhận kích hoạt'),
        confirmVariant: 'primary' as const,
        tone: 'good' as const,
        presets: [
          { key: 'resolved', defaultText: 'Đã xử lý xong vi phạm, khôi phục quyền sử dụng' },
          { key: 'userRequest', defaultText: 'Người dùng yêu cầu mở khóa trở lại' },
          { key: 'mistake', defaultText: 'Khóa nhầm — khôi phục ngay' },
        ],
      };

  const handleSubmit = () => {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 5 || trimmed.length > 500) {
      setErr(true);
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={500}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            config.tone === 'bad' ? 'bg-bad-soft text-bad' : 'bg-good-soft text-good'
          }`}
        >
          {config.tone === 'bad' ? <IconAlertTriangle size={22} /> : <IconInfo size={22} />}
        </div>
        <div className="flex-1">
          <div className="text-[17px] font-bold text-ink">{config.title}</div>
          <div className="mt-0.5 text-[12.5px] text-muted">{config.subtitle}</div>
        </div>
      </div>

      <div
        className={`mt-4 rounded-[9px] border p-3 text-[12px] leading-relaxed ${
          config.tone === 'bad'
            ? 'border-bad-border bg-bad-soft/40 text-bad-deep font-medium'
            : 'border-good-border bg-good-soft/40 text-good-deep'
        }`}
      >
        {config.notice}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="text-[11.5px] font-medium text-muted">
          {t('users.dialog.presetSuggestions', 'Gợi ý lý do:')}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {config.presets.map((p) => {
            const text = t(`users.dialog.presets.${type}.${p.key}`, p.defaultText);
            const isSelected = reason === text;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setReason(text);
                  setErr(false);
                }}
                className={`rounded-full border px-2.5 py-1 text-left text-[11.5px] transition ${
                  isSelected
                    ? 'border-brand bg-brand-soft font-semibold text-brand ring-1 ring-brand'
                    : 'border-line bg-surface text-body hover:border-brand/40 hover:bg-surface-2'
                }`}
              >
                + {text}
              </button>
            );
          })}
        </div>

        <div className="mt-1">
          <FormField
            label={t('users.dialog.reasonLabel', 'Lý do thao tác (Bắt buộc, tối đa 500 ký tự)')}
            error={err}
            hint={
              err
                ? t('users.dialog.reasonRequired', 'Vui lòng nhập lý do (5–500 ký tự).')
                : `${reason.trim().length}/500`
            }
          >
            <textarea
              value={reason}
              maxLength={500}
              onChange={(e) => {
                setReason(e.target.value);
                if (err && e.target.value.trim().length >= 5) setErr(false);
              }}
              placeholder={t('users.dialog.reasonPlaceholder', 'Nhập lý do chi tiết hoặc chọn nhanh từ gợi ý…')}
              className={`h-[76px] w-full resize-none rounded-[9px] border px-3 py-2 text-[12.5px] leading-relaxed transition ${
                err ? 'border-bad bg-bad-soft/10 ring-1 ring-bad' : 'border-line bg-surface focus:border-brand'
              }`}
            />
          </FormField>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={pending}>
          {t('users.dialog.cancelBtn', 'Hủy bỏ')}
        </Button>
        <Button
          variant={config.confirmVariant}
          className="flex-1"
          onClick={handleSubmit}
          disabled={pending}
        >
          {pending ? t('users.dialog.processing', 'Đang xử lý…') : config.confirmBtn}
        </Button>
      </div>
    </Modal>
  );
}
