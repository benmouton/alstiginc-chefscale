import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

type ReviewPromptState = {
  firstLaunchAt: number | null;
  completionCount: number;
  lastPromptAttemptAt: number | null;
};

const STORAGE_KEY = '@chefscale_review_prompt_state_v1';
const MIN_COMPLETIONS = 3;
const MIN_DAYS_SINCE_FIRST_LAUNCH = 14;
const COOLDOWN_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
let sessionCompletionCount = 0;

function getDefaultState(): ReviewPromptState {
  return {
    firstLaunchAt: null,
    completionCount: 0,
    lastPromptAttemptAt: null,
  };
}

async function loadState(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultState();
    }

    const parsed = JSON.parse(raw) as Partial<ReviewPromptState>;
    return {
      firstLaunchAt: typeof parsed.firstLaunchAt === 'number' ? parsed.firstLaunchAt : null,
      completionCount: typeof parsed.completionCount === 'number' ? parsed.completionCount : 0,
      lastPromptAttemptAt: typeof parsed.lastPromptAttemptAt === 'number' ? parsed.lastPromptAttemptAt : null,
    };
  } catch {
    return getDefaultState();
  }
}

async function saveState(state: ReviewPromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // No-op: prompting should never block recipe workflows.
  }
}

function isEligible(state: ReviewPromptState, now: number): boolean {
  if (sessionCompletionCount < 1) {
    return false;
  }

  if (state.completionCount < MIN_COMPLETIONS || !state.firstLaunchAt) {
    return false;
  }

  if (now - state.firstLaunchAt < MIN_DAYS_SINCE_FIRST_LAUNCH * DAY_MS) {
    return false;
  }

  if (state.lastPromptAttemptAt && now - state.lastPromptAttemptAt < COOLDOWN_DAYS * DAY_MS) {
    return false;
  }

  return true;
}

export async function trackPositiveCompletionAndPromptReview(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  sessionCompletionCount += 1;
  const now = Date.now();
  const state = await loadState();

  state.completionCount += 1;
  if (!state.firstLaunchAt) {
    state.firstLaunchAt = now;
  }

  if (!isEligible(state, now)) {
    await saveState(state);
    return false;
  }

  try {
    const available = await StoreReview.isAvailableAsync();
    if (!available) {
      await saveState(state);
      return false;
    }

    state.lastPromptAttemptAt = now;
    await saveState(state);
    await StoreReview.requestReview();
    return true;
  } catch {
    await saveState(state);
    return false;
  }
}
