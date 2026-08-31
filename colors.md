Understood — no repo inspection, no planning work, nothing else. Here is the standalone `colors.md` file containing the complete Google-inspired color combination library, with every combination in its own separate section:

```markdown
# colors.md — Google-Inspired Color Combination Library

> **Scope of this file:** reference color combinations only.
> **No code, CSS, tokens, or theme files were modified.** This document is for later
> implementation planning. Full research + the semantic token plan will live in `planning.md`.

---

## 0. How to read this file

### 0.1 Provenance tags (mandatory distinction)

| Tag | Meaning |
| --- | --- |
| **OFFICIAL** | Directly documented by Google/Material (m3.material.io, Google Brand Resource Center) |
| **OFFICIAL†** | Google product-UI token — used consistently across Google's own product UIs and published in Google product/Workspace design guidance; exact shade *naming* varies between Google sources |
| **OBSERVED** | Identified in a live Google product UI (Gemini, Chat, Messages, Keep, Gmail, Search); values may be approximate |
| **INFERRED** | Derived from Google/Material design principles; not directly documented for that exact use |

Never treat an OBSERVED or INFERRED value as an official Google token.

### 0.2 Pairing rules

- Never mix values from different combinations blindly. Each combination is **independently usable**.
- Natural light/dark pairs: **A↔B**, **C↔D**, **E↔F**, **G↔H**, **M↔N**.
- I, J, K, L are light-only concepts; suggested dark partners are listed in each entry.

### 0.3 Contrast

All ratios are computed with the WCAG 2.x relative-luminance formula, shown as ≈ values.
AA (normal text) = 4.5:1 · AA (large text / 18.66px bold / 24px) = 3:1.

---

## 1. Shared reference values (with RGB)

Every value used in the combinations below appears here, so RGB is defined once.

### 1.1 Google brand core — OFFICIAL (Google Brand Resource Center)

| Color | HEX | RGB | HSL |
| --- | --- | --- | --- |
| Google Blue | #4285F4 | 66, 133, 244 | 217°, 89%, 61% |
| Google Red | #EA4335 | 234, 67, 53 | 5°, 81%, 56% |
| Google Yellow | #FBBC05 | 251, 188, 5 | 45°, 97%, 50% |
| Google Green | #34A853 | 52, 168, 83 | 136°, 53%, 43% |

### 1.2 Google product UI ramps — OFFICIAL†

**Blue**

| Token | HEX | RGB |
| --- | --- | --- |
| Blue 50 | #E8F0FE | 232, 240, 254 |
| Blue 100 | #D2E3FC | 210, 227, 252 |
| Blue 100 (2024 refresh) | #D3E3FD | 211, 227, 253 |
| Blue 300 | #8AB4F8 | 138, 180, 248 |
| Blue 300 (2024 refresh) | #A8C7FA | 168, 199, 250 |
| Blue 600 | #1A73E8 | 26, 115, 232 |
| Blue 700 (2024 refresh primary) | #0B57D0 | 11, 87, 208 |
| Blue 800 | #185ABC | 24, 90, 188 |
| Blue 900 | #174EA6 | 23, 78, 166 |
| Dark blue container (dark-mode selection/bubble) | #004A77 | 0, 74, 119 — OBSERVED (approx, medium confidence) |

**Grey**

| Token | HEX | RGB |
| --- | --- | --- |
| Grey 50 | #F8F9FA | 248, 249, 250 |
| Grey 100 | #F1F3F4 | 241, 243, 244 |
| Grey 200 | #E8EAED | 232, 234, 237 |
| Grey 300 | #DADCE0 | 218, 220, 224 |
| Grey 400 | #BDC1C6 | 189, 193, 198 |
| Grey 500 | #9AA0A6 | 154, 160, 166 |
| Grey 600 | #80868B | 128, 134, 139 |
| Grey 700 | #5F6368 | 95, 99, 104 |
| Grey 800 | #3C4043 | 60, 64, 67 |
| Grey 900 | #202124 | 32, 33, 36 |

**Status colors**

| Token | HEX | RGB |
| --- | --- | --- |
| Green 100 | #E6F4EA | 230, 244, 234 |
| Green 300 (dark mode) | #81C995 | 129, 201, 149 |
| Green 600 | #1E8E3E | 30, 142, 62 |
| Green 800 | #188038 | 24, 128, 56 |
| Red 100 | #FCE8E6 | 252, 232, 230 |
| Red 300 (dark mode) | #F28B82 | 242, 139, 130 |
| Red 600 | #D93025 | 217, 48, 37 |
| Yellow 50 | #FEF7E0 | 254, 247, 224 |
| Yellow 300 (dark mode) | #FDD663 | 253, 214, 99 |
| Yellow 600 | #F9AB00 | 249, 171, 0 |
| Yellow 900 | #B06000 | 176, 96, 0 |
| Purple 600 | #9334E6 | 147, 52, 230 — OFFICIAL† (medium confidence) |
| Purple 300 (dark mode) | #C58AF9 | 197, 138, 249 — OBSERVED (medium confidence) |
| Google Chat green | #00AC47 | 0, 172, 71 — OBSERVED (Chat product accent) |

### 1.3 Google dark surface ramps — OFFICIAL† / OBSERVED

| Step | Classic Workspace dark | 2024 refresh (Gemini/Gmail) |
| --- | --- | --- |
| Base | #202124 (32,33,36) | #131314 (19,19,20) |
| Raised | #292A2D (41,42,45) | #1E1F20 (30,31,32) |
| Hover / overlay | #303134 (48,49,52) | #282A2C (40,42,44) |
| Higher / selected | #3C4043 (60,64,67) | #333537 (51,53,55) |

### 1.4 Google 2024 refresh neutrals + Gemini tokens — OBSERVED

| Purpose | HEX | RGB |
| --- | --- | --- |
| Primary text (light) | #1F1F1F | 31, 31, 31 |
| Secondary text (light) | #444746 | 68, 71, 70 |
| Primary text (dark) | #E3E3E3 | 227, 227, 227 |
| Secondary text (dark) | #C4C7C5 | 196, 199, 197 |
| Gemini light conversation surface | #F0F4F9 | 240, 244, 249 |
| Gemini light user bubble | #D3E3FD | 211, 227, 253 |
| Gemini dark user bubble | #333537 | 51, 53, 55 |
| Gemini dark submit/links | #A8C7FA | 168, 199, 250 |

### 1.5 Material 3 baseline (tonal roles) — OFFICIAL (m3.material.io)

| Role | Light | Dark |
| --- | --- | --- |
| Primary | #6750A4 | #D0BCFF |
| On Primary | #FFFFFF | #381E72 |
| Primary Container | #EADDFF | #4F378B |
| On Primary Container | #21005D | #EADDFF |
| Secondary | #625B71 | #CCC2DC |
| On Secondary | #FFFFFF | #332D41 |
| Secondary Container | #E8DEF8 | #4A4458 |
| On Secondary Container | #1D192B | #E8DEF8 |
| Tertiary | #7D5260 | #EFB8C8 |
| On Tertiary | #FFFFFF | #492532 |
| Tertiary Container | #FFD8E4 | #633B48 |
| On Tertiary Container | #31111D | #FFD8E4 |
| Error | #B3261E | #F2B8B5 |
| On Error | #FFFFFF | #601410 |
| Error Container | #F9DEDC | #8C1D18 |
| On Error Container | #410E0B | #F9DEDC |
| Surface | #FEF7FF | #141218 |
| On Surface | #1D1B20 | #E6E0E9 |
| Surface Variant | #E7E0EC | #49454F |
| On Surface Variant | #49454F | #CAC4D0 |
| Surface Dim | #DED8E1 | #141218 |
| Surface Bright | #FEF7FF | #3B383E |
| Surface Container Lowest | #FFFFFF | #0F0D13 |
| Surface Container Low | #F7F2FA | #1D1B20 |
| Surface Container | #F3EDF7 | #211F26 |
| Surface Container High | #ECE6F0 | #2B2930 |
| Surface Container Highest | #E6E0E9 | #36343B |
| Outline | #79747E | #938F99 |
| Outline Variant | #CAC4D0 | #49454F |
| Inverse Surface | #322F35 | #E6E0E9 |
| Inverse On Surface | #F5EFF7 | #322F35 |
| Inverse Primary | #D0BCFF | #6750A4 |
| Scrim | #000000 | #000000 |

> **Note:** M3 has **no official warning/success/info roles.** Any warning/success/info value in an
> M3-based combination below is INFERRED (Google product tokens grafted onto the M3 structure).

### 1.6 Classic Google Keep note palette — OBSERVED (approximate; varies by app version)

| Note name | HEX | RGB |
| --- | --- | --- |
| Default (white) | #FFFFFF | 255, 255, 255 |
| Coral (Red 100) | #FFCDD2 | 255, 205, 210 |
| Tangerine (Orange 100) | #FFE0B2 | 255, 224, 178 |
| Citron (Yellow 100) | #FFF9C4 | 255, 249, 196 |
| Grass (Green 100) | #C8E6C9 | 200, 230, 201 |
| Teal 100 | #B2DFDB | 178, 223, 219 |
| Blue 100 | #BBDEFB | 187, 222, 251 |
| Indigo 100 | #C5CAE9 | 197, 202, 233 |
| Lavender (Deep Purple 100) | #D1C4E9 | 209, 196, 233 |
| Pink 100 | #F8BBD0 | 248, 187, 208 |
| Brown 100 | #D7CCC8 | 215, 204, 200 |

> Newer Keep builds use Material 3–style tonal variants; exact newer hex values are
> **not reliably established** — do not guess them.

### 1.7 Google AI / Gemini brand gradient — OBSERVED (approximate)

`#4285F4 → #9B72CB → #D96570` (blue → purple → pink, 66,133,244 / 155,114,203 / 217,101,112).
Use for decoration only; never for text.

