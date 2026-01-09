/**
 * Haptic feedback utility for mobile devices
 * Uses the Vibration API where available
 */

// Vibration patterns (in milliseconds)
const PATTERNS = {
  light: [10],
  medium: [25],
  heavy: [50],
  success: [10, 50, 10],
  error: [50, 30, 50, 30, 50],
  levelUp: [50, 30, 100, 30, 50],
  milestone: [30, 20, 30, 20, 100, 50, 100],
  click: [5],
  timerStart: [20, 10, 20],
  timerStop: [30, 15, 15],
};

/**
 * Check if haptic feedback is available
 */
export const isHapticAvailable = () => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Trigger haptic feedback
 * @param {string|number[]} pattern - Pattern name or custom vibration array
 */
export const triggerHaptic = (pattern = 'light') => {
  if (!isHapticAvailable()) return false;

  try {
    const vibrationPattern = typeof pattern === 'string'
      ? PATTERNS[pattern] || PATTERNS.light
      : pattern;

    navigator.vibrate(vibrationPattern);
    return true;
  } catch (err) {
    console.debug('Haptic feedback failed:', err);
    return false;
  }
};

/**
 * Stop any ongoing vibration
 */
export const stopHaptic = () => {
  if (!isHapticAvailable()) return;
  navigator.vibrate(0);
};

/**
 * React hook for haptic feedback
 */
export const useHaptics = () => {
  const available = isHapticAvailable();

  return {
    available,
    trigger: triggerHaptic,
    stop: stopHaptic,
    patterns: PATTERNS,
  };
};

export default {
  triggerHaptic,
  stopHaptic,
  isHapticAvailable,
  useHaptics,
  PATTERNS,
};
