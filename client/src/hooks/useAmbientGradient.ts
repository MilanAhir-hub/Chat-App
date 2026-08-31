import { useMemo } from 'react';
import type { ThemeId } from '../config/themes';

/* ─────────────────────────────────────────────────────────────
   Atmosphere Region
   Each region is a soft, diffuse radial-gradient ellipse.
   Positioned so the highest intensity cascades from the top-down.
   ───────────────────────────────────────────────────────────── */
export interface AtmosphereRegion {
  /** Hex color */
  color: string;
  /** Opacity (0–1). Baked into the gradient rgba stop. */
  opacity: number;
  /** Ellipse center-x in % of the element */
  cx: number;
  /** Ellipse center-y in % of the element */
  cy: number;
  /** Ellipse radius-x in % of the element */
  rx: number;
  /** Ellipse radius-y in % of the element */
  ry: number;
  /** % at which the gradient reaches full transparency */
  spread: number;
}

export type AmbientPalette = AtmosphereRegion[];

export interface ThemeGradients {
  base: string;
  aurora: string;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Composites an array of atmosphere regions into a single CSS
 * `background` value with stacked radial-gradient layers.
 */
export function buildGradientCSS(regions: AmbientPalette): string {
  return regions
    .map(
      (r) =>
        `radial-gradient(ellipse ${r.rx}% ${r.ry}% at ${r.cx}% ${r.cy}%, ` +
        `${hexToRgba(r.color, r.opacity)} 0%, transparent ${r.spread}%)`
    )
    .join(', ');
}

/**
 * Global trigger utility: call this when the user types or sends a message
 * to instantly illuminate the Gemini ambient gradient.
 */
export function triggerAmbientPulse(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ambient:trigger'));
  }
}

/* ─────────────────────────────────────────────────────────────
   Theme → Ambient Palette Map
   Carefully balanced opacities (soft & atmospheric, not blinding)
   mixing Red, Green, Blue & Yellow with top-down cascade.
   ───────────────────────────────────────────────────────────── */

