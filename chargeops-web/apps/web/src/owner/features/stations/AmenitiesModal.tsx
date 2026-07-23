import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AMENITY_CATALOG,
  AMENITY_EMOJI,
  useApi,
  type Amenity,
  type Station,
} from '@chargeops/api';
import { Button, IconCheck, Modal, useToast } from '@chargeops/ui';

/**
 * Owner self-service amenities editor. Owners toggle what their station offers
 * (wifi, cafe, parking, …) themselves — no admin request needed — and the set
 * flows through to the driver app's station detail page. Scoped to the owner's
 * own station (BR-STA-02); the mock only allows editing `ownerStations`.
 */
export function AmenitiesModal({
  station,
  open,
  onClose,
}: {
  station: Station;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState<Amenity[]>(station.amenities ?? []);

  // Reset the draft to the station's current amenities each time it opens.
  useEffect(() => {
    if (open) setSelected(station.amenities ?? []);
  }, [open, station.amenities]);

  const toggle = (a: Amenity) =>
    setSelected((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const save = useMutation({
    mutationFn: (amenities: Amenity[]) => api.stations.updateAmenities(station.id, amenities),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stations', 'mine'] });
      toast(t('stations.amenitiesModal.saved'), 'success');
      onClose();
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  return (
    <Modal open={open} onClose={onClose} maxWidth={480}>
      <div className="text-[17px] font-bold">{t('stations.amenitiesModal.title')}</div>
      <div className="mt-0.5 mb-[18px] text-[12px] text-muted">
        {t('stations.amenitiesModal.subtitle', { name: station.name })}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {AMENITY_CATALOG.map((a) => {
          const on = selected.includes(a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              aria-pressed={on}
              className={`flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left text-[13px] font-medium transition ${
                on ? 'border-owner bg-owner-soft text-owner-deep' : 'border-line-2 text-body hover:border-line-3'
              }`}
            >
              <span className="text-[18px] leading-none">{AMENITY_EMOJI[a]}</span>
              <span className="flex-1">{t(`stations.amenities.${a}`)}</span>
              {on && <IconCheck size={16} className="text-owner" />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-[11px] leading-[1.5] text-faint">{t('stations.amenitiesModal.hint')}</div>

      <div className="mt-[22px] flex gap-[11px]">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
          {t('stations.amenitiesModal.cancel')}
        </Button>
        <Button
          accent="owner"
          size="lg"
          className="flex-1"
          onClick={() => save.mutate(selected)}
          disabled={save.isPending}
        >
          {save.isPending ? t('stations.amenitiesModal.saving') : t('stations.amenitiesModal.save')}
        </Button>
      </div>
    </Modal>
  );
}
