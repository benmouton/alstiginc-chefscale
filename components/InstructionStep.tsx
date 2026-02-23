import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Spacing, FontSize } from '@/constants/theme';

interface InstructionStepProps {
  stepNumber: number;
  text: string;
}

export default function InstructionStep({ stepNumber, text }: InstructionStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{stepNumber}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
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
    fontFamily: 'Inter_700Bold',
  },
  text: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
});
