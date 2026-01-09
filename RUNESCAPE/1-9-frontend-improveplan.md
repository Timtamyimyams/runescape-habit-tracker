# RuneScape Habit Tracker - Micro-Interactions Improvement Plan

**Date:** January 9, 2026
**Component:** `RuneScapeHabitTracker.jsx`
**Reviewed By:** Senior Front-End Developer

---

## Executive Summary

This document provides a comprehensive analysis of micro-interactions in the RuneScape Habit Tracker application, identifying areas for improvement to enhance user experience while maintaining the authentic OSRS aesthetic. The review covers hover states, click feedback, transitions, animations, accessibility, and performance considerations.

The current implementation has a solid foundation with XP popups, level-up animations, and timer functionality. However, there are significant opportunities to add tactile feedback, improve animation timing, and create a more responsive, game-like feel that matches player expectations from OSRS.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Hover Interaction Improvements](#2-hover-interaction-improvements)
3. [Click and Tap Feedback](#3-click-and-tap-feedback)
4. [Transition and Animation Enhancements](#4-transition-and-animation-enhancements)
5. [Missing Micro-Interactions](#5-missing-micro-interactions)
6. [Animation Timing and Easing](#6-animation-timing-and-easing)
7. [Tactile Feedback Opportunities](#7-tactile-feedback-opportunities)
8. [Accessibility Considerations](#8-accessibility-considerations)
9. [Performance Considerations](#9-performance-considerations)
10. [Implementation Priority Matrix](#10-implementation-priority-matrix)

---

## 1. Current State Analysis

### 1.1 Existing Micro-Interactions

| Interaction | Current Implementation | Quality |
|-------------|------------------------|---------|
| Skill Box Hover | Tooltip appears, follows cursor | Good |
| Skill Box Click | Opens detail modal | Functional |
| Skill Box Double-Click | Completes habit/toggles timer | Functional, no feedback |
| XP Gain Popup | Float animation, 1s duration | Good |
| Level Up Animation | Bounce scale animation | Good |
| Timer Pulse | Status indicator pulses | Basic |
| Button Hover | No visual change | Missing |
| Modal Open/Close | Instant appearance | Missing transition |
| Focus Window Toggle | Instant show/hide | Missing transition |

### 1.2 Current Animation Definitions (index.css)

```css
/* Existing animations - lines 36-70 */
@keyframes levelUpBounce { /* 0.3s, scale 0.5->1.1->1 */ }
@keyframes xpFloat { /* 1s, translate up + scale + fade */ }
@keyframes pulse { /* opacity 1->0.4->1 */ }
```

### 1.3 Key Issues Identified

1. **No button press feedback** - Buttons lack active/pressed states
2. **Instant modal transitions** - Modals appear/disappear without animation
3. **No skill box hover highlight** - Beyond tooltip, box itself doesn't react
4. **Double-click lacks confirmation** - No immediate visual response
5. **Timer start/stop lacks ceremony** - Important actions feel flat
6. **XP bar has no animation on gain** - Static update, misses opportunity
7. **Missing sound design integration** - No audio feedback architecture
8. **Focus window lacks entrance animation** - Feels disconnected

---

## 2. Hover Interaction Improvements

### 2.1 Skill Box Hover Enhancement

**Current:** Only shows tooltip
**Recommended:** Add subtle glow/highlight to the skill box itself

```jsx
// SkillBox component - add hover state
const [isHovered, setIsHovered] = useState(false);

// Add to style object:
style={{
  // ... existing styles
  transition: 'box-shadow 0.15s ease-out, transform 0.1s ease-out',
  boxShadow: isHovered
    ? 'inset 0 0 8px 2px rgba(255,152,31,0.3), 0 0 4px rgba(255,152,31,0.2)'
    : existingBoxShadow,
  transform: isHovered ? 'translateY(-1px)' : 'none',
}}
onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => { setIsHovered(false); setHoveredHabit(null); }}
```

**OSRS Authenticity Note:** The original OSRS skill panel has a subtle brightness increase on hover. Replicate this with a semi-transparent overlay rather than a glow for stricter authenticity.

### 2.2 Button Hover States

**Current:** No hover feedback on header buttons (+, grid, focus icons)
**Recommended:** Add color shift and subtle scale

```css
/* Add to index.css */
.osrs-icon-btn {
  transition: color 0.1s ease, transform 0.1s ease;
}

.osrs-icon-btn:hover {
  color: #ffff00;
  transform: scale(1.1);
}

.osrs-icon-btn:active {
  transform: scale(0.95);
  color: #cc7a00;
}
```

### 2.3 Empty Slot Hover

**Current:** `opacity: 0.6`, cursor pointer
**Recommended:** Increase opacity and show plus icon more prominently

```jsx
// EmptySlot component improvements
const [isHovered, setIsHovered] = useState(false);

style={{
  opacity: isHovered ? 0.85 : 0.6,
  transition: 'opacity 0.15s ease, box-shadow 0.15s ease',
  boxShadow: isHovered
    ? 'inset 0 0 6px 2px rgba(90,80,64,0.4)'
    : 'inset 0 0 6px 1px rgba(255,255,255,0.08)',
}}
```

### 2.4 Tooltip Entrance Animation

**Current:** Instant appearance
**Recommended:** Quick fade-in with slight slide

```css
@keyframes tooltipEnter {
  from {
    opacity: 0;
    transform: translate(0, -90%);
  }
  to {
    opacity: 1;
    transform: translate(0, -100%);
  }
}

/* Apply to tooltip container */
.skill-tooltip {
  animation: tooltipEnter 0.12s ease-out;
}
```

---

## 3. Click and Tap Feedback

### 3.1 Skill Box Click Feedback

**Issue:** Single click opens modal but no immediate visual confirmation
**Solution:** Brief press animation before modal opens

```jsx
// Add click feedback state
const [isPressed, setIsPressed] = useState(false);

<div
  onMouseDown={() => setIsPressed(true)}
  onMouseUp={() => setIsPressed(false)}
  onMouseLeave={() => setIsPressed(false)}
  style={{
    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
    transition: 'transform 0.08s ease-out',
  }}
>
```

### 3.2 Double-Click Completion Feedback

**Issue:** Double-click to complete habit has no immediate response before XP popup
**Recommended:** Add a brief flash/pulse on the skill box

```jsx
const [flashComplete, setFlashComplete] = useState(false);

const handleDoubleClick = (e) => {
  // Trigger flash immediately
  setFlashComplete(true);
  setTimeout(() => setFlashComplete(false), 200);

  // Then process the action
  if (habit.type === 'timed') {
    // ... existing logic
  }
};

// In style:
boxShadow: flashComplete
  ? 'inset 0 0 12px 4px rgba(0,255,0,0.5), 0 0 8px rgba(0,255,0,0.3)'
  : normalBoxShadow,
```

### 3.3 Button Press States

**Issue:** Buttons (CREATE, COMPLETE, DELETE) lack pressed states
**Current:** Uses `border: 2px outset` for 3D effect
**Recommended:** Invert to `inset` on press

```jsx
// For OSRS-style button press
const [isButtonPressed, setIsButtonPressed] = useState(false);

style={{
  border: isButtonPressed
    ? '2px inset #4a3d22'
    : '2px outset #6b5a3a',
  transform: isButtonPressed ? 'translateY(1px)' : 'none',
}}
onMouseDown={() => setIsButtonPressed(true)}
onMouseUp={() => setIsButtonPressed(false)}
```

### 3.4 Timer Toggle Feedback

**Issue:** Starting/stopping timer needs more ceremony
**Recommended:** Add a brief scale pulse when toggling

```css
@keyframes timerToggle {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Apply when timer state changes */
.timer-active {
  animation: timerToggle 0.25s ease-out;
}
```

---

## 4. Transition and Animation Enhancements

### 4.1 Modal Open/Close Animations

**Current:** Instant show/hide via conditional rendering
**Recommended:** Add enter/exit transitions

```css
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modalExit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Backdrop fade */
@keyframes backdropFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Implementation approach:**
```jsx
// Use state to delay unmount for exit animation
const [isClosing, setIsClosing] = useState(false);

const closeModal = () => {
  setIsClosing(true);
  setTimeout(() => {
    setSelectedHabit(null);
    setIsClosing(false);
  }, 150);
};

// Apply animation class based on state
className={isClosing ? 'modal-exit' : 'modal-enter'}
```

### 4.2 XP Bar Animation

**Current:** Static width change with `transition: width 0.3s ease`
**Recommended:** Add a shimmer effect on XP gain

```css
@keyframes xpBarShimmer {
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.xp-bar-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255,255,255,0.3) 50%,
    transparent 100%
  );
  background-size: 50% 100%;
  animation: xpBarShimmer 0.6s ease-out;
}
```

### 4.3 Focus Window Slide-In

**Current:** Instant appearance
**Recommended:** Slide in from right

```css
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.focus-window {
  animation: slideInRight 0.2s ease-out;
}
```

### 4.4 Heatmap Cell Animation

**Current:** Static grid
**Recommended:** Staggered fade-in on view switch

```jsx
// Add staggered delay based on cell index
const cellDelay = (weekIndex * 7 + dayIndex) * 5; // 5ms per cell

style={{
  animation: `fadeIn 0.3s ease-out ${cellDelay}ms both`,
}}
```

```css
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## 5. Missing Micro-Interactions

### 5.1 Streak Milestone Celebrations

**Missing:** No special feedback for streak milestones (7 days, 30 days, etc.)
**Recommendation:** Add a special animation/popup for streak achievements

```jsx
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

// Check on completion
if (STREAK_MILESTONES.includes(newStreak)) {
  setStreakMilestone({ days: newStreak, habitName: h.name });
}
```

### 5.2 Progress Ring Visualization

**Missing:** No visual indicator of daily progress toward "total level"
**Recommendation:** Add a subtle progress ring around the total level counter

### 5.3 Skill Icon Wiggle on Incomplete

**Missing:** No visual reminder for incomplete daily habits
**Recommendation:** Subtle periodic animation for incomplete habits

```css
@keyframes gentleWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-2deg); }
  75% { transform: rotate(2deg); }
}

.habit-incomplete {
  animation: gentleWiggle 3s ease-in-out infinite;
  animation-delay: calc(var(--habit-index) * 0.2s);
}
```

### 5.4 Confirmation Ripple Effect

**Missing:** No ripple effect on successful actions
**Recommendation:** Add CSS ripple for touch/click feedback

```css
@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}

.ripple-effect::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.2);
  border-radius: inherit;
  transform: scale(0);
  animation: ripple 0.4s ease-out;
}
```

### 5.5 Input Field Focus States

**Missing:** Text input lacks focus indication
**Current:** Basic border styling only

```jsx
// Add focus state styling
style={{
  outline: 'none',
  border: isFocused
    ? '2px solid #ff981f'
    : '2px inset #3d3226',
  transition: 'border-color 0.15s ease',
}}
```

### 5.6 Delete Confirmation Animation

**Missing:** Delete action is immediate with no "danger" feedback
**Recommendation:** Add a shake animation if attempting to delete, require hold or confirm

```css
@keyframes dangerShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
```

---

## 6. Animation Timing and Easing

### 6.1 Recommended Easing Functions

Based on research from [Easings.net](https://easings.net/) and [MDN Animation Timing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function):

| Animation Type | Recommended Easing | Duration |
|----------------|-------------------|----------|
| Hover states | `ease-out` | 100-150ms |
| Button press | `ease-out` | 80-100ms |
| Modal open | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 200-250ms |
| Modal close | `ease-in` | 150ms |
| XP popup float | `ease-out` | 800-1000ms |
| Level up bounce | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | 300ms |
| Tooltip appear | `ease-out` | 100-120ms |
| Focus window slide | `ease-out` | 200ms |
| Shimmer effects | `linear` | 600ms |

### 6.2 OSRS-Specific Timing Considerations

OSRS has a characteristic "snappy" feel due to its tick-based system (0.6s ticks). Animations should feel:
- **Responsive**: Immediate feedback (< 100ms for interactions)
- **Brief**: Most transitions under 300ms
- **Purposeful**: No gratuitous flourishes

### 6.3 Spring Easing for Bouncy Effects

For level-up and celebration animations, use spring easing:

```css
/* Modern spring easing using linear() - Chrome 113+ */
@supports (animation-timing-function: linear(0, 1)) {
  .level-up-popup {
    animation-timing-function: linear(
      0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%,
      0.938 16.7%, 1.017 19.2%, 1.043, 1.064 22.8%,
      1.073 24.5%, 1.078 26.4%, 1.076 28.4%, 1.059 32.4%,
      1.024 38%, 0.999 45%, 0.992 55%, 1 100%
    );
  }
}
```

### 6.4 Current Animation Timing Audit

| Animation | Current | Recommended |
|-----------|---------|-------------|
| levelUpBounce | 0.3s (implied, no duration in keyframes) | 0.35s with spring easing |
| xpFloat | 1s | 0.8s (feels snappier) |
| pulse | 1s infinite | 1.5s infinite (less frantic) |

---

## 7. Tactile Feedback Opportunities

### 7.1 Sound Design Architecture

**Current:** No audio feedback
**Recommendation:** Implement optional sound effects

```jsx
// Create a sound manager
const useSoundEffects = () => {
  const [enabled, setEnabled] = useState(true);

  const sounds = {
    click: new Audio('/sounds/click.mp3'),
    complete: new Audio('/sounds/complete.mp3'),
    levelUp: new Audio('/sounds/levelup.mp3'),
    timerStart: new Audio('/sounds/timer-start.mp3'),
    timerStop: new Audio('/sounds/timer-stop.mp3'),
  };

  const play = (soundName) => {
    if (enabled && sounds[soundName]) {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(() => {});
    }
  };

  return { play, enabled, setEnabled };
};
```

**OSRS-Authentic Sounds:**
- Click: Short, low "thunk"
- Complete: Quick ascending ding
- Level Up: Triumphant fanfare (shorter version of OSRS level up)
- Timer: Subtle tick/tock

### 7.2 Haptic Feedback (Mobile)

For mobile users, add vibration feedback:

```jsx
const triggerHaptic = (pattern = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [25],
      heavy: [50],
      success: [10, 50, 10],
      levelUp: [50, 30, 100],
    };
    navigator.vibrate(patterns[pattern] || [10]);
  }
};
```

### 7.3 Visual Haptics (Screenshake)

For major events like level-up:

```css
@keyframes screenShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-2px, -1px); }
  20% { transform: translate(2px, 1px); }
  30% { transform: translate(-1px, 2px); }
  40% { transform: translate(1px, -1px); }
  50% { transform: translate(-2px, 1px); }
}

.screen-shake {
  animation: screenShake 0.3s ease-out;
}
```

### 7.4 Particle Effects

For XP gain and level-up, consider adding canvas-based particle effects:

```jsx
// Simple particle burst on XP gain
const createParticles = (x, y, color) => {
  const particles = [];
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4 - 2,
      life: 1,
      color,
    });
  }
  return particles;
};
```

---

## 8. Accessibility Considerations

### 8.1 Reduced Motion Support

**Critical Requirement:** Respect `prefers-reduced-motion` per [WCAG 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)

```css
/* Add to index.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Keep essential state changes visible */
  .xp-bar {
    transition: width 0.01ms !important;
  }
}
```

### 8.2 React Hook for Motion Preference

```jsx
const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

// Usage
const prefersReducedMotion = usePrefersReducedMotion();

// Conditionally apply animations
style={{
  animation: prefersReducedMotion ? 'none' : 'levelUpBounce 0.3s ease-out',
}}
```

### 8.3 Focus Indicators

**Issue:** Custom buttons lack visible focus indicators
**Requirement:** Keyboard users must see focus state

```css
button:focus-visible {
  outline: 2px solid #ffff00;
  outline-offset: 2px;
}

/* For styled buttons, add a visible focus ring */
.osrs-button:focus-visible {
  box-shadow: 0 0 0 2px #000, 0 0 0 4px #ffff00;
}
```

### 8.4 Animation Duration Limits

Per WCAG guidelines:
- Avoid animations longer than 5 seconds
- No content should flash more than 3 times per second
- Current `pulse` animation (1s, infinite) is acceptable but should have a pause option

### 8.5 Provide Pause Controls

```jsx
// Add animation toggle to settings
const [animationsEnabled, setAnimationsEnabled] = useState(true);

// Apply globally via CSS custom property
document.documentElement.style.setProperty(
  '--animation-state',
  animationsEnabled ? 'running' : 'paused'
);
```

```css
.animated-element {
  animation-play-state: var(--animation-state, running);
}
```

---

## 9. Performance Considerations

### 9.1 GPU-Accelerated Properties

**Best Practice:** Only animate `transform` and `opacity` for smooth 60fps animations.

Based on [MDN Performance Guide](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance):

**Avoid animating:**
- `width`, `height`, `margin`, `padding` (trigger layout)
- `background-color`, `border` (trigger paint)

**Prefer animating:**
- `transform: translate()`, `scale()`, `rotate()`
- `opacity`

### 9.2 Current Code Audit

**Issues Found:**

1. **Line 1629:** XP bar uses `transition: width 0.3s` - triggers layout
   ```jsx
   // Change from:
   width: `${getXpBarWidth(selectedHabit)}%`

   // To:
   transform: `scaleX(${getXpBarWidth(selectedHabit) / 100})`
   transformOrigin: 'left'
   ```

2. **Tooltip positioning:** Uses `left` and `top` properties
   - Consider using `transform: translate()` for smoother movement

### 9.3 Will-Change Optimization

Use sparingly for known animated elements:

```css
.modal-content {
  will-change: transform, opacity;
}

.xp-popup {
  will-change: transform, opacity;
}

/* Remove after animation completes to free memory */
```

### 9.4 React Re-render Optimization

**Issue:** Timer causes full component re-render every second (line 290-296)

```jsx
// Current problematic pattern
const [, setTick] = useState(0);
useEffect(() => {
  if (hasRunningTimer) {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }
}, [hasRunningTimer]);
```

**Recommendation:** Use `useRef` for timer state and only update displayed elements:

```jsx
const timerRef = useRef(null);
const [timerDisplay, setTimerDisplay] = useState('0:00');

useEffect(() => {
  if (hasRunningTimer) {
    const updateTimer = () => {
      // Only update the specific timer displays, not trigger full re-render
      requestAnimationFrame(() => {
        // Update only timer-specific DOM elements
      });
    };
    timerRef.current = setInterval(updateTimer, 1000);
    return () => clearInterval(timerRef.current);
  }
}, [hasRunningTimer]);
```

### 9.5 Animation Frame Budget

For smooth 60fps: ~16.67ms per frame

- Keep animations simple
- Batch DOM reads/writes
- Use CSS animations over JS where possible
- Debounce rapid updates

### 9.6 Lazy Loading Considerations

For the heatmap with many cells (26 weeks x 7 days = 182 cells):
- Consider virtualizing off-screen cells
- Use `content-visibility: auto` for cells outside viewport

```css
.heatmap-week {
  content-visibility: auto;
  contain-intrinsic-size: 5px 35px;
}
```

---

## 10. Implementation Priority Matrix

### Priority 1: Quick Wins (1-2 hours each)

| Task | Impact | Effort | File |
|------|--------|--------|------|
| Add button press states | High | Low | JSX inline styles |
| Add hover glow to skill boxes | High | Low | SkillBox component |
| Implement reduced motion support | Critical | Low | index.css |
| Add focus-visible outlines | Critical | Low | index.css |
| Improve tooltip entrance animation | Medium | Low | index.css |

### Priority 2: Medium Effort (2-4 hours each)

| Task | Impact | Effort | File |
|------|--------|--------|------|
| Modal enter/exit animations | High | Medium | JSX + CSS |
| Focus window slide animation | Medium | Low | JSX + CSS |
| XP bar shimmer effect | Medium | Medium | index.css + JSX |
| Double-click flash feedback | High | Medium | SkillBox component |
| Heatmap staggered animation | Low | Medium | Heatmap component |

### Priority 3: Larger Features (4+ hours)

| Task | Impact | Effort | File |
|------|--------|--------|------|
| Sound effects system | High | High | New hook + assets |
| Haptic feedback | Medium | Medium | New utility |
| Streak milestone celebrations | High | Medium | New component |
| Particle effects | Medium | High | New canvas component |
| Timer re-render optimization | Medium | High | Refactor required |

### Priority 4: Nice to Have

| Task | Impact | Effort |
|------|--------|--------|
| Screen shake on level up | Low | Low |
| Incomplete habit wiggle | Low | Low |
| Delete confirmation animation | Medium | Medium |
| Progress ring visualization | Medium | High |

---

## Appendix A: CSS Animation Library

Complete CSS to add to `index.css`:

```css
/* ==========================================
   MICRO-INTERACTION ANIMATIONS
   ========================================== */

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Tooltip Entrance */
@keyframes tooltipEnter {
  from {
    opacity: 0;
    transform: translate(0, -90%);
  }
  to {
    opacity: 1;
    transform: translate(0, -100%);
  }
}

/* Modal Animations */
@keyframes modalEnter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modalExit {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes backdropFade {
  from { background: rgba(0,0,0,0); }
  to { background: rgba(0,0,0,0.8); }
}

/* XP Bar Shimmer */
@keyframes xpBarShimmer {
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
}

/* Focus Window Slide */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Cell Fade In (for heatmap) */
@keyframes cellFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Timer Toggle Pulse */
@keyframes timerToggle {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Completion Flash */
@keyframes completionFlash {
  0% { box-shadow: inset 0 0 0 0 rgba(0,255,0,0); }
  50% { box-shadow: inset 0 0 12px 4px rgba(0,255,0,0.5); }
  100% { box-shadow: inset 0 0 0 0 rgba(0,255,0,0); }
}

/* Gentle Wiggle (incomplete reminder) */
@keyframes gentleWiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-1.5deg); }
  75% { transform: rotate(1.5deg); }
}

/* Danger Shake */
@keyframes dangerShake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

/* Screen Shake (level up) */
@keyframes screenShake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-2px, -1px); }
  20% { transform: translate(2px, 1px); }
  30% { transform: translate(-1px, 2px); }
  40% { transform: translate(1px, -1px); }
  50% { transform: translate(-2px, 1px); }
}

/* Ripple Effect */
@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}

/* Focus Visible States */
button:focus-visible,
input:focus-visible {
  outline: 2px solid #ffff00;
  outline-offset: 2px;
}

/* Improved pulse (slower, less frantic) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Appendix B: Research Sources

- [Micro Interactions 2025: Best Practices](https://www.stan.vision/journal/micro-interactions-2025-in-web-design)
- [10 Best Microinteraction Examples](https://www.designstudiouiux.com/blog/micro-interactions-examples/)
- [The Role of Micro-interactions in Modern UX](https://www.interaction-design.org/literature/article/micro-interactions-ux)
- [7 UI patterns from designing a habit-tracking app](https://uxdesign.cc/micro-habits-ui-design-patterns-4b2b7c1b4f07)
- [OSRS Wiki - Interface](https://oldschool.runescape.wiki/w/Interface)
- [Easings.net - Easing Functions Cheat Sheet](https://easings.net/)
- [MDN - Animation Timing Function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function)
- [CSS Linear Easing Function (Chrome)](https://developer.chrome.com/docs/css-ui/css-linear-easing-function)
- [WCAG 2.3.3 - Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- [Using CSS prefers-reduced-motion](https://www.w3.org/WAI/WCAG21/Techniques/css/C39)
- [Accessible Animation Best Practices](https://www.sarahdarr.com/post/accessible-animation-best-practices)
- [CSS and JavaScript Animation Performance (MDN)](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance)
- [Animation Performance in React](https://stevekinney.com/courses/react-performance/animation-performance)

---

## Conclusion

The RuneScape Habit Tracker has a solid foundation with authentic OSRS styling and core functionality. By implementing the micro-interactions outlined in this document, the application can achieve a more polished, responsive, and game-like feel that will increase user engagement and satisfaction.

**Key Takeaways:**

1. **Start with accessibility** - Implement reduced motion support immediately
2. **Focus on feedback** - Every user action should have immediate visual confirmation
3. **Keep animations brief** - 100-300ms for most interactions
4. **Use GPU-friendly properties** - Animate only transform and opacity
5. **Respect OSRS aesthetic** - Avoid overly modern flourishes; keep it snappy and pixelated

The recommended implementation order prioritizes quick wins that have the highest user impact with minimal development effort, followed by features that require more architectural consideration.
