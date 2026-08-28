import { useState, useCallback, useMemo, type ReactNode, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi, type Station, type StaffLookupResponse } from '@chargeops/api';
import {
  Button,
  Card,
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconUsers,
  IconX,
  Select,
  useToast,
} from '@chargeops/ui';

import { getApiErrorMessage } from '../../../i18n';

interface StaffAssignFormProps {
  stations: Station[];
}

export function StaffAssignForm({ stations }: StaffAssignFormProps) {
  const { t } = useTranslation('owner');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [debouncedEmail, setDebouncedEmail] = useState('');
  const [stationId, setStationId] = useState('');
  const [note, setNote] = useState('');
  const [resetSignal, setResetSignal] = useState(0);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(debouncedEmail);
  }, [debouncedEmail]);

  const stationOptions = useMemo(() => {
    return stations
      .filter((s) => s.status === 'active' || s.status === 'ACTIVE')
      .map((s) => ({ value: s.id, label: s.name }));
  }, [stations]);

  const effectiveStationId = stationId || stationOptions[0]?.value || '';

  // Lookup query (only triggered when debounced email arrives)
  const lookupQ = useQuery<StaffLookupResponse>({
    queryKey: ['staff', 'lookup', effectiveStationId, debouncedEmail],
    queryFn: () => api.staff.lookup(effectiveStationId, debouncedEmail),
    enabled: isValidEmail && Boolean(effectiveStationId),
    staleTime: 1000 * 60, // 60s
  });

  const assignMutation = useMutation({
    mutationFn: () =>
      api.staff.assign(effectiveStationId, {
        email: debouncedEmail,
        note: note.trim() || undefined,
      }),
    onSuccess: (member) => {
      qc.invalidateQueries({ queryKey: ['staff'] });
      toast(
        t('staff.assignSuccess', {
          name: member.displayName || member.email,
          station: member.stationName,
        }),
        'success',
      );
      setDebouncedEmail('');
      setNote('');
      setResetSignal((s) => s + 1);
    },
    onError: (e) => toast(getApiErrorMessage(e), 'error'),
  });

  const lookupData = lookupQ.data;
  const isEligible = lookupData?.status === 'ELIGIBLE' && lookupData?.assignable;
  const canSubmit = isEligible && !!effectiveStationId && !assignMutation.isPending;

  const notePresets = useMemo(() => {
    return [
      t('staff.assign.presets.morning'),
      t('staff.assign.presets.afternoon'),
      t('staff.assign.presets.night'),
      t('staff.assign.presets.tech'),
      t('staff.assign.presets.coordinator'),
      t('staff.assign.presets.fulltime'),
    ];
  }, [t]);

  const handleEmailDebounced = useCallback((email: string) => {
    setDebouncedEmail(email);
  }, []);

  return (
    <Card className="p-[18px] border border-line/60 shadow-subtle flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-hairline pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-owner-soft text-owner">
            <IconUsers size={16} />
          </span>
          <span className="text-[15px] font-bold text-ink">{t('staff.assign.title')}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3.5">
        {/* Email Field - Isolated for 60fps Native Typing */}
        <Field label={t('staff.assign.emailLabel')}>
          <EmailSearchInput
            onDebouncedChange={handleEmailDebounced}
            placeholder={t('staff.assign.emailPlaceholder')}
            isSearching={lookupQ.isFetching && isValidEmail}
            isValidEmail={isValidEmail}
            lookupStatus={lookupData?.status}
            resetSignal={resetSignal}
          />
        </Field>

        {/* Live Lookup State Feedback */}
        {isValidEmail && !lookupQ.isFetching && lookupData && (
          <div className="animate-fadeIn transition-all duration-200">
            {lookupData.status === 'ELIGIBLE' && (
              <div className="rounded-xl border border-good/30 bg-good-soft/30 p-3.5 flex flex-col gap-2.5">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good text-[13px] font-bold text-white shadow-sm">
                    {(lookupData.displayName || lookupData.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13.5px] font-bold text-ink max-w-[200px] sm:max-w-none">
                        {lookupData.displayName || lookupData.email}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-good/15 px-2 py-0.5 text-[10.5px] font-bold text-good border border-good/25 whitespace-nowrap">
                        <IconCheck size={10} strokeWidth={3} /> {t('staff.assign.userFound')}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                      <span className="break-all font-mono text-ink/80">{lookupData.email}</span>
                      {lookupData.maskedPhone && <span>• {lookupData.maskedPhone}</span>}
                      <span className="rounded bg-surface-3/80 px-1.5 py-0.5 text-[10px] font-semibold text-body">
                        {t('staff.assign.driverRole')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {lookupData.status === 'NOT_FOUND' && (
              <div className="rounded-xl border border-warn/40 bg-warn-soft/40 p-3.5 text-[12px]">
                <div className="flex items-center gap-2 font-bold text-warn-deep">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warn/20 text-warn-deep">
                    <IconAlertCircle size={13} />
                  </div>
                  <span>{t('staff.lookup.notFound')}</span>
                </div>
                <p className="mt-1.5 pl-7 text-[11.5px] text-muted leading-relaxed">
                  {t('staff.lookup.notFoundHelp')}
                </p>
              </div>
            )}

            {lookupData.status === 'SELF_ASSIGNMENT' && (
              <div className="rounded-xl border border-danger/30 bg-danger-soft/30 p-3.5 text-[12px]">
                <div className="flex items-center gap-2 font-bold text-danger">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-danger">
                    <IconAlertTriangle size={13} />
                  </div>
                  <span>{t('staff.lookup.selfAssignment')}</span>
                </div>
                <p className="mt-1.5 pl-7 text-[11.5px] text-muted leading-relaxed">
                  {t('staff.lookup.selfAssignmentHelp')}
                </p>
              </div>
            )}

            {lookupData.status === 'ALREADY_ASSIGNED' && (
              <div className="rounded-xl border border-warn/40 bg-warn-soft/40 p-3.5 text-[12px]">
                <div className="flex items-center gap-2 font-bold text-warn-deep">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warn/20 text-warn-deep">
                    <IconAlertTriangle size={13} />
                  </div>
                  <span>{t('staff.lookup.alreadyAssigned')}</span>
                </div>
                <p className="mt-1.5 pl-7 text-[11.5px] text-muted leading-relaxed">
                  {t('staff.lookup.alreadyAssignedHelp')}
                </p>
              </div>
            )}

            {lookupData.status === 'ROLE_NOT_ALLOWED' && (
              <div className="rounded-xl border border-danger/30 bg-danger-soft/30 p-3.5 text-[12px]">
                <div className="flex items-center gap-2 font-bold text-danger">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-danger">
                    <IconAlertTriangle size={13} />
                  </div>
                  <span>{t('staff.lookup.roleNotAllowed')}</span>
                </div>
                <p className="mt-1.5 pl-7 text-[11.5px] text-muted leading-relaxed">
                  {t('staff.lookup.roleNotAllowedHelp')}
                </p>
              </div>
            )}

            {lookupData.status === 'ACCOUNT_INACTIVE' && (
              <div className="rounded-xl border border-danger/30 bg-danger-soft/30 p-3.5 text-[12px]">
                <div className="flex items-center gap-2 font-bold text-danger">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-danger/20 text-danger">
                    <IconAlertTriangle size={13} />
                  </div>
                  <span>{t('staff.lookup.accountInactive')}</span>
                </div>
                <p className="mt-1.5 pl-7 text-[11.5px] text-muted leading-relaxed">
                  {t('staff.lookup.accountInactiveHelp')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Station Select */}
        <Field label={t('staff.assign.stationLabel')}>
          <Select
            value={effectiveStationId}
            onChange={setStationId}
            options={stationOptions}
            accent="owner"
          />
        </Field>

        {/* Shift Note with Quick Presets */}
        <Field label={t('staff.assign.noteLabel')}>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('staff.assign.notePlaceholder')}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] font-medium text-ink transition-colors focus:border-owner focus:outline-none focus:ring-2 focus:ring-owner/15"
            />
            {/* Quick Preset Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] font-medium text-faint mr-0.5">
                {t('staff.assign.noteQuickPresets')}
              </span>
              {notePresets.map((preset) => {
                const isSelected = note === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNote(isSelected ? '' : preset)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] transition-all border ${
                      isSelected
                        ? 'bg-owner-soft text-owner font-bold border-owner/40 shadow-xs'
                        : 'bg-surface-2 text-muted border-hairline hover:border-owner/30 hover:text-ink hover:bg-surface-3'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>
        </Field>

        {/* Submit Button */}
        <Button
          accent="owner"
          fullWidth
          disabled={!canSubmit}
          onClick={() => assignMutation.mutate()}
        >
          {assignMutation.isPending
            ? t('staff.assign.submitting')
            : t('staff.assign.submitBtn')}
        </Button>

        <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-muted border border-hairline">
          {t('staff.assign.help')}
        </p>
      </div>
    </Card>
  );
}

/**
 * Isolated, ultra-fast email search input component.
 * Typing in this component does not trigger re-renders in the parent form.
 */
interface EmailSearchInputProps {
  onDebouncedChange: (email: string) => void;
  placeholder?: string;
  isSearching: boolean;
  isValidEmail: boolean;
  lookupStatus?: string;
  resetSignal: number;
}

const EmailSearchInput = memo(function EmailSearchInput({
  onDebouncedChange,
  placeholder,
  isSearching,
  isValidEmail,
  lookupStatus,
  resetSignal,
}: EmailSearchInputProps) {
  const [val, setVal] = useState('');

  useEffect(() => {
    setVal('');
  }, [resetSignal]);

  useEffect(() => {
    const trimmed = val.trim().toLowerCase();
    const timer = setTimeout(() => {
      onDebouncedChange(trimmed);
    }, 450);
    return () => clearTimeout(timer);
  }, [val, onDebouncedChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onDebouncedChange(val.trim().toLowerCase());
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim().replace(/[\r\n\t\s]+/g, '');
    setVal(text);
    // Instant lookup on paste
    onDebouncedChange(text.toLowerCase());
  };

  const handleBlur = () => {
    onDebouncedChange(val.trim().toLowerCase());
  };

  const handleClear = () => {
    setVal('');
    onDebouncedChange('');
  };

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="email"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={handleBlur}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-surface pl-3.5 pr-10 py-2.5 text-[13px] font-medium text-ink transition-colors focus:border-owner focus:outline-none focus:ring-2 focus:ring-owner/15"
      />
      {/* Status icon or Clear button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {isSearching ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-owner border-t-transparent"
            aria-label="Loading"
          />
        ) : isValidEmail && lookupStatus === 'ELIGIBLE' ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-good text-white shadow-xs">
            <IconCheck size={11} strokeWidth={3} />
          </span>
        ) : isValidEmail && lookupStatus && lookupStatus !== 'ELIGIBLE' ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warn/20 text-warn-deep">
            <IconAlertCircle size={12} />
          </span>
        ) : val ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded p-0.5 text-faint hover:text-ink hover:bg-surface-3 transition-colors"
            tabIndex={-1}
          >
            <IconX size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
});

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-faint">
        {label}
      </div>
      {children}
    </div>
  );
}
