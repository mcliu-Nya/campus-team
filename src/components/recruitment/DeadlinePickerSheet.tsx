import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Sheet } from '@/components/ui/Sheet';
import { colors, hitSlop, radius, spacing, typography } from '@/constants/theme';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  clampHour,
  clampMinute,
  composeIso,
  formatDayLabel,
  formatTimeLabel,
  initialPickerParts,
  monthLabel,
  sameDay,
  shiftMonth,
  startOfDay,
  formatShortDayLabel,
} from '@/lib/calendar';
import { formatDeadlineHint } from '@/lib/date';

interface DeadlinePickerSheetProps {
  visible: boolean;
  /** 当前截止时间（ISO 8601），null 表示尚未选择 */
  value: string | null;
  onClose: () => void;
  onConfirm: (iso: string) => void;
}

const TIME_PRESETS = [
  { hour: 9, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 21, minute: 0 },
  { hour: 23, minute: 59 },
];

const WEEKDAY_HEADERS = WEEKDAY_LABELS.map((label) => `周${label}`);

interface StepperProps {
  label: string;
  value: string;
  onStep: (delta: number) => void;
}

function Stepper({ label, value, onStep }: StepperProps) {
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}减少`}
        hitSlop={hitSlop}
        onPress={() => onStep(-1)}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Ionicons name="remove" size={16} color={colors.primaryDark} />
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}增加`}
        hitSlop={hitSlop}
        onPress={() => onStep(1)}
        style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={16} color={colors.primaryDark} />
      </Pressable>
    </View>
  );
}

/**
 * 自定义报名截止时间：日历选日期 + 时/分步进，精确到 5 分钟。
 * 组件不保存到表单，确认后由父级 patch 到 RecruitmentFormValues。
 */
export function DeadlinePickerSheet({
  visible,
  value,
  onClose,
  onConfirm,
}: DeadlinePickerSheetProps) {
  const [seed] = useState(() => initialPickerParts(value));
  const [cursor, setCursor] = useState({ year: seed.year, month: seed.month });
  const [day, setDay] = useState(() => new Date(seed.year, seed.month, seed.day));
  const [hour, setHour] = useState(seed.hour);
  const [minute, setMinute] = useState(seed.minute);
  const [error, setError] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const weeks = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  );
  const iso = composeIso(day, hour, minute);
  const canGoPrev =
    cursor.year > today.getFullYear() ||
    (cursor.year === today.getFullYear() && cursor.month > today.getMonth());

  const selectDay = (target: Date) => {
    setDay(startOfDay(target));
    setError(null);
  };

  const handleConfirm = () => {
    if (new Date(iso).getTime() <= Date.now()) {
      setError('截止时间需晚于当前时间，请重新选择');
      return;
    }
    onConfirm(iso);
  };

  return (
    <Sheet
      visible={visible}
      title="选择报名截止时间"
      subtitle="过期后招募自动结束"
      onClose={onClose}
      maxHeightRatio={0.92}
      footer={<Button label="确定" icon="checkmark" onPress={handleConfirm} fullWidth />}
    >
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="上个月"
          hitSlop={hitSlop}
          disabled={!canGoPrev}
          onPress={() => setCursor(shiftMonth(cursor.year, cursor.month, -1))}
          style={({ pressed }) => [
            styles.monthButton,
            !canGoPrev && styles.monthButtonDisabled,
            pressed && canGoPrev && styles.pressed,
          ]}
        >
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel(cursor.year, cursor.month)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="下个月"
          hitSlop={hitSlop}
          onPress={() => setCursor(shiftMonth(cursor.year, cursor.month, 1))}
          style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_HEADERS.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week) => (
        <View key={week[0]?.key ?? 'week'} style={styles.weekRow}>
          {week.map((cell) => {
            const cellDate = new Date(
              Number(cell.key.slice(0, 4)),
              Number(cell.key.slice(5, 7)) - 1,
              cell.day,
            );
            const selected = sameDay(cellDate, day);
            const isToday = sameDay(cellDate, today);
            return (
              <Pressable
                key={cell.key}
                accessibilityRole="button"
                accessibilityLabel={formatDayLabel(cellDate)}
                accessibilityState={{ selected, disabled: cell.disabled }}
                disabled={cell.disabled}
                onPress={() => selectDay(cellDate)}
                style={({ pressed }) => [
                  styles.dayCell,
                  isToday && !selected && styles.dayCellToday,
                  selected && styles.dayCellSelected,
                  pressed && !cell.disabled && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    !cell.inMonth && styles.dayTextOutside,
                    cell.disabled && styles.dayTextDisabled,
                    selected && styles.dayTextSelected,
                  ]}
                >
                  {cell.day}
                </Text>
                {isToday ? <View style={[styles.dot, selected && styles.dotSelected]} /> : null}
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.quickDayRow}>
        <Chip label="今天" active={sameDay(day, today)} onPress={() => selectDay(today)} />
        <Chip
          label="明天"
          active={sameDay(day, new Date(today.getTime() + 86_400_000))}
          onPress={() => selectDay(new Date(today.getTime() + 86_400_000))}
        />
        <Chip
          label="一周后"
          active={sameDay(day, new Date(today.getTime() + 7 * 86_400_000))}
          onPress={() => selectDay(new Date(today.getTime() + 7 * 86_400_000))}
        />
      </View>

      <View style={styles.divider} />

      <Text style={styles.blockLabel}>具体时间</Text>
      <View style={styles.timeRow}>
        <Stepper label="小时" value={`${formatTimeLabel(hour, 0).slice(0, 2)} 时`} onStep={(delta) => setHour((prev) => clampHour(prev + delta))} />
        <Stepper
          label="分钟"
          value={`${formatTimeLabel(0, minute).slice(3)} 分`}
          onStep={(delta) => setMinute((prev) => clampMinute(prev + delta * 5))}
        />
      </View>

      <View style={styles.quickTimeRow}>
        {TIME_PRESETS.map((preset) => {
          const active = hour === preset.hour && minute === preset.minute;
          return (
            <Chip
              key={`${preset.hour}-${preset.minute}`}
              label={formatTimeLabel(preset.hour, preset.minute)}
              active={active}
              onPress={() => {
                setHour(preset.hour);
                setMinute(preset.minute);
                setError(null);
              }}
            />
          );
        })}
      </View>

      <View style={styles.summary}>
        <Ionicons name="alarm-outline" size={15} color={colors.primaryDark} />
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {formatShortDayLabel(day)} {formatTimeLabel(hour, minute)} 截止
          </Text>
          <Text style={styles.summarySub} numberOfLines={1}>
            {formatDeadlineHint(iso)}
          </Text>
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthLabel: { ...typography.h3 },
  monthButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonDisabled: { opacity: 0.4 },
  weekRow: { flexDirection: 'row', alignItems: 'center' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    ...typography.tiny,
    fontWeight: '600',
    paddingVertical: spacing.xs,
  },
  dayCell: {
    flex: 1,
    height: 34,
    margin: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.card,
  },
  dayCellSelected: { backgroundColor: colors.primary },
  dayText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  dayTextOutside: { color: colors.textFaint },
  dayTextDisabled: { color: colors.borderStrong },
  dayTextSelected: { color: colors.white, fontWeight: '700' },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 1,
  },
  dotSelected: { backgroundColor: colors.white },
  quickDayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  blockLabel: { ...typography.caption, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  stepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { ...typography.h3, fontSize: 16 },
  quickTimeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  summaryColumn: { flex: 1 },
  summaryTitle: { ...typography.body, fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  summarySub: { ...typography.caption, color: colors.primaryDark },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  pressed: { opacity: 0.7 },
});
