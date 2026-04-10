import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, BorderRadius, Spacing, FontSize, MONO_FONT } from '@/constants/theme';

interface TimerOverlayProps {
  visible: boolean;
  minutes: number;
  stepNumber: number;
  onClose: () => void;
}

export default function TimerOverlay({ visible, minutes, stepNumber, onClose }: TimerOverlayProps) {
  const totalSeconds = minutes * 60;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      setRemaining(totalSeconds);
      setIsRunning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, totalSeconds]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining]);

  const handleStartPause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (remaining === 0) {
      setRemaining(totalSeconds);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  }, [isRunning, remaining, totalSeconds]);

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  const handleClose = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onClose();
  }, [onClose]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isDone = remaining === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.stepLabel}>Step {stepNumber} Timer</Text>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.timerCircle}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { height: `${progress * 100}%` }]} />
            </View>
            <Text style={[styles.time, isDone && styles.timeDone]}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
            {isDone ? (
              <Text style={styles.doneLabel}>Done!</Text>
            ) : null}
          </View>

          <View style={styles.controls}>
            <Pressable
              onPress={handleReset}
              style={({ pressed }) => [styles.controlBtn, styles.resetBtn, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="refresh" size={20} color={Colors.textSecondary} />
            </Pressable>

            <Pressable
              onPress={handleStartPause}
              style={({ pressed }) => [
                styles.controlBtn,
                styles.playBtn,
                isDone && styles.restartBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={isDone ? 'refresh' : isRunning ? 'pause' : 'play'}
                size={28}
                color={Colors.textPrimary}
              />
            </Pressable>

            <View style={styles.controlBtn} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  stepLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'DMSans_600SemiBold',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: Colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
  },
  progressFill: {
    backgroundColor: Colors.primary + '20',
    width: '100%',
  },
  time: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: MONO_FONT,
    zIndex: 1,
  },
  timeDone: {
    color: Colors.accent,
  },
  doneLabel: {
    fontSize: FontSize.lg,
    color: Colors.accent,
    fontFamily: MONO_FONT,
    marginTop: Spacing.xs,
    zIndex: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    width: '100%',
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    backgroundColor: Colors.backgroundElevated,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
  },
  restartBtn: {
    backgroundColor: Colors.accent,
  },
});
