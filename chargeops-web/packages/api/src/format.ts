/** Display helpers for the Vietnamese locale — keep formatting out of components. */

/** 4200000 → "₫4.200.000" */
export function formatVnd(n: number): string {
  return '₫' + n.toLocaleString('vi-VN');
}

/** 4200000 → "₫4,2tr"; 850000 → "₫850k" */
export function formatVndCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    const m = n / 1_000_000;
    return '₫' + m.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr';
  }
  if (Math.abs(n) >= 1_000) {
    return '₫' + Math.round(n / 1_000).toLocaleString('vi-VN') + 'k';
  }
  return formatVnd(n);
}

/**
 * Helper to ensure an ISO timestamp string from backend (Instant / UTC)
 * is parsed correctly with fallback 'Z' if missing. Returns null if invalid.
 */
function parseUtcDate(iso: string | Date | null | undefined): Date | null {
  if (iso instanceof Date) return isNaN(iso.getTime()) ? null : iso;
  if (!iso) return null;
  const str = String(iso).trim();
  if (!str || str.toLowerCase().includes('invalid date')) return null;
  // If ISO string doesn't specify timezone offset or 'Z', append 'Z' to treat as UTC Instant
  const normalized = str.includes('Z') || str.includes('+') || (str.includes('-') && str.length > 19)
    ? str
    : `${str}Z`;
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) return d;
  const dRaw = new Date(str);
  return isNaN(dRaw.getTime()) ? null : dRaw;
}

/** "2026-06-28T01:15:00Z" → "28/06/2026" (in Asia/Ho_Chi_Minh, UTC+7) */
export function formatDateVn(iso: string | Date | null | undefined): string {
  const d = parseUtcDate(iso);
  if (!d) return '--/--/----';
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "2026-06-28T01:15:00Z" → "08:15" (in Asia/Ho_Chi_Minh, UTC+7) */
export function formatTimeVn(iso: string | Date | null | undefined): string {
  const d = parseUtcDate(iso);
  if (!d) return '--:--';
  return d.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** "2026-06-28T01:15:00Z" → "08:15 · 28/06/2026" (in Asia/Ho_Chi_Minh, UTC+7) */
export function formatDateTimeVn(iso: string | Date | null | undefined): string {
  const d = parseUtcDate(iso);
  if (!d) return '--:-- · --/--/----';
  const time = formatTimeVn(d);
  const date = formatDateVn(d);
  return `${time} · ${date}`;
}

/** 90 → "1h30", 60 → "1h00" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export interface ParsedAssistantMessage {
  thinking: string | null;
  answer: string;
}

/**
 * Parses reasoning models (e.g. DeepSeek-R1, Qwen-Thinking) output containing <think>...</think>.
 * Separates internal reasoning from the customer-facing answer text.
 */
export function parseAssistantThinking(rawText: string | null | undefined): ParsedAssistantMessage {
  if (!rawText) return { thinking: null, answer: '' };

  let text = rawText;
  const thinkBlocks: string[] = [];
  const closedRegex = /<think>([\s\S]*?)<\/think>/gi;

  let match: RegExpExecArray | null;
  while ((match = closedRegex.exec(rawText)) !== null) {
    const chunk = match[1].trim();
    if (chunk) thinkBlocks.push(chunk);
  }

  text = text.replace(closedRegex, '').trim();

  // If there's an unclosed <think> tag (e.g. streaming or truncated output)
  const unclosedIdx = text.search(/<think>/i);
  if (unclosedIdx !== -1) {
    const unclosedChunk = text.slice(unclosedIdx + 7).trim();
    if (unclosedChunk) thinkBlocks.push(unclosedChunk);
    text = text.slice(0, unclosedIdx).trim();
  }

  return {
    thinking: thinkBlocks.length > 0 ? thinkBlocks.join('\n\n---\n\n') : null,
    answer: text,
  };
}

