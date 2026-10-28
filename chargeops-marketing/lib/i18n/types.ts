import type { vi } from "./dictionaries/vi";

export type Locale = "vi" | "en";

export type Dictionary = typeof vi;

export interface I18nContextType {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}
