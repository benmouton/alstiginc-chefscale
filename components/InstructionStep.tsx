import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface InstructionStepProps {
  stepNumber: number;
  text: string;
  timerMinutes?: number | null;
  temperature?: string;
  photoUri?: string;
  onTimerPress?: () => void;
}

export default function InstructionStep({
  stepNumber,
  text,
  timerMinutes,
  temperature,
  photoUri,
  onTimerPress,
}: InstructionStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{stepNumber}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>{text}</Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.stepPhoto} />
        ) : null}

        {(timerMinutes || temperature) ? (
          <View style={styles.badges}>
            {timerMinutes ? (
              <Pressable
                onPress={onTimerPress}
                style={({ pressed }) => [styles.badge, styles.timerBadge, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="timer-outline" size={14} color={Colors.primary} />
                <Text style={styles.timerText}>{timerMinutes} min</Text>
              </Pressable>
            ) : null}
            {temperature ? (
              <View style={[styles.badge, styles.tempBadge]}>
                <Ionicons name="thermometer-outline" size={14} color={Colors.accent} />
                <Text style={styles.tempText}>{temperature}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  numberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  number: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'DMSans_700Bold',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
  },
  stepPhoto: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  timerBadge: {
    backgroundColor: Colors.primary + '20',
  },
  tempBadge: {
    backgroundColor: Colors.accent + '20',
  },
  timerText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontFamily: 'DMSans_600SemiBold',
  },
  tempText: {
    fontSize: FontSize.xs,
    color: Colors.accent,
    fontFamily: 'DMSans_600SemiBold',
  },
});
