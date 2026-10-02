/**
 * Helper utilities for user profile formatting and display.
 */

/**
 * Get initials from a full name (e.g. "Nguyen Van A" -> "NA", "Admin" -> "A").
 */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''}`.toUpperCase();
}

/**
 * Format phone number for clean mobile presentation (e.g. "84901234567" -> "+84 901 234 567").
 */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length === 11) {
    return `+84 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return phone;
}
