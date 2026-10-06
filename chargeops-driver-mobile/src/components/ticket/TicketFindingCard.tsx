import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, radius, spacing } from '@/theme';
import type { TicketFinding } from '@/types';
import { formatDateTime } from '@/utils/format';

export interface TicketFindingCardProps {
  findings: TicketFinding[];
  /** Khi phiếu đã đóng thì không còn đường khiếu nại — ẩn gợi ý khiếu nại. */
  showDisputeHint?: boolean;
}

/** Mass-carrying curve — never `linear` / `ease-in-out` (Section 5). */
const EASE = Easing.bezier(0.32, 0.72, 0, 1);

type Tone = 'bad' | 'warn' | 'neutral';

/**
 * Tone theo đúng ngôn ngữ của Web Console (TicketFindingsCard) để tài xế và
 * trạm đọc cùng một màu: đỏ = lỗi phía trạm, xám = không phải lỗi trạm.
 */
const CONCLUSION_META: Record<string, { fallback: string; tone: Tone }> = {
  STATION_FAILURE: { fallback: 'Lỗi phía trạm sạc', tone: 'bad' },
  NOT_STATION_FAILURE: { fallback: 'Không phải lỗi trạm', tone: 'neutral' },
  HARDWARE_FAULT: { fallback: 'Lỗi phần cứng trụ sạc', tone: 'bad' },
  STATION_OFFLINE: { fallback: 'Trạm mất kết nối mạng', tone: 'bad' },
  SOFTWARE_BUG: { fallback: 'Sự cố phần mềm / firmware', tone: 'warn' },
  USER_ERROR: { fallback: 'Thao tác phía người dùng', tone: 'neutral' },
  OTHER: { fallback: 'Nguyên nhân khác', tone: 'neutral' },
};

interface TonePalette {
  chipBg: string;
  chipBorder: string;
  chipText: string;
  accent: string;
  shell: string;
  shellBorder: string;
}

const TONES: Record<Tone, { light: TonePalette; dark: TonePalette }> = {
  bad: {
    light: {
      chipBg: '#FEF2F2',
      chipBorder: '#FECACA',
      chipText: '#B91C1C',
      accent: '#DC2626',
      shell: '#FEF2F2',
      shellBorder: '#FECACA',
    },
    dark: {
      chipBg: '#2A1416',
      chipBorder: '#7F1D1D',
      chipText: '#FCA5A5',
      accent: '#EF4444',
      shell: '#1E1012',
      shellBorder: '#4C1D1D',
    },
  },
  warn: {
    light: {
      chipBg: '#FFFBEB',
      chipBorder: '#FDE68A',
      chipText: '#92400E',
      accent: '#D97706',
      shell: '#FFFBEB',
      shellBorder: '#FDE68A',
    },
    dark: {
      chipBg: '#2D2010',
      chipBorder: '#78350F',
      chipText: '#FDE68A',
      accent: '#F59E0B',
      shell: '#241A0D',
      shellBorder: '#4A3212',
    },
  },
  neutral: {
    light: {
      chipBg: '#F9FAFB',
      chipBorder: '#E5E7EB',
      chipText: '#374151',
      accent: '#6B7280',
      shell: '#F4F6F5',
      shellBorder: '#E5E7EB',
    },
    dark: {
      chipBg: '#1A211F',
      chipBorder: '#2A312F',
      chipText: '#C4CECA',
      accent: '#8E9A96',
      shell: '#161D1B',
      shellBorder: '#27312E',
    },
  },
};

function toneOf(conclusion: string): Tone {
  return CONCLUSION_META[conclusion]?.tone ?? 'neutral';
}

/**
 * "Kết luận kỹ thuật" — Double-Bezel card (Section 4.A).
 *
 * Mục tiêu: giảm hiểu lầm khi đọc biên bản — mỗi kết luận được phân tách
 * thành (1) chip phán quyết theo màu, (2) mô tả ý nghĩa, (3) căn cứ ghi nhận,
 * (4) siêu dữ liệu ai/ghi lúc nào/thời điểm sự cố, cùng footnote làm rõ
 * kết luận KHÔNG tự hoàn tiền và đường khiếu nại lên Admin.
 */
