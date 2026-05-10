import { useRef, useCallback } from 'react';

const SWIPE_THRESHOLD = 72;    // px to trigger reply
const DRAG_RESISTANCE = 0.45;  // damping factor (elastic feel)
const SPRING_DURATION = 300;   // ms for spring-back animation

/** Returns whether the primary input is touch (mobile). */
const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

interface UseSwipeReplyOptions {
  onReply: () => void;
}

/**
 * Attaches swipe-right-to-reply gesture to a message element.
 * Works exclusively on touch/pointer-coarse devices.
 * Returns ref callback + touch event handlers to spread onto the element.
 */
export function useSwipeReply({ onReply }: UseSwipeReplyOptions) {
  // Refs so gesture state never causes re-renders
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isScrollingRef = useRef(false);
  const hasTriggeredRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  /** Apply transform without React reconciliation */
  const applyTranslation = useCallback((dx: number) => {
    const el = wrapperRef.current;
    const icon = iconRef.current;
    if (!el) return;

    const damped = dx * DRAG_RESISTANCE;
    el.style.transform = `translateX(${damped}px)`;
    el.style.transition = 'none';

    if (icon) {
      // Icon appears between 0 and SWIPE_THRESHOLD
      const progress = Math.min(1, damped / (SWIPE_THRESHOLD * DRAG_RESISTANCE));
      const scale = 0.5 + 0.5 * progress;
      const opacity = progress;
      icon.style.opacity = String(opacity);
      icon.style.transform = `scale(${scale})`;
    }
  }, []);

  /** Spring back to original position */
  const springBack = useCallback(() => {
    const el = wrapperRef.current;
    const icon = iconRef.current;
    if (!el) return;

    el.style.transition = `transform ${SPRING_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    el.style.transform = 'translateX(0px)';

    if (icon) {
      icon.style.transition = `opacity ${SPRING_DURATION}ms ease, transform ${SPRING_DURATION}ms ease`;
      icon.style.opacity = '0';
      icon.style.transform = 'scale(0.5)';
    }

    // Clean up transition after it ends
    setTimeout(() => {
      if (el) el.style.transition = '';
      if (icon) icon.style.transition = '';
    }, SPRING_DURATION + 50);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice()) return;

    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = 0;
    isDraggingRef.current = false;
    isScrollingRef.current = false;
    hasTriggeredRef.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice()) return;
    if (isScrollingRef.current) return;

    const touch = e.touches[0];
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    // First meaningful movement: decide if horizontal swipe or vertical scroll
    if (!isDraggingRef.current && !isScrollingRef.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) {
        // Vertical movement wins → let the scroll container handle it
        isScrollingRef.current = true;
        return;
      }
      if (dx > 8) {
        // Horizontal swipe to the right confirmed
        isDraggingRef.current = true;
      } else {
        return;
      }
    }

    if (!isDraggingRef.current) return;

    // Only allow rightward drag
    currentXRef.current = Math.max(0, dx);

    // Cancel existing animation frame to avoid stacking
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applyTranslation(currentXRef.current);
    });

    // Trigger reply at threshold – only once per gesture
    const damped = currentXRef.current * DRAG_RESISTANCE;
    if (damped >= SWIPE_THRESHOLD * DRAG_RESISTANCE && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      // Haptic feedback (supported on Android Chrome)
      if ('vibrate' in navigator) navigator.vibrate(30);
      onReply();
    }
  }, [applyTranslation, onReply]);

  const onTouchEnd = useCallback(() => {
    if (!isTouchDevice()) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    isDraggingRef.current = false;
    isScrollingRef.current = false;
    springBack();
  }, [springBack]);

  return {
    wrapperRef,
    iconRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
