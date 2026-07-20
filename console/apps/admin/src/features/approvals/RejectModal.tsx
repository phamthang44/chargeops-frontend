import { useState } from 'react';
import { Button, FormField, Modal } from '@chargeops/ui';

export interface RejectModalProps {
  open: boolean;
  stationName: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/** Reject a station registration with a required reason (shown to the owner). */
export function RejectModal({ open, stationName, pending, onClose, onConfirm }: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState(false);

  const close = () => {
    setReason('');
    setErr(false);
    onClose();
  };
  const submit = () => {
    if (!reason.trim()) {
      setErr(true);
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setErr(false);
  };

  return (
    <Modal open={open} onClose={close} maxWidth={420}>
      <div className="mb-0.5 text-[17px] font-bold">Từ chối đăng ký trạm</div>
      <div className="mb-4 text-[12.5px] text-muted">
        Lý do sẽ được gửi tới chủ trạm {stationName} trên màn hình trạng thái đăng ký.
      </div>
      <FormField label="LÝ DO TỪ CHỐI" error={err} hint={err ? 'Cần nhập lý do từ chối.' : undefined}>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="VD: Thiếu giấy phép kinh doanh hợp lệ…"
          className={`h-[84px] w-full resize-none rounded-[9px] border px-[11px] py-2.5 text-[13px] ${
            err ? 'border-bad' : 'border-line'
          }`}
        />
      </FormField>
      <div className="mt-[18px] flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={close}>
          Hủy
        </Button>
        <Button variant="danger" className="flex-1" onClick={submit} disabled={pending}>
          {pending ? 'Đang xử lý…' : 'Xác nhận từ chối'}
        </Button>
      </div>
    </Modal>
  );
}
