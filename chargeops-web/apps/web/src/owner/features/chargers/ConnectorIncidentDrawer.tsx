import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Checkbox,
  Drawer,
  IconAlertTriangle,
  IconBolt,
  IconCheckCircle,
  IconClock,
  IconLock,
  IconShieldAlert,
  IconShieldCheck,
  Modal,
  Skeleton,
  StatusPill,
  useToast,
} from '@chargeops/ui';
import {
  formatDateVn,
  formatTimeVn,
  useApi,
  type AffectedIncidentBooking,
  type ConnectorIncidentResponse,
} from '@chargeops/api';

export interface ConnectorIncidentDrawerProps {
  open: boolean;
  onClose: () => void;
  stationId: string;
  incidentId: string | null;
  onIncidentUpdated?: (incident: ConnectorIncidentResponse) => void;
}

export function ConnectorIncidentDrawer({
  open,
  onClose,
  stationId,
  incidentId,
  onIncidentUpdated,
}: ConnectorIncidentDrawerProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const toast = useToast();
  const queryClient = useQueryClient();

  // State for session resolution dialog
  const [resolveTargetBooking, setResolveTargetBooking] = useState<AffectedIncidentBooking | null>(null);
  const [resolveReason, setResolveReason] = useState('');
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // State for recovery dialog
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverReason, setRecoverReason] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);

  const incidentQuery = useQuery({
    queryKey: ['incidents', stationId, incidentId],
    queryFn: () => (incidentId ? api.incidents.get(stationId, incidentId) : Promise.resolve(null)),
    enabled: Boolean(open && stationId && incidentId),
    refetchInterval: open ? 5000 : false,
  });

  if (!open || !incidentId) return null;

  const incident = incidentQuery.data;
  const isLoading = incidentQuery.isLoading;
  const isOpen = incident?.status === 'OPEN';
  const isPendingSafety = incident?.handlingState === 'PENDING';

  const handleResolveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTargetBooking || !incident) return;
    if (resolveReason.trim().length < 5) {
      setResolveError(
        t('incidents.drawer.resolveReasonTooShort', 'Lý do dừng phiên phải có tối thiểu 5 ký tự.')
      );
      return;
    }
    if (!safetyConfirmed) {
      setResolveError(
        t('incidents.drawer.safetyConfirmRequired', 'Bạn phải xác nhận hiện trường và xe đã được ngắt an toàn.')
      );
      return;
    }

    try {
      setIsResolving(true);
      setResolveError(null);

      const updated = await api.incidents.resolveSession(
        stationId,
        incident.incidentId,
        resolveTargetBooking.bookingId,
        {
          expectedBookingVersion: resolveTargetBooking.currentVersion,
          reason: resolveReason.trim(),
          safetyConfirmed: true,
        },
      );

      toast(
        t('incidents.drawer.resolveSuccessToast', 'Đã xác nhận dừng phiên an toàn tại hiện trường.'),
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['incidents', stationId, incidentId] });
      queryClient.invalidateQueries({ queryKey: ['ownerBookings'] });
      queryClient.invalidateQueries({ queryKey: ['connectors'] });

      onIncidentUpdated?.(updated);
      setResolveTargetBooking(null);
      setResolveReason('');
      setSafetyConfirmed(false);
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.error?.message ||
        t('incidents.drawer.resolveErrorToast', 'Không thể xác nhận dừng phiên an toàn.');
      setResolveError(msg);
      toast(msg, 'error');
    } finally {
      setIsResolving(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    if (recoverReason.trim().length < 5) {
      setRecoverError(
        t('incidents.drawer.recoverReasonTooShort', 'Lý do phục hồi phải có tối thiểu 5 ký tự.')
      );
      return;
    }

    try {
      setIsRecovering(true);
      setRecoverError(null);

      const updated = await api.incidents.recover(stationId, incident.incidentId, {
        expectedVersion: incident.version,
        reason: recoverReason.trim(),
      });

      toast(
        t('incidents.drawer.recoverSuccessToast', 'Phục hồi sự cố thành công. Đã cập nhật trạng thái cổng sạc.'),
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['incidents', stationId, incidentId] });
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      queryClient.invalidateQueries({ queryKey: ['chargePoints'] });

      onIncidentUpdated?.(updated);
      setShowRecoverModal(false);
      setRecoverReason('');
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.error?.message ||
        t('incidents.drawer.recoverErrorToast', 'Có lỗi xảy ra khi phục hồi cổng.');
      setRecoverError(msg);
      toast(msg, 'error');
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={
          isLoading || !incident ? (
            <span className="font-mono text-[16px] font-bold">
              {t('incidents.drawer.loading', 'Đang tải sự cố...')}
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[16px] font-bold text-ink">
                {t('incidents.drawer.incidentCode', 'SỰ CỐ #{{code}}', {
                  code: incident.incidentId.slice(-8).toUpperCase(),
                })}
              </span>
              <StatusPill
                tone={isOpen ? 'bad' : 'good'}
                label={
                  isOpen
                    ? t('incidents.drawer.statusOpen', 'ĐANG MỞ (OPEN)')
                    : t('incidents.drawer.statusRecovered', 'ĐÃ PHỤC HỒI (RECOVERED)')
                }
              />
              <StatusPill
                tone={isPendingSafety ? 'warn' : 'good'}
                label={
                  isPendingSafety
                    ? t('incidents.drawer.handlingPending', 'CHỜ DỪNG PHIÊN (PENDING)')
                    : t('incidents.drawer.handlingCompleted', 'ĐÃ CHỐT AN TOÀN')
                }
              />
            </div>
          )
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={onClose}>
              {t('incidents.drawer.closeBtn', 'Đóng')}
            </Button>
            {isOpen && (
              <Button
                variant="primary"
                accent="owner"
                onClick={() => setShowRecoverModal(true)}
              >
                {t('incidents.drawer.recoverBtn', 'Phục hồi cổng sạc (Recover)')}
              </Button>
            )}
          </div>
        }
      >
        {isLoading || !incident ? (
          <div className="space-y-4 p-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-1">
            {/* Overview Card */}
            <Card className="rounded-xl border border-line-2 bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <span className="text-[12px] font-semibold text-muted">
                  {t('incidents.drawer.fullIdLabel', 'Mã định danh đầy đủ:')}
                </span>
                <span className="font-mono text-[11.5px] text-faint select-all">{incident.incidentId}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block mb-0.5">
                    {t('incidents.drawer.occurredAtLabel', 'Thời điểm xảy ra:')}
                  </span>
                  <span className="font-medium text-body">
                    {t('incidents.drawer.atTime', '{{date}} lúc {{time}}', {
                      date: formatDateVn(incident.occurredAt),
                      time: formatTimeVn(incident.occurredAt),
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block mb-0.5">
                    {t('incidents.drawer.reportedAtLabel', 'Thời điểm ghi nhận:')}
                  </span>
                  <span className="font-medium text-body">
                    {t('incidents.drawer.atTime', '{{date}} lúc {{time}}', {
                      date: formatDateVn(incident.reportedAt),
                      time: formatTimeVn(incident.reportedAt),
                    })}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-faint block mb-0.5">
                  {t('incidents.drawer.incidentReasonLabel', 'Lý do sự cố:')}
                </span>
                <p className="rounded-lg bg-surface-2 p-2.5 text-[12.5px] font-medium text-ink leading-relaxed">
                  {incident.reason}
                </p>
              </div>

              {incident.recoveredAt && (
                <div className="rounded-lg border border-good/30 bg-good-soft p-3 text-[12px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-good">
                    <IconShieldCheck size={15} />
                    <span>
                      {t('incidents.drawer.recoveredAtNotice', 'Đã phục hồi lúc {{date}} ({{time}})', {
                        date: formatDateVn(incident.recoveredAt),
                        time: formatTimeVn(incident.recoveredAt),
                      })}
                    </span>
                  </div>
                  {incident.recoveryReason && (
                    <p className="text-body font-medium">
                      {t('incidents.drawer.recoveryReasonLabel', 'Lý do: {{reason}}', {
                        reason: incident.recoveryReason,
                      })}
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Invariant Policy Notice */}
            <div className="rounded-xl border border-warn-border bg-warn-soft p-3 text-[12px] text-warn-deep leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-warn mb-1">
                <IconAlertTriangle size={15} />
                <span>{t('incidents.drawer.policyNoticeTitle', 'Quy định an toàn BKG-054 & BKG-055:')}</span>
              </div>
              <p>
                {t(
                  'incidents.drawer.policyNoticeDesc',
                  'Xác nhận dừng phiên (Resolve Session) là thao tác ghi nhận an toàn vật lý tại hiện trường và chuyển đơn đặt chỗ sang COMPLETED với lý do INCIDENT_SESSION_STOPPED. Thao tác này không tự cấp quyền hoàn tiền; hoàn tiền sẽ thực hiện riêng theo quy trình tài chính.'
                )}
              </p>
            </div>

            {/* Affected Bookings Snapshot Section */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-ink">
                    {t('incidents.drawer.snapshotTitle', 'Snapshot Booking Bị Ảnh Hưởng ({{count}})', {
                      count: incident.affectedBookings.length,
                    })}
                  </span>
                </div>
                <span className="text-[11px] text-faint">
                  {t('incidents.drawer.snapshotHint', 'Chụp tức thời khi báo sự cố')}
                </span>
              </div>

              {incident.affectedBookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line-2 bg-surface-2 p-4 text-center text-[12px] text-muted">
                  {t('incidents.drawer.noAffectedBookings', 'Không có lượt đặt chỗ nào bị ảnh hưởng tại thời điểm xảy ra sự cố.')}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {incident.affectedBookings.map((b) => {
                    const isAwaitingStop = b.safetyState === 'AWAITING_SESSION_STOP';
                    const isResolved = b.safetyState === 'SESSION_RESOLVED';

                    return (
                      <div
                        key={b.bookingId}
                        className={`rounded-xl border p-3 text-[12px] transition ${
                          isAwaitingStop
                            ? 'border-bad/40 bg-bad-soft/40 shadow-xs'
                            : isResolved
                              ? 'border-good/30 bg-surface'
                              : 'border-line-2 bg-surface'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[12.5px] font-bold text-brand">
                                #{b.bookingId.slice(-8).toUpperCase()}
                              </span>
                              <span className="rounded bg-chip px-1.5 py-0.5 text-[10.5px] font-mono text-muted">
                                {t('incidents.drawer.snapshotStatus', 'Snap: {{status}} (v{{version}})', {
                                  status: b.snapshotStatus,
                                  version: b.snapshotVersion,
                                })}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[11.5px] text-muted">
                              <span>
                                {t('incidents.drawer.currentStatusLabel', 'Hiện tại:')}{' '}
                                <strong className="text-body">{b.currentStatus}</strong>
                              </span>
                              <span>· {t('incidents.drawer.versionLabel', 'Phiên bản:')} v{b.currentVersion}</span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            {isAwaitingStop && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-bad px-2.5 py-0.5 text-[11px] font-bold text-white animate-pulse">
                                {t('incidents.drawer.awaitingStop', 'Chờ dừng an toàn')}
                              </span>
                            )}
                            {isResolved && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-good-soft px-2.5 py-0.5 text-[11px] font-bold text-good">
                                <IconCheckCircle size={12} />
                                {t('incidents.drawer.stopResolved', 'Đã dừng an toàn')}
                              </span>
                            )}
                            {b.safetyState === 'NO_ACTIVE_SESSION' && (
                              <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-muted">
                                {t('incidents.drawer.noActiveSession', 'Chưa vào phiên')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action for Awaiting Session Stop */}
                        {isAwaitingStop && (
                          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-hairline pt-2">
                            <span className="text-[11px] text-bad font-medium">
                              {t('incidents.drawer.needManualCheck', 'Cần nhân viên kiểm tra ngắt sạc thực tế tại trụ.')}
                            </span>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setResolveTargetBooking(b);
                                setResolveReason('');
                                setSafetyConfirmed(false);
                                setResolveError(null);
                              }}
                            >
                              {t('incidents.drawer.confirmResolveBtn', 'Xác nhận dừng phiên')}
                            </Button>
                          </div>
                        )}

                        {/* Resolution details */}
                        {isResolved && b.resolvedAt && (
                          <div className="mt-2 rounded-lg bg-surface-2 p-2 text-[11.5px] text-muted space-y-0.5">
                            <div>
                              {t('incidents.drawer.stopResolvedAt', 'Dừng an toàn lúc: {{datetime}}', {
                                datetime: `${formatDateVn(b.resolvedAt)} ${formatTimeVn(b.resolvedAt)}`,
                              })}
                            </div>
                            {b.resolutionReason && (
                              <div>
                                {t('incidents.drawer.reasonLabel', 'Lý do: {{reason}}', {
                                  reason: b.resolutionReason,
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Xác nhận dừng phiên an toàn */}
      {resolveTargetBooking && (
        <Modal open onClose={() => setResolveTargetBooking(null)} maxWidth={480}>
          <form onSubmit={handleResolveSession} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-bad-soft text-bad">
                <IconShieldAlert size={22} />
              </span>
              <div>
                <div className="text-[16px] font-bold text-ink">
                  {t('incidents.drawer.resolveModal.title', 'Xác nhận dừng phiên sạc an toàn')}
                </div>
                <div className="text-[12px] text-muted">
                  {t('incidents.drawer.resolveModal.subtitle', 'Booking #{{code}} · Cổng sạc sự cố', {
                    code: resolveTargetBooking.bookingId.slice(-8).toUpperCase(),
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-bad-border bg-bad-soft p-3 text-[12px] text-bad-deep leading-relaxed">
              {t(
                'incidents.drawer.resolveModal.notice',
                'Thao tác này xác nhận rằng súng sạc đã được ngắt kết nối an toàn với xe điện tại hiện trường. Đơn đặt chỗ sẽ được chuyển sang COMPLETED với lý do INCIDENT_SESSION_STOPPED.'
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-ink">
                {t('incidents.drawer.resolveModal.reasonLabel', 'Lý do / Biên bản kiểm tra an toàn')}{' '}
                <span className="text-bad">*</span>
              </label>
              <textarea
                rows={3}
                value={resolveReason}
                onChange={(e) => {
                  setResolveReason(e.target.value);
                  if (resolveError) setResolveError(null);
                }}
                placeholder={t(
                  'incidents.drawer.resolveModal.reasonPlaceholder',
                  'Nhập chi tiết xác nhận (ví dụ: Đã rút súng sạc an toàn, xe đã rời vị trí trụ, không có chập điện...)'
                )}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink focus:border-bad focus:outline-none"
              />
            </div>

            <div className="rounded-lg bg-surface-2 p-3">
              <Checkbox
                checked={safetyConfirmed}
                onChange={(checked) => {
                  setSafetyConfirmed(checked);
                  if (resolveError) setResolveError(null);
                }}
              >
                <span className="text-[12px] font-semibold text-ink">
                  {t(
                    'incidents.drawer.resolveModal.safetyConfirmText',
                    'Tôi xác nhận thiết bị và phương tiện tại hiện trường đã dừng an toàn (safetyConfirmed).'
                  )}
                </span>
              </Checkbox>
            </div>

            {resolveError && (
              <div className="rounded-lg bg-bad-soft p-2.5 text-[12px] font-medium text-bad">
                {resolveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResolveTargetBooking(null)}
                disabled={isResolving}
              >
                {t('incidents.drawer.resolveModal.cancelBtn', 'Hủy')}
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={isResolving || !safetyConfirmed || resolveReason.trim().length < 5}
              >
                {isResolving
                  ? t('incidents.drawer.resolveModal.submitting', 'Đang xác nhận...')
                  : t('incidents.drawer.resolveModal.submitBtn', 'Xác nhận dừng an toàn')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Phục hồi cổng sạc (Recovery BKG-055) */}
      {showRecoverModal && (
        <Modal open onClose={() => setShowRecoverModal(false)} maxWidth={480}>
          <form onSubmit={handleRecover} className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-owner-soft text-owner">
                <IconShieldCheck size={22} />
              </span>
              <div>
                <div className="text-[16px] font-bold text-ink">
                  {t('incidents.drawer.recoverModal.title', 'Phục hồi cổng sạc sau sự cố (Recovery)')}
                </div>
                <div className="text-[12px] text-muted">
                  {t('incidents.drawer.recoverModal.subtitle', 'BKG-055 · Khôi phục vận hành cổng sạc')}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line-2 bg-surface-2 p-3 text-[12px] text-body leading-relaxed space-y-1">
              <p>
                {t('incidents.drawer.recoverModal.info1', 'Lệnh phục hồi sẽ chuyển sự cố sang RECOVERED.')}
              </p>
              <p className="text-muted">
                {t(
                  'incidents.drawer.recoverModal.info2',
                  'Nếu không còn sự cố mở nào khác và trạm đang hoạt động, cổng sạc sẽ tự động mở lại sang AVAILABLE.'
                )}
              </p>
            </div>

            {isPendingSafety && (
              <div className="rounded-lg bg-warn-soft p-2.5 text-[11.5px] font-medium text-warn">
                {t(
                  'incidents.drawer.recoverModal.pendingWarning',
                  '⚠️ Vẫn còn phiên sạc chưa xác nhận dừng an toàn. Lệnh phục hồi sẽ đóng sự cố này nhưng cổng sạc có thể tiếp tục giữ OFFLINE hoặc IN_USE.'
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[12px] font-bold text-ink">
                {t('incidents.drawer.recoverModal.reasonLabel', 'Lý do & kết quả khắc phục sự cố')}{' '}
                <span className="text-bad">*</span>
              </label>
              <textarea
                rows={3}
                value={recoverReason}
                onChange={(e) => {
                  setRecoverReason(e.target.value);
                  if (recoverError) setRecoverError(null);
                }}
                placeholder={t(
                  'incidents.drawer.recoverModal.reasonPlaceholder',
                  'Mô tả công tác khắc phục kỹ thuật (ví dụ: Kỹ thuật viên đã thay cáp và kiểm tra điện trở cách điện đạt chuẩn, cổng sẵn sàng hoạt động trở lại...)'
                )}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-[12px] font-medium text-ink focus:border-owner focus:outline-none"
              />
            </div>

            {recoverError && (
              <div className="rounded-lg bg-bad-soft p-2.5 text-[12px] font-medium text-bad">
                {recoverError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowRecoverModal(false)}
                disabled={isRecovering}
              >
                {t('incidents.drawer.recoverModal.cancelBtn', 'Hủy')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                accent="owner"
                disabled={isRecovering || recoverReason.trim().length < 5}
              >
                {isRecovering
                  ? t('incidents.drawer.recoverModal.submitting', 'Đang phục hồi...')
                  : t('incidents.drawer.recoverModal.submitBtn', 'Xác nhận phục hồi cổng')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
