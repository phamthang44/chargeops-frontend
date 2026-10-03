import type { TicketCategory } from '@/types';

/** Subject (issue summary) limits — mobile is stricter than the backend contract (@Size max 160). */
export const SUBJECT_MIN_LENGTH = 10;
export const SUBJECT_MAX_LENGTH = 100;

/** Description limits — mirrors backend `@Size(max = 2000)`. */
export const DESCRIPTION_MIN_LENGTH = 20;
export const DESCRIPTION_MAX_LENGTH = 2000;

/** Which field can hold an error on the create-ticket form. */
export type TicketFormErrorKey = 'session' | 'subject' | 'description';

export type TicketFormErrors = Partial<Record<TicketFormErrorKey, string>>;

/** Visual top → bottom order of the fields, so "first error" is the topmost one on screen. */
export const ERROR_FIELD_ORDER: TicketFormErrorKey[] = ['session', 'subject', 'description'];

export interface TicketFormValues {
  subject: string;
  description: string;
  category: TicketCategory;
  /** Pre-linked ids coming from the route (navigated from an active session). */
  bookingId: string | null;
  stationId: string | null;
  /** Ids picked inside the form. */
  selectedBookingId: string | null;
  selectedStationId: string | null;
}

/**
 * Pure validation for the create-ticket form (mirrors backend CreateTicketRequest
 * + BR-TKT-SCOPE). Returns per-field messages so the UI can render inline errors
 * instead of blocking with a native Alert.
 */
export function validateTicketForm(values: TicketFormValues, t: any): TicketFormErrors {
  const errors: TicketFormErrors = {};

  const subject = values.subject.trim();
  if (!subject) {
    errors.subject = t('ticket.create.errSubjectRequired', {
      defaultValue: 'Vui lòng nhập tóm tắt sự cố',
    });
  } else if (subject.length < SUBJECT_MIN_LENGTH) {
    errors.subject = t('ticket.create.errSubjectMin', {
      defaultValue: 'Tóm tắt cần ít nhất {{min}} ký tự',
      min: SUBJECT_MIN_LENGTH,
    });
  }

  const description = values.description.trim();
  if (!description) {
    errors.description = t('ticket.create.errDescRequired', {
      defaultValue: 'Vui lòng mô tả chi tiết sự cố',
    });
  } else if (description.length < DESCRIPTION_MIN_LENGTH) {
    errors.description = t('ticket.create.errDescMin', {
      defaultValue: 'Mô tả cần ít nhất {{min}} ký tự',
      min: DESCRIPTION_MIN_LENGTH,
    });
  }

  const effectiveBookingId = values.selectedBookingId || values.bookingId || null;
  const effectiveStationId = values.selectedStationId || values.stationId || null;

  // Scope validation (BR-TKT-SCOPE)
  if (values.category === 'CHARGING_ISSUE' && !effectiveBookingId) {
    errors.session = t('ticket.create.errSessionRequired', {
      defaultValue: 'Hãy chọn phiên sạc phát sinh sự cố',
    });
  } else if (values.category === 'BOOKING' && !effectiveBookingId && !effectiveStationId) {
    errors.session = t('ticket.create.errStationRequired', {
      defaultValue: 'Hãy chọn trạm hoặc đơn đặt chỗ liên quan',
    });
  }

  return errors;
}

/** Topmost invalid field, used to scroll + focus after a failed submit. */
export function firstErrorKey(errors: TicketFormErrors): TicketFormErrorKey | undefined {
  return ERROR_FIELD_ORDER.find((key) => errors[key]);
}

export function errorCount(errors: TicketFormErrors): number {
  return ERROR_FIELD_ORDER.filter((key) => errors[key]).length;
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Hex token → rgba(), so error tints stay on-palette in both light and dark themes. */
export function withAlpha(hex: string, alpha: number): string {
  if (!HEX_RE.test(hex)) return hex;
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
