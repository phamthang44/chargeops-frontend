import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { legalDocument, type LegalDocType } from '@/content/legal';
import { usePreferences } from '@/context/PreferencesContext';
import { fontSizes, fontWeights, lineHeights, spacing } from '@/theme';
import { BottomSheet } from './BottomSheet';

interface LegalDocumentSheetProps {
  visible: boolean;
  type: LegalDocType;
  onClose: () => void;
}

export function LegalDocumentSheet({ visible, type, onClose }: LegalDocumentSheetProps) {
  const { i18n } = useTranslation();
  const { themeColors } = usePreferences();
  const doc = legalDocument(type, i18n.language);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={doc.title}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.updated, { color: themeColors.textMuted }]}>Cập nhật: {doc.updatedAt}</Text>
        <Text style={[styles.intro, { color: themeColors.textBody }]}>{doc.intro}</Text>
        {doc.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.heading, { color: themeColors.textStrong }]}>{section.title}</Text>
            {section.body.map((line) => (
              <Text key={line} style={[styles.body, { color: themeColors.textBody }]}>
                {line}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.lg },
  updated: { fontSize: fontSizes.caption, fontWeight: fontWeights.medium },
  intro: { fontSize: fontSizes.body, lineHeight: lineHeights.body },
  section: { gap: spacing.xs },
  heading: { fontSize: fontSizes.body, fontWeight: fontWeights.bold },
  body: { fontSize: fontSizes.caption, lineHeight: lineHeights.caption },
});