export function getThemeGradients(themeId: ThemeId): ThemeGradients {
  const definitions: Record<ThemeId, { base: AmbientPalette; aurora: AmbientPalette }> = {

    /* ── A — Material Light ───────────────────────────────── */
    A: {
      base: [
        { color: '#6750A4', opacity: 0.10, cx: 8,   cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.07, cx: -6,  cy: 12,  rx: 120, ry: 130, spread: 52 },
        { color: '#FBBC05', opacity: 0.06, cx: 84,  cy: -5,  rx: 125, ry: 100, spread: 52 },
        { color: '#34A853', opacity: 0.05, cx: 12,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#EADDFF', opacity: 0.08, cx: 50,  cy: -10, rx: 140, ry: 90,  spread: 54 },
      ],
      aurora: [
        { color: '#FF1744', opacity: 0.06, cx: 12,  cy: -4,  rx: 120, ry: 110, spread: 48 },
        { color: '#7C4DFF', opacity: 0.08, cx: 35,  cy: 8,   rx: 130, ry: 100, spread: 50 },
        { color: '#FFD600', opacity: 0.05, cx: 78,  cy: 4,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── B — Material Dark ────────────────────────────────── */
    B: {
      base: [
        { color: '#7C4DFF', opacity: 0.45, cx: 6,   cy: -14, rx: 175, ry: 135, spread: 66 },
        { color: '#FF1744', opacity: 0.28, cx: -10, cy: 14,  rx: 130, ry: 145, spread: 54 },
        { color: '#FFB300', opacity: 0.24, cx: 86,  cy: -8,  rx: 145, ry: 110, spread: 55 },
        { color: '#00E676', opacity: 0.18, cx: 10,  cy: 40,  rx: 115, ry: 125, spread: 48 },
        { color: '#4F378B', opacity: 0.35, cx: 50,  cy: -15, rx: 155, ry: 110, spread: 60 },
      ],
      aurora: [
        { color: '#F50057', opacity: 0.25, cx: 12,  cy: -5,  rx: 130, ry: 120, spread: 50 },
        { color: '#651FFF', opacity: 0.22, cx: 32,  cy: 8,   rx: 140, ry: 110, spread: 52 },
        { color: '#FFAB00', opacity: 0.20, cx: 78,  cy: 6,   rx: 120, ry: 95,  spread: 48 },
        { color: '#00F59B', opacity: 0.14, cx: 15,  cy: 35,  rx: 105, ry: 110, spread: 42 },
      ],
    },

    /* ── C — Keep Light ───────────────────────────────────── */
    C: {
      base: [
        { color: '#FBBC05', opacity: 0.10, cx: 8,   cy: -10, rx: 155, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.07, cx: -6,  cy: 12,  rx: 115, ry: 125, spread: 52 },
        { color: '#1A73E8', opacity: 0.06, cx: 84,  cy: -5,  rx: 130, ry: 105, spread: 54 },
        { color: '#34A853', opacity: 0.05, cx: 12,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#FEF7E0', opacity: 0.08, cx: 50,  cy: -10, rx: 135, ry: 90,  spread: 52 },
      ],
      aurora: [
        { color: '#FF3D00', opacity: 0.06, cx: 14,  cy: -5,  rx: 120, ry: 110, spread: 48 },
        { color: '#FFD600', opacity: 0.08, cx: 38,  cy: 6,   rx: 130, ry: 100, spread: 50 },
        { color: '#00E5FF', opacity: 0.05, cx: 80,  cy: 4,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── D — Keep Dark ────────────────────────────────────── */
    D: {
      base: [
        { color: '#FF9100', opacity: 0.46, cx: 6,   cy: -14, rx: 175, ry: 135, spread: 66 },
        { color: '#FF3D00', opacity: 0.30, cx: -10, cy: 14,  rx: 130, ry: 145, spread: 54 },
        { color: '#2979FF', opacity: 0.25, cx: 85,  cy: -8,  rx: 145, ry: 110, spread: 55 },
        { color: '#00C853', opacity: 0.18, cx: 10,  cy: 40,  rx: 115, ry: 125, spread: 48 },
        { color: '#B06000', opacity: 0.32, cx: 50,  cy: -15, rx: 150, ry: 110, spread: 60 },
      ],
      aurora: [
        { color: '#FF6D00', opacity: 0.26, cx: 12,  cy: -4,  rx: 135, ry: 120, spread: 52 },
        { color: '#FFD600', opacity: 0.22, cx: 35,  cy: 8,   rx: 140, ry: 110, spread: 52 },
        { color: '#00E5FF', opacity: 0.20, cx: 80,  cy: 6,   rx: 120, ry: 95,  spread: 48 },
        { color: '#00F59B', opacity: 0.14, cx: 14,  cy: 35,  rx: 110, ry: 115, spread: 44 },
      ],
    },

    /* ── E — Gemini Light ─────────────────────────────────── */
    E: {
      base: [
        { color: '#0B57D0', opacity: 0.10, cx: 8,   cy: -10, rx: 165, ry: 125, spread: 65 },
        { color: '#D96570', opacity: 0.08, cx: -6,  cy: 12,  rx: 120, ry: 130, spread: 52 },
        { color: '#FBBC05', opacity: 0.06, cx: 85,  cy: -6,  rx: 130, ry: 105, spread: 54 },
        { color: '#34A853', opacity: 0.05, cx: 14,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#9B72CB', opacity: 0.07, cx: 52,  cy: -12, rx: 140, ry: 95,  spread: 52 },
      ],
      aurora: [
        { color: '#FF4081', opacity: 0.07, cx: 14,  cy: -4,  rx: 120, ry: 110, spread: 48 },
        { color: '#00B0FF', opacity: 0.06, cx: 38,  cy: 8,   rx: 130, ry: 100, spread: 50 },
        { color: '#FFD600', opacity: 0.05, cx: 78,  cy: 6,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── F — Gemini Dark (Gemini AI Signature Aurora) ────── */
    F: {
      base: [
        { color: '#E91E63', opacity: 0.46, cx: 5,   cy: -12, rx: 180, ry: 140, spread: 68 },
        { color: '#4285F4', opacity: 0.42, cx: 18,  cy: -15, rx: 175, ry: 135, spread: 66 },
        { color: '#FBBC05', opacity: 0.28, cx: 88,  cy: -6,  rx: 150, ry: 115, spread: 58 },
        { color: '#00E676', opacity: 0.20, cx: 8,   cy: 38,  rx: 125, ry: 140, spread: 50 },
        { color: '#004A77', opacity: 0.38, cx: 50,  cy: -12, rx: 160, ry: 120, spread: 62 },
      ],
      aurora: [
        { color: '#FF1744', opacity: 0.28, cx: 10,  cy: -4,  rx: 135, ry: 120, spread: 52 },
        { color: '#00E5FF', opacity: 0.24, cx: 30,  cy: 10,  rx: 145, ry: 110, spread: 52 },
        { color: '#FFAB00', opacity: 0.22, cx: 80,  cy: 8,   rx: 125, ry: 95,  spread: 48 },
        { color: '#00F59B', opacity: 0.16, cx: 12,  cy: 35,  rx: 115, ry: 115, spread: 45 },
      ],
    },

    /* ── G — Chat Light ───────────────────────────────────── */
    G: {
      base: [
        { color: '#00C853', opacity: 0.10, cx: 8,   cy: -10, rx: 155, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.07, cx: -6,  cy: 12,  rx: 115, ry: 125, spread: 52 },
        { color: '#1A73E8', opacity: 0.07, cx: 84,  cy: -5,  rx: 130, ry: 105, spread: 54 },
        { color: '#FBBC05', opacity: 0.06, cx: 12,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#E8F0FE', opacity: 0.08, cx: 50,  cy: -10, rx: 135, ry: 90,  spread: 52 },
      ],
      aurora: [
        { color: '#00E676', opacity: 0.07, cx: 12,  cy: -4,  rx: 120, ry: 110, spread: 48 },
        { color: '#00B0FF', opacity: 0.06, cx: 36,  cy: 8,   rx: 130, ry: 100, spread: 50 },
        { color: '#FF9100', opacity: 0.05, cx: 78,  cy: 5,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── H — Chat Dark ────────────────────────────────────── */
    H: {
      base: [
        { color: '#00E676', opacity: 0.44, cx: 6,   cy: -14, rx: 175, ry: 135, spread: 66 },
        { color: '#FF1744', opacity: 0.28, cx: -10, cy: 14,  rx: 130, ry: 145, spread: 54 },
        { color: '#2979FF', opacity: 0.30, cx: 85,  cy: -8,  rx: 145, ry: 110, spread: 55 },
        { color: '#FFB300', opacity: 0.20, cx: 12,  cy: 40,  rx: 115, ry: 125, spread: 48 },
        { color: '#174EA6', opacity: 0.35, cx: 48,  cy: -15, rx: 155, ry: 110, spread: 60 },
      ],
      aurora: [
        { color: '#00F59B', opacity: 0.26, cx: 12,  cy: -5,  rx: 135, ry: 120, spread: 52 },
        { color: '#00E5FF', opacity: 0.22, cx: 38,  cy: 8,   rx: 140, ry: 110, spread: 52 },
        { color: '#FF5252', opacity: 0.20, cx: 78,  cy: 6,   rx: 120, ry: 95,  spread: 48 },
        { color: '#FFD600', opacity: 0.16, cx: 14,  cy: 35,  rx: 110, ry: 115, spread: 44 },
      ],
    },

    /* ── I — Workspace Light ──────────────────────────────── */
    I: {
      base: [
        { color: '#1A73E8', opacity: 0.09, cx: 8,   cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.07, cx: -6,  cy: 12,  rx: 115, ry: 125, spread: 52 },
        { color: '#FBBC05', opacity: 0.06, cx: 82,  cy: -5,  rx: 125, ry: 100, spread: 52 },
        { color: '#34A853', opacity: 0.05, cx: 14,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#E8F0FE', opacity: 0.07, cx: 50,  cy: -10, rx: 140, ry: 90,  spread: 52 },
      ],
      aurora: [
        { color: '#4285F4', opacity: 0.07, cx: 12,  cy: -4,  rx: 120, ry: 110, spread: 48 },
        { color: '#00E676', opacity: 0.05, cx: 36,  cy: 8,   rx: 130, ry: 100, spread: 50 },
        { color: '#FFB300', opacity: 0.05, cx: 78,  cy: 5,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── J — Blue Light ───────────────────────────────────── */
    J: {
      base: [
        { color: '#1A73E8', opacity: 0.11, cx: 8,   cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.07, cx: -6,  cy: 14,  rx: 120, ry: 130, spread: 52 },
        { color: '#FBBC05', opacity: 0.06, cx: 84,  cy: -5,  rx: 130, ry: 105, spread: 54 },
        { color: '#00BFA5', opacity: 0.05, cx: 12,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#D2E3FC', opacity: 0.08, cx: 50,  cy: -10, rx: 140, ry: 90,  spread: 52 },
      ],
      aurora: [
        { color: '#2979FF', opacity: 0.08, cx: 14,  cy: -4,  rx: 120, ry: 110, spread: 48 },
        { color: '#00E5FF', opacity: 0.06, cx: 38,  cy: 8,   rx: 130, ry: 100, spread: 50 },
        { color: '#FF9100', opacity: 0.05, cx: 78,  cy: 5,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── K — Multi-color Google Light ─────────────────────── */
    K: {
      base: [
        { color: '#EA4335', opacity: 0.11, cx: 8,   cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#4285F4', opacity: 0.10, cx: 20,  cy: -10, rx: 150, ry: 115, spread: 60 },
        { color: '#FBBC05', opacity: 0.08, cx: 85,  cy: -6,  rx: 135, ry: 110, spread: 56 },
        { color: '#34A853', opacity: 0.07, cx: 10,  cy: 40,  rx: 115, ry: 125, spread: 50 },
        { color: '#E8F0FE', opacity: 0.07, cx: 50,  cy: -12, rx: 140, ry: 90,  spread: 52 },
      ],
      aurora: [
        { color: '#FF1744', opacity: 0.08, cx: 12,  cy: -4,  rx: 125, ry: 110, spread: 50 },
        { color: '#00E676', opacity: 0.07, cx: 35,  cy: 10,  rx: 130, ry: 100, spread: 50 },
        { color: '#FFD600', opacity: 0.07, cx: 78,  cy: 5,   rx: 115, ry: 90,  spread: 46 },
      ],
    },

    /* ── L — Minimal Light ────────────────────────────────── */
    L: {
      base: [
        { color: '#1A73E8', opacity: 0.07, cx: 8,   cy: -10, rx: 165, ry: 125, spread: 66 },
        { color: '#EA4335', opacity: 0.04, cx: -6,  cy: 12,  rx: 115, ry: 125, spread: 52 },
        { color: '#FBBC05', opacity: 0.04, cx: 82,  cy: -5,  rx: 125, ry: 100, spread: 52 },
        { color: '#34A853', opacity: 0.03, cx: 12,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#E8EAED', opacity: 0.06, cx: 50,  cy: -10, rx: 140, ry: 90,  spread: 52 },
      ],
      aurora: [
        { color: '#4285F4', opacity: 0.05, cx: 14,  cy: -4,  rx: 120, ry: 110, spread: 48 },
        { color: '#FFD600', opacity: 0.04, cx: 38,  cy: 8,   rx: 130, ry: 100, spread: 50 },
        { color: '#00E676', opacity: 0.03, cx: 78,  cy: 5,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── M — Messages Light (Default) ─────────────────────── */
    M: {
      base: [
        { color: '#0B57D0', opacity: 0.11, cx: 8,   cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.08, cx: -6,  cy: 12,  rx: 120, ry: 130, spread: 52 },
        { color: '#FBBC05', opacity: 0.06, cx: 82,  cy: -5,  rx: 130, ry: 105, spread: 54 },
        { color: '#34A853', opacity: 0.05, cx: 12,  cy: 40,  rx: 110, ry: 115, spread: 48 },
        { color: '#D3E3FD', opacity: 0.08, cx: 50,  cy: -10, rx: 140, ry: 90,  spread: 52 },
      ],
      aurora: [
        { color: '#FF1744', opacity: 0.07, cx: 12,  cy: -4,  rx: 120, ry: 110, spread: 48 },
        { color: '#00B0FF', opacity: 0.06, cx: 36,  cy: 8,   rx: 130, ry: 100, spread: 50 },
        { color: '#FFD600', opacity: 0.05, cx: 78,  cy: 5,   rx: 110, ry: 90,  spread: 45 },
      ],
    },

    /* ── N — Messages Dark ────────────────────────────────── */
    N: {
      base: [
        { color: '#2979FF', opacity: 0.46, cx: 6,   cy: -14, rx: 175, ry: 135, spread: 66 },
        { color: '#EA4335', opacity: 0.30, cx: -10, cy: 14,  rx: 130, ry: 145, spread: 54 },
        { color: '#FBBC05', opacity: 0.25, cx: 85,  cy: -8,  rx: 145, ry: 110, spread: 55 },
        { color: '#00E676', opacity: 0.18, cx: 12,  cy: 40,  rx: 115, ry: 125, spread: 48 },
        { color: '#0D47A1', opacity: 0.35, cx: 48,  cy: -15, rx: 155, ry: 110, spread: 60 },
      ],
      aurora: [
        { color: '#FF3D00', opacity: 0.26, cx: 12,  cy: -5,  rx: 135, ry: 120, spread: 52 },
        { color: '#00E5FF', opacity: 0.24, cx: 30,  cy: 6,   rx: 140, ry: 110, spread: 52 },
        { color: '#FFD600', opacity: 0.20, cx: 78,  cy: 8,   rx: 120, ry: 95,  spread: 48 },
        { color: '#00F59B', opacity: 0.15, cx: 8,   cy: 35,  rx: 110, ry: 115, spread: 44 },
      ],
    },
  };

  const def = definitions[themeId];
  return {
    base: buildGradientCSS(def.base),
    aurora: buildGradientCSS(def.aurora),
  };
}

/**
 * Convenience hook returning the dual-layer gradient CSS for the active theme.
 */
export function useAmbientGradient(themeId: ThemeId): ThemeGradients {
  return useMemo(() => getThemeGradients(themeId), [themeId]);
}
