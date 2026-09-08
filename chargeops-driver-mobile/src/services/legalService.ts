import { Platform } from 'react-native';
import { legalDocument, type LegalDocType, type LegalDocument, type LegalSection } from '@/content/legal';
import { resolveDevUrl } from '@/utils/networkHost';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export const apiBaseUrl = resolveDevUrl(
  configuredBaseUrl ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:8081' : 'http://localhost:8081')
);

function parseMarkdownToSections(content: string): LegalSection[] {
  const sections: LegalSection[] = [];
  const lines = content.split('\n');
  let currentTitle = '';
  let currentBody: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    const headingMatch = line.match(/^(?:#{2,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentTitle && currentBody.length > 0) {
        sections.push({ title: currentTitle, body: currentBody });
        currentBody = [];
      }
      currentTitle = headingMatch[1].trim().replace(/\*\*/g, '');
      continue;
    }

    if (line.startsWith('# ') || line.startsWith('---') || line.startsWith('>')) {
      continue;
    }

    if (line.length > 0) {
      if (currentTitle) {
        const cleaned = line.replace(/^(\d+\.|\-|\*)\s+/, '').replace(/\*\*/g, '');
        if (cleaned.length > 0) {
          currentBody.push(cleaned);
        }
      }
    }
  }

  if (currentTitle && currentBody.length > 0) {
    sections.push({ title: currentTitle, body: currentBody });
  }

  return sections;
}

function formatDate(isoString?: string): string {
  if (!isoString) return '08/09/2026';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export async function fetchLegalDocument(
  type: LegalDocType,
  lang: string = 'vi',
): Promise<LegalDocument> {
  const fallback = legalDocument(type, lang);
  const slug = type === 'terms' ? 'terms-of-service' : 'privacy-policy';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${apiBaseUrl}/api/v1/legal-documents/${slug}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const payload = await res.json();
      const data = payload?.data || payload;
      if (data && typeof data.content === 'string' && data.content.trim().length > 0) {
        const sections = parseMarkdownToSections(data.content);
        return {
          title: data.title || fallback.title,
          updatedAt: formatDate(data.updatedAt || data.effectiveFrom),
          intro: data.summary || fallback.intro,
          sections: sections.length > 0 ? sections : fallback.sections,
        };
      }
    }
  } catch {
    // Graceful offline fallback
  }

  return fallback;
}