---

## 2. Combination A — Google Material Light (M3 baseline)

**Character:** soft, lavender-tinted neutrals with a purple primary — the exact published Material 3 baseline.
**Closest Google product:** Material 3 reference theme / Material You default.
**Strengths:** 100% official values; every contrast pair pre-validated by Google; container roles handle elevation & bubbles natively.
**Weaknesses:** purple primary reads "Material You default" rather than "Google product"; tinted surface #FEF7FF can look faintly purple on low-quality displays.
**Best use:** apps that want strict Material 3 compliance.
**Chat suitability:** good — containers map cleanly to message bubbles.
**Suggested dark pair:** B.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #FEF7FF | OFFICIAL · M3 surface |
| Surface | #FEF7FF | OFFICIAL · M3 surface |
| Elevated surface | #FFFFFF | OFFICIAL · M3 surface container lowest |
| Primary | #6750A4 | OFFICIAL · M3 primary |
| Primary container | #EADDFF | OFFICIAL · M3 primary container |
| Secondary | #625B71 | OFFICIAL · M3 secondary |
| Accent | #7D5260 | OFFICIAL · M3 tertiary |
| Primary text | #1D1B20 | OFFICIAL · M3 on-surface |
| Secondary text | #49454F | OFFICIAL · M3 on-surface variant |
| Muted text | #79747E | OFFICIAL · M3 outline — **icon/border tier only** |
| Border | #CAC4D0 | OFFICIAL · M3 outline variant |
| Divider | #E7E0EC | OFFICIAL · M3 surface variant |
| Hover | #F3EDF7 | OFFICIAL · M3 surface container |
| Selected | #EADDFF | OFFICIAL · M3 primary container |
| Focus | #6750A4 | OFFICIAL · M3 primary (focus ring) |
| Error | #B3261E | OFFICIAL · M3 error |
| Warning | #B06000 | INFERRED · Google yellow 900 (M3 has no warning) |
| Success | #188038 | INFERRED · Google green 800 (M3 has no success) |
| Info | #1A73E8 | INFERRED · Google blue 600 |
| Incoming message | #E6E0E9 | OFFICIAL · M3 surface container highest |
| Incoming message text | #1D1B20 | OFFICIAL · M3 on-surface |
| Outgoing message | #EADDFF | OFFICIAL · M3 primary container |
| Outgoing message text | #21005D | OFFICIAL · M3 on-primary-container |
| Composer | #F7F2FA | OFFICIAL · M3 surface container low |
| Link | #6750A4 | INFERRED · M3 guidance: links use primary |

**Accessibility flags:** primary container doubles as selected + outgoing (intended in M3).
Muted #79747E on surface ≈ **4.3:1** — fails AA for body text; reserve for icons/borders, use #49454F for muted text.
Warning #B06000 on #FEF7FF ≈ 4.4:1 — borderline; use bold/large or place on #FFFFFF.
Info #1A73E8 on #FEF7FF ≈ 4.3:1 — reserve for links/icons; #185ABC for small info text.
Outgoing text #21005D on #EADDFF, incoming #1D1B20 on #E6E0E9, error #B3261E (6.2:1) — pass.

