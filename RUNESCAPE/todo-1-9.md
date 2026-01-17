# RuneScape Habit Tracker - Micro-Interactions Todo

**Date:** January 9, 2026

---

## Priority 1: Quick Wins (1-2 hours each) ✅

### Accessibility (Critical)
- [x] Add `prefers-reduced-motion` CSS media query to `index.css`
- [x] Add `focus-visible` outline styles for all buttons and inputs
- [x] Create `usePrefersReducedMotion` React hook
- [x] Add animation pause toggle to settings

### Hover States
- [x] Add hover glow effect to SkillBox component
- [x] Add `isHovered` state to SkillBox
- [x] Add hover states to header icon buttons (+, grid, focus)
- [x] Improve EmptySlot hover feedback (opacity + glow)
- [x] Add tooltip entrance animation (fade + slide)

### Button Press States
- [x] Add press state to CREATE button (outset → inset border)
- [x] Add press state to COMPLETE button
- [x] Add press state to DELETE button
- [x] Add press state to START/STOP timer buttons
- [x] Add press feedback to SkillBox on click (scale 0.97)

---

## Priority 2: Medium Effort (2-4 hours each) ✅

### Modal Animations
- [x] Create `@keyframes modalEnter` animation
- [x] Create `@keyframes modalExit` animation
- [x] Create `@keyframes backdropFade` animation
- [x] Implement delayed unmount for exit animation
- [x] Add `isClosing` state management for modals

### Click Feedback
- [x] Add double-click completion flash effect
- [x] Create `flashComplete` state in SkillBox
- [x] Add green glow box-shadow on completion

### Timer Improvements
- [x] Add timer toggle pulse animation
- [x] Create `@keyframes timerToggle`
- [x] Improve timer start/stop visual ceremony

### Focus Window
- [x] Add slide-in animation from right
- [x] Create `@keyframes slideInRight`

### XP Bar
- [x] Add shimmer effect on XP gain
- [x] Create `@keyframes xpBarShimmer`
- [x] Change XP bar from `width` to `transform: scaleX()` (GPU optimization)

### Heatmap
- [x] Add staggered fade-in animation for cells
- [x] Calculate delay based on cell index
- [x] Create `@keyframes cellFadeIn`

---

## Priority 3: Larger Features (4+ hours) ✅

### Sound Effects System
- [x] Create `useSoundEffects` hook
- [x] Add click sound
- [x] Add complete sound
- [x] Add level-up sound
- [x] Add timer start/stop sounds
- [x] Add sound toggle in settings
- [x] Source/create OSRS-style sound assets (oscillator-based)

### Haptic Feedback (Mobile)
- [x] Create `triggerHaptic` utility function
- [x] Add vibration patterns (light, medium, heavy, success, levelUp)
- [x] Integrate haptics on completion
- [x] Integrate haptics on level-up

### Streak Celebrations
- [x] Define streak milestones array (7, 14, 30, 60, 90, 180, 365)
- [x] Create streak milestone popup component
- [x] Add streak milestone state management
- [x] Design streak celebration animation

### Particle Effects
- [x] Create CSS-based particle system
- [x] Add particle burst on XP gain
- [x] Add particle effects on level-up

### Performance Optimization
- [x] Refactor timer to use `useRef` instead of state
- [x] Optimize re-renders (only update timer display elements)
- [x] Add `will-change` to modal and XP popup
- [x] Add `content-visibility: auto` to heatmap cells

---

## Priority 4: Nice to Have ✅

### Visual Polish
- [x] Add screen shake on level-up
- [x] ~~Add incomplete habit wiggle reminder animation~~ (removed)
- [x] Add ripple effect on successful actions
- [x] Add input field focus state styling

### Delete UX
- [x] Add danger shake animation before delete
- [x] Consider hold-to-delete or confirmation step

### Progress Visualization
- [x] Add progress ring around total level counter
- [x] Show daily completion percentage

---

## CSS Animations to Add (index.css)

- [x] `@keyframes tooltipEnter`
- [x] `@keyframes modalEnter`
- [x] `@keyframes modalExit`
- [x] `@keyframes backdropFade`
- [x] `@keyframes xpBarShimmer`
- [x] `@keyframes slideInRight`
- [x] `@keyframes cellFadeIn`
- [x] `@keyframes timerToggle`
- [x] `@keyframes completionFlash`
- [x] `@keyframes gentleWiggle`
- [x] `@keyframes dangerShake`
- [x] `@keyframes screenShake`
- [x] `@keyframes ripple`
- [x] Update `@keyframes pulse` (slower: 1.5s)

---

## Animation Timing Reference

| Animation Type | Easing | Duration |
|----------------|--------|----------|
| Hover states | `ease-out` | 100-150ms |
| Button press | `ease-out` | 80-100ms |
| Modal open | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 200-250ms |
| Modal close | `ease-in` | 150ms |
| XP popup float | `ease-out` | 800ms |
| Level up bounce | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | 300ms |
| Tooltip appear | `ease-out` | 100-120ms |
| Focus window slide | `ease-out` | 200ms |
| Shimmer effects | `linear` | 600ms |

---

## Files to Modify

- [x] `src/RuneScapeHabitTracker.jsx` - Component logic and inline styles
- [x] `src/index.css` - Animation keyframes and global styles
- [x] Create `src/hooks/useSoundEffects.js` (new)
- [x] Create `src/hooks/usePrefersReducedMotion.js` (new)
- [x] Create `src/utils/haptics.js` (new)
- [x] Audio handled via Web Audio API oscillators (no external files needed)

---

## Completion Tracking

| Priority | Total Tasks | Completed |
|----------|-------------|-----------|
| P1 - Quick Wins | 14 | 14 |
| P2 - Medium | 17 | 17 |
| P3 - Larger | 18 | 18 |
| P4 - Nice to Have | 8 | 8 |
| CSS Animations | 14 | 14 |
| **Total** | **71** | **71** |
