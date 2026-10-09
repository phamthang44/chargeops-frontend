import * as Clipboard from 'expo-clipboard';

/**
 * Cross-platform clipboard write.
 *
 * `navigator.clipboard` only exists on web — on React Native devices it is a
 * silent no-op, which previously made the UI show "Đã sao chép" without
 * anything actually being copied. `expo-clipboard` covers iOS, Android and web,
 * with the web API kept only as a last-resort fallback.
 *
 * @returns `true` when the text was actually written to the clipboard.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