---

## 3. Combination B — Google Material Dark (M3 baseline dark)

**Character:** true M3 dark — near-black #141218 with tonal (not shadow) elevation.
**Closest Google product:** Material 3 reference dark theme.
**Strengths:** official; elevation via surface containers (no shadows needed); all pairs Google-validated.
**Weaknesses:** purple default caveat; subtle surface steps need careful hierarchy discipline.
**Best use:** Material 3–compliant dark mode.
**Chat suitability:** strong — #2B2930 incoming / #4F378B outgoing is exactly the M3 chat pattern.
**Suggested light pair:** A.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #141218 | OFFICIAL · M3 surface |
| Surface | #141218 | OFFICIAL · M3 surface |
| Elevated surface | #36343B | OFFICIAL · M3 surface container highest |
| Primary | #D0BCFF | OFFICIAL · M3 primary (dark) |
| Primary container | #4F378B | OFFICIAL · M3 primary container |
| Secondary | #CCC2DC | OFFICIAL · M3 secondary |
| Accent | #EFB8C8 | OFFICIAL · M3 tertiary |
| Primary text | #E6E0E9 | OFFICIAL · M3 on-surface |
| Secondary text | #CAC4D0 | OFFICIAL · M3 on-surface variant |
| Muted text | #938F99 | OFFICIAL · M3 outline (≈5.8:1 ✓) |
| Border | #49454F | OFFICIAL · M3 outline variant |
| Divider | #36343B | OFFICIAL · M3 surface container highest |
| Hover | #1D1B20 | OFFICIAL · M3 surface container low |
| Selected | #4A4458 | OFFICIAL · M3 secondary container |
| Focus | #D0BCFF | OFFICIAL · M3 primary |
| Error | #F2B8B5 | OFFICIAL · M3 error (dark) |
| Warning | #FDD663 | INFERRED · Google yellow 300 (dark-mode status) |
| Success | #81C995 | INFERRED · Google green 300 |
| Info | #8AB4F8 | INFERRED · Google blue 300 |
| Incoming message | #2B2930 | OFFICIAL · M3 surface container high |
| Incoming message text | #E6E0E9 | OFFICIAL · M3 on-surface (≈11:1 ✓) |
| Outgoing message | #4F378B | OFFICIAL · M3 primary container |
| Outgoing message text | #EADDFF | OFFICIAL · M3 on-primary-container (≈7.2:1 ✓) |
| Composer | #211F26 | OFFICIAL · M3 surface container |
| Link | #D0BCFF | INFERRED · links use primary |

**Accessibility flags:** all text pairs pass AA. Warning/success/info on #141218: ≈13.4 / 8.2 / 7.7:1 ✓.

---

## 4. Combination C — Google Keep-inspired Light

**Character:** white canvas + warm yellow "note" tint — playful, light, distinctly Keep.
**Closest Google product:** Google Keep (light).
**Strengths:** warm and friendly; the yellow 50 tint gives selected/outgoing a Keep identity without inventing colors.
**Weaknesses:** yellow overlaps semantically with "warning"; must be constrained to bubbles/selection, never errors.
**Best use:** consumer chat with a notes/personal flavor.
**Chat suitability:** medium-good — playful consumer chat.
**Suggested dark pair:** D.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #FFFFFF | OFFICIAL† · Keep canvas |
| Surface | #FFFFFF | OFFICIAL† |
| Elevated surface | #FFFFFF | OFFICIAL† (elevation via shadow) |
| Primary | #1A73E8 | OFFICIAL† · Keep uses standard Google UI blue for links/actions |
| Primary container | #FEF7E0 | OFFICIAL† · Google yellow 50 (Keep-style note tint) |
| Secondary | #5F6368 | OFFICIAL† · grey 700 |
| Accent | #FBBC05 | OFFICIAL · Google Yellow (Keep brand) — decoration only |
| Primary text | #202124 | OFFICIAL† · grey 900 |
| Secondary text | #3C4043 | OFFICIAL† · grey 800 |
| Muted text | #5F6368 | OFFICIAL† · grey 700 (≈6.0:1 ✓) |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #F1F3F4 | OFFICIAL† · grey 100 |
| Selected | #FEF7E0 | OFFICIAL† · yellow 50 (Keep selected-note tint) |
| Focus | #1A73E8 | OFFICIAL† · blue 600 |
| Error | #D93025 | OFFICIAL† · red 600 |
| Warning | #B06000 | OFFICIAL† · yellow 900 |
| Success | #188038 | OFFICIAL† · green 800 |
| Info | #1A73E8 | OFFICIAL† · blue 600 |
| Incoming message | #F1F3F4 | OFFICIAL† · grey 100 |
| Incoming message text | #202124 | OFFICIAL† · grey 900 (≈14:1 ✓) |
| Outgoing message | #FEF7E0 | OFFICIAL† · yellow 50 (Keep "note" outgoing bubble) |
| Outgoing message text | #202124 | OFFICIAL† · grey 900 (≈14:1 ✓) |
| Composer | #FFFFFF | OFFICIAL† (with #DADCE0 border) |
| Link | #1A73E8 | OFFICIAL† · blue 600 (≈4.5:1 ✓) |

**Accessibility flags:** #FBBC05 is decoration/icons only (≈1.9:1 — never text).
Warning #B06000 on #FEF7E0 ≈ 4.3:1 — borderline; bold/large or keep warning text on white.
Optional stronger outgoing: #FFF9C4 (Keep Citron, OBSERVED).

---

## 5. Combination D — Google Keep-inspired Dark

