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
   Gemini-inspired flowing aurora: blue → violet → magenta → bright green → amber,
   cascading softly from the top with large, smooth diffusion radii.
   ───────────────────────────────────────────────────────────── */

export function getThemeGradients(themeId: ThemeId): ThemeGradients {
  const definitions: Record<ThemeId, { base: AmbientPalette; aurora: AmbientPalette }> = {

    /* ── A — Material Light ───────────────────────────────── */
    A: {
      base: [
        { color: '#4F46E5', opacity: 0.08, cx: 8, cy: -18, rx: 170, ry: 130, spread: 68 },
        { color: '#EA4335', opacity: 0.06, cx: 28, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#9C27B0', opacity: 0.07, cx: 46, cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#F538A0', opacity: 0.07, cx: 64, cy: -12, rx: 150, ry: 115, spread: 62 },
        { color: '#6E8B3D', opacity: 0.06, cx: 82, cy: -14, rx: 148, ry: 112, spread: 60 },
        { color: '#FBBC05', opacity: 0.06, cx: 92, cy: -18, rx: 140, ry: 108, spread: 56 },
        { color: '#EADDFF', opacity: 0.06, cx: 50, cy: -22, rx: 190, ry: 100, spread: 60 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.06, cx: 16, cy: -6, rx: 135, ry: 105, spread: 52 },
        { color: '#7C4DFF', opacity: 0.07, cx: 38, cy: -6, rx: 140, ry: 110, spread: 55 },
        { color: '#FF4D8D', opacity: 0.06, cx: 60, cy: -4, rx: 145, ry: 105, spread: 55 },
        { color: '#7FA040', opacity: 0.05, cx: 80, cy: -6, rx: 132, ry: 96, spread: 50 },
        { color: '#FFD600', opacity: 0.05, cx: 92, cy: -6, rx: 125, ry: 90, spread: 48 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── B — Material Dark ────────────────────────────────── */
    B: {
      base: [
        { color: '#7C4DFF', opacity: 0.38, cx: 8, cy: -20, rx: 185, ry: 140, spread: 70 },
        { color: '#E53935', opacity: 0.28, cx: 28, cy: -14, rx: 165, ry: 128, spread: 64 },
        { color: '#9C27B0', opacity: 0.32, cx: 46, cy: -12, rx: 170, ry: 130, spread: 66 },
        { color: '#FF4D8D', opacity: 0.30, cx: 64, cy: -14, rx: 160, ry: 125, spread: 64 },
        { color: '#6E8B3D', opacity: 0.24, cx: 82, cy: -16, rx: 155, ry: 120, spread: 62 },
        { color: '#FFAB40', opacity: 0.24, cx: 92, cy: -18, rx: 148, ry: 112, spread: 58 },
        { color: '#4F378B', opacity: 0.28, cx: 50, cy: -24, rx: 200, ry: 110, spread: 62 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#FF2D55', opacity: 0.24, cx: 16, cy: -6, rx: 145, ry: 110, spread: 54 },
        { color: '#651FFF', opacity: 0.26, cx: 38, cy: -6, rx: 150, ry: 115, spread: 56 },
        { color: '#FF2D95', opacity: 0.24, cx: 58, cy: -4, rx: 150, ry: 110, spread: 56 },
        { color: '#7FA040', opacity: 0.20, cx: 78, cy: -6, rx: 140, ry: 100, spread: 52 },
        { color: '#FFC400', opacity: 0.18, cx: 90, cy: -6, rx: 130, ry: 95, spread: 50 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── C — Keep Light ───────────────────────────────────── */
    C: {
      base: [
        { color: '#FBBC05', opacity: 0.09, cx: 8, cy: -18, rx: 170, ry: 130, spread: 66 },
        { color: '#EA4335', opacity: 0.07, cx: 28, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#FA7B17', opacity: 0.07, cx: 48, cy: -10, rx: 155, ry: 120, spread: 62 },
        { color: '#F538A0', opacity: 0.06, cx: 66, cy: -12, rx: 150, ry: 115, spread: 60 },
        { color: '#6E8B3D', opacity: 0.06, cx: 84, cy: -14, rx: 145, ry: 110, spread: 58 },
        { color: '#4285F4', opacity: 0.06, cx: 94, cy: -16, rx: 140, ry: 108, spread: 56 },
        { color: '#FEF7E0', opacity: 0.08, cx: 50, cy: -20, rx: 185, ry: 100, spread: 58 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.06, cx: 16, cy: -6, rx: 135, ry: 105, spread: 52 },
        { color: '#FF9100', opacity: 0.07, cx: 40, cy: -4, rx: 140, ry: 100, spread: 54 },
        { color: '#FFD600', opacity: 0.06, cx: 62, cy: -4, rx: 138, ry: 100, spread: 52 },
        { color: '#7FA040', opacity: 0.05, cx: 80, cy: -6, rx: 130, ry: 95, spread: 50 },
        { color: '#00B8D4', opacity: 0.05, cx: 92, cy: -6, rx: 125, ry: 92, spread: 48 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── D — Keep Dark ────────────────────────────────────── */
    D: {
      base: [
        { color: '#FFAB00', opacity: 0.40, cx: 8, cy: -20, rx: 185, ry: 140, spread: 70 },
        { color: '#E53935', opacity: 0.28, cx: 28, cy: -14, rx: 165, ry: 128, spread: 64 },
        { color: '#FF6D00', opacity: 0.30, cx: 48, cy: -12, rx: 170, ry: 130, spread: 66 },
        { color: '#FF2D95', opacity: 0.26, cx: 66, cy: -14, rx: 160, ry: 125, spread: 62 },
        { color: '#6E8B3D', opacity: 0.24, cx: 84, cy: -16, rx: 152, ry: 118, spread: 60 },
        { color: '#2979FF', opacity: 0.22, cx: 94, cy: -18, rx: 145, ry: 112, spread: 56 },
        { color: '#B06000', opacity: 0.28, cx: 50, cy: -24, rx: 195, ry: 110, spread: 60 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#FF3B30', opacity: 0.22, cx: 16, cy: -6, rx: 145, ry: 110, spread: 54 },
        { color: '#FF9100', opacity: 0.24, cx: 40, cy: -4, rx: 145, ry: 108, spread: 54 },
        { color: '#FFEA00', opacity: 0.20, cx: 62, cy: -4, rx: 142, ry: 104, spread: 52 },
        { color: '#7FA040', opacity: 0.18, cx: 80, cy: -6, rx: 135, ry: 98, spread: 50 },
        { color: '#00E5FF', opacity: 0.16, cx: 92, cy: -6, rx: 128, ry: 95, spread: 48 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── E — Gemini Light ─────────────────────────────────── */
    E: {
      base: [
        { color: '#4285F4', opacity: 0.09, cx: 8, cy: -20, rx: 180, ry: 135, spread: 68 },
        { color: '#EA4335', opacity: 0.07, cx: 28, cy: -14, rx: 160, ry: 122, spread: 62 },
        { color: '#9C6ADE', opacity: 0.08, cx: 48, cy: -10, rx: 165, ry: 125, spread: 64 },
        { color: '#F538A0', opacity: 0.07, cx: 66, cy: -12, rx: 155, ry: 118, spread: 62 },
        { color: '#6E8B3D', opacity: 0.06, cx: 84, cy: -16, rx: 148, ry: 112, spread: 58 },
        { color: '#FBBC05', opacity: 0.06, cx: 94, cy: -18, rx: 140, ry: 108, spread: 56 },
        { color: '#E8F0FE', opacity: 0.06, cx: 50, cy: -22, rx: 195, ry: 105, spread: 58 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.06, cx: 16, cy: -6, rx: 138, ry: 105, spread: 52 },
        { color: '#667EEA', opacity: 0.07, cx: 38, cy: -6, rx: 145, ry: 110, spread: 55 },
        { color: '#FF6EC7', opacity: 0.06, cx: 60, cy: -4, rx: 145, ry: 105, spread: 54 },
        { color: '#7FA040', opacity: 0.05, cx: 80, cy: -6, rx: 132, ry: 96, spread: 50 },
        { color: '#FFD600', opacity: 0.05, cx: 92, cy: -6, rx: 125, ry: 92, spread: 48 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── F — Gemini Dark (Gemini AI Signature Aurora) ────── */
    F: {
      base: [
        { color: '#4285F4', opacity: 0.44, cx: 6, cy: -22, rx: 195, ry: 145, spread: 72 },
        { color: '#E53935', opacity: 0.32, cx: 26, cy: -16, rx: 175, ry: 130, spread: 66 },
        { color: '#9C27B0', opacity: 0.38, cx: 46, cy: -12, rx: 180, ry: 135, spread: 68 },
        { color: '#F538A0', opacity: 0.34, cx: 64, cy: -14, rx: 170, ry: 128, spread: 65 },
        { color: '#6E8B3D', opacity: 0.28, cx: 82, cy: -18, rx: 155, ry: 120, spread: 62 },
        { color: '#FBBC05', opacity: 0.26, cx: 94, cy: -20, rx: 150, ry: 115, spread: 58 },
        { color: '#1A237E', opacity: 0.28, cx: 50, cy: -26, rx: 210, ry: 115, spread: 62 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#FF3B30', opacity: 0.26, cx: 16, cy: -6, rx: 150, ry: 115, spread: 56 },
        { color: '#667EEA', opacity: 0.28, cx: 38, cy: -6, rx: 160, ry: 120, spread: 58 },
        { color: '#E91E8C', opacity: 0.26, cx: 58, cy: -2, rx: 160, ry: 115, spread: 58 },
        { color: '#7FA040', opacity: 0.22, cx: 78, cy: -4, rx: 145, ry: 105, spread: 54 },
        { color: '#FFC400', opacity: 0.20, cx: 92, cy: -6, rx: 135, ry: 98, spread: 50 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── G — Chat Light ───────────────────────────────────── */
    G: {
      base: [
        { color: '#34A853', opacity: 0.08, cx: 8, cy: -18, rx: 165, ry: 128, spread: 64 },
        { color: '#EA4335', opacity: 0.06, cx: 28, cy: -12, rx: 152, ry: 118, spread: 60 },
        { color: '#F538A0', opacity: 0.06, cx: 48, cy: -10, rx: 150, ry: 115, spread: 58 },
        { color: '#4285F4', opacity: 0.07, cx: 68, cy: -12, rx: 150, ry: 115, spread: 58 },
        { color: '#6E8B3D', opacity: 0.06, cx: 86, cy: -16, rx: 144, ry: 110, spread: 56 },
        { color: '#FBBC05', opacity: 0.06, cx: 94, cy: -18, rx: 138, ry: 106, spread: 54 },
        { color: '#E6F4EA', opacity: 0.07, cx: 50, cy: -20, rx: 185, ry: 100, spread: 56 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.06, cx: 16, cy: -6, rx: 135, ry: 104, spread: 52 },
        { color: '#00E676', opacity: 0.07, cx: 38, cy: -6, rx: 135, ry: 105, spread: 52 },
        { color: '#00B0FF', opacity: 0.06, cx: 60, cy: -4, rx: 140, ry: 100, spread: 54 },
        { color: '#7FA040', opacity: 0.05, cx: 80, cy: -6, rx: 128, ry: 94, spread: 48 },
        { color: '#FFD600', opacity: 0.05, cx: 92, cy: -6, rx: 122, ry: 90, spread: 46 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── H — Chat Dark ────────────────────────────────────── */
    H: {
      base: [
        { color: '#00E676', opacity: 0.38, cx: 8, cy: -20, rx: 180, ry: 138, spread: 68 },
        { color: '#E53935', opacity: 0.28, cx: 28, cy: -14, rx: 165, ry: 126, spread: 62 },
        { color: '#FF2D95', opacity: 0.24, cx: 48, cy: -12, rx: 160, ry: 122, spread: 60 },
        { color: '#2979FF', opacity: 0.28, cx: 68, cy: -14, rx: 158, ry: 120, spread: 60 },
        { color: '#6E8B3D', opacity: 0.26, cx: 86, cy: -18, rx: 150, ry: 114, spread: 58 },
        { color: '#FFAB00', opacity: 0.22, cx: 94, cy: -20, rx: 144, ry: 110, spread: 54 },
        { color: '#0D3B2E', opacity: 0.26, cx: 50, cy: -24, rx: 195, ry: 108, spread: 58 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#FF3B30', opacity: 0.22, cx: 16, cy: -6, rx: 142, ry: 108, spread: 52 },
        { color: '#00F5A0', opacity: 0.24, cx: 38, cy: -6, rx: 148, ry: 112, spread: 54 },
        { color: '#00E5FF', opacity: 0.20, cx: 60, cy: -4, rx: 145, ry: 106, spread: 52 },
        { color: '#7FA040', opacity: 0.20, cx: 80, cy: -6, rx: 136, ry: 98, spread: 50 },
        { color: '#FFD600', opacity: 0.14, cx: 92, cy: -6, rx: 122, ry: 92, spread: 46 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── I — Workspace Light ──────────────────────────────── */
    I: {
      base: [
        { color: '#4285F4', opacity: 0.09, cx: 8, cy: -18, rx: 165, ry: 128, spread: 64 },
        { color: '#EA4335', opacity: 0.07, cx: 28, cy: -12, rx: 152, ry: 118, spread: 60 },
        { color: '#F538A0', opacity: 0.06, cx: 48, cy: -10, rx: 148, ry: 115, spread: 58 },
        { color: '#FBBC05', opacity: 0.07, cx: 68, cy: -12, rx: 148, ry: 112, spread: 56 },
        { color: '#6E8B3D', opacity: 0.06, cx: 88, cy: -16, rx: 142, ry: 108, spread: 56 },
        { color: '#E8F0FE', opacity: 0.07, cx: 50, cy: -20, rx: 185, ry: 100, spread: 56 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.06, cx: 16, cy: -6, rx: 135, ry: 104, spread: 52 },
        { color: '#4285F4', opacity: 0.07, cx: 40, cy: -6, rx: 135, ry: 105, spread: 52 },
        { color: '#FF6EC7', opacity: 0.05, cx: 62, cy: -4, rx: 138, ry: 100, spread: 52 },
        { color: '#7FA040', opacity: 0.05, cx: 82, cy: -6, rx: 128, ry: 94, spread: 48 },
        { color: '#FFB300', opacity: 0.05, cx: 92, cy: -6, rx: 120, ry: 90, spread: 46 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── J — Blue Light ───────────────────────────────────── */
    J: {
      base: [
        { color: '#1A73E8', opacity: 0.11, cx: 8, cy: -18, rx: 175, ry: 132, spread: 66 },
        { color: '#EA4335', opacity: 0.06, cx: 28, cy: -12, rx: 155, ry: 118, spread: 60 },
        { color: '#F538A0', opacity: 0.06, cx: 48, cy: -10, rx: 150, ry: 116, spread: 58 },
        { color: '#4285F4', opacity: 0.09, cx: 68, cy: -12, rx: 160, ry: 122, spread: 62 },
        { color: '#6E8B3D', opacity: 0.06, cx: 88, cy: -16, rx: 142, ry: 108, spread: 56 },
        { color: '#D2E3FC', opacity: 0.08, cx: 50, cy: -20, rx: 190, ry: 100, spread: 58 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.06, cx: 16, cy: -6, rx: 136, ry: 104, spread: 52 },
        { color: '#2979FF', opacity: 0.08, cx: 40, cy: -6, rx: 140, ry: 106, spread: 54 },
        { color: '#FF4D8D', opacity: 0.06, cx: 62, cy: -4, rx: 140, ry: 102, spread: 52 },
        { color: '#7FA040', opacity: 0.05, cx: 82, cy: -6, rx: 130, ry: 95, spread: 50 },
        { color: '#7C4DFF', opacity: 0.05, cx: 92, cy: -6, rx: 122, ry: 92, spread: 46 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── K — Multi-color Google Light ─────────────────────── */
    K: {
      base: [
        { color: '#4285F4', opacity: 0.09, cx: 8, cy: -18, rx: 168, ry: 128, spread: 64 },
        { color: '#EA4335', opacity: 0.08, cx: 28, cy: -12, rx: 155, ry: 120, spread: 60 },
        { color: '#F538A0', opacity: 0.06, cx: 48, cy: -10, rx: 150, ry: 116, spread: 58 },
        { color: '#FBBC05', opacity: 0.07, cx: 68, cy: -12, rx: 150, ry: 115, spread: 58 },
        { color: '#6E8B3D', opacity: 0.06, cx: 88, cy: -16, rx: 142, ry: 108, spread: 56 },
        { color: '#F1F3F4', opacity: 0.06, cx: 50, cy: -20, rx: 190, ry: 100, spread: 56 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.07, cx: 16, cy: -6, rx: 135, ry: 104, spread: 52 },
        { color: '#4285F4', opacity: 0.07, cx: 40, cy: -4, rx: 138, ry: 100, spread: 52 },
        { color: '#FF6EC7', opacity: 0.06, cx: 62, cy: -4, rx: 138, ry: 100, spread: 52 },
        { color: '#7FA040', opacity: 0.05, cx: 82, cy: -6, rx: 128, ry: 94, spread: 48 },
        { color: '#FBBC05', opacity: 0.05, cx: 92, cy: -6, rx: 120, ry: 90, spread: 46 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── L — Minimal Light ────────────────────────────────── */
    L: {
      base: [
        { color: '#4285F4', opacity: 0.06, cx: 8, cy: -18, rx: 175, ry: 132, spread: 68 },
        { color: '#EA4335', opacity: 0.04, cx: 28, cy: -12, rx: 155, ry: 118, spread: 60 },
        { color: '#F538A0', opacity: 0.04, cx: 48, cy: -10, rx: 155, ry: 116, spread: 60 },
        { color: '#9C6ADE', opacity: 0.05, cx: 68, cy: -12, rx: 160, ry: 120, spread: 62 },
        { color: '#6E8B3D', opacity: 0.04, cx: 88, cy: -16, rx: 142, ry: 108, spread: 56 },
        { color: '#F1F3F4', opacity: 0.05, cx: 50, cy: -20, rx: 195, ry: 100, spread: 58 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.04, cx: 16, cy: -6, rx: 132, ry: 102, spread: 50 },
        { color: '#667EEA', opacity: 0.05, cx: 40, cy: -6, rx: 140, ry: 106, spread: 54 },
        { color: '#FF6EC7', opacity: 0.04, cx: 62, cy: -4, rx: 135, ry: 100, spread: 50 },
        { color: '#7FA040', opacity: 0.03, cx: 82, cy: -6, rx: 125, ry: 94, spread: 48 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── M — Messages Light (Default) ─────────────────────── */
    M: {
      base: [
        { color: '#4285F4', opacity: 0.10, cx: 8, cy: -18, rx: 175, ry: 130, spread: 66 },
        { color: '#EA4335', opacity: 0.07, cx: 28, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#9C6ADE', opacity: 0.08, cx: 48, cy: -10, rx: 160, ry: 122, spread: 62 },
        { color: '#F538A0', opacity: 0.07, cx: 66, cy: -12, rx: 152, ry: 116, spread: 60 },
        { color: '#6E8B3D', opacity: 0.06, cx: 84, cy: -16, rx: 145, ry: 110, spread: 58 },
        { color: '#FBBC05', opacity: 0.06, cx: 94, cy: -18, rx: 142, ry: 108, spread: 56 },
        { color: '#D3E3FD', opacity: 0.08, cx: 50, cy: -20, rx: 190, ry: 100, spread: 58 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.06, cx: 16, cy: -6, rx: 136, ry: 104, spread: 52 },
        { color: '#667EEA', opacity: 0.07, cx: 38, cy: -6, rx: 140, ry: 106, spread: 54 },
        { color: '#FF6EC7', opacity: 0.06, cx: 60, cy: -4, rx: 142, ry: 100, spread: 52 },
        { color: '#7FA040', opacity: 0.05, cx: 80, cy: -6, rx: 130, ry: 95, spread: 50 },
        { color: '#FFD600', opacity: 0.05, cx: 92, cy: -6, rx: 125, ry: 92, spread: 48 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── N — Messages Dark ────────────────────────────────── */
    N: {
      base: [
        { color: '#2979FF', opacity: 0.44, cx: 6, cy: -22, rx: 190, ry: 140, spread: 70 },
        { color: '#E53935', opacity: 0.32, cx: 26, cy: -16, rx: 175, ry: 130, spread: 66 },
        { color: '#9C27B0', opacity: 0.34, cx: 46, cy: -14, rx: 175, ry: 130, spread: 66 },
        { color: '#F538A0', opacity: 0.30, cx: 64, cy: -16, rx: 165, ry: 124, spread: 62 },
        { color: '#6E8B3D', opacity: 0.26, cx: 82, cy: -18, rx: 155, ry: 118, spread: 60 },
        { color: '#FFAB00', opacity: 0.24, cx: 92, cy: -20, rx: 150, ry: 114, spread: 58 },
        { color: '#0D47A1', opacity: 0.28, cx: 50, cy: -26, rx: 200, ry: 112, spread: 60 },
        { color: '#39FF14', opacity: 0.045, cx: 58, cy: -18, rx: 175, ry: 125, spread: 60 },
      ],
      aurora: [
        { color: '#FF3B30', opacity: 0.24, cx: 16, cy: -6, rx: 148, ry: 112, spread: 54 },
        { color: '#536DFE', opacity: 0.26, cx: 38, cy: -6, rx: 155, ry: 116, spread: 56 },
        { color: '#FF2D95', opacity: 0.22, cx: 58, cy: -2, rx: 152, ry: 110, spread: 54 },
        { color: '#7FA040', opacity: 0.20, cx: 78, cy: -4, rx: 142, ry: 104, spread: 52 },
        { color: '#FFD600', opacity: 0.18, cx: 92, cy: -6, rx: 135, ry: 98, spread: 50 },
        { color: '#39FF14', opacity: 0.035, cx: 50, cy: -5, rx: 145, ry: 105, spread: 52 },
      ],
    },

    /* ── O — Chrome Coral Light ───────────────────────────── */
    O: {
      base: [
        { color: '#EA4335', opacity: 0.09, cx: 8, cy: -18, rx: 170, ry: 130, spread: 68 },
        { color: '#FBBC05', opacity: 0.06, cx: 32, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#6E8B3D', opacity: 0.05, cx: 55, cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#4285F4', opacity: 0.06, cx: 78, cy: -14, rx: 150, ry: 115, spread: 62 },
        { color: '#FCE8E6', opacity: 0.08, cx: 50, cy: -22, rx: 190, ry: 100, spread: 60 },
      ],
      aurora: [
        { color: '#EA4335', opacity: 0.08, cx: 18, cy: -6, rx: 140, ry: 110, spread: 55 },
        { color: '#FA7B17', opacity: 0.06, cx: 48, cy: -4, rx: 145, ry: 105, spread: 55 },
        { color: '#7FA040', opacity: 0.05, cx: 75, cy: -6, rx: 135, ry: 95, spread: 50 },
        { color: '#4285F4', opacity: 0.05, cx: 92, cy: -6, rx: 125, ry: 90, spread: 48 },
      ],
    },

    /* ── P — Chrome Coral Dark ────────────────────────────── */
    P: {
      base: [
        { color: '#EA4335', opacity: 0.42, cx: 8, cy: -20, rx: 180, ry: 140, spread: 70 },
        { color: '#FBBC05', opacity: 0.28, cx: 32, cy: -15, rx: 165, ry: 125, spread: 65 },
        { color: '#6E8B3D', opacity: 0.24, cx: 55, cy: -12, rx: 170, ry: 130, spread: 65 },
        { color: '#4285F4', opacity: 0.26, cx: 78, cy: -16, rx: 160, ry: 120, spread: 60 },
        { color: '#5C1D1D', opacity: 0.32, cx: 50, cy: -24, rx: 195, ry: 110, spread: 60 },
      ],
      aurora: [
        { color: '#F28B82', opacity: 0.30, cx: 18, cy: -6, rx: 145, ry: 115, spread: 55 },
        { color: '#FA7B17', opacity: 0.22, cx: 48, cy: -3, rx: 150, ry: 110, spread: 55 },
        { color: '#7FA040', opacity: 0.18, cx: 75, cy: -5, rx: 140, ry: 100, spread: 50 },
        { color: '#8AB4F8', opacity: 0.20, cx: 92, cy: -6, rx: 130, ry: 95, spread: 48 },
      ],
    },

    /* ── Q — Android Mint Light ───────────────────────────── */
    Q: {
      base: [
        { color: '#188038', opacity: 0.08, cx: 8, cy: -18, rx: 170, ry: 130, spread: 68 },
        { color: '#6E8B3D', opacity: 0.06, cx: 30, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#4285F4', opacity: 0.05, cx: 55, cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.04, cx: 78, cy: -14, rx: 150, ry: 115, spread: 62 },
        { color: '#E6F4EA', opacity: 0.08, cx: 50, cy: -22, rx: 190, ry: 100, spread: 60 },
      ],
      aurora: [
        { color: '#34A853', opacity: 0.07, cx: 18, cy: -6, rx: 140, ry: 110, spread: 55 },
        { color: '#7FA040', opacity: 0.06, cx: 45, cy: -4, rx: 145, ry: 105, spread: 55 },
        { color: '#00ACC1', opacity: 0.05, cx: 75, cy: -6, rx: 135, ry: 95, spread: 50 },
      ],
    },

    /* ── R — Android Mint Dark ────────────────────────────── */
    R: {
      base: [
        { color: '#188038', opacity: 0.38, cx: 8, cy: -20, rx: 180, ry: 140, spread: 70 },
        { color: '#6E8B3D', opacity: 0.28, cx: 30, cy: -15, rx: 165, ry: 125, spread: 65 },
        { color: '#4285F4', opacity: 0.24, cx: 55, cy: -12, rx: 170, ry: 130, spread: 65 },
        { color: '#E53935', opacity: 0.20, cx: 80, cy: -16, rx: 155, ry: 115, spread: 60 },
      ],
      aurora: [
        { color: '#81C995', opacity: 0.28, cx: 18, cy: -6, rx: 145, ry: 115, spread: 55 },
        { color: '#7FA040', opacity: 0.22, cx: 48, cy: -3, rx: 150, ry: 110, spread: 55 },
        { color: '#4DD0E1', opacity: 0.18, cx: 78, cy: -5, rx: 140, ry: 100, spread: 50 },
      ],
    },

    /* ── S — Google Play Teal Light ───────────────────────── */
    S: {
      base: [
        { color: '#00838F', opacity: 0.08, cx: 8, cy: -18, rx: 170, ry: 130, spread: 68 },
        { color: '#4285F4', opacity: 0.06, cx: 35, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#6E8B3D', opacity: 0.05, cx: 60, cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#EA4335', opacity: 0.04, cx: 85, cy: -14, rx: 145, ry: 110, spread: 60 },
      ],
      aurora: [
        { color: '#00ACC1', opacity: 0.07, cx: 20, cy: -6, rx: 140, ry: 110, spread: 55 },
        { color: '#2979FF', opacity: 0.06, cx: 50, cy: -4, rx: 145, ry: 105, spread: 55 },
        { color: '#7FA040', opacity: 0.05, cx: 80, cy: -6, rx: 135, ry: 95, spread: 50 },
      ],
    },

    /* ── T — Google Play Teal Dark ────────────────────────── */
    T: {
      base: [
        { color: '#00838F', opacity: 0.40, cx: 8, cy: -20, rx: 180, ry: 140, spread: 70 },
        { color: '#2979FF', opacity: 0.30, cx: 35, cy: -15, rx: 165, ry: 125, spread: 65 },
        { color: '#6E8B3D', opacity: 0.24, cx: 60, cy: -12, rx: 170, ry: 130, spread: 65 },
        { color: '#E53935', opacity: 0.20, cx: 85, cy: -16, rx: 155, ry: 115, spread: 60 },
      ],
      aurora: [
        { color: '#4DD0E1', opacity: 0.28, cx: 20, cy: -6, rx: 145, ry: 115, spread: 55 },
        { color: '#536DFE', opacity: 0.22, cx: 50, cy: -3, rx: 150, ry: 110, spread: 55 },
        { color: '#7FA040', opacity: 0.18, cx: 80, cy: -5, rx: 140, ry: 100, spread: 50 },
      ],
    },

    /* ── U — Pixel Sunset Light ───────────────────────────── */
    U: {
      base: [
        { color: '#E8710A', opacity: 0.08, cx: 8, cy: -18, rx: 170, ry: 130, spread: 68 },
        { color: '#EA4335', opacity: 0.06, cx: 32, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#FBBC05', opacity: 0.06, cx: 58, cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#6E8B3D', opacity: 0.05, cx: 82, cy: -14, rx: 148, ry: 112, spread: 60 },
      ],
      aurora: [
        { color: '#FA7B17', opacity: 0.07, cx: 18, cy: -6, rx: 140, ry: 110, spread: 55 },
        { color: '#FF3B30', opacity: 0.06, cx: 48, cy: -4, rx: 145, ry: 105, spread: 55 },
        { color: '#7FA040', opacity: 0.05, cx: 78, cy: -6, rx: 135, ry: 95, spread: 50 },
      ],
    },

    /* ── V — Pixel Sunset Dark ────────────────────────────── */
    V: {
      base: [
        { color: '#E8710A', opacity: 0.40, cx: 8, cy: -20, rx: 180, ry: 140, spread: 70 },
        { color: '#E53935', opacity: 0.30, cx: 32, cy: -15, rx: 165, ry: 125, spread: 65 },
        { color: '#FFAB00', opacity: 0.26, cx: 58, cy: -12, rx: 170, ry: 130, spread: 65 },
        { color: '#6E8B3D', opacity: 0.22, cx: 82, cy: -16, rx: 155, ry: 115, spread: 60 },
      ],
      aurora: [
        { color: '#FFB59D', opacity: 0.28, cx: 18, cy: -6, rx: 145, ry: 115, spread: 55 },
        { color: '#FF3B30', opacity: 0.22, cx: 48, cy: -3, rx: 150, ry: 110, spread: 55 },
        { color: '#7FA040', opacity: 0.18, cx: 78, cy: -5, rx: 140, ry: 100, spread: 50 },
      ],
    },

    /* ── W — YouTube Red Light ────────────────────────────── */
    W: {
      base: [
        { color: '#CC0000', opacity: 0.08, cx: 8, cy: -18, rx: 170, ry: 130, spread: 68 },
        { color: '#EA4335', opacity: 0.06, cx: 32, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#6E8B3D', opacity: 0.05, cx: 58, cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#4285F4', opacity: 0.05, cx: 82, cy: -14, rx: 148, ry: 112, spread: 60 },
      ],
      aurora: [
        { color: '#FF0000', opacity: 0.07, cx: 18, cy: -6, rx: 140, ry: 110, spread: 55 },
        { color: '#FF4D8D', opacity: 0.06, cx: 48, cy: -4, rx: 145, ry: 105, spread: 55 },
        { color: '#7FA040', opacity: 0.05, cx: 78, cy: -6, rx: 135, ry: 95, spread: 50 },
      ],
    },

    /* ── X — YouTube Red Dark ─────────────────────────────── */
    X: {
      base: [
        { color: '#CC0000', opacity: 0.44, cx: 8, cy: -20, rx: 180, ry: 140, spread: 70 },
        { color: '#E53935', opacity: 0.32, cx: 32, cy: -15, rx: 165, ry: 125, spread: 65 },
        { color: '#6E8B3D', opacity: 0.24, cx: 58, cy: -12, rx: 170, ry: 130, spread: 65 },
        { color: '#2979FF', opacity: 0.24, cx: 82, cy: -16, rx: 155, ry: 115, spread: 60 },
      ],
      aurora: [
        { color: '#FF4E45', opacity: 0.30, cx: 18, cy: -6, rx: 145, ry: 115, spread: 55 },
        { color: '#FF2D95', opacity: 0.22, cx: 48, cy: -3, rx: 150, ry: 110, spread: 55 },
        { color: '#7FA040', opacity: 0.18, cx: 78, cy: -5, rx: 140, ry: 100, spread: 50 },
      ],
    },

    /* ── Y — Pixel Porcelain Light ────────────────────────── */
    Y: {
      base: [
        { color: '#4285F4', opacity: 0.06, cx: 8, cy: -18, rx: 170, ry: 130, spread: 68 },
        { color: '#EA4335', opacity: 0.05, cx: 32, cy: -12, rx: 155, ry: 120, spread: 62 },
        { color: '#6E8B3D', opacity: 0.05, cx: 58, cy: -10, rx: 160, ry: 120, spread: 64 },
        { color: '#FBBC05', opacity: 0.05, cx: 82, cy: -14, rx: 148, ry: 112, spread: 60 },
      ],
      aurora: [
        { color: '#2979FF', opacity: 0.05, cx: 18, cy: -6, rx: 140, ry: 110, spread: 55 },
        { color: '#FF3B30', opacity: 0.05, cx: 48, cy: -4, rx: 145, ry: 105, spread: 55 },
        { color: '#7FA040', opacity: 0.04, cx: 78, cy: -6, rx: 135, ry: 95, spread: 50 },
      ],
    },

    /* ── Z — Pixel Obsidian OLED Dark ─────────────────────── */
    Z: {
      base: [
        { color: '#2979FF', opacity: 0.46, cx: 8, cy: -20, rx: 180, ry: 140, spread: 70 },
        { color: '#E53935', opacity: 0.30, cx: 32, cy: -15, rx: 165, ry: 125, spread: 65 },
        { color: '#6E8B3D', opacity: 0.24, cx: 58, cy: -12, rx: 170, ry: 130, spread: 65 },
        { color: '#9C27B0', opacity: 0.28, cx: 82, cy: -16, rx: 155, ry: 115, spread: 60 },
      ],
      aurora: [
        { color: '#8AB4F8', opacity: 0.28, cx: 18, cy: -6, rx: 145, ry: 115, spread: 55 },
        { color: '#FF3B30', opacity: 0.20, cx: 48, cy: -3, rx: 150, ry: 110, spread: 55 },
        { color: '#7FA040', opacity: 0.18, cx: 78, cy: -5, rx: 140, ry: 100, spread: 50 },
      ],
    },
  };

  const def = definitions[themeId] || definitions.M;
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