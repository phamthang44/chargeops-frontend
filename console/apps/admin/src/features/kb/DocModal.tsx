import { useEffect, useState } from 'react';
import type { PolicyDoc } from '@chargeops/api';
import { FormField, Modal } from '@chargeops/ui';

const CATEGORIES = ['Hủy & hoàn tiền', 'Check-in', 'Thanh toán', 'Giá', 'Trụ sạc', 'Tài khoản'];

export interface DocModalProps {
  open: boolean;
  /** Editing an existing doc, or null to create. */
  doc: PolicyDoc | null;
  pending: boolean;
  onClose: () => void;
  onSave: (input: { id?: string; category: string; content: string }) => void;
}

/** Create/edit a policy doc. Saving re-embeds it for the RAG assistant. */
export function DocModal({ open, doc, pending, onClose, onSave }: DocModalProps) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState('');
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(doc?.category ?? CATEGORIES[0]);
      setContent(doc?.content ?? '');
      setErr(false);
    }
  }, [open, doc]);

  const submit = () => {
    if (!content.trim()) {
      setErr(true);
      return;
    }
    onSave({ id: doc?.id, category, content: content.trim() });
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth={480}>
      <div className="mb-0.5 text-[17px] font-bold">{doc ? 'Sửa tài liệu chính sách' : 'Thêm tài liệu chính sách'}</div>
      <div className="mb-[18px] text-[12.5px] text-muted">
        Lưu xong, tài liệu được tái tạo embedding để trợ lý trả lời theo chính sách mới nhất.
      </div>
      <div className="flex flex-col gap-[13px]">
        <FormField label="DANH MỤC">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full cursor-pointer rounded-[9px] border border-line bg-white px-[11px] py-[9px] text-[13px] font-medium"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </FormField>
        <FormField label="NỘI DUNG CHÍNH SÁCH" error={err} hint={err ? 'Vui lòng nhập nội dung chính sách.' : undefined}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Một phát biểu chính sách rõ ràng, tự chứa…"
            className={`h-[110px] w-full resize-none rounded-[9px] border px-[11px] py-2.5 text-[13px] leading-[1.5] ${
              err ? 'border-bad' : 'border-line'
            }`}
          />
        </FormField>
      </div>
      <div className="mt-5 flex gap-2.5">
        <button onClick={onClose} className="flex-1 rounded-[9px] border border-line py-[11px] text-[13px] font-semibold text-body hover:bg-canvas">
          Hủy
        </button>
        <button
          onClick={submit}
          disabled={pending}
          className="flex-1 rounded-[9px] bg-brand py-[11px] text-[13px] font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? 'Đang lưu…' : 'Lưu & tái tạo'}
        </button>
      </div>
    </Modal>
  );
}
