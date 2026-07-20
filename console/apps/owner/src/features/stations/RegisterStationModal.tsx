import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type StationRegistration } from '@chargeops/api';
import { Button, FormField, IconHome, Modal, Select, TextInput, useToast } from '@chargeops/ui';

const CITIES = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'];
const CITY_OPTIONS = CITIES.map((c) => ({ value: c, label: c }));

const EMPTY: StationRegistration = { name: '', city: 'Hà Nội', address: '', plannedChargers: 4 };

/**
 * FR12 — register a new station. Submits a PENDING registration; validation is
 * client-side here and re-checked by the backend. Business licence is verified
 * off-platform (no document upload in this screen).
 */
export function RegisterStationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<StationRegistration>(EMPTY);
  const [showErrors, setShowErrors] = useState(false);

  const nameInvalid = !form.name.trim();
  const addrInvalid = !form.address.trim();

  const mutation = useMutation({
    mutationFn: (input: StationRegistration) => api.stations.register(input),
    onSuccess: (station) => {
      qc.invalidateQueries({ queryKey: ['stations', 'mine'] });
      toast(`Đã gửi đăng ký "${station.name}" — chờ duyệt`, 'success');
      close();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const close = () => {
    setForm(EMPTY);
    setShowErrors(false);
    onClose();
  };

  const submit = () => {
    if (nameInvalid || addrInvalid) {
      setShowErrors(true);
      return;
    }
    mutation.mutate({ ...form, plannedChargers: Number(form.plannedChargers) || 1 });
  };

  return (
    <Modal open={open} onClose={close} maxWidth={460}>
      <div className="mb-[18px] flex items-start gap-3">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-owner-soft">
          <IconHome size={20} className="text-owner" />
        </span>
        <div>
          <div className="text-[17px] font-bold">Đăng ký trạm mới</div>
          <div className="mt-0.5 text-[12px] text-muted">
            Hồ sơ ở trạng thái CHỜ DUYỆT cho tới khi quản trị viên xét duyệt.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[15px]">
        <FormField
          label="TÊN TRẠM"
          hint={
            showErrors && nameInvalid
              ? 'Vui lòng nhập tên trạm.'
              : 'Tên này hiển thị cho tài xế khi tìm trạm trên bản đồ.'
          }
          error={showErrors && nameInvalid}
        >
          <TextInput
            value={form.name}
            onChange={(name) => setForm((f) => ({ ...f, name }))}
            placeholder="VD: Trạm Mỹ Đình"
            invalid={showErrors && nameInvalid}
          />
        </FormField>

        <FormField
          label="ĐỊA CHỈ"
          hint={
            showErrors && addrInvalid
              ? 'Vui lòng nhập địa chỉ.'
              : 'Dùng để định vị trạm chính xác trên bản đồ tìm kiếm.'
          }
          error={showErrors && addrInvalid}
        >
          <TextInput
            value={form.address}
            onChange={(address) => setForm((f) => ({ ...f, address }))}
            placeholder="Số nhà, đường, quận"
            invalid={showErrors && addrInvalid}
          />
        </FormField>

        <div className="flex gap-[11px]">
          <div className="flex-[1.4]">
            <FormField label="THÀNH PHỐ">
              <Select
                value={form.city}
                onChange={(city) => setForm((f) => ({ ...f, city }))}
                options={CITY_OPTIONS}
                accent="owner"
              />
            </FormField>
          </div>
          <div className="flex-[0.8]">
            <FormField label="SỐ TRỤ DỰ KIẾN">
              <TextInput
                value={String(form.plannedChargers)}
                onChange={(v) =>
                  setForm((f) => ({ ...f, plannedChargers: Number(v.replace(/\D/g, '')) || 0 }))
                }
                mono
              />
            </FormField>
          </div>
        </div>

        <div className="flex gap-2.5 rounded-[10px] border border-warn-border bg-warn-soft px-[13px] py-[11px] text-[11px] leading-[1.5] text-warn-deep">
          <span>
            Giấy phép kinh doanh được xác minh ngoài nền tảng trước khi duyệt (không nộp tài liệu tại
            đây).
          </span>
        </div>
      </div>

      <div className="mt-[22px] flex gap-[11px]">
        <Button variant="secondary" size="lg" className="flex-1" onClick={close}>
          Hủy bỏ
        </Button>
        <Button accent="owner" size="lg" className="flex-[1.4]" onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang gửi…' : 'Gửi đăng ký'}
        </Button>
      </div>
    </Modal>
  );
}
