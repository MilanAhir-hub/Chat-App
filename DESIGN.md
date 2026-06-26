# Chattogram Design System v2

## Overview

A modern, premium dark-first chat interface with glassmorphism, subtle depth, and purposeful motion. The design philosophy centers on creating a **focused, immersive communication experience** that feels native, polished, and alive.

---

## 1. Design Philosophy

### Core Principles
- **Dark-First Default**: The interface defaults to a deep, comfortable darkness, reducing eye strain during extended chat sessions.
- **Glass & Depth**: Use frosted glass (`backdrop-blur`) and subtle borders to create a sense of spatial hierarchy.
- **Purposeful Motion**: Every animation serves a purpose—feedback, state transition, or delight. Avoid gratuitous motion.
- **Content is King**: The chat area is the hero. UI chrome is minimal and non-intrusive.
- **Brand Identity**: Elevate "Chattogram" from a utility to an experience. A professional, reliable, yet innovative feel.

---

## 2. Color System

### Dark Mode (Default)
- **Background (Base)**: `#0c0c0e` — Deep space black. Not pure black, but a very dark, slightly warm charcoal.
- **Background (Elevated)**: `rgba(22, 22, 25, 0.8)` — For cards, sidebars, and overlays. Paired with `backdrop-blur(12px)`.
- **Background (Input)**: `rgba(30, 30, 33, 0.9)` — Slightly lighter for input fields to contrast with elevated surfaces.
- **Border**: `rgba(255, 255, 255, 0.06)` — Extremely subtle borders to define space without drawing attention.
- **Border (Hover)**: `rgba(255, 255, 255, 0.10)` — Slightly more visible on hover.
- **Text (Primary)**: `#f5f5f5` — Near-white for maximum readability.
- **Text (Secondary)**: `rgba(245, 245, 245, 0.55)` — For timestamps, metadata, and labels.
- **Text (Tertiary)**: `rgba(245, 245, 245, 0.35)` — For disabled states and very subtle text.

### Light Mode
- **Background (Base)**: `#f4f4f5` — Warm off-white.
- **Background (Elevated)**: `rgba(255, 255, 255, 0.85)` — Glass effect over light backgrounds.
- **Background (Input)**: `#ffffff`
- **Border**: `rgba(0, 0, 0, 0.06)`
- ** Text (Primary)**: `#0c0c0e`
- **Text (Secondary)**: `rgba(12, 12, 14, 0.55)`
- **Text (Tertiary)`: `rgba(12, 12, 14, 0.35)`

### Accent Colors (Primary)
- **Default**: `cyan` (A vibrant, tech-forward blue: `#22d3ee`)
- **Hover**: Lighten by 15%.
- **Glow**: `0 0 20px rgba(34, 211, 238, 0.3)` (Used sparingly on active elements).
- **Subtle**: `rgba(34, 211, 238, 0.1)` (For backgrounds of active states).

### Semantic Colors
- **Success**: `#22c55e` (Emerald)
- **Error**: `#ef4444` (Red)
- **Warning**: `#f59e0b` (Amber)
- **Info**: `#3b82f6` (Blue)

---

## 3. Typography

### Font Stack
- **Primary**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (Weights: 400, 500, 600, 700).
- **Monospace**: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace` (For technical data like Room IDs).

### Scale
- **Display**: `3rem` (48px), `font-weight: 700` — Hero text on landing/auth pages.
- **H1**: `1.5rem` (24px), `font-weight: Bold (700)` — Page/section titles.
- **H2**: `1.125rem` (18px), `font-weight: Semibold (600)` — Card titles.
- **Body**: `0.9375rem` (15px), `font-weight: Normal (400)` — Chat messages.
- **Caption**: `0.75rem` (12px), `font-weight: Medium (500)` — Timestamps, labels, badges.

### Spacing
- **Base Unit**: `4px`.
- **Radii**:
  - **Buttons**: `9999px` (Fully rounded pills for primary CTAs, `8px` for inputs).
  - **Cards**: `20px` (Large, soft rounded corners).
  - **Messages**: `24px` for the main corner, `4px` for the opposite side (Speech bubble effect).
- **Shadows**:
  - **Elevated**: `0 8px 32px rgba(0, 0, 0, 0.12)` (Soft, diffuse).
  - **Floating**: `0 12px 40px rgba(0, 0, 0, 0.2)` (For dropdowns, modals).

---

## 4. Component Patterns

### Buttons
- **Primary**:
  - Background: `accent-500` (e.g., `#22d3ee`)
  - Text: `dark` (black on light accent).
  - Hover: Lighten background `10%`, add `box-shadow: 0 0 15px rgba(34, 211, 238, 0.3)`.
  - Border-radius: `9999px`.