export function TicketFindingCard({ findings, showDisputeHint = true }: TicketFindingCardProps) {
  const { t } = useTranslation();
  const { themeColors, isDark } = usePreferences();
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.timing(reveal, {
      toValue: 1,
      duration: 640,
      easing: EASE,
      useNativeDriver: true,
    });
    run.start();
    return () => run.stop();
  }, [reveal]);

  /** Staggered mask reveal — transform + opacity only (Section 6). */
  const stagger = (start: number, end: number) => {
    const s = Math.min(0.9, Math.max(0, start));
    const e = Math.max(s + 0.05, Math.min(1, end));
    return {
      opacity: reveal.interpolate({
        inputRange: [s, e],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          translateY: reveal.interpolate({
            inputRange: [s, e],
            outputRange: [14, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    };
  };

  if (!findings.length) return null;

  const primaryTone = toneOf(findings[0].conclusion);
  const head = TONES[primaryTone][isDark ? 'dark' : 'light'];

  return (
    <Animated.View
      style={[
        styles.shell,
        {
          backgroundColor: head.shell,
          borderColor: head.shellBorder,
          shadowColor: head.accent,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.28 : 0.12,
          shadowRadius: 22,
          elevation: 3,
        },
      ]}
    >
      <View style={[styles.core, { backgroundColor: themeColors.surface }]}>
        {/* Eyebrow header */}
        <Animated.View style={stagger(0, 0.45)}>
          <View style={styles.headRow}>
            <View style={[styles.iconTile, { backgroundColor: isDark ? '#10202E' : '#EFF6FF' }]}>
              <Ionicons name="document-text-outline" size={20} color={isDark ? '#60A5FA' : '#2563EB'} />
            </View>

            <View style={styles.headText}>
              <View
                style={[
                  styles.eyebrow,
                  { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
                ]}
              >
                <View style={[styles.eyebrowDot, { backgroundColor: head.accent }]} />
                <Text style={[styles.eyebrowText, { color: themeColors.textMuted }]}>
                  {t('ticket.detail.findingsEyebrow', 'Biên bản kỹ thuật')}
                </Text>
                <Text style={[styles.eyebrowCount, { color: head.accent }]}>
                  {`· ${findings.length}`}
                </Text>
              </View>

              <Text style={[styles.title, { color: themeColors.textStrong }]}>
                {t('ticket.detail.findingsTitle', 'Kết luận kỹ thuật')}
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                {t(
                  'ticket.detail.findingsSubtitle',
                  'Đánh giá nguyên nhân do trạm hoặc Admin ghi nhận, lưu vào hồ sơ đối soát.'
                )}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Findings */}
        {findings.map((f, i) => {
          const meta = CONCLUSION_META[f.conclusion];
          const tone = meta?.tone ?? 'neutral';
          const pal = TONES[tone][isDark ? 'dark' : 'light'];

          const conclusionLabel = t(
            `ticket.conclusion.${f.conclusion}`,
            meta?.fallback || f.conclusion
          );
          const conclusionDesc = t(`ticket.conclusionDesc.${f.conclusion}`, '');

          const role = f.recordedByRole || null;
          const roleLabel = role
            ? t(`ticket.detail.findingRole.${role}`, t('ticket.detail.findingRole.UNKNOWN', 'Hệ thống'))
            : null;

          const badgeKey =
            role === 'DRIVER'
              ? 'findingsBadgeDriver'
              : role === 'ADMIN'
                ? 'findingsBadgeAdmin'
                : i === 0
                  ? 'findingsBadgeStation'
                  : 'findingsBadgeStationMore';
          const badgeLabel = t(`ticket.detail.${badgeKey}`, {
            cycle: i + 1,
            defaultValue:
              badgeKey === 'findingsBadgeStationMore'
                ? `Biên bản trạm · lần #${i + 1}`
                : badgeKey === 'findingsBadgeAdmin'
                  ? 'Phân xử của Admin'
                  : badgeKey === 'findingsBadgeDriver'
                    ? 'Bạn tự ghi nhận'
                    : 'Biên bản từ trạm',
          });

          const recordedAt = formatDateTime(f.recordedAt, '');
          const affectedAt = formatDateTime(f.affectedAt, '');

          return (
            <Animated.View key={f.findingId || String(i)} style={stagger(0.18 + i * 0.14, 0.6 + i * 0.14)}>
              <View
                style={[
                  styles.findingRow,
                  { backgroundColor: pal.chipBg, borderColor: pal.chipBorder },
                ]}
              >
                {/* Verdict + provenance */}
                <View style={styles.pillRow}>
                  <View style={[styles.pill, { backgroundColor: themeColors.surface, borderColor: pal.chipBorder }]}>
                    <Ionicons
                      name={tone === 'neutral' ? 'information-circle-outline' : 'alert-circle-outline'}
                      size={13}
                      color={pal.accent}
                    />
                    <Text style={[styles.pillText, { color: pal.chipText }]} numberOfLines={2}>
                      {conclusionLabel}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Text style={[styles.badgeText, { color: themeColors.textMuted }]} numberOfLines={1}>
                      {badgeLabel}
                    </Text>
                  </View>
                </View>

                {Boolean(conclusionDesc) && (
                  <Text style={[styles.desc, { color: themeColors.textMuted }]}>{conclusionDesc}</Text>
                )}

                {/* Reason — tách hẳn khỏi label để không bị đọc nhầm thành một câu */}
                {Boolean(f.reason) && (
                  <View
                    style={[
                      styles.reasonBox,
                      { backgroundColor: themeColors.surfaceAlt, borderLeftColor: pal.accent },
                    ]}
                  >
                    <Text style={[styles.reasonLabel, { color: themeColors.textMuted }]}>
                      {t('ticket.detail.findingsReasonLabel', 'Căn cứ ghi nhận')}
                    </Text>
                    <Text style={[styles.reasonText, { color: themeColors.textBody }]}>
                      {f.reason}
                    </Text>
                  </View>
                )}

                {/* Meta — ai ghi nhận / khi nào / sự cố lúc nào */}
                <View style={styles.metaWrap}>
                  {roleLabel && (
                    <View style={styles.metaRow}>
                      <Ionicons name="person-outline" size={12} color={themeColors.textMuted} />
                      <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                        {t('ticket.detail.findingsMetaBy', { role: roleLabel, defaultValue: `Người ghi nhận: ${roleLabel}` })}
                      </Text>
                    </View>
                  )}
                  {Boolean(recordedAt) && (
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={12} color={themeColors.textMuted} />
                      <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                        {t('ticket.detail.findingsMetaRecordedAt', {
                          time: recordedAt,
                          defaultValue: `Ghi nhận lúc: ${recordedAt}`,
                        })}
                      </Text>
                    </View>
                  )}
                  {Boolean(affectedAt) && (
                    <View style={styles.metaRow}>
                      <Ionicons name="alert-circle-outline" size={12} color={themeColors.textMuted} />
                      <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                        {t('ticket.detail.findingsMetaAffectedAt', {
                          time: affectedAt,
                          defaultValue: `Thời điểm sự cố: ${affectedAt}`,
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          );
        })}

        {/* Footnote — hai hiểu lầm phổ biến nhất: "kết luận = hoàn tiền" & "không có cửa khiếu nại" */}
        <Animated.View style={stagger(0.35 + findings.length * 0.14, 0.95)}>
          <View
            style={[
              styles.noteBox,
              { backgroundColor: themeColors.surfaceAlt, borderColor: themeColors.border },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={themeColors.textMuted}
              style={styles.noteIcon}
            />
            <View style={styles.noteTextWrap}>
              <Text style={[styles.noteText, { color: themeColors.textMuted }]}>
                {t(
                  'ticket.detail.findingsAuditNote',
                  'Đây là biên bản kỹ thuật — không tự quyết định và không tự thực hiện hoàn tiền.'
                )}
              </Text>
              {showDisputeHint && (
                <Text style={[styles.noteText, { color: themeColors.textMuted, marginTop: 4 }]}>
                  {t(
                    'ticket.detail.findingsDisputeHint',
                    'Bạn không đồng thuận? Chọn “Yêu cầu Admin xem xét” ở cuối trang.'
                  )}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Outer shell of the Double-Bezel.
  shell: {
    padding: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  // Inner core — concentric radius (radius.xl - spacing.sm).
  core: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  eyebrowText: {
    fontSize: fontSizes.micro,
    lineHeight: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  eyebrowCount: {
    fontSize: fontSizes.micro,
    lineHeight: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: fontSizes.heading,
    lineHeight: 24,
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSizes.caption,
    lineHeight: 17,
  },
  findingRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  pillText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: fontSizes.micro,
    lineHeight: 12,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0.2,
  },
  desc: {
    fontSize: fontSizes.caption,
    lineHeight: 17,
  },
  reasonBox: {
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.sm + 1,
    gap: 3,
  },
  reasonLabel: {
    fontSize: fontSizes.micro,
    lineHeight: 12,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 19,
  },
  metaWrap: {
    gap: 4,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: fontSizes.micro,
    lineHeight: 14,
    fontWeight: fontWeights.medium,
    flexShrink: 1,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md - 2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteIcon: {
    marginTop: 1,
  },
  noteTextWrap: {
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17,
  },
});
