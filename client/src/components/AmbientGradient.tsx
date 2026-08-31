import { memo, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getThemeGradients, type ThemeGradients } from '../hooks/useAmbientGradient';

const ACTIVE_PULSE_DURATION = 3500; // Visible for 3 to 4 seconds (3.5s)
const COOLDOWN_DURATION = 45000;    // 45-second strict cooldown between triggers

/**
 * AmbientGradient
 *
 * Gemini-style top-down ambient atmosphere:
 * - Arrives for 3 to 4 seconds when user starts typing or sends a message.
 * - Strict 45-second cooldown: even if user continues typing, it stays quiet
 *   and will not reappear until 45 seconds have passed.
 */
export const AmbientGradient = memo(function AmbientGradient() {
  const { themeId } = useTheme();

  const gradients = useMemo(
    () => getThemeGradients(themeId),
    [themeId],
  );

  const [isActive, setIsActive] = useState(false);

  /* ── Cross-fade on theme change ───────────────────────── */
  const isInitialRef = useRef(true);
  const prevGradientsRef = useRef(gradients);
  const [fadingGradients, setFadingGradients] = useState<ThemeGradients | null>(null);

  const lastTriggeredTimeRef = useRef<number>(0);
  const activeTimerRef = useRef<number | null>(null);

  // Activates the ambient glow for 3.5s, strictly enforcing the 45s cooldown
  const triggerGlow = useCallback((force = false) => {
    const now = Date.now();
    const timeSinceLast = now - lastTriggeredTimeRef.current;

    // If within 45s cooldown and not forced (e.g. by theme switch), do nothing
    if (!force && timeSinceLast < COOLDOWN_DURATION) {
      return;
    }

    lastTriggeredTimeRef.current = now;

    if (activeTimerRef.current) {
      window.clearTimeout(activeTimerRef.current);
    }

    setIsActive(true);

    // Fade out after 3.5 seconds (3 to 4 seconds)
    activeTimerRef.current = window.setTimeout(() => {
      setIsActive(false);
    }, ACTIVE_PULSE_DURATION);
  }, []);

  // Listen for trigger events from typing or sending messages
  useEffect(() => {
    const handleTrigger = () => triggerGlow(false);
    window.addEventListener('ambient:trigger', handleTrigger);

    // Initial activation upon load so it's immediately visible
    triggerGlow(true);

    return () => {
      window.removeEventListener('ambient:trigger', handleTrigger);
      if (activeTimerRef.current) window.clearTimeout(activeTimerRef.current);
    };
  }, [triggerGlow]);

  // Handle theme transitions: shows a brief preview of the new theme
  useEffect(() => {
    if (isInitialRef.current) {
      isInitialRef.current = false;
      prevGradientsRef.current = gradients;
      return;
    }

    if (
      prevGradientsRef.current.base !== gradients.base ||
      prevGradientsRef.current.aurora !== gradients.aurora
    ) {
      setFadingGradients(prevGradientsRef.current);
      prevGradientsRef.current = gradients;
      triggerGlow(true);
      const timer = setTimeout(() => setFadingGradients(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [gradients, triggerGlow]);

  return (
    <div
      className={`ambient-gradient-host ${isActive ? 'is-active' : 'is-resting'}`}
      aria-hidden="true"
    >
      {/* Layer 1: Base fluid atmospheric canvas (top-down cascade) */}
      <div className="ambient-atmosphere-base" style={{ background: gradients.base }} />

      {/* Layer 2: Shimmering aurora highlight wave (top-down flow) */}
      <div className="ambient-atmosphere-aurora" style={{ background: gradients.aurora }} />

      {/* Cross-fade exit layers when switching theme */}
      {fadingGradients && (
        <>
          <div
            className="ambient-atmosphere-base ambient-atmosphere-exit"
            style={{ background: fadingGradients.base }}
          />
          <div
            className="ambient-atmosphere-aurora ambient-atmosphere-exit"
            style={{ background: fadingGradients.aurora }}
          />
        </>
      )}
    </div>
  );
});
