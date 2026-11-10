import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ACTIVITY_TYPES,
  COLLEGES,
  PUBLISHED_WITHIN_OPTIONS,
  SPOT_OPTIONS,
} from '@/constants/options';
import { spacing, typography } from '@/constants/theme';
import type { ActivityType, PublishedWithin, SpotFilter } from '@/types/models';
import type { FilterState } from '@/hooks/useRecruitmentList';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Sheet } from '@/components/ui/Sheet';

interface FilterSheetProps {
  visible: boolean;
  filters: FilterState;
  onClose: () => void;
  onApply: (next: FilterState) => void;
  onReset: () => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function FilterSheet({ visible, filters, onClose, onApply, onReset }: FilterSheetProps) {
  const [draft, setDraft] = useState<FilterState>(filters);

  const resetDraft = () => {
    const empty: FilterState = {
      colleges: [],
      types: [],
      spot: 'any',
      publishedWithin: 'all',
    };
    setDraft(empty);
    onReset();
  };

  return (
    <Sheet
      visible={visible}
      title="筛选招募"
      subtitle="可多选，条件之间为「同时满足」"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button label="重置" variant="secondary" onPress={resetDraft} style={styles.footerButton} />
          <Button
            label="查看结果"
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            style={styles.footerButton}
          />
        </View>
      }
    >
      <Text style={styles.sectionTitle}>二级学院</Text>
      <View style={styles.chipWrap}>
        {COLLEGES.map((college) => (
          <Chip
            key={college}
            label={college.replace('学院', '')}
            active={draft.colleges.includes(college)}
            onPress={() => setDraft((prev) => ({ ...prev, colleges: toggle(prev.colleges, college) }))}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>活动类型</Text>
      <View style={styles.chipWrap}>
        {ACTIVITY_TYPES.map((type) => (
          <Chip
            key={type.value}
            label={type.label}
            icon={type.icon}
            active={draft.types.includes(type.value)}
            onPress={() =>
              setDraft((prev) => ({
                ...prev,
                types: toggle<ActivityType>(prev.types, type.value),
              }))
            }
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>剩余名额</Text>
      <View style={styles.chipWrap}>
        {SPOT_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={draft.spot === option.value}
            onPress={() => setDraft((prev) => ({ ...prev, spot: option.value as SpotFilter }))}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>发布时间</Text>
      <View style={styles.chipWrap}>
        {PUBLISHED_WITHIN_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={draft.publishedWithin === option.value}
            onPress={() =>
              setDraft((prev) => ({
                ...prev,
                publishedWithin: option.value as PublishedWithin,
              }))
            }
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typography.body,
    fontWeight: '600',
    fontSize: 14,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.md },
  footerButton: { flex: 1 },
});
