import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * OSRS-style sound effects hook
 * Manages audio playback with volume control and enable/disable toggle
 */
const useSoundEffects = () => {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('sound-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.3;
    const saved = localStorage.getItem('sound-volume');
    return saved !== null ? JSON.parse(saved) : 0.3;
  });

  // Audio refs to prevent recreation
  const audioRefs = useRef({});

  // Sound definitions with base64 encoded simple sounds
  // These are placeholder tones - replace with actual OSRS-style sounds
  const soundUrls = {
    click: 'data:audio/wav;base64,UklGRl9vT19teleX//8BAAgDAGABAABAAP//AQAOAAAAAA==',
    complete: null,
    levelUp: null,
    timerStart: null,
    timerStop: null,
    milestone: null,
  };

  // Create oscillator-based sounds (works without external files)
  const createSound = useCallback((type) => {
    if (typeof window === 'undefined' || !window.AudioContext) return null;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const configs = {
      click: { freq: 800, type: 'square', duration: 0.05, decay: 0.03 },
      complete: { freq: 600, type: 'square', duration: 0.15, decay: 0.1, freqEnd: 900 },
      levelUp: { freq: 400, type: 'square', duration: 0.4, decay: 0.3, freqEnd: 800 },
      timerStart: { freq: 500, type: 'square', duration: 0.1, decay: 0.05, freqEnd: 700 },
      timerStop: { freq: 700, type: 'square', duration: 0.1, decay: 0.05, freqEnd: 400 },
      milestone: { freq: 300, type: 'square', duration: 0.5, decay: 0.4, freqEnd: 900 },
    };

    const config = configs[type] || configs.click;

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.freq, audioContext.currentTime);

    if (config.freqEnd) {
      oscillator.frequency.linearRampToValueAtTime(config.freqEnd, audioContext.currentTime + config.duration);
    }

    gainNode.gain.setValueAtTime(volume * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);

    return { oscillator, audioContext, duration: config.duration };
  }, [volume]);

  // Play a sound by name
  const play = useCallback((soundName) => {
    if (!enabled) return;

    try {
      const sound = createSound(soundName);
      if (sound) {
        sound.oscillator.start(sound.audioContext.currentTime);
        sound.oscillator.stop(sound.audioContext.currentTime + sound.duration);
      }
    } catch (err) {
      // Silently fail if audio isn't available
      console.debug('Sound playback failed:', err);
    }
  }, [enabled, createSound]);

  // Toggle sound on/off
  const toggle = useCallback(() => {
    setEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('sound-enabled', JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  // Update volume
  const updateVolume = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    localStorage.setItem('sound-volume', JSON.stringify(clampedVolume));
  }, []);

  return {
    play,
    enabled,
    toggle,
    volume,
    setVolume: updateVolume,
  };
};

export default useSoundEffects;