- **Secondary/Outline**:
  - Background: `transparent`
  - Border: `1px solid border-color`
  - Hover: Background `rgba(255, 255, 255, 0.05)`.
- **Input Fields**:
  - Background: `bg-input`.
  - Border: `1px solid border`.
  - Focus: `border: 1px solid accent`, `box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1)`.

### Cards
- **Dashboard Card**:
  - Background: `bg-elevated` with `backdrop-blur`.
  - Border: `1px solid border`.
  - Hover: `border-color: border-hover`, subtle `translateY(-2px)`.

### Chat Bubbles (The Hero Component)
- **Self (Mine)**:
  - Background: `accent-500`.
  - Text: Black (`#000`).
  - Shape: `rounded-2xl rounded-tr-sm` (Slight tail effect on opposite side).
- **Other**:
  - Background: `bg-elevated`.
  - Border: `1px solid border`.
  - Text: `text-primary`.
- **Reactions**:
  - Mini floating badge below the bubble: `bg-elevated`, `border`, `rounded-full`, `px-2 py-0.5`, `text-xs`.

---

## 5. Layout Principles

### Auth Pages (Login/Signup)
- **Layout**: Centered, single-column layout.
- **Container**: Glass card (`bg-elevated`, `backdrop-blur`, `border`), `max-w-md`, generous padding (`p-8`).
- **Visuals**: Subtle animated gradient mesh in the background (or a static, dark, premium abstract image).
- **Focus**: The form is the only element that matters.

### Dashboard
- **Layout**: Clean grid, usually 2 columns on desktop.
- **Header**: Sticky, frosted glass header. Minimalist.
- **User Info**: Displayed prominently but not obtrusively.

### Chat Room
- **Layout**: Split view (Sidebar on left, Chat on right on desktop). On mobile, the sidebar is a drawer.
- **Header**: Smart header. **CRITICAL:** It must hide when scrolling down to maximize message space, and reappear when scrolling up.
- **Input Area**:
  - Sticky to the bottom.
  - Large, friendly text area.
  - Action buttons (emoji, attach) clustered neatly to the left of the send button.
- **Scroll Button**: A floating pill button that appears when not at the bottom. Shows unread count. Must have a smooth `animate-bounce` or `slide-up` animation.

---

## 6. Animations & Interactions

### Feedback
- **Buttons**: `active:scale-95`, `duration-200`.
- **Inputs**: Smooth border and shadow transition on focus (`duration-200`).

### State Transitions
- **Page Load**: Elements should fade in and slide up slightly (`opacity: 0 -> 1`, `translateY: 10px -> 0`).
- **Modals/Drawers**: `scale-95 opacity-0` to `scale-100 opacity-100` on open. Backdrop fades in.
- **Chat Messages**:
  - **New Message**: Slide in from the bottom (`translateY: 20px -> 0`), fade in.
  - **Reply Target**: When clicking a reply, the target message should flash brightly (`bg-accent/20`) and then fade back over `1500ms`.

### Delighters
- **Typing Indicator**: 3 bouncing dots with a staggered animation delay.
- **Reaction Popups**: Should spring out (`scale: 0.8 -> 1`, `opacity: 0 -> 1`) rather than just appearing.

---

## 7. Critical Implementation Rules

1. **Do NOT use pure black (`#000`) for backgrounds.** Always use the defined base colors (`#0c0c0e` or `#f4f4f5`).
2. **Preserve ALL existing functionality.** Do not remove swipe-to-reply, typing indicators, file sharing, video calls, or reaction logic.
3. **Keep all existing layout logic for responsiveness.** The app must remain fully responsive across mobile, tablet, and desktop.
4. **Preserve all state logic, hooks, and API calls.** Changes should be **cosmetic only** (CSS classes and minor structural tweaks for layout).
5. **Glass effect is key:** Use `backdrop-blur-md` (or similar) combined with semi-transparent backgrounds (`bg-white/80`, `bg-[#161619]/80`) for all floating elements (headers, sidebars, modals).
6. **Icon Consistency:** Ensure all icons use the same size and stroke width where applicable.
7. **Accessibility:** Do not remove focus rings. Style them to match the new theme (`ring-accent`).