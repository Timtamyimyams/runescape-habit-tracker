import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Trash2, Grid3X3, LayoutGrid, Target, Volume2, VolumeX, Sparkles, Pause, LogIn } from 'lucide-react';
import useSoundEffects from './hooks/useSoundEffects';
import usePrefersReducedMotion from './hooks/usePrefersReducedMotion';
import { triggerHaptic } from './utils/haptics';
import { useAuth } from './context/AuthContext';
import { LoginModal, UserMenu } from './components/Auth';

const NATIVE_WIDTH = 204;

// Streak milestones for celebrations
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];
const NATIVE_HEIGHT = 275;

// RuneScape XP formula: sum of floor((n + 300 * 2^(n/7)) / 4) for n=1 to level-1
// Total XP to level 99 = 13,034,431
// Level 92 is ~halfway to 99 in total XP
const xpForLevel = (level) => {
  if (level <= 1) return 0;
  let total = 0;
  for (let n = 1; n < level; n++) {
    total += Math.floor((n + 300 * Math.pow(2, n / 7)) / 4);
  }
  return Math.floor(total);
};

// Pre-calculate XP table for levels 1-99
const XP_TABLE = Array.from({ length: 100 }, (_, i) => xpForLevel(i));

// Get level from XP
const getLevelFromXp = (xp) => {
  for (let level = 99; level >= 1; level--) {
    if (xp >= XP_TABLE[level]) return level;
  }
  return 1;
};

const RuneScapeHabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', icon: '1', type: 'daily' });
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [totalLevel, setTotalLevel] = useState(0);
  const [scale, setScale] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoveredHabit, setHoveredHabit] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [levelUpInfo, setLevelUpInfo] = useState(null); // { name, icon, level }
  const [xpPopup, setXpPopup] = useState(null); // { xp, x, y }
  const [showFocusWindow, setShowFocusWindow] = useState(false);
  const [focusedSkills, setFocusedSkills] = useState([]); // Array of habit IDs in focus mode
  const [isAddModalClosing, setIsAddModalClosing] = useState(false);
  const [isDetailModalClosing, setIsDetailModalClosing] = useState(false);
  const [isFocusWindowClosing, setIsFocusWindowClosing] = useState(false);
  const [xpBarShimmer, setXpBarShimmer] = useState(false); // Trigger shimmer on XP gain
  const [streakMilestone, setStreakMilestone] = useState(null); // { days, habitName }
  const [particles, setParticles] = useState([]); // Array of particle objects
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Auth hook
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Sound effects hook
  const { play: playSound, enabled: soundEnabled, toggle: toggleSound } = useSoundEffects();

  // Reduced motion preference
  const prefersReducedMotion = usePrefersReducedMotion();

  // Animations toggle (respects system preference but can be overridden)
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('animations-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('animations-enabled', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Effective animations state (disabled if user preference OR toggle is off)
  const shouldAnimate = animationsEnabled && !prefersReducedMotion;

  // Ref for particle container
  const particleContainerRef = useRef(null);

  // OSRS-style skill icons (using numbers as placeholders - replace with actual sprites)
  const skillIcons = [
    { id: '1', label: 'Attack', emoji: '⚔️' },
    { id: '2', label: 'Strength', emoji: '💪' },
    { id: '3', label: 'Defence', emoji: '🛡️' },
    { id: '4', label: 'Ranged', emoji: '🏹' },
    { id: '5', label: 'Prayer', emoji: '✨' },
    { id: '6', label: 'Magic', emoji: '🔮' },
    { id: '7', label: 'Runecraft', emoji: '🔵' },
    { id: '8', label: 'Construction', emoji: '🏠' },
    { id: '9', label: 'Hitpoints', emoji: '❤️' },
    { id: '10', label: 'Agility', emoji: '🏃' },
    { id: '11', label: 'Herblore', emoji: '🌿' },
    { id: '12', label: 'Thieving', emoji: '🎭' },
    { id: '13', label: 'Crafting', emoji: '✂️' },
    { id: '14', label: 'Fletching', emoji: '🪶' },
    { id: '15', label: 'Slayer', emoji: '💀' },
    { id: '16', label: 'Hunter', emoji: '🦊' },
    { id: '17', label: 'Mining', emoji: '⛏️' },
    { id: '18', label: 'Smithing', emoji: '🔨' },
    { id: '19', label: 'Fishing', emoji: '🎣' },
    { id: '20', label: 'Cooking', emoji: '🍖' },
    { id: '21', label: 'Firemaking', emoji: '🔥' },
    { id: '22', label: 'Woodcutting', emoji: '🪓' },
    { id: '23', label: 'Farming', emoji: '🌾' },
  ];

  useEffect(() => {
    const updateScale = () => {
      const scaleX = (window.innerWidth * 0.9) / NATIVE_WIDTH;
      const scaleY = (window.innerHeight * 0.9) / NATIVE_HEIGHT;
      setScale(Math.min(scaleX, scaleY, 3));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    const total = habits.reduce((sum, h) => sum + h.level, 0);
    setTotalLevel(total);
  }, [habits]);

  // Sync selectedHabit with habits when habits change
  useEffect(() => {
    if (selectedHabit) {
      const updated = habits.find(h => h.id === selectedHabit.id);
      if (updated) {
        setSelectedHabit(updated);
      } else {
        // Habit was deleted
        setSelectedHabit(null);
      }
    }
  }, [habits]);

  const loadHabits = async () => {
    try {
      const saved = localStorage.getItem('habits-data');
      if (saved) {
        setHabits(JSON.parse(saved));
      }
    } catch (error) {
      console.log('No saved habits yet');
    }
  };

  const saveHabits = (updatedHabits) => {
    try {
      localStorage.setItem('habits-data', JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    } catch (error) {
      console.error('Failed to save habits');
    }
  };

  const getIconEmoji = (iconId) => {
    const icon = skillIcons.find(i => i.id === iconId);
    return icon ? icon.emoji : '⚔️';
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) return;

    const habit = {
      id: Date.now(),
      name: newHabit.name,
      icon: newHabit.icon,
      type: newHabit.type, // 'daily' or 'timed'
      level: 1,
      xp: 0,
      xpToNext: XP_TABLE[2], // XP needed for level 2
      streak: 0,
      lastCompleted: null,
      history: [],
      // Timer fields for timed skills
      timerStart: null, // timestamp when timer started
      totalTimeToday: 0, // accumulated ms for today
    };

    saveHabits([...habits, habit]);
    setNewHabit({ name: '', icon: '1', type: 'daily' });
    setShowAddModal(false);
  };

  const isCompletedToday = (habit) => {
    const today = new Date().toDateString();
    return habit.lastCompleted === today;
  };

  const completeHabit = (habitId, e) => {
    e.stopPropagation();
    const today = new Date().toDateString();
    let leveledUp = null;
    let xpGained = 0;
    let newStreak = 0;
    let habitName = '';

    const updated = habits.map(h => {
      if (h.id === habitId) {
        if (h.lastCompleted === today) return h;

        // XP gain scales with level (more XP at higher levels feels rewarding)
        const xpGain = Math.floor(50 + (h.level * 10) + (h.level * h.level * 0.5));
        xpGained = xpGain;
        habitName = h.name;
        const newXp = h.xp + xpGain;
        const newLevel = Math.min(99, getLevelFromXp(newXp));
        const xpForNextLevel = newLevel < 99 ? XP_TABLE[newLevel + 1] : XP_TABLE[99];

        // Check for level up
        if (newLevel > h.level) {
          leveledUp = { name: h.name, icon: h.icon, level: newLevel };
        }

        // Calculate new streak
        newStreak = h.lastCompleted === new Date(Date.now() - 86400000).toDateString() ? h.streak + 1 : 1;

        return {
          ...h,
          xp: newXp,
          level: newLevel,
          xpToNext: Math.max(0, xpForNextLevel - newXp),
          streak: newStreak,
          lastCompleted: today,
          history: [...h.history, { date: today, xp: xpGain }]
        };
      }
      return h;
    });

    saveHabits(updated);

    // Play sound and haptic feedback
    playSound('complete');
    triggerHaptic('success');

    // Show XP popup near cursor and trigger shimmer
    if (xpGained > 0) {
      setXpPopup({ xp: xpGained, x: e.clientX, y: e.clientY });
      setXpBarShimmer(true);
      // Spawn particles at click position
      spawnParticles(e.clientX, e.clientY, 6, '#00ff00');
      // Auto-dismiss after animation
      setTimeout(() => setXpPopup(null), 1000);
      setTimeout(() => setXpBarShimmer(false), 500);
    }

    // Check for streak milestone
    if (STREAK_MILESTONES.includes(newStreak)) {
      playSound('milestone');
      triggerHaptic('milestone');
      setStreakMilestone({ days: newStreak, habitName });
      // Auto-dismiss after animation
      setTimeout(() => setStreakMilestone(null), 3000);
    }

    // Show level up popup if leveled up
    if (leveledUp) {
      playSound('levelUp');
      triggerHaptic('levelUp');
      // Spawn more particles for level up
      spawnParticles(e.clientX, e.clientY, 16, '#ffff00', true);
      setLevelUpInfo(leveledUp);
    }
  };

  // Timer functions for timed skills
  const startTimer = (habitId) => {
    playSound('timerStart');
    triggerHaptic('timerStart');

    const updated = habits.map(h => {
      if (h.id === habitId && h.type === 'timed') {
        return { ...h, timerStart: Date.now() };
      }
      return h;
    });
    saveHabits(updated);
  };

  const stopTimer = (habitId, e) => {
    playSound('timerStop');
    triggerHaptic('timerStop');

    const today = new Date().toDateString();
    let xpGained = 0;
    let leveledUp = null;

    const updated = habits.map(h => {
      if (h.id === habitId && h.type === 'timed' && h.timerStart) {
        const elapsed = Date.now() - h.timerStart;
        const newTotalTime = (h.totalTimeToday || 0) + elapsed;

        // XP calculation: base 10 XP per minute + level scaling
        const minutes = elapsed / 60000;
        const xpGain = Math.floor(minutes * (10 + h.level * 2));
        xpGained = xpGain;

        if (xpGain > 0) {
          const newXp = h.xp + xpGain;
          const newLevel = Math.min(99, getLevelFromXp(newXp));
          const xpForNextLevel = newLevel < 99 ? XP_TABLE[newLevel + 1] : XP_TABLE[99];

          if (newLevel > h.level) {
            leveledUp = { name: h.name, icon: h.icon, level: newLevel };
          }

          return {
            ...h,
            timerStart: null,
            totalTimeToday: newTotalTime,
            xp: newXp,
            level: newLevel,
            xpToNext: Math.max(0, xpForNextLevel - newXp),
            lastCompleted: today,
            history: [...h.history, { date: today, xp: xpGain, duration: elapsed }]
          };
        }

        return { ...h, timerStart: null, totalTimeToday: newTotalTime };
      }
      return h;
    });

    saveHabits(updated);

    // Show XP popup and trigger shimmer
    if (xpGained > 0 && e) {
      setXpPopup({ xp: xpGained, x: e.clientX, y: e.clientY });
      setXpBarShimmer(true);
      // Spawn particles
      spawnParticles(e.clientX, e.clientY, 6, '#ff9900');
      setTimeout(() => setXpPopup(null), 1000);
      setTimeout(() => setXpBarShimmer(false), 500);
    }

    if (leveledUp) {
      playSound('levelUp');
      triggerHaptic('levelUp');
      // Spawn more particles for level up
      if (e) spawnParticles(e.clientX, e.clientY, 16, '#ffff00', true);
      setLevelUpInfo(leveledUp);
    }
  };

  // Format time for display (mm:ss or hh:mm:ss)
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if any timer is running (for real-time updates)
  const hasRunningTimer = habits.some(h => h.timerStart);

  // Optimized timer updates using ref to avoid stale closure issues
  const timerIntervalRef = useRef(null);
  const [timerTick, setTimerTick] = useState(0);

  useEffect(() => {
    if (hasRunningTimer) {
      // Clear any existing interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      // Update every second for running timers
      timerIntervalRef.current = setInterval(() => {
        setTimerTick(t => t + 1);
      }, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    } else {
      // Clean up interval when no timers are running
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [hasRunningTimer]);

  const deleteHabit = (habitId) => {
    saveHabits(habits.filter(h => h.id !== habitId));
    setSelectedHabit(null);
    setFocusedSkills(prev => prev.filter(id => id !== habitId));
  };

  // Focus window management
  const addToFocus = (habitId) => {
    if (!focusedSkills.includes(habitId)) {
      setFocusedSkills(prev => [...prev, habitId]);
      setShowFocusWindow(true);
    }
  };

  const removeFromFocus = (habitId) => {
    setFocusedSkills(prev => prev.filter(id => id !== habitId));
  };

  const toggleFocusWindow = () => {
    if (showFocusWindow) {
      // Closing - animate out first
      setIsFocusWindowClosing(true);
      setTimeout(() => {
        setShowFocusWindow(false);
        setIsFocusWindowClosing(false);
      }, 150);
    } else {
      setShowFocusWindow(true);
    }
  };

  // Modal close handlers with exit animation
  const closeAddModal = () => {
    setIsAddModalClosing(true);
    setTimeout(() => {
      setShowAddModal(false);
      setIsAddModalClosing(false);
      setNewHabit({ name: '', icon: '1', type: 'daily' });
    }, 150);
  };

  const closeDetailModal = () => {
    setIsDetailModalClosing(true);
    setTimeout(() => {
      setSelectedHabit(null);
      setIsDetailModalClosing(false);
    }, 150);
  };

  // Get focused habits data
  const getFocusedHabits = () => {
    return focusedSkills
      .map(id => habits.find(h => h.id === id))
      .filter(Boolean);
  };

  const resetAllData = () => {
    localStorage.removeItem('habits-data');
    setHabits([]);
    setSelectedHabit(null);
  };

  // Spawn particles at a position
  const spawnParticles = useCallback((x, y, count = 8, color = '#ffff00', isLevelUp = false) => {
    // Skip particles when animations are paused
    if (!shouldAnimate) return;

    const newParticles = [];
    const colors = isLevelUp
      ? ['#ffff00', '#ffd700', '#ff981f', '#ffffff', '#00ff00']
      : [color, '#ffd700', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = isLevelUp ? 60 + Math.random() * 40 : 30 + Math.random() * 20;
      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        tx: Math.cos(angle) * speed,
        ty: Math.sin(angle) * speed - (isLevelUp ? 30 : 15),
        color: colors[Math.floor(Math.random() * colors.length)],
        size: isLevelUp ? 4 + Math.random() * 4 : 3 + Math.random() * 2,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Clean up particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
  }, [shouldAnimate]);

  const getXpBarWidth = (habit, includePending = false) => {
    if (habit.level >= 99) return 100;

    let totalXp = habit.xp;

    // Add pending XP for timed skills with running timer
    if (includePending && habit.type === 'timed' && habit.timerStart) {
      const elapsed = Date.now() - habit.timerStart;
      const minutes = elapsed / 60000;
      const pendingXp = Math.floor(minutes * (10 + habit.level * 2));
      totalXp += pendingXp;
    }

    const xpForCurrentLevel = XP_TABLE[habit.level];
    const xpForNextLevel = XP_TABLE[habit.level + 1];
    const xpInLevel = totalXp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    return Math.min(100, Math.max(0, (xpInLevel / xpNeeded) * 100));
  };

  // Get pending XP for display
  const getPendingXp = (habit) => {
    if (habit.type === 'timed' && habit.timerStart) {
      const elapsed = Date.now() - habit.timerStart;
      const minutes = elapsed / 60000;
      return Math.floor(minutes * (10 + habit.level * 2));
    }
    return 0;
  };

  // Stone texture base - used for all stone surfaces
  const stoneTexture = 'url("/stone-tile.jpg")';
  const columnTexture = 'url("/column_texture.png")';
  const stoneSize = '32px 32px'; // Smaller tiles for more texture detail

  // Reusable icon button with hover/press states
  const IconButton = ({ onClick, isActive, title, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          background: 'none',
          border: 'none',
          color: isActive ? '#ffff00' : isHovered ? '#ffff00' : '#ff981f',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.1s ease-out, transform 0.1s ease-out',
          transform: isPressed ? 'scale(0.9)' : isHovered ? 'scale(1.15)' : 'scale(1)',
        }}
        title={title}
      >
        {children}
      </button>
    );
  };

  // Reusable OSRS-style action button with press states
  const ActionButton = ({ onClick, disabled, variant = 'primary', children, style = {} }) => {
    const [isPressed, setIsPressed] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const variants = {
      primary: {
        bg: 'linear-gradient(180deg, #5d4a2a 0%, #4a3d22 50%, #3d3218 100%)',
        bgHover: 'linear-gradient(180deg, #6d5a3a 0%, #5a4d32 50%, #4d4228 100%)',
        border: '#6b5a3a',
      },
      success: {
        bg: 'linear-gradient(180deg, #3a6a2a 0%, #2a5a1a 100%)',
        bgHover: 'linear-gradient(180deg, #4a7a3a 0%, #3a6a2a 100%)',
        border: '#4a8a3a',
      },
      danger: {
        bg: 'linear-gradient(180deg, #6a2a2a 0%, #4a1a1a 100%)',
        bgHover: 'linear-gradient(180deg, #7a3a3a 0%, #5a2a2a 100%)',
        border: '#8a3a3a',
      },
      warning: {
        bg: 'linear-gradient(180deg, #8a4a2a 0%, #6a3a1a 100%)',
        bgHover: 'linear-gradient(180deg, #9a5a3a 0%, #7a4a2a 100%)',
        border: '#aa5a3a',
      },
      secondary: {
        bg: 'linear-gradient(180deg, #4a4a6a 0%, #3a3a5a 100%)',
        bgHover: 'linear-gradient(180deg, #5a5a7a 0%, #4a4a6a 100%)',
        border: '#5a5a7a',
      },
    };

    const v = variants[variant] || variants.primary;

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          background: disabled ? '#2a2218' : isHovered ? v.bgHover : v.bg,
          border: isPressed ? `2px inset ${v.border}` : `2px outset ${v.border}`,
          color: variant === 'danger' ? '#ff6666' : '#ffff00',
          padding: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontSize: '7px',
          textShadow: '1px 1px 0 #000',
          opacity: disabled ? 0.5 : 1,
          transition: 'background 0.1s ease-out',
          transform: isPressed ? 'translateY(1px)' : 'none',
          ...style,
        }}
      >
        {children}
      </button>
    );
  };

  // Stone panel border styles (no top/bottom texture, only sides use columns)
  const panelBorder = {
    borderTop: '2px solid #3b3024',
    borderBottom: '2px solid #3b3024',
    borderLeft: 'none',
    borderRight: 'none',
    boxShadow: 'inset 0 0 0 1px #5d4e3a, 0 2px 4px rgba(0,0,0,0.8)',
  };

  // Skill box component - matches OSRS skill panel cells
  const SkillBox = ({ habit, index }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [flashComplete, setFlashComplete] = useState(false);
    const [timerToggleAnim, setTimerToggleAnim] = useState(false);
    const completed = isCompletedToday(habit);
    const isTimerRunning = habit.type === 'timed' && habit.timerStart;
    const currentTime = isTimerRunning ? Date.now() - habit.timerStart + (habit.totalTimeToday || 0) : (habit.totalTimeToday || 0);

    // Determine background based on state
    const getBackground = () => {
      if (isTimerRunning) {
        return `linear-gradient(180deg, rgba(61,42,31,0.5) 0%, rgba(40,26,18,0.6) 100%), ${stoneTexture}`; // Orange tint when running
      }
      if (completed) {
        return `linear-gradient(180deg, rgba(42,61,31,0.5) 0%, rgba(26,40,18,0.6) 100%), ${stoneTexture}`; // Green when completed
      }
      return `linear-gradient(180deg, rgba(61,52,40,0.4) 0%, rgba(42,35,24,0.5) 100%), ${stoneTexture}`; // Default
    };

    const handleDoubleClick = (e) => {
      if (habit.type === 'timed') {
        // Trigger timer toggle animation
        setTimerToggleAnim(true);
        setTimeout(() => setTimerToggleAnim(false), 250);

        if (isTimerRunning) {
          stopTimer(habit.id, e);
        } else {
          startTimer(habit.id);
        }
      } else {
        // Trigger completion flash
        setFlashComplete(true);
        setTimeout(() => setFlashComplete(false), 300);
        completeHabit(habit.id, e);
      }
    };

    // Get box shadow based on state
    const getBoxShadow = () => {
      const baseInner = 'inset 1px 1px 1px rgba(255,255,255,0.12), inset -1px -1px 1px rgba(0,0,0,0.3)';
      if (isTimerRunning) {
        return `inset 0 0 6px 1px rgba(255,102,0,0.2), ${baseInner}`;
      }
      if (isHovered) {
        return `inset 0 0 8px 2px rgba(255,152,31,0.3), 0 0 4px rgba(255,152,31,0.2), ${baseInner}`;
      }
      return `inset 0 0 6px 1px rgba(255,255,255,0.08), ${baseInner}`;
    };

    return (
      <div
        className={`${flashComplete ? 'completion-flash' : ''} ${timerToggleAnim ? 'timer-toggle' : ''}`}
        onClick={() => {
          setSelectedHabit(habit);
          setHoveredHabit(null);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={(e) => {
          setTooltipPos({ x: e.clientX, y: e.clientY - 10 });
          setHoveredHabit(habit);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
          setHoveredHabit(null);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          width: '62px',
          height: '32px',
          backgroundImage: getBackground(),
          backgroundSize: stoneSize,
          border: isTimerRunning ? '1px solid #ff6600' : '1px solid #1a1610',
          borderRadius: '2px',
          boxShadow: getBoxShadow(),
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          cursor: 'pointer',
          position: 'relative',
          imageRendering: 'pixelated',
          transition: 'box-shadow 0.15s ease-out, transform 0.08s ease-out',
          transform: isPressed ? 'scale(0.97)' : isHovered ? 'translateY(-1px)' : 'none',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Icon container */}
        <div style={{
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          marginRight: '2px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '2px',
        }}>
          {getIconEmoji(habit.icon)}
        </div>

        {/* Level display or Timer display for timed skills */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        }}>
          {habit.type === 'timed' && (isTimerRunning || currentTime > 0) ? (
            <>
              <span style={{
                color: isTimerRunning ? '#ff9900' : '#ffff00',
                textShadow: '1px 1px 0 #000',
                fontSize: '4px',
                fontFamily: '"Press Start 2P", monospace',
              }}>
                {formatTime(isTimerRunning ? Date.now() - habit.timerStart + (habit.totalTimeToday || 0) : habit.totalTimeToday || 0)}
              </span>
              <span style={{
                color: '#aaa',
                textShadow: '1px 1px 0 #000',
                fontSize: '3px',
                fontFamily: '"Press Start 2P", monospace',
              }}>
                Lv{habit.level}
              </span>
            </>
          ) : (
            <span style={{
              color: '#ffff00',
              textShadow: '1px 1px 0 #000',
              fontSize: '5px',
              fontWeight: 'bold',
              fontFamily: '"Press Start 2P", monospace',
              letterSpacing: '1px',
            }}>
              {habit.level}/99
            </span>
          )}
        </div>

        {/* Status indicator */}
        {(completed || isTimerRunning) && (
          <div style={{
            position: 'absolute',
            top: '1px',
            right: '1px',
            width: '6px',
            height: '6px',
            background: isTimerRunning ? '#ff6600' : '#00ff00',
            borderRadius: '50%',
            boxShadow: isTimerRunning ? '0 0 2px #ff6600' : '0 0 2px #00ff00',
            animation: isTimerRunning ? 'pulse 1s infinite' : 'none',
          }} />
        )}
      </div>
    );
  };

  // Empty skill slot for grid padding
  const EmptySlot = () => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    return (
      <div
        onClick={() => setShowAddModal(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          width: '62px',
          height: '32px',
          backgroundImage: `linear-gradient(180deg, rgba(42,36,24,0.5) 0%, rgba(26,24,16,0.6) 100%), ${stoneTexture}`,
          backgroundSize: stoneSize,
          border: '1px solid #1a1610',
          borderRadius: '2px',
          boxShadow: isHovered
            ? 'inset 0 0 8px 2px rgba(90,80,64,0.4), inset 1px 1px 1px rgba(255,255,255,0.12), inset -1px -1px 1px rgba(0,0,0,0.3)'
            : 'inset 0 0 6px 1px rgba(255,255,255,0.08), inset 1px 1px 1px rgba(255,255,255,0.12), inset -1px -1px 1px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: isHovered ? 0.85 : 0.6,
          transition: 'opacity 0.15s ease-out, box-shadow 0.15s ease-out, transform 0.08s ease-out',
          transform: isPressed ? 'scale(0.97)' : 'none',
        }}
        title="Add new skill"
      >
        <Plus size={12} color={isHovered ? '#ff981f' : '#5a5040'} />
      </div>
    );
  };

  // Focus Window Component - runs multiple timed skills
  const FocusWindow = () => {
    const focusedHabits = getFocusedHabits();
    const timedHabits = habits.filter(h => h.type === 'timed' && !focusedSkills.includes(h.id));

    return (
      <div
        className={isFocusWindowClosing ? 'focus-window-exit' : 'focus-window'}
        style={{
          width: '160px',
          backgroundImage: `linear-gradient(180deg, rgba(74,61,46,0.4) 0%, rgba(61,50,38,0.5) 50%, rgba(50,42,30,0.5) 100%), ${stoneTexture}`,
          backgroundSize: stoneSize,
          ...panelBorder,
          borderLeft: 'none',
          padding: '3px',
        }}>
        {/* Inner border */}
        <div style={{
          backgroundImage: `linear-gradient(180deg, rgba(93,78,58,0.3) 0%, rgba(74,61,46,0.4) 100%), ${stoneTexture}`,
          backgroundSize: stoneSize,
          border: '1px solid #2a2218',
          padding: '2px',
          height: '100%',
        }}>
          {/* Header */}
          <div style={{
            backgroundImage: `linear-gradient(180deg, rgba(61,50,38,0.5) 0%, rgba(42,35,24,0.6) 100%), ${stoneTexture}`,
            backgroundSize: stoneSize,
            borderBottom: '1px solid #1a1610',
            padding: '4px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              color: '#ff981f',
              textShadow: '1px 1px 0 #000',
              fontSize: '7px',
              letterSpacing: '0.5px',
            }}>
              Focus Mode
            </span>
            <button
              onClick={() => setShowFocusWindow(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff0000',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
              }}
            >
              <X size={8} />
            </button>
          </div>

          {/* Focused Skills List */}
          <div style={{
            padding: '4px',
            minHeight: '60px',
          }}>
            {focusedHabits.length === 0 ? (
              <div style={{
                color: '#666',
                fontSize: '5px',
                textAlign: 'center',
                padding: '10px 4px',
              }}>
                No skills in focus.<br/>
                Add timed skills to track multiple at once.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {focusedHabits.map(habit => {
                  const isRunning = habit.timerStart !== null;
                  const currentTime = isRunning
                    ? Date.now() - habit.timerStart + (habit.totalTimeToday || 0)
                    : (habit.totalTimeToday || 0);
                  const pendingXp = getPendingXp(habit);

                  return (
                    <div
                      key={habit.id}
                      style={{
                        backgroundImage: isRunning
                          ? `linear-gradient(180deg, rgba(61,42,31,0.6) 0%, rgba(40,26,18,0.7) 100%), ${stoneTexture}`
                          : `linear-gradient(180deg, rgba(42,36,28,0.5) 0%, rgba(30,26,20,0.6) 100%), ${stoneTexture}`,
                        backgroundSize: stoneSize,
                        border: isRunning ? '1px solid #ff6600' : '1px solid #1a1610',
                        borderRadius: '2px',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '18px',
                        height: '18px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        flexShrink: 0,
                      }}>
                        {getIconEmoji(habit.icon)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          color: '#ff981f',
                          fontSize: '5px',
                          textShadow: '1px 1px 0 #000',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {habit.name}
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                          <span style={{
                            color: isRunning ? '#ff9900' : '#ffff00',
                            fontSize: '6px',
                            textShadow: '1px 1px 0 #000',
                            fontWeight: 'bold',
                          }}>
                            {formatTime(currentTime)}
                          </span>
                          {isRunning && pendingXp > 0 && (
                            <span style={{
                              color: '#00ff00',
                              fontSize: '4px',
                              textShadow: '1px 1px 0 #000',
                            }}>
                              +{pendingXp}xp
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                        <button
                          onClick={(e) => {
                            if (isRunning) {
                              stopTimer(habit.id, e);
                            } else {
                              startTimer(habit.id);
                            }
                          }}
                          style={{
                            width: '16px',
                            height: '16px',
                            background: isRunning
                              ? 'linear-gradient(180deg, #8a4a2a 0%, #6a3a1a 100%)'
                              : 'linear-gradient(180deg, #3a6a2a 0%, #2a5a1a 100%)',
                            border: '1px solid #1a1610',
                            borderRadius: '2px',
                            color: '#ffff00',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            padding: 0,
                          }}
                          title={isRunning ? 'Stop' : 'Start'}
                        >
                          {isRunning ? '⏹' : '▶'}
                        </button>
                        <button
                          onClick={() => removeFromFocus(habit.id)}
                          style={{
                            width: '16px',
                            height: '16px',
                            background: 'linear-gradient(180deg, #4a3a2a 0%, #3a2a1a 100%)',
                            border: '1px solid #1a1610',
                            borderRadius: '2px',
                            color: '#ff6666',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            padding: 0,
                          }}
                          title="Remove from focus"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Skills Section */}
          {timedHabits.length > 0 && (
            <div style={{
              borderTop: '1px solid #2a2218',
              padding: '4px',
            }}>
              <div style={{
                color: '#aaa',
                fontSize: '5px',
                marginBottom: '3px',
              }}>
                Add to focus:
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2px',
              }}>
                {timedHabits.slice(0, 6).map(habit => (
                  <button
                    key={habit.id}
                    onClick={() => addToFocus(habit.id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      background: 'linear-gradient(180deg, #3d3226 0%, #2a2318 100%)',
                      border: '1px solid #1a1610',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      padding: 0,
                    }}
                    title={habit.name}
                  >
                    {getIconEmoji(habit.icon)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{
            borderTop: '1px solid #2a2218',
            padding: '4px',
            display: 'flex',
            gap: '4px',
          }}>
            <button
              onClick={() => {
                focusedHabits.forEach(h => {
                  if (!h.timerStart) startTimer(h.id);
                });
              }}
              disabled={focusedHabits.length === 0 || focusedHabits.every(h => h.timerStart)}
              style={{
                flex: 1,
                padding: '4px',
                background: focusedHabits.length === 0 || focusedHabits.every(h => h.timerStart)
                  ? '#2a2218'
                  : 'linear-gradient(180deg, #3a6a2a 0%, #2a5a1a 100%)',
                border: '1px solid #1a1610',
                borderRadius: '2px',
                color: '#ffff00',
                fontSize: '5px',
                cursor: focusedHabits.length === 0 || focusedHabits.every(h => h.timerStart) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                textShadow: '1px 1px 0 #000',
                opacity: focusedHabits.length === 0 || focusedHabits.every(h => h.timerStart) ? 0.5 : 1,
              }}
            >
              ▶ START ALL
            </button>
            <button
              onClick={(e) => {
                focusedHabits.forEach(h => {
                  if (h.timerStart) stopTimer(h.id, e);
                });
              }}
              disabled={focusedHabits.length === 0 || focusedHabits.every(h => !h.timerStart)}
              style={{
                flex: 1,
                padding: '4px',
                background: focusedHabits.length === 0 || focusedHabits.every(h => !h.timerStart)
                  ? '#2a2218'
                  : 'linear-gradient(180deg, #8a4a2a 0%, #6a3a1a 100%)',
                border: '1px solid #1a1610',
                borderRadius: '2px',
                color: '#ffff00',
                fontSize: '5px',
                cursor: focusedHabits.length === 0 || focusedHabits.every(h => !h.timerStart) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                textShadow: '1px 1px 0 #000',
                opacity: focusedHabits.length === 0 || focusedHabits.every(h => !h.timerStart) ? 0.5 : 1,
              }}
            >
              ⏹ STOP ALL
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Get completion count for a specific day across all habits
  const getCompletionsForDay = (dateString) => {
    return habits.filter(h =>
      h.history && h.history.some(entry => entry.date === dateString)
    ).length;
  };

  // Heatmap component - GitHub style (rows=days of week, columns=weeks)
  const Heatmap = () => {
    const maxCompletions = Math.max(habits.length, 1);
    const today = new Date();
    const numWeeks = 26; // ~6 months of data

    // Get intensity level (0-4) based on completions
    const getIntensity = (completions) => {
      if (completions === 0) return 0;
      const ratio = completions / maxCompletions;
      if (ratio <= 0.25) return 1;
      if (ratio <= 0.5) return 2;
      if (ratio <= 0.75) return 3;
      return 4;
    };

    // Intensity colors (OSRS green theme)
    const intensityColors = [
      'rgba(26,22,16,0.8)',      // 0 - empty/dark
      'rgba(42,61,31,0.6)',      // 1 - light green
      'rgba(52,81,41,0.7)',      // 2 - medium green
      'rgba(62,101,51,0.8)',     // 3 - bright green
      'rgba(72,121,61,0.9)',     // 4 - max green
    ];

    // Generate weeks data (columns) - each week has 7 days (rows)
    const getWeeksData = () => {
      const weeks = [];
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (numWeeks * 7) + (6 - today.getDay()));

      for (let w = 0; w < numWeeks; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + (w * 7) + d);
          week.push(date);
        }
        weeks.push(week);
      }
      return weeks;
    };

    const weeks = getWeeksData();
    const dayLabels = ['M', '', 'W', '', 'F', '', ''];

    // Get month labels for header
    const getMonthLabels = () => {
      const labels = [];
      let lastMonth = -1;
      weeks.forEach((week, i) => {
        const month = week[0].getMonth();
        if (month !== lastMonth) {
          labels.push({ index: i, name: week[0].toLocaleDateString('en', { month: 'short' }) });
          lastMonth = month;
        }
      });
      return labels;
    };
    const monthLabels = getMonthLabels();

    return (
      <div style={{ padding: '3px' }}>
        {/* Month labels */}
        <div style={{
          display: 'flex',
          marginLeft: '10px',
          marginBottom: '1px',
          position: 'relative',
          height: '8px',
        }}>
          {monthLabels.map((label, i) => (
            <span key={i} style={{
              position: 'absolute',
              left: `${(label.index / numWeeks) * 100}%`,
              color: '#ff981f',
              fontSize: '4px',
              textShadow: '1px 1px 0 #000',
            }}>
              {label.name}
            </span>
          ))}
        </div>

        {/* Grid container */}
        <div style={{ display: 'flex' }}>
          {/* Day labels */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            marginRight: '2px',
            justifyContent: 'space-around',
          }}>
            {dayLabels.map((label, i) => (
              <span key={i} style={{
                color: '#aaa',
                fontSize: '3px',
                height: '5px',
                lineHeight: '5px',
              }}>
                {label}
              </span>
            ))}
          </div>

          {/* Heatmap grid - weeks as columns, days as rows */}
          <div style={{
            display: 'flex',
            gap: '1px',
            background: '#1a1610',
            padding: '2px',
            borderRadius: '2px',
            flex: 1,
          }}>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
              }}>
                {week.map((date, dayIndex) => {
                  const dateStr = date.toDateString();
                  const completions = getCompletionsForDay(dateStr);
                  const intensity = getIntensity(completions);
                  const isToday = dateStr === today.toDateString();
                  const isFuture = date > today;
                  // Calculate staggered animation delay based on cell position
                  const cellDelay = (weekIndex * 7 + dayIndex) * 3; // 3ms per cell

                  return (
                    <div
                      key={dayIndex}
                      className="heatmap-cell"
                      title={isFuture ? '' : `${date.toLocaleDateString()}: ${completions}/${habits.length}`}
                      style={{
                        width: '5px',
                        height: '5px',
                        backgroundImage: isFuture
                          ? 'none'
                          : `linear-gradient(180deg, ${intensityColors[intensity]}, ${intensityColors[intensity]}), ${stoneTexture}`,
                        backgroundColor: isFuture ? 'transparent' : undefined,
                        backgroundSize: stoneSize,
                        borderRadius: '1px',
                        border: isToday ? '1px solid #ffff00' : isFuture ? 'none' : '1px solid #2a2218',
                        animationDelay: `${cellDelay}ms`,
                        boxShadow: intensity > 0 && !isFuture
                          ? `inset 0 0 2px rgba(0,255,0,${intensity * 0.15})`
                          : 'none',
                        opacity: isFuture ? 0 : 1,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          marginTop: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span style={{ color: '#aaa', fontSize: '4px' }}>Streak: </span>
            <span style={{ color: '#ff981f', fontSize: '4px' }}>
              {Math.max(...habits.map(h => h.streak), 0)} days
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1px',
          }}>
            <span style={{ color: '#aaa', fontSize: '3px' }}>Less</span>
            {intensityColors.map((color, i) => (
              <div
                key={i}
                style={{
                  width: '5px',
                  height: '5px',
                  backgroundImage: `linear-gradient(180deg, ${color}, ${color}), ${stoneTexture}`,
                  backgroundSize: stoneSize,
                  borderRadius: '1px',
                  border: '1px solid #2a2218',
                }}
              />
            ))}
            <span style={{ color: '#aaa', fontSize: '3px' }}>More</span>
          </div>
        </div>
      </div>
    );
  };

  // Fill grid to always show 3 columns
  const gridItems = [...habits];
  const remainder = habits.length % 3;
  const emptySlots = remainder === 0 ? (habits.length === 0 ? 3 : 0) : 3 - remainder;

  return (
    <div
      className={!shouldAnimate ? 'animations-paused' : ''}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Scaled pixel-perfect container */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        WebkitFontSmoothing: 'none',
        MozOsxFontSmoothing: 'grayscale',
        imageRendering: 'pixelated',
        position: 'relative',
      }}>
        {/* Main Skills Panel */}
        <div style={{
          width: NATIVE_WIDTH,
          height: 'auto',
          minHeight: NATIVE_HEIGHT,
        }}>

        {/* Main Panel with Column Borders */}
        <div
          onMouseLeave={() => setHoveredHabit(null)}
          style={{
            display: 'flex',
            position: 'relative',
          }}>
          {/* Left Column */}
          <div style={{
            width: '18px',
            backgroundImage: 'url("/column_texture.png")',
            backgroundSize: '100% auto',
            backgroundRepeat: 'repeat-y',
            borderLeft: '1px solid #2a2218',
            borderRight: '1px solid #1a1610',
            imageRendering: 'pixelated',
          }} />

          {/* Center Content */}
          <div style={{
            flex: 1,
            backgroundImage: `linear-gradient(180deg, rgba(74,61,46,0.4) 0%, rgba(61,50,38,0.5) 50%, rgba(50,42,30,0.5) 100%), ${stoneTexture}`,
            backgroundSize: stoneSize,
            ...panelBorder,
            borderLeft: 'none',
            borderRight: 'none',
            padding: '3px',
          }}>
          {/* Inner border detail */}
          <div style={{
            backgroundImage: `linear-gradient(180deg, rgba(93,78,58,0.3) 0%, rgba(74,61,46,0.4) 100%), ${stoneTexture}`,
            backgroundSize: stoneSize,
            border: '1px solid #2a2218',
            padding: '2px',
          }}>
            {/* Panel header - minimal */}
            <div style={{
              backgroundImage: `linear-gradient(180deg, rgba(61,50,38,0.5) 0%, rgba(42,35,24,0.6) 100%), ${stoneTexture}`,
              backgroundSize: stoneSize,
              borderBottom: '1px solid #1a1610',
              padding: '4px 6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{
                color: '#ff981f',
                textShadow: '1px 1px 0 #000',
                fontSize: '8px',
                letterSpacing: '0.5px',
              }}>
                {showHeatmap ? 'Activity' : 'Skills'}
              </span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <IconButton
                  onClick={() => {
                    playSound('click');
                    toggleSound();
                  }}
                  isActive={soundEnabled}
                  title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
                >
                  {soundEnabled ? <Volume2 size={10} /> : <VolumeX size={10} />}
                </IconButton>
                <IconButton
                  onClick={() => {
                    playSound('click');
                    toggleAnimations();
                  }}
                  isActive={animationsEnabled}
                  title={animationsEnabled ? 'Pause Animations' : 'Enable Animations'}
                >
                  {animationsEnabled ? <Sparkles size={10} /> : <Pause size={10} />}
                </IconButton>
                <IconButton
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  isActive={showHeatmap}
                  title={showHeatmap ? 'Show Skills' : 'Show Activity'}
                >
                  {showHeatmap ? <LayoutGrid size={10} /> : <Grid3X3 size={10} />}
                </IconButton>
                <IconButton
                  onClick={toggleFocusWindow}
                  isActive={showFocusWindow}
                  title={showFocusWindow ? 'Hide Focus' : 'Show Focus'}
                >
                  <Target size={10} />
                </IconButton>
                <IconButton
                  onClick={() => setShowAddModal(true)}
                  title="Add Skill"
                >
                  <Plus size={10} />
                </IconButton>
                {isAuthenticated ? (
                  <UserMenu />
                ) : (
                  <IconButton
                    onClick={() => {
                      playSound('click');
                      setShowLoginModal(true);
                    }}
                    title="Sign In"
                  >
                    <LogIn size={10} />
                  </IconButton>
                )}
              </div>
            </div>

            {/* Skills Grid or Heatmap view */}
            {showHeatmap ? (
              <Heatmap />
            ) : (
              <div
                onMouseLeave={() => setHoveredHabit(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 62px)',
                  gap: '1px',
                  padding: '3px',
                  background: '#1a1610',
                  justifyContent: 'center',
                }}>
                {gridItems.map((habit, index) => (
                  <SkillBox key={habit.id} habit={habit} index={index} />
                ))}
                {[...Array(emptySlots)].map((_, i) => (
                  <EmptySlot key={`empty-${i}`} />
                ))}
              </div>
            )}

            {/* Total Level Banner - Shift+Click to reset */}
            <div
              onClick={(e) => {
                if (e.shiftKey && window.confirm('Reset all habit data?')) {
                  resetAllData();
                }
              }}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(42,35,24,0.5) 0%, rgba(26,22,16,0.6) 100%), ${stoneTexture}`,
                backgroundSize: stoneSize,
                borderTop: '1px solid #3d3226',
                padding: '6px 8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'default',
              }}>
              <span style={{
                color: '#ffff00',
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                fontSize: '8px',
                letterSpacing: '0.5px',
              }}>
                Total level:
              </span>
              <span style={{
                color: '#ffff00',
                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                fontSize: '10px',
                fontWeight: 'bold',
                marginLeft: '6px',
              }}>
                {totalLevel}
              </span>
            </div>
          </div>
          </div>

          {/* Right Column */}
          <div style={{
            width: '18px',
            backgroundImage: 'url("/column_texture.png")',
            backgroundSize: '100% auto',
            backgroundRepeat: 'repeat-y',
            borderLeft: '1px solid #1a1610',
            borderRight: '1px solid #2a2218',
            imageRendering: 'pixelated',
          }} />
        </div>
        </div>

        {/* Focus Window - side panel for tracking multiple skills */}
        {showFocusWindow && <FocusWindow />}

        {/* Add Modal - OSRS styled */}
        {showAddModal && (
          <div
            className={isAddModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}
            onClick={closeAddModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
            <div
              className={isAddModalClosing ? 'modal-content-exit' : 'modal-content'}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(74,61,46,0.4) 0%, rgba(61,50,38,0.5) 50%, rgba(50,42,30,0.5) 100%), ${stoneTexture}`,
                backgroundSize: stoneSize,
                ...panelBorder,
                padding: '3px',
                width: '180px',
                transform: `scale(${1/scale})`,
                transformOrigin: 'center center',
              }}>
              <div style={{
                backgroundImage: `linear-gradient(180deg, rgba(93,78,58,0.3) 0%, rgba(74,61,46,0.4) 100%), ${stoneTexture}`,
                backgroundSize: stoneSize,
                border: '1px solid #2a2218',
                padding: '8px',
              }}>
                {/* Modal Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  borderBottom: '1px solid #2a2218',
                  paddingBottom: '6px',
                }}>
                  <span style={{
                    color: '#ff981f',
                    textShadow: '1px 1px 0 #000',
                    fontSize: '8px',
                  }}>
                    Add New Skill
                  </span>
                  <button
                    onClick={closeAddModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff0000',
                      cursor: 'pointer',
                      padding: '0',
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>

                {/* Skill Name Input */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    display: 'block',
                    color: '#ffff00',
                    textShadow: '1px 1px 0 #000',
                    fontSize: '6px',
                    marginBottom: '4px',
                  }}>
                    SKILL NAME
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({...newHabit, name: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && addHabit()}
                    style={{
                      width: '100%',
                      padding: '4px 6px',
                      background: '#1a1610',
                      border: '2px inset #3d3226',
                      color: '#ffff00',
                      fontFamily: 'inherit',
                      fontSize: '7px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="e.g. Exercise"
                    autoFocus
                  />
                </div>

                {/* Skill Type Selection */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    display: 'block',
                    color: '#ffff00',
                    textShadow: '1px 1px 0 #000',
                    fontSize: '6px',
                    marginBottom: '4px',
                  }}>
                    TYPE
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                  }}>
                    <button
                      onClick={() => setNewHabit({...newHabit, type: 'daily'})}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: newHabit.type === 'daily'
                          ? 'linear-gradient(180deg, #3a6a2a 0%, #2a5a1a 100%)'
                          : 'linear-gradient(180deg, #3d3226 0%, #2a2318 100%)',
                        border: newHabit.type === 'daily' ? '1px solid #4a8a3a' : '1px solid #1a1610',
                        color: '#ffff00',
                        fontFamily: 'inherit',
                        fontSize: '5px',
                        textShadow: '1px 1px 0 #000',
                        cursor: 'pointer',
                      }}
                    >
                      ✓ DAILY
                    </button>
                    <button
                      onClick={() => setNewHabit({...newHabit, type: 'timed'})}
                      style={{
                        flex: 1,
                        padding: '4px',
                        background: newHabit.type === 'timed'
                          ? 'linear-gradient(180deg, #3a6a2a 0%, #2a5a1a 100%)'
                          : 'linear-gradient(180deg, #3d3226 0%, #2a2318 100%)',
                        border: newHabit.type === 'timed' ? '1px solid #4a8a3a' : '1px solid #1a1610',
                        color: '#ffff00',
                        fontFamily: 'inherit',
                        fontSize: '5px',
                        textShadow: '1px 1px 0 #000',
                        cursor: 'pointer',
                      }}
                    >
                      ⏱ TIMED
                    </button>
                  </div>
                </div>

                {/* Icon Selection */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{
                    display: 'block',
                    color: '#ffff00',
                    textShadow: '1px 1px 0 #000',
                    fontSize: '6px',
                    marginBottom: '4px',
                  }}>
                    ICON
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '2px',
                    background: '#1a1610',
                    padding: '4px',
                    border: '1px inset #2a2218',
                  }}>
                    {skillIcons.map(icon => (
                      <button
                        key={icon.id}
                        onClick={() => setNewHabit({...newHabit, icon: icon.id})}
                        style={{
                          width: '22px',
                          height: '22px',
                          background: newHabit.icon === icon.id
                            ? 'linear-gradient(180deg, #5a4a3a 0%, #3d3226 100%)'
                            : 'linear-gradient(180deg, #3d3226 0%, #2a2318 100%)',
                          border: newHabit.icon === icon.id ? '1px solid #ff981f' : '1px solid #1a1610',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={icon.label}
                      >
                        {icon.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Button */}
                <ActionButton
                  onClick={addHabit}
                  disabled={!newHabit.name.trim()}
                  variant="primary"
                  style={{ width: '100%' }}
                >
                  CREATE
                </ActionButton>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal - OSRS styled */}
        {selectedHabit && (
          <div
            className={isDetailModalClosing ? 'modal-backdrop-exit' : 'modal-backdrop'}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={closeDetailModal}
          >
            <div
              className={isDetailModalClosing ? 'modal-content-exit' : 'modal-content'}
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(74,61,46,0.4) 0%, rgba(61,50,38,0.5) 50%, rgba(50,42,30,0.5) 100%), ${stoneTexture}`,
                backgroundSize: stoneSize,
                ...panelBorder,
                padding: '3px',
                width: '180px',
                transform: `scale(${1/scale})`,
                transformOrigin: 'center center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                backgroundImage: `linear-gradient(180deg, rgba(93,78,58,0.3) 0%, rgba(74,61,46,0.4) 100%), ${stoneTexture}`,
                backgroundSize: stoneSize,
                border: '1px solid #2a2218',
                padding: '8px',
              }}>
                {/* Header with icon and name */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  borderBottom: '1px solid #2a2218',
                  paddingBottom: '6px',
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    background: 'linear-gradient(180deg, #3d3226 0%, #2a2318 100%)',
                    border: '1px solid #1a1610',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    marginRight: '8px',
                  }}>
                    {getIconEmoji(selectedHabit.icon)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: '#ff981f',
                      textShadow: '1px 1px 0 #000',
                      fontSize: '8px',
                      marginBottom: '2px',
                    }}>
                      {selectedHabit.name}
                    </div>
                    <div style={{
                      color: '#ffff00',
                      textShadow: '1px 1px 0 #000',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}>
                      Level {selectedHabit.level}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHabit(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff0000',
                      cursor: 'pointer',
                      padding: '0',
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>

                {/* Stats */}
                <div style={{
                  background: '#1a1610',
                  border: '1px inset #2a2218',
                  padding: '6px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <span style={{ color: '#aaa', fontSize: '6px' }}>Total XP:</span>
                    <span style={{ color: '#ffff00', fontSize: '7px', textShadow: '1px 1px 0 #000' }}>
                      {selectedHabit.xp.toLocaleString()}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <span style={{ color: '#aaa', fontSize: '6px' }}>To Next Level:</span>
                    <span style={{ color: '#00ffff', fontSize: '7px', textShadow: '1px 1px 0 #000' }}>
                      {Math.max(0, selectedHabit.xpToNext - getPendingXp(selectedHabit))}
                    </span>
                  </div>
                  {/* Show pending XP for timed skills */}
                  {selectedHabit.type === 'timed' && selectedHabit.timerStart && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '4px',
                    }}>
                      <span style={{ color: '#aaa', fontSize: '6px' }}>Pending XP:</span>
                      <span style={{ color: '#ff9900', fontSize: '7px', textShadow: '1px 1px 0 #000' }}>
                        +{getPendingXp(selectedHabit)}
                      </span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ color: '#aaa', fontSize: '6px' }}>Streak:</span>
                    <span style={{ color: '#ff8c00', fontSize: '7px', textShadow: '1px 1px 0 #000' }}>
                      {selectedHabit.streak} days
                    </span>
                  </div>

                  {/* XP Progress bar - grows in real-time for timed skills */}
                  <div style={{
                    marginTop: '6px',
                    background: '#0a0a0a',
                    border: '1px solid #000',
                    height: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Base XP (already earned) - uses scaleX for GPU optimization */}
                    <div
                      className={xpBarShimmer ? 'xp-bar-shimmer' : ''}
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(180deg, #4a9f3a 0%, #3a8a2a 100%)',
                        transformOrigin: 'left',
                        transform: `scaleX(${getXpBarWidth(selectedHabit, false) / 100})`,
                        transition: 'transform 0.3s ease',
                      }} />
                    {/* Pending XP overlay (orange, grows in real-time) */}
                    {selectedHabit.type === 'timed' && selectedHabit.timerStart && (
                      <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(180deg, #cc8833 0%, #aa6622 100%)',
                        transformOrigin: 'left',
                        transform: `scaleX(${getXpBarWidth(selectedHabit, true) / 100})`,
                        opacity: 0.8,
                      }} />
                    )}
                  </div>
                </div>

                {/* Complete/Timer Button - depends on skill type */}
                {selectedHabit.type === 'timed' ? (
                  <>
                    {/* Timer Display */}
                    <div style={{
                      background: '#0d0b08',
                      border: '1px solid #1a1610',
                      padding: '6px',
                      marginBottom: '4px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        color: selectedHabit.timerStart ? '#ff9900' : '#ffff00',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textShadow: '1px 1px 0 #000',
                        marginBottom: '2px',
                      }}>
                        {formatTime(
                          selectedHabit.timerStart
                            ? Date.now() - selectedHabit.timerStart + (selectedHabit.totalTimeToday || 0)
                            : (selectedHabit.totalTimeToday || 0)
                        )}
                      </div>
                      <div style={{
                        color: '#aaa',
                        fontSize: '5px',
                      }}>
                        {selectedHabit.timerStart ? 'RUNNING' : 'TODAY\'S TIME'}
                      </div>
                    </div>

                    {/* Start/Stop Button */}
                    <ActionButton
                      onClick={(e) => {
                        if (selectedHabit.timerStart) {
                          stopTimer(selectedHabit.id, e);
                        } else {
                          startTimer(selectedHabit.id);
                        }
                      }}
                      variant={selectedHabit.timerStart ? 'warning' : 'success'}
                      style={{ width: '100%', marginBottom: '4px' }}
                    >
                      {selectedHabit.timerStart ? '⏹ STOP' : '▶ START'}
                    </ActionButton>

                    {/* Add to Focus Button */}
                    <ActionButton
                      onClick={() => {
                        addToFocus(selectedHabit.id);
                        setSelectedHabit(null);
                      }}
                      disabled={focusedSkills.includes(selectedHabit.id)}
                      variant="secondary"
                      style={{ width: '100%', marginBottom: '4px', fontSize: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Target size={8} />
                      {focusedSkills.includes(selectedHabit.id) ? 'IN FOCUS' : 'ADD TO FOCUS'}
                    </ActionButton>
                  </>
                ) : (
                  <ActionButton
                    onClick={(e) => completeHabit(selectedHabit.id, e)}
                    disabled={isCompletedToday(selectedHabit)}
                    variant="success"
                    style={{ width: '100%', marginBottom: '4px' }}
                  >
                    {isCompletedToday(selectedHabit) ? 'COMPLETED TODAY' : 'COMPLETE'}
                  </ActionButton>
                )}

                {/* Delete Button */}
                <ActionButton
                  onClick={() => deleteHabit(selectedHabit.id)}
                  variant="danger"
                  style={{ width: '100%', fontSize: '6px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                >
                  <Trash2 size={8} />
                  DELETE
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Skill Hover Tooltip - outside scaled container */}
      {hoveredHabit && (
        <div
          className="skill-tooltip"
          style={{
            position: 'fixed',
            left: tooltipPos.x + 10,
            top: tooltipPos.y,
            zIndex: 2000,
            pointerEvents: 'none',
            fontFamily: '"Press Start 2P", "Courier New", monospace',
          }}
        >
          <div style={{
            backgroundImage: `linear-gradient(180deg, rgba(50,42,30,0.95) 0%, rgba(35,28,18,0.98) 100%), ${stoneTexture}`,
            backgroundSize: stoneSize,
            border: '2px solid #1a1610',
            boxShadow: '0 3px 6px rgba(0,0,0,0.9), inset 0 0 0 1px #3d3226',
            padding: '5px 6px',
            minWidth: '90px',
          }}>
            {/* Header with icon and name */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '4px',
              borderBottom: '1px solid #2a2218',
              paddingBottom: '4px',
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                marginRight: '5px',
              }}>
                {getIconEmoji(hoveredHabit.icon)}
              </div>
              <span style={{
                color: '#ff981f',
                textShadow: '1px 1px 0 #000',
                fontSize: '6px',
              }}>
                {hoveredHabit.name}
              </span>
            </div>

            {/* Level display */}
            <div style={{
              textAlign: 'center',
              marginBottom: '4px',
            }}>
              <span style={{
                color: '#ffff00',
                textShadow: '1px 1px 0 #000',
                fontSize: '9px',
                fontWeight: 'bold',
              }}>
                Level {hoveredHabit.level}
              </span>
            </div>

            {/* Stats */}
            <div style={{
              background: '#0d0b08',
              border: '1px solid #1a1610',
              padding: '4px 5px',
            }}>
              {hoveredHabit.type === 'timed' && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '2px',
                  gap: '8px',
                }}>
                  <span style={{ color: '#aaa', fontSize: '5px' }}>Time:</span>
                  <span style={{ color: hoveredHabit.timerStart ? '#ff9900' : '#ffff00', fontSize: '5px' }}>
                    {formatTime(
                      hoveredHabit.timerStart
                        ? Date.now() - hoveredHabit.timerStart + (hoveredHabit.totalTimeToday || 0)
                        : (hoveredHabit.totalTimeToday || 0)
                    )}
                  </span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2px',
                gap: '8px',
              }}>
                <span style={{ color: '#aaa', fontSize: '5px' }}>XP:</span>
                <span style={{ color: '#ffff00', fontSize: '5px' }}>
                  {hoveredHabit.xp.toLocaleString()}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '2px',
                gap: '8px',
              }}>
                <span style={{ color: '#aaa', fontSize: '5px' }}>Next:</span>
                <span style={{ color: '#00ffff', fontSize: '5px' }}>
                  {hoveredHabit.xpToNext.toLocaleString()}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <span style={{ color: '#aaa', fontSize: '5px' }}>Streak:</span>
                <span style={{ color: '#ff981f', fontSize: '5px' }}>
                  {hoveredHabit.streak} days
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Popup */}
      {levelUpInfo && (
        <div
          onClick={() => setLevelUpInfo(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'relative',
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"),
                linear-gradient(180deg, #d4c4a8 0%, #c4b498 50%, #b4a488 100%)
              `,
              backgroundBlendMode: 'soft-light, normal',
              border: '6px solid transparent',
              borderImage: 'url("/column_texture.png") 6 round',
              boxShadow: 'inset 0 0 0 2px #8a7a5a, 0 4px 12px rgba(0,0,0,0.5), 0 0 0 2px #2a1810',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              fontFamily: '"Press Start 2P", "Courier New", monospace',
              animation: 'levelUpBounce 0.3s ease-out',
              imageRendering: 'pixelated',
            }}
          >
            {/* Skill Icon */}
            <div style={{
              width: '40px',
              height: '40px',
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"),
                linear-gradient(180deg, #c4b498 0%, #a49478 100%)
              `,
              backgroundBlendMode: 'soft-light, normal',
              border: '2px solid #6a5a3a',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
            }}>
              {getIconEmoji(levelUpInfo.icon)}
            </div>

            {/* Text */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#000080',
                fontSize: '7px',
                marginBottom: '6px',
                fontWeight: 'normal',
              }}>
                Congratulations, you just advanced a {levelUpInfo.name} level.
              </div>
              <div style={{
                color: '#000080',
                fontSize: '7px',
                marginBottom: '8px',
                fontWeight: 'normal',
              }}>
                Your {levelUpInfo.name} level is now {levelUpInfo.level}.
              </div>
              <div style={{
                color: '#000080',
                fontSize: '5px',
                fontWeight: 'normal',
                opacity: 0.7,
              }}>
                Click here to continue
              </div>
            </div>
          </div>
        </div>
      )}

      {/* XP Gain Popup - floats up and fades out */}
      {xpPopup && (
        <div
          className="xp-popup"
          style={{
            position: 'fixed',
            left: xpPopup.x,
            top: xpPopup.y,
            transform: 'translate(-50%, -50%)',
            zIndex: 4000,
            pointerEvents: 'none',
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            animation: 'xpFloat 1s ease-out forwards',
          }}
        >
          <span style={{
            color: '#00ff00',
            fontSize: '14px',
            fontWeight: 'bold',
            textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 0 8px rgba(0,255,0,0.5)',
          }}>
            +{xpPopup.xp} XP
          </span>
        </div>
      )}

      {/* Streak Milestone Celebration */}
      {streakMilestone && (
        <div
          onClick={() => setStreakMilestone(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3500,
            cursor: 'pointer',
          }}
        >
          <div
            className="milestone-popup"
            style={{
              backgroundImage: `linear-gradient(180deg, #ffd700 0%, #ffaa00 50%, #ff8800 100%)`,
              border: '4px solid #ffee00',
              borderRadius: '8px',
              boxShadow: '0 0 30px rgba(255,215,0,0.6), inset 0 0 15px rgba(255,255,255,0.3)',
              padding: '20px 30px',
              textAlign: 'center',
              fontFamily: '"Press Start 2P", "Courier New", monospace',
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: '10px',
            }}>
              🔥
            </div>
            <div style={{
              color: '#2a1810',
              fontSize: '10px',
              fontWeight: 'bold',
              marginBottom: '8px',
              textShadow: '1px 1px 0 rgba(255,255,255,0.5)',
            }}>
              {streakMilestone.days} Day Streak!
            </div>
            <div style={{
              color: '#4a3020',
              fontSize: '6px',
            }}>
              {streakMilestone.habitName}
            </div>
            <div style={{
              color: '#6a5040',
              fontSize: '5px',
              marginTop: '10px',
            }}>
              Click to continue
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Particles Container */}
      <div
        ref={particleContainerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 5000,
          overflow: 'hidden',
        }}
      >
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size}px ${particle.color}`,
              '--tx': `${particle.tx}px`,
              '--ty': `${particle.ty}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default RuneScapeHabitTracker;