**Character:** classic Google dark grey with a bold yellow outgoing bubble — Keep's dark personality.
**Closest Google product:** Google Keep (dark).
**Strengths:** yellow outgoing bubble (#F9AB00 + #202124 text, ≈8.4:1) is distinctive *and* accessible; standard Google dark ramp.
**Weaknesses:** bright yellow bubbles dominate visually; yellow accent and yellow warning must be kept apart (accent = fills, warning = status only).
**Best use:** playful consumer chat, dark mode.
**Chat suitability:** medium — distinctive but louder than Google's own dark chats.
**Suggested light pair:** C.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #202124 | OFFICIAL† · grey 900 (classic Google dark base) |
| Surface | #202124 | OFFICIAL† |
| Elevated surface | #292A2D | OFFICIAL† · classic dark raised |
| Primary | #8AB4F8 | OFFICIAL† · blue 300 (dark-mode action blue) |
| Primary container | #174EA6 | OFFICIAL† · blue 900 (deep-blue dark container) |
| Secondary | #9AA0A6 | OFFICIAL† · grey 500 |
| Accent | #F9AB00 | OFFICIAL† · yellow 600 (Keep dark yellow) |
| Primary text | #E8EAED | OFFICIAL† · grey 200 |
| Secondary text | #BDC1C6 | OFFICIAL† · grey 400 |
| Muted text | #9AA0A6 | OFFICIAL† · grey 500 (≈6.1:1 ✓) |
| Border | #3C4043 | OFFICIAL† · grey 800 |
| Divider | #3C4043 | OFFICIAL† · grey 800 |
| Hover | #303134 | OFFICIAL† · classic dark hover |
| Selected | #3C4043 | OFFICIAL† · grey 800 (standard Google dark selection) |
| Focus | #8AB4F8 | OFFICIAL† · blue 300 |
| Error | #F28B82 | OFFICIAL† · red 300 |
| Warning | #FDD663 | OFFICIAL† · yellow 300 |
| Success | #81C995 | OFFICIAL† · green 300 |
| Info | #8AB4F8 | OFFICIAL† · blue 300 |
| Incoming message | #292A2D | OFFICIAL† · dark raised |
| Incoming message text | #E8EAED | OFFICIAL† (≈13:1 ✓) |
| Outgoing message | #F9AB00 | OFFICIAL† · yellow 600 |
| Outgoing message text | #202124 | OFFICIAL† · grey 900 (≈8.4:1 ✓) |
| Composer | #303134 | OFFICIAL† · classic dark hover step |
| Link | #8AB4F8 | OFFICIAL† · blue 300 (≈7.7:1 ✓) |

**Accessibility flags:** all text pairs pass AA. Keep dark note tints (desaturated color versions) are **not reliably established** — do not guess them.

---

## 6. Combination E — Gemini-inspired Light

**Character:** calm, blue-tinted Google 2024 refresh; white bubbles on a soft #F0F4F9 conversation surface.
**Closest Google product:** Gemini web (light).
**Strengths:** the newest "modern Google" look; the outgoing bubble #D3E3FD is the actual Gemini user-message color; #0B57D0 + white ≈ 6.3:1.
**Weaknesses:** most values are OBSERVED (2024 refresh tokens are not published as classic documentation); very low chroma — needs disciplined hierarchy.
**Best use:** AI-assistant-style or assistant-like chat UI.
**Chat suitability:** excellent — modeled directly on a Google chat product.
**Suggested dark pair:** F.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #F0F4F9 | OBSERVED · Gemini light conversation surface |
| Surface | #FFFFFF | OBSERVED · Gemini light cards/composer |
| Elevated surface | #FFFFFF | OBSERVED · dialogs/menus (shadow elevation) |
| Primary | #0B57D0 | OBSERVED · 2024 Google primary blue (Gemini submit) |
| Primary container | #D3E3FD | OBSERVED · 2024 blue 100 |
| Secondary | #444746 | OBSERVED · 2024 secondary text |
| Accent | #A8C7FA | OBSERVED · Gemini gradient light blue (decoration) |
| Primary text | #1F1F1F | OBSERVED · 2024 primary text |
| Secondary text | #444746 | OBSERVED · 2024 secondary text (≈9.4:1 ✓) |
| Muted text | #5F6368 | OFFICIAL† · grey 700 |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #E8EAED | OFFICIAL† · grey 200 (on tinted bg) |
| Selected | #D3E3FD | OBSERVED · 2024 blue 100 selection |
| Focus | #0B57D0 | OBSERVED · 2024 primary blue |
| Error | #B3261E | OFFICIAL · M3 error |
| Warning | #B06000 | OFFICIAL† · yellow 900 |
| Success | #188038 | OFFICIAL† · green 800 |
| Info | #0B57D0 | OBSERVED · 2024 primary blue |
| Incoming message | #FFFFFF | OBSERVED · white bubble on tinted bg (Gemini responses sit directly on #F0F4F9 — no-bubble is the authentic variant) |
| Incoming message text | #1F1F1F | OBSERVED (≈15:1 ✓) |
| Outgoing message | #D3E3FD | OBSERVED · Gemini light user bubble |
| Outgoing message text | #1F1F1F | OBSERVED (≈12:1 ✓) |
| Composer | #FFFFFF | OBSERVED · Gemini light input card |
| Link | #0B57D0 | OBSERVED · 2024 primary blue (≈5.7:1 ✓) |

**Accessibility flags:** primary text pairs all pass. Warning #B06000 on tinted surfaces ≈ 4.0–4.4:1 — use with #FEF7E0 container + bold weight, or icons only.

---

## 7. Combination F — Gemini-inspired Dark

**Character:** Google's 2024 AI-product dark — #131314 base with a 4-step tonal ramp and soft blue #A8C7FA.
**Closest Google product:** Gemini web (dark).
**Strengths:** authentic Google dark-chat look; elevation is purely tonal; gradient accents available for decoration.
**Weaknesses:** OBSERVED values only; incoming #282A2C vs outgoing #333537 is subtle — differentiate with alignment/author, not only color.
**Best use:** AI-assistant-style chat, dark mode.
**Chat suitability:** excellent.
**Suggested light pair:** E.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #131314 | OBSERVED · 2024 dark base |
| Surface | #1E1F20 | OBSERVED · 2024 dark surface |
| Elevated surface | #333537 | OBSERVED · 2024 dark high surface |
| Primary | #A8C7FA | OBSERVED · Gemini dark submit/links |
| Primary container | #004A77 | OBSERVED (approx) · Google dark blue container |
| Secondary | #C4C7C5 | OBSERVED · 2024 dark secondary text |
| Accent | #9B72CB | OBSERVED (approx) · Gemini gradient purple — decoration only |
| Primary text | #E3E3E3 | OBSERVED · 2024 dark primary text |
| Secondary text | #C4C7C5 | OBSERVED (≈10.9:1 ✓) |
| Muted text | #9AA0A6 | OFFICIAL† · grey 500 (≈7.0:1 ✓) |
| Border | #3C4043 | OFFICIAL† · grey 800 |
| Divider | #3C4043 | OFFICIAL† · grey 800 |
| Hover | #282A2C | OBSERVED · 2024 dark hover |
| Selected | #333537 | OBSERVED · 2024 dark selected |
| Focus | #A8C7FA | OBSERVED · Gemini dark primary |
| Error | #F2B8B5 | OFFICIAL · M3 error dark |
| Warning | #FDD663 | OFFICIAL† · yellow 300 (≈13.2:1 ✓) |
| Success | #81C995 | OFFICIAL† · green 300 |
| Info | #8AB4F8 | OFFICIAL† · blue 300 |
| Incoming message | #282A2C | OBSERVED · 2024 dark hover step (authentic Gemini: no incoming bubble — sits on #1E1F20) |
| Incoming message text | #E3E3E3 | OBSERVED (≈10.7:1 ✓) |
| Outgoing message | #333537 | OBSERVED · Gemini dark user bubble |
| Outgoing message text | #E3E3E3 | OBSERVED (≈9.6:1 ✓) |
| Composer | #282A2C | OBSERVED (approx) · Gemini dark input |
| Link | #A8C7FA | OBSERVED (≈10.8:1 ✓) |

**Accessibility flags:** all text pairs pass comfortably. Gradient colors are decoration only.

---

## 8. Combination G — Google Chat-inspired Light

**Character:** white, flat, grey + Google blue with Chat green accents; the "team chat" look.
**Closest Google product:** Google Chat (light).
**Strengths:** closest to an actual Google team-chat product; every color is a documented product token.
**Weaknesses:** Google Chat has **no message bubbles** — incoming sits on white; the provided #F1F3F4 fill is a pragmatic fallback, not a Google-observed bubble.
**Best use:** Slack/Chat-style workspace chat.
**Chat suitability:** excellent for team chat.
**Suggested dark pair:** H.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #FFFFFF | OFFICIAL† · Chat light |
| Surface | #FFFFFF | OFFICIAL† |
| Elevated surface | #FFFFFF | OFFICIAL† |
| Primary | #1A73E8 | OFFICIAL† · blue 600 |
| Primary container | #E8F0FE | OFFICIAL† · blue 50 |
| Secondary | #5F6368 | OFFICIAL† · grey 700 |
| Accent | #00AC47 | OBSERVED · Google Chat green |
| Primary text | #202124 | OFFICIAL† · grey 900 |
| Secondary text | #3C4043 | OFFICIAL† · grey 800 |
| Muted text | #5F6368 | OFFICIAL† · grey 700 |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #F1F3F4 | OFFICIAL† · grey 100 |
| Selected | #E8F0FE | OFFICIAL† · blue 50 selection |
| Focus | #1A73E8 | OFFICIAL† · blue 600 |
| Error | #D93025 | OFFICIAL† · red 600 |
| Warning | #B06000 | OFFICIAL† · yellow 900 |
| Success | #188038 | OFFICIAL† · green 800 |
| Info | #1A73E8 | OFFICIAL† · blue 600 |
| Incoming message | #F1F3F4 | OFFICIAL† · grey 100 — **INFERRED as a bubble** (authentic Chat: unbubbled on #FFFFFF) |
| Incoming message text | #202124 | OFFICIAL† (≈14:1 ✓) |
| Outgoing message | #D2E3FC | OFFICIAL† · blue 100 — INFERRED as a bubble (authentic Chat: unbubbled) |
| Outgoing message text | #202124 | OFFICIAL† (≈12:1 ✓) |
| Composer | #FFFFFF | OFFICIAL† · Chat light input (with #DADCE0 border) |
| Link | #1A73E8 | OFFICIAL† · blue 600 (≈4.5:1 ✓, borderline) |

**Accessibility flags:** all core pairs pass; link/primary blue sits exactly at 4.5:1 — use #185ABC for small text where margin is needed.

---

## 9. Combination H — Google Chat-inspired Dark

**Character:** classic Workspace dark (#202124 family) with blue 300 accents, green 300 status, deep-blue outgoing bubbles.
**Closest Google product:** Google Chat / Gmail (dark).
**Strengths:** the proven Google Workspace dark pattern; deep blue #174EA6 outgoing bubble is quieter than bright-bubble themes.
**Weaknesses:** grey selection (#3C4043) can be subtle; deep blue bubble is muted compared to Messages-style dark.
**Best use:** workspace/team chat, dark mode.
**Chat suitability:** excellent.
**Suggested light pair:** G.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #202124 | OFFICIAL† · grey 900 |
| Surface | #202124 | OFFICIAL† |
| Elevated surface | #292A2D | OFFICIAL† · dark raised |
| Primary | #8AB4F8 | OFFICIAL† · blue 300 |
| Primary container | #174EA6 | OFFICIAL† · blue 900 |
| Secondary | #9AA0A6 | OFFICIAL† · grey 500 |
| Accent | #81C995 | OFFICIAL† · green 300 (Chat green, dark variant) |
| Primary text | #E8EAED | OFFICIAL† · grey 200 |
| Secondary text | #BDC1C6 | OFFICIAL† · grey 400 |
| Muted text | #9AA0A6 | OFFICIAL† · grey 500 |
| Border | #5F6368 | OFFICIAL† · grey 700 |
| Divider | #3C4043 | OFFICIAL† · grey 800 |
| Hover | #303134 | OFFICIAL† · classic dark hover |
| Selected | #3C4043 | OFFICIAL† · grey 800 (observed Google dark selection) |
| Focus | #8AB4F8 | OFFICIAL† · blue 300 |
| Error | #F28B82 | OFFICIAL† · red 300 (≈6.7:1 ✓) |
| Warning | #FDD663 | OFFICIAL† · yellow 300 (≈11.5:1 ✓) |
| Success | #81C995 | OFFICIAL† · green 300 (≈8.2:1 ✓) |
| Info | #8AB4F8 | OFFICIAL† · blue 300 |
| Incoming message | #292A2D | OFFICIAL† · dark raised — INFERRED as bubble |
| Incoming message text | #E8EAED | OFFICIAL† (≈13:1 ✓) |
| Outgoing message | #174EA6 | OFFICIAL† · blue 900 — INFERRED as bubble |
| Outgoing message text | #D2E3FC | OFFICIAL† · blue 100 (≈5.9:1 ✓) |
| Composer | #292A2D | OFFICIAL† · dark raised |
| Link | #8AB4F8 | OFFICIAL† · blue 300 (≈7.7:1 ✓) |

**Accessibility flags:** all pairs pass AA.

---

## 10. Combination I — Neutral Google Workspace

**Character:** Gmail-like grey canvas with white cards; restrained, enterprise.
**Closest Google product:** Gmail / Drive (light).
**Strengths:** neutral chrome lets message content dominate; the safest "serious Google" look.
**Weaknesses:** least expressive; grey-100 incoming vs blue-50 outgoing is a subtle difference.
**Best use:** enterprise/workspace chat.
**Chat suitability:** very good for work chat.
**Suggested dark pair:** H.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #F8F9FA | OFFICIAL† · grey 50 |
| Surface | #FFFFFF | OFFICIAL† · white cards on grey canvas |
| Elevated surface | #FFFFFF | OFFICIAL† |
| Primary | #1A73E8 | OFFICIAL† · blue 600 |
| Primary container | #E8F0FE | OFFICIAL† · blue 50 |
| Secondary | #5F6368 | OFFICIAL† · grey 700 |
| Accent | #1E8E3E | OFFICIAL† · green 600 (status accent) |
| Primary text | #202124 | OFFICIAL† · grey 900 |
| Secondary text | #3C4043 | OFFICIAL† · grey 800 |
| Muted text | #5F6368 | OFFICIAL† · grey 700 |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #F1F3F4 | OFFICIAL† · grey 100 |
| Selected | #E8F0FE | OFFICIAL† · blue 50 |
| Focus | #1A73E8 | OFFICIAL† · blue 600 |
| Error | #D93025 | OFFICIAL† · red 600 |
| Warning | #B06000 | OFFICIAL† · yellow 900 |
| Success | #188038 | OFFICIAL† · green 800 |
| Info | #1A73E8 | OFFICIAL† · blue 600 |
| Incoming message | #F1F3F4 | OFFICIAL† · grey 100 |
| Incoming message text | #202124 | OFFICIAL† (≈14:1 ✓) |
| Outgoing message | #D2E3FC | OFFICIAL† · blue 100 |
| Outgoing message text | #202124 | OFFICIAL† (≈12:1 ✓) |
| Composer | #FFFFFF | OFFICIAL† · white composer card on grey canvas |
| Link | #1A73E8 | OFFICIAL† · blue 600 (≈4.5:1 ✓, borderline) |

**Accessibility flags:** all core pairs pass; blue 600 text sits exactly at 4.5:1.

---

## 11. Combination J — Blue-focused Google

**Character:** everything organized around Google Blue; solid #1A73E8 outgoing bubbles — the classic "Google Messages" feel.
**Closest Google product:** Google Messages (classic) / Google sign-in buttons.
**Strengths:** instantly reads "Google"; strong affordance for outgoing messages.
**Weaknesses:** white on #1A73E8 ≈ 4.5:1 exactly — AA passes with zero margin; blue-dominant UI can fatigue.
**Best use:** consumer chat that wants maximum Google-brand recognition.
**Chat suitability:** good for consumer chat (Messages-style).
**Suggested dark pair:** N.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #FFFFFF | OFFICIAL† |
| Surface | #FFFFFF | OFFICIAL† |
| Elevated surface | #FFFFFF | OFFICIAL† |
| Primary | #1A73E8 | OFFICIAL† · blue 600 |
| Primary container | #D2E3FC | OFFICIAL† · blue 100 |
| Secondary | #5F6368 | OFFICIAL† · grey 700 (blue emphasis variant: #185ABC) |
| Accent | #4285F4 | OFFICIAL · Google Blue (brand) — decoration/icons |
| Primary text | #202124 | OFFICIAL† · grey 900 |
| Secondary text | #3C4043 | OFFICIAL† · grey 800 |
| Muted text | #5F6368 | OFFICIAL† · grey 700 |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #F1F3F4 | OFFICIAL† · grey 100 |
| Selected | #D2E3FC | OFFICIAL† · blue 100 |
| Focus | #1A73E8 | OFFICIAL† · blue 600 |
| Error | #D93025 | OFFICIAL† · red 600 |
| Warning | #B06000 | OFFICIAL† · yellow 900 |
| Success | #188038 | OFFICIAL† · green 800 |
| Info | #1A73E8 | OFFICIAL† · blue 600 |
| Incoming message | #F1F3F4 | OFFICIAL† · grey 100 |
| Incoming message text | #202124 | OFFICIAL† (≈14:1 ✓) |
| Outgoing message | #1A73E8 | OFFICIAL† · blue 600 (Messages-style solid bubble) |
| Outgoing message text | #FFFFFF | OFFICIAL† (≈4.5:1 — passes AA exactly, zero margin) |
| Composer | #FFFFFF | OFFICIAL† |
| Link | #1A73E8 | OFFICIAL† · blue 600 |

**Accessibility flags:** **outgoing text is the weak point** — white on #1A73E8 ≈ 4.50:1.
If you need margin, use #0B57D0 as the bubble (≈6.3:1, see Combination M). #4285F4 with white fails (≈3.6:1) — accent is decorative only.

---

## 12. Combination K — Multi-color Google

**Character:** Google's four brand colors on a neutral white/grey base; per-contact tints, colorful avatars and reactions.
**Closest Google product:** Google brand system + Gmail label colors + Keep note colors.
**Strengths:** playful, color-coded people/threads; authentically "Google playful."
**Weaknesses:** brand colors are contrast-unsafe as text (decoration only); yellow tints collide with warning semantics — needs strict rules.
**Best use:** consumer multi-user chat with avatars, reactions, mentions.
**Chat suitability:** very good for social/consumer chat.
**Suggested dark pair:** H (with dark status colors), or B.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #FFFFFF | OFFICIAL† |
| Surface | #FFFFFF | OFFICIAL† |
| Elevated surface | #FFFFFF | OFFICIAL† |
| Primary | #1A73E8 | OFFICIAL† · blue 600 (functional) |
| Primary container | #E8F0FE | OFFICIAL† · blue 50 |
| Secondary | #5F6368 | OFFICIAL† · grey 700 |
| Accent | #FBBC05 | OFFICIAL · Google Yellow — decoration only |
| Primary text | #202124 | OFFICIAL† · grey 900 |
| Secondary text | #3C4043 | OFFICIAL† · grey 800 |
| Muted text | #5F6368 | OFFICIAL† · grey 700 |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #F1F3F4 | OFFICIAL† · grey 100 |
| Selected | #E8F0FE | OFFICIAL† · blue 50 |
| Focus | #1A73E8 | OFFICIAL† · blue 600 |
| Error | #D93025 | OFFICIAL† · red 600 (decorative red: #EA4335) |
| Warning | #B06000 | OFFICIAL† · yellow 900 (fills: #F9AB00 / #FBBC05) |
| Success | #188038 | OFFICIAL† · green 800 (decorative green: #34A853) |
| Info | #1A73E8 | OFFICIAL† · blue 600 |
| Incoming message | #F1F3F4 | OFFICIAL† · grey 100 (default) |
| Incoming message text | #202124 | OFFICIAL† (≈14:1 ✓) |
| Outgoing message | #D2E3FC | OFFICIAL† · blue 100 |
| Outgoing message text | #202124 | OFFICIAL† (≈12:1 ✓) |
| Composer | #FFFFFF | OFFICIAL† |
| Link | #1A73E8 | OFFICIAL† · blue 600 |

**Per-contact / label tints (incoming message variants)** — OFFICIAL† Google tints:
#E8F0FE (blue), #E6F4EA (green), #FEF7E0 (yellow), #FCE8E6 (red).
**Avatar / reaction palette** — OFFICIAL brand: #4285F4, #34A853, #FBBC05, #EA4335.
**Accessibility flags:** all four brand colors fail AA as text on white (≈1.9–3.6:1) — icons/fills only. Text is always grey. All grey/blue text pairs pass.

---

## 13. Combination L — Minimal monochrome Google

**Character:** pure white + grey with a single blue accent; Google Search austerity. Grey outgoing bubbles.
**Closest Google product:** Google Search.
**Strengths:** maximal content focus; trivially consistent; almost impossible to make clash.
**Weaknesses:** grey outgoing bubble needs alignment/author cues to read correctly; can feel cold; semantics still need color (see flags).
**Best use:** dense, information-first chat UIs.
**Chat suitability:** good for minimal/dense chat.
**Suggested dark pair:** B-style neutrals + blue 300 (#8AB4F8) as the single accent.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #FFFFFF | OFFICIAL† |
| Surface | #FFFFFF | OFFICIAL† |
| Elevated surface | #FFFFFF | OFFICIAL† |
| Primary | #1A73E8 | OFFICIAL† · blue 600 (the single hue) |
| Primary container | #E8F0FE | OFFICIAL† · blue 50 |
| Secondary | #5F6368 | OFFICIAL† · grey 700 |
| Accent | #1A73E8 | INFERRED · intentionally single-hue (Search model) |
| Primary text | #202124 | OFFICIAL† · grey 900 |
| Secondary text | #3C4043 | OFFICIAL† · grey 800 |
| Muted text | #5F6368 | OFFICIAL† · grey 700 |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #F1F3F4 | OFFICIAL† · grey 100 |
| Selected | #E8F0FE | OFFICIAL† · blue 50 (selection must stay distinguishable) |
| Focus | #1A73E8 | OFFICIAL† · blue 600 |
| Error | #D93025 | OFFICIAL† · red 600 (semantics stay colored — Google's own approach) |
| Warning | #B06000 | OFFICIAL† · yellow 900 |
| Success | #188038 | OFFICIAL† · green 800 |
| Info | #1A73E8 | OFFICIAL† · blue 600 |
| Incoming message | #FFFFFF | INFERRED · no bubble — Google Chat-style unbubbled layout (fallback if bubbles required: #F1F3F4) |
| Incoming message text | #202124 | OFFICIAL† (≈16:1 ✓) |
| Outgoing message | #E8EAED | OFFICIAL† · grey 200 (monochrome bubble) |
| Outgoing message text | #202124 | OFFICIAL† (≈13.6:1 ✓) |
| Composer | #FFFFFF | OFFICIAL† (with #DADCE0 border) |
| Link | #1A73E8 | OFFICIAL† · blue 600 |

**Accessibility flags:** all text pairs pass. Note that a truly monochrome UI still keeps colored error/success/warning — this matches Google's own practice (Search UI is grey + blue, but errors are still red).

---

## 14. Combination M — Google Messages-inspired Light *(bonus)*

**Character:** the 2024 Google-refresh take on Messages: #0B57D0 primary, #D3E3FD containers, solid blue outgoing bubbles.
**Closest Google product:** Google Messages (2024 refresh).
**Strengths:** newest accessible Google blue (≈6.3:1 with white — real AA margin); an actual chat product as reference.
**Weaknesses:** OBSERVED values, not classic documentation; mixing eras if older grey tokens are introduced carelessly.
**Best use:** consumer chat, Messages-style.
**Chat suitability:** excellent.
**Suggested dark pair:** N.

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #FFFFFF | OFFICIAL† |
| Surface | #FFFFFF | OFFICIAL† |
| Elevated surface | #FFFFFF | OFFICIAL† |
| Primary | #0B57D0 | OBSERVED · 2024 primary blue (older builds: #1A73E8) |
| Primary container | #D3E3FD | OBSERVED · 2024 blue 100 |
| Secondary | #5F6368 | OFFICIAL† · grey 700 |
| Accent | #4285F4 | OFFICIAL · Google Blue — decoration only |
| Primary text | #1F1F1F | OBSERVED · 2024 primary text |
| Secondary text | #444746 | OBSERVED · 2024 secondary text (≈9.4:1 ✓) |
| Muted text | #5F6368 | OFFICIAL† · grey 700 |
| Border | #DADCE0 | OFFICIAL† · grey 300 |
| Divider | #E8EAED | OFFICIAL† · grey 200 |
| Hover | #F1F3F4 | OFFICIAL† · grey 100 |
| Selected | #D3E3FD | OBSERVED · 2024 blue 100 |
| Focus | #0B57D0 | OBSERVED · 2024 primary blue |
| Error | #B3261E | OFFICIAL · M3 error |
| Warning | #B06000 | OFFICIAL† · yellow 900 |
| Success | #188038 | OFFICIAL† · green 800 |
| Info | #0B57D0 | OBSERVED · 2024 primary blue |
| Incoming message | #F1F3F4 | OBSERVED (approx) · classic Messages incoming bubble |
| Incoming message text | #1F1F1F | OBSERVED (≈15:1 ✓) |
| Outgoing message | #0B57D0 | OBSERVED · Messages-style blue bubble |
| Outgoing message text | #FFFFFF | OBSERVED (≈6.3:1 ✓ — real AA margin) |
| Composer | #FFFFFF | OFFICIAL† |
| Link | #0B57D0 | OBSERVED (≈6.3:1 ✓) |

**Accessibility flags:** all pairs pass; this is the *safest* blue-bubble light scheme (better margin than J).

---

## 15. Combination N — Google Messages-inspired Dark *(bonus)*

**Character:** classic Google dark with bright blue 300 outgoing bubbles and dark text inside them — the documented Google dark-button pattern applied to bubbles.
**Closest Google product:** Google Messages (dark) / Google Workspace dark buttons.
**Strengths:** outgoing bubble text ≈7.7:1; every color is a known Google dark token.
**Weaknesses:** bright #8AB4F8 bubbles visually dominate; bubble assignment itself is INFERRED (Google's exact dark bubble hex is not reliably established).
**Best use:** consumer chat, dark mode.
**Chat suitability:** excellent.
**Suggested light pair:** M (or J).

| Role | HEX | Provenance / basis |
| --- | --- | --- |
| App background | #202124 | OFFICIAL† · grey 900 |
| Surface | #202124 | OFFICIAL† |
| Elevated surface | #292A2D | OFFICIAL† · dark raised |
| Primary | #8AB4F8 | OFFICIAL† · blue 300 |
| Primary container | #174EA6 | OFFICIAL† · blue 900 |
| Secondary | #9AA0A6 | OFFICIAL† · grey 500 |
| Accent | #4285F4 | OFFICIAL · Google Blue — decoration only |
| Primary text | #E8EAED | OFFICIAL† · grey 200 |
| Secondary text | #BDC1C6 | OFFICIAL† · grey 400 |
| Muted text | #9AA0A6 | OFFICIAL† · grey 500 (≈6.1:1 ✓) |
| Border | #3C4043 | OFFICIAL† · grey 800 |
| Divider | #3C4043 | OFFICIAL† · grey 800 |
| Hover | #303134 | OFFICIAL† · classic dark hover |
| Selected | #3C4043 | OFFICIAL† · grey 800 |
| Focus | #8AB4F8 | OFFICIAL† · blue 300 |
| Error | #F28B82 | OFFICIAL† · red 300 |
| Warning | #FDD663 | OFFICIAL† · yellow 300 |
| Success | #81C995 | OFFICIAL† · green 300 |
| Info | #8AB4F8 | OFFICIAL† · blue 300 |
| Incoming message | #303134 | OBSERVED (approx) · dark incoming bubble |
| Incoming message text | #E8EAED | OFFICIAL† (≈12:1 ✓) |
| Outgoing message | #8AB4F8 | OFFICIAL† · blue 300 — INFERRED as a bubble (documented Google dark-button pattern) |
| Outgoing message text | #202124 | OFFICIAL† · grey 900 (≈7.7:1 ✓) |
| Composer | #292A2D | OFFICIAL† · dark raised |
| Link | #8AB4F8 | OFFICIAL† · blue 300 (≈7.7:1 ✓) |

**Accessibility flags:** all text pairs pass AA.

---

## 16. Pairing guide (light ↔ dark)

| Light | Dark | System |
| --- | --- | --- |
| A | B | Material 3 baseline (purple) |
| C | D | Keep-inspired (yellow personality) |
| E | F | Gemini / 2024 refresh |
| G | H | Google Chat / classic Workspace |
| M | N | Google Messages |
| I | H | Neutral Workspace → Chat dark |
| J | N | Blue-focused → Messages dark |
| K | H | Multi-color → Chat dark (keep brand colors for avatars only) |
| L | B | Minimal monochrome → M3 dark neutrals + blue 300 accent |

---

## 17. Cross-palette accessibility flags (apply everywhere)

1. **White on #1A73E8 ≈ 4.5:1** — passes AA exactly, with zero margin. Prefer #0B57D0 (≈6.3:1) for solid blue bubbles/buttons (Combinations E/M).
2. **White on #4285F4 ≈ 3.6:1 — fails.** Google brand blue is for icons/logos/illustration, never text backgrounds.
3. **All four Google brand colors fail AA as text on white** (≈1.9–3.6:1). Decorative use only.
4. **Google yellow 900 #B06000** passes on pure white (≈4.65:1) but fails on tinted surfaces (#FEF7E0 ≈ 4.3:1, #F0F4F9 ≈ 4.0:1). Pair with bold/large text or icons.
5. **M3 outline (#79747E light / #938F99 dark)** is a border/icon tier, not a body-text tier (≈4.3:1 / ≈5.8:1). For muted *text* use on-surface-variant.
6. **Google grey 600 #80868B** (≈3.7:1 on white) — icons/disabled only, never readable text.
7. Dark-mode status colors (blue/green/yellow/red 300) all pass comfortably (≈6.7–13.4:1) on both #202124 and #131314.
8. Google Messages / Gemini dark bubble hexes are OBSERVED — treat as approximate until verified against the live product during implementation.

---

## 18. Sources

**Primary / official**
- Material 3 color roles & baseline tokens — https://m3.material.io/styles/color/roles , https://m3.material.io/styles/color/system
- Google brand colors (#4285F4 / #EA4335 / #FBBC05 / #34A853) — https://about.google/brand-resource-center/
- Google product UI tokens (blue/grey/status ramps) — used across Google's own product UIs and published in Google product & Workspace design guidance (shade naming varies between Google sources; values are stable)

**Observed directly in Google products**
- Gemini (light/dark surfaces, bubbles, #0B57D0, #A8C7FA, #F0F4F9, #D3E3FD, #131314/#1E1F20/#282A2C/#333537) — https://gemini.google.com
- Google Chat (chrome, selection, composer) — https://chat.google.com
- Google Messages (bubbles, composer, status) — https://messages.google.com
- Google Keep (canvas, note palette) — https://keep.google.com
- Gmail / Google Search (grey ramps, selection, dark surfaces) — https://mail.google.com , https://www.google.com

**Secondary (marked where used)**
- Material Theme Builder (M3 baseline token verification) — https://material-foundation.github.io/material-theme-builder/

**Values not reliably established (do not guess):**
- Newer Keep (M3-era) note color hexes
- Exact dark-mode note tints in Keep
- Google pink/teal product token values
- Newer 2024 warning/success variants (e.g., possible replacements for #B06000 / #188038)
- Exact Google Messages dark outgoing-bubble hex (2024)

---

*End of `colors.md`. No code, CSS, tokens, or configuration was modified. Full research, the recommended palette, and the semantic token mapping will follow in `planning.md` as a separate deliverable.*
```

`colors.md` is ready — all 14 combinations (A–L plus bonus Google Messages-inspired M/N) are in separate, self-contained sections, each independently usable, with provenance tags (OFFICIAL / OFFICIAL† / OBSERVED / INFERRED), accessibility flags, and pairing guidance. Nothing else was touched. Stopping here and waiting for your next instruction.