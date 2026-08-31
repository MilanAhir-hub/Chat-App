# React Frontend Performance Audit — Final Report

> **No source files were modified during this audit.**

---

## 1. Executive Summary

### Why does this application feel less smooth?

The application suffers from a **monolithic component architecture** problem. The two primary chat screens — `ChatRoomPage.tsx` (1,755 lines) and `SecureChatPage.tsx` (1,730 lines) — are single massive components that hold **all chat state, all socket handlers, all rendering logic, and all UI interactions** in one component function. Every state change in these components — a new message, a typing indicator, a scroll event, a UI toggle — triggers a **full re-render of the entire component tree**, including re-evaluating every message in the list, every button, every piece of UI.

Additionally, the application uses a **continuously running placeholder typing animation** that fires state updates every 50–100ms even when the user is idle, and recreates `IntersectionObserver` instances on every message array change. There is **no message list virtualization**, **no code splitting**, and **no component decomposition** to isolate re-renders.

### What are the biggest frontend performance bottlenecks?

1. **Monolithic chat components** — every state update re-renders 1,700+ lines of JSX including the entire message list
2. **Placeholder typing animation** — continuous 50–100ms `setTimeout` loop causing non-stop re-renders
3. **IntersectionObserver recreation on every message change** — O(n) DOM queries and observer setup per message update
4. **No message list virtualization** — all messages rendered in DOM at once
5. **No code splitting** — all pages plus `emoji-picker-react` (~200KB+) shipped in one eagerly loaded bundle

### What are the top 5 problems?

Ranked by user-facing impact (consistent with Section 4):

1. **Monolithic chat components** (`ChatRoomPage.tsx`, `SecureChatPage.tsx`) — 28 `useState` hooks and the entire UI in one component; every keystroke, message, typing indicator, and scroll toggle re-renders the full message list. This is the root cause the other problems amplify.
2. **Continuous placeholder animation** (`ChatRoomPage.tsx:225-249`) — re-renders the whole component 10–20 times per second whenever the input is empty, i.e. constantly while the user is idle.
3. **IntersectionObserver rebuilt on every message change** (`ChatRoomPage.tsx:498-537`) — two O(n) filter passes, per-message DOM queries, and observer teardown/recreate on every message event; lag scales with conversation length.
4. **No message list virtualization** — every message is a live DOM node; long conversations degrade scrolling, memory, and render time.
5. **No code splitting** (`App.tsx`) — the login page downloads and parses all chat pages, the video call feature, and the ~200KB+ emoji picker before the app is interactive.

### Are the problems mainly rendering, state management, JavaScript execution, DOM, CSS, media, bundle size, or something else?

Primarily **React rendering** and **state management**. The monolithic architecture means state management problems directly cascade into rendering problems. Secondary issues exist in **DOM efficiency** (no virtualization), **JavaScript execution** (observer recreation), and **bundle efficiency** (no code splitting). CSS and media handling are reasonably implemented.

---

## 2. Performance Scorecard

| Area | Score | Explanation |
|---|---|---|
| **Initial Load** | 5/10 | No code splitting — all pages (ChatRoom, SecureChat, Dashboard, VideoCall) loaded eagerly. All wallpaper thumbnails loaded in sidebar. Google Fonts loaded render-blocking. `emoji-picker-react` bundled even if never opened. |
| **React Rendering** | 3/10 | Monolithic 1,755-line component re-renders entirely on every state change. ~28 `useState` hooks in one component. No component decomposition for message bubbles, header, sidebar, input area. |
| **Chat Rendering** | 3/10 | No virtualization. Every message re-renders on any state change. `formatTime()` and `isSingleEmoji()` called per message per render. IntersectionObserver recreated on every `messages` change. |
| **State Management** | 4/10 | All chat state co-located in one component (good for colocation, bad for render isolation). `typingUsers` change re-renders entire message list. Placeholder animation state mixed with chat state. |
| **JavaScript Execution** | 5/10 | New `AudioContext` per notification. `readFileAsDataUrl` converts full file to data URL in-memory (up to 2MB base64 string). Regex-based `isSingleEmoji()` runs per message per render. |
| **Scrolling** | 6/10 | `handleScroll` is well-memoized with `useCallback`. But triggers `setShowScrollButton`/`setUnreadCount` state updates which cause full re-renders. No passive scroll listener. |
| **Input Responsiveness** | 5/10 | Typing emits socket events on every change. Placeholder animation runs even during active typing (just short-circuits). `handleMessageChange` is not debounced — every keystroke causes state update + render. |
| **Real-time Updates** | 4/10 | Each incoming message triggers: state update → full re-render → IntersectionObserver rebuild → DOM queries for all unread messages. Typing indicator changes re-render entire chat. |
| **Memory Management** | 5/10 | No message pagination/cleanup — messages array grows unbounded. New `AudioContext` objects allocated per sound. Placeholder animation timers always running. IntersectionObserver properly disconnected. |
| **DOM Efficiency** | 4/10 | All messages rendered as DOM nodes. Deep nesting per message (article > SwipeableMessage > div > div > div > content). Chat area has `backdrop-blur` on sidebar overlay. |
| **CSS/Animation Performance** | 6/10 | `backdrop-blur` used on multiple overlays (sidebar, media meta, fullscreen viewer). `filter: blur(40px)` on chat background gradient. CSS transitions on message bubbles. Overall reasonable but blur effects are GPU-expensive. |
| **Media Handling** | 6/10 | Images use `loading="lazy"`. But wallpaper thumbnails in sidebar all load eagerly. Files converted to full base64 data URLs before sending (up to 2MB in-memory strings). |
| **Bundle Efficiency** | 4/10 | No code splitting or lazy routes. `emoji-picker-react` (~200KB+) loaded eagerly. `@hugeicons` library imported with many individual icons. No dynamic imports for VideoCall feature. |

---

## 3. Findings

---

### [P0] Monolithic Chat Components — Entire UI Re-renders on Every State Change

**Location:** `client/src/pages/ChatRoomPage.tsx` (1,755 lines) and `client/src/pages/SecureChatPage.tsx` (1,730 lines)

**Problem:**

Each chat page is a single component with ~28 `useState` hooks (lines 148–215 in ChatRoomPage). The entire 1,755-line render function — including header, sidebar, message list, input area, emoji picker, camera UI, wallpaper picker, scroll button, fullscreen image viewer, and termination modal — is one render tree.

```text
ChatRoomPage (28 useState hooks)
├── header (room info, buttons, VideoCallPanel)
├── sidebar (user list, theme controls, wallpaper picker)
├── message list
│   ├── notices.map(...)
│   └── messages.map(...)  ← EVERY message re-renders
│       ├── SwipeableMessage
│       │   ├── sender name
│       │   ├── reply preview
│       │   ├── reaction picker
│       │   ├── message content/image/file
│       │   ├── timestamp + status
│       │   └── reaction display
│       └── (useSwipeReply hook per message)
├── typing indicator
├── scroll-to-bottom button
├── input form (emoji picker, attachments, textarea)
├── camera interface
├── termination modal
└── fullscreen image viewer
```

**Why it is expensive:**

When *any* of the 28 state values changes, React must re-execute the entire component function, re-evaluate all conditionals, re-call `formatTime()` and `isSingleEmoji()` for every message, re-create all inline JSX, and reconcile the entire virtual DOM tree. With 100+ messages, this is thousands of React elements being diffed on every keystroke, every typing indicator update, every scroll event that toggles the scroll button.

**Trigger:** Any state update: typing, receiving a message, scroll position change, toggling emoji picker, opening sidebar, wallpaper change, etc.

**Impact:** User experiences sluggishness on every interaction. Input feels delayed. New messages cause visible jank as the entire component re-renders.

**Frequency:** Every keystroke, every incoming socket event, every scroll event that crosses the threshold, every 50ms during placeholder animation.

**Affected area:** Both chat screens — the primary user-facing pages.

**Severity:** P0

**Confidence:** High

---

### [P0] Continuous Placeholder Animation Causing Non-Stop Re-renders

**Location:** `client/src/pages/ChatRoomPage.tsx:225-249`

**Problem:**

The component runs a continuous typing animation for the input placeholder text. It cycles through phrases like "Say something...", "Type a message...", etc. by setting `setTimeout` every 50ms (deleting) or 100ms (typing), updating three state variables: `placeholder`, `placeholderIndex`, and `isDeleting`.

```typescript
const [placeholder, setPlaceholder] = useState('');
const [placeholderIndex, setPlaceholderIndex] = useState(0);
const [isDeleting, setIsDeleting] = useState(false);

useEffect(() => {
  const timeout = window.setTimeout(() => {
    // ... updates placeholder, isDeleting, placeholderIndex
    setPlaceholder(currentFullText.substring(0, nextCharIndex));
  }, typingSpeed); // 50ms or 100ms

  return () => clearTimeout(timeout);
}, [placeholder, isDeleting, placeholderIndex, placeholders]);
```

**Why it is expensive:**

This effect fires every 50–100ms. Each firing updates `placeholder` state, which triggers a **full re-render of the entire 1,755-line component**, including re-evaluating and reconciling the entire message list. Even when the user is simply looking at the chat, the component is re-rendering 10–20 times per second.

While the animation short-circuits when `messageText.length > 0`, it still sets a timer and enters the effect callback every 50–100ms. And when the input is empty (the most common idle state), it constantly re-renders.

**Trigger:** Constantly, whenever input is empty (which is most of the time).

**Impact:** Continuous unnecessary CPU work. Competes with real user interactions for main thread time. Can cause dropped frames during scrolling or message receipt.

**Frequency:** 10–20 times per second, indefinitely.

**Affected area:** ChatRoomPage only (SecureChatPage uses a static placeholder).

**Severity:** P0

**Confidence:** High

---

### [P0] IntersectionObserver Recreated on Every Message Array Change

**Location:** `client/src/pages/ChatRoomPage.tsx:498-537` and `client/src/pages/SecureChatPage.tsx:538-577`

**Problem:**

The "seen detection" effect depends on `[messages, user]`. Every time the messages array changes (new message, message update, delivery status, reaction), the effect:

1. Disconnects the previous `IntersectionObserver`
2. Iterates ALL messages to find undelivered ones: `messages.filter(m => ...)`
3. For each undelivered message, emits `message:delivered` socket event
4. Iterates ALL messages again to find unseen ones: `messages.filter(m => ...)`
5. For each unseen message, calls `document.getElementById(...)` (DOM query)
6. Creates a **new** `IntersectionObserver`
7. Observes each unseen message element

**Why it is expensive:**

With 200 messages, this runs 3 x O(200) operations plus DOM queries every time any message changes. IntersectionObserver creation and element observation are not free. The `deliveredTo.includes()` and `seenBy.includes()` are O(n) array scans per message.

**Trigger:** Any change to the messages array — new message, message update, reaction, delivery/seen status change.

**Impact:** Noticeable lag on message receipt in conversations with many messages. Multiple redundant socket emissions.

**Frequency:** Every incoming message event, every message update event.

**Affected area:** Both ChatRoomPage and SecureChatPage.

**Severity:** P0

**Confidence:** High

---

### [P1] No Message List Virtualization

**Location:** `client/src/pages/ChatRoomPage.tsx:1233-1459` (message rendering loop)

**Problem:**

All messages are rendered to the DOM simultaneously via `messages.map(...)`. Each message creates a deeply nested DOM subtree (article -> SwipeableMessage -> group div -> bubble div -> content + meta + reactions). There is no virtualization (e.g., react-window, react-virtuoso).

**Why it is expensive:**

With 500+ messages, this creates thousands of DOM nodes. The browser must layout, paint, and composite all of them. Combined with the monolithic re-render problem (P0), every state change reconciles all message elements. Each message also instantiates the `useSwipeReply` hook (via `SwipeableMessage`), which creates refs and callback closures.

**Trigger:** Opening a chat with many messages. Accumulating messages in a long session.

**Impact:** Progressively degrading performance as conversation grows. Slow initial render when opening a chat with history.

**Frequency:** Every chat opening. Continuous degradation during long conversations.

**Affected area:** Both ChatRoomPage and SecureChatPage.

**Severity:** P1

**Confidence:** High

---

### [P1] New AudioContext Created Per Notification Sound

**Location:** `client/src/utils/sound.ts:5-30`

**Problem:**

Every call to `playNotificationSound()` creates a brand new `AudioContext`, a new `OscillatorNode`, and a new `GainNode`:

```typescript
export const playNotificationSound = () => {
  const context = new AudioContextClass();  // NEW AudioContext each time
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  // ...plays sound...
  oscillator.onended = () => { void context.close(); };
};
```

**Why it is expensive:**

`AudioContext` creation involves OS-level audio system allocation. Browsers have limits on concurrent AudioContexts (Chrome warns after 6). In a busy group chat, rapid messages can create many AudioContexts before old ones close, potentially exhausting the browser's audio resource pool and causing console warnings or audio glitches.

**Trigger:** Every incoming message from another user.

**Impact:** Audio glitches in rapid-fire messaging. Console warnings. Resource allocation overhead.

**Frequency:** Every incoming message (could be rapid in group chats).

**Affected area:** Both ChatRoomPage and SecureChatPage.

**Severity:** P1

**Confidence:** High

---

### [P1] Scroll-to-Bottom Effect Triggered by typingUsers Changes

**Location:** `client/src/pages/ChatRoomPage.tsx:286-290`

**Problem:**

```typescript
useEffect(() => {
  if (isAtBottomRef.current) {
    scrollToBottom('smooth');
  }
}, [messages, notices, typingUsers, scrollToBottom]);
```

The auto-scroll effect depends on `typingUsers`. Every typing indicator start/stop (which creates a new object via `{ ...current }`) triggers this effect, which calls `scrollToBottom('smooth')`, which calls `scrollContainerRef.current.scrollTo(...)` and updates `unreadCount` and `showScrollButton` state.

**Why it is expensive:**

Typing indicators can toggle rapidly (every keystroke from remote users, with 900ms timeout). Each toggle: new `typingUsers` object -> effect fires -> `scrollToBottom` called -> 2 state updates (`setUnreadCount(0)`, `setShowScrollButton(false)`) -> full component re-render.

**Trigger:** Every typing start/stop event from any user in the room.

**Impact:** Unnecessary scroll operations and state updates during typing events.

**Frequency:** Every time any remote user starts or stops typing.

**Affected area:** Both chat pages.

**Severity:** P1

**Confidence:** High

---

### [P1] No Code Splitting or Lazy Loading of Routes

**Location:** `client/src/App.tsx:1-38`

**Problem:**

All page components are eagerly imported:

```typescript
import { ChatRoomPage } from './pages/ChatRoomPage';
import { SecureChatPage } from './pages/SecureChatPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
```

No `React.lazy()` or dynamic imports are used. This means:
- Login page loads ChatRoomPage code (74KB source)
- Login page loads SecureChatPage code (72KB source)
- Login page loads VideoCallPanel and useVideoCall (50KB source)
- Login page loads emoji-picker-react (~200KB+ bundled)

**Why it is expensive:**

The entire application JavaScript is in a single chunk. Initial page load downloads, parses, and evaluates all code regardless of which route the user navigates to. This significantly increases Time to Interactive, especially on mobile networks.

**Trigger:** Initial application load.

**Impact:** Slower first paint. Longer time before the login page is interactive. Unnecessary bandwidth usage.

**Frequency:** Every page load / hard refresh.

**Affected area:** All pages, especially initial load.

**Severity:** P1

**Confidence:** High

---

### [P1] `handleScroll` Triggers State Updates Without Debouncing

**Location:** `client/src/pages/ChatRoomPage.tsx:269-284`

**Problem:**

```typescript
const handleScroll = useCallback(() => {
  if (!scrollContainerRef.current) return;
  const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
  const isBottom = scrollHeight - scrollTop - clientHeight < 100;

  isAtBottomRef.current = isBottom;
  setShowScrollButton(!isBottom);  // STATE UPDATE on every scroll event

  if (isBottom) {
    setUnreadCount(0);  // STATE UPDATE
  }
}, []);
```

This is attached directly as `onScroll={handleScroll}` on the scroll container. The scroll event fires at ~60fps during active scrolling. Each event calls `setShowScrollButton()`, which triggers a full component re-render. When at the bottom, it additionally calls `setUnreadCount(0)`.

**Why it is expensive:**

60 state updates per second during scrolling, each causing the monolithic component to re-render entirely. The `setShowScrollButton` call creates new boolean state even if the value hasn't changed (React's `useState` will bail out for same-value booleans, but only after entering the render function).

**Trigger:** Any scroll event.

**Impact:** Janky scrolling, especially on lower-end devices. Scrolling competes with rendering for main thread time.

**Frequency:** ~60 times per second during active scrolling.

**Affected area:** Both chat pages.

**Severity:** P1

**Confidence:** Medium (React may bail out on identical values, but the scroll handler still runs frequently and reads layout properties)

---

### [P1] File Uploads Convert Entire File to Base64 Data URL In-Memory

**Location:** `client/src/utils/file.ts:3-10` used in `client/src/pages/ChatRoomPage.tsx:766`

**Problem:**

```typescript
export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read this file.'));
    reader.readAsDataURL(file);
  });
```

The `MAX_UPLOAD_BYTES` is 2,000,000 (2MB). A 2MB file converted to base64 becomes ~2.67MB string. This entire base64 string is then:
1. Stored in the `optimisticMessage.content` field (line 774)
2. Added to the `messages` state array (line 791)
3. Emitted via WebSocket as `dataUrl` (line 799)

**Why it is expensive:**

A ~2.7MB string is held in React state, causing the monolithic component to diff this large string on every render. The socket emission sends a ~2.7MB payload. If multiple images are in the message list, the messages array holds several MB of base64 strings in memory.

**Trigger:** Any file upload (image or document).

**Impact:** Memory spike during upload. Large socket payload. Possible UI freeze on lower-end devices during FileReader operation.

**Frequency:** Each file upload.

**Affected area:** Both chat pages.

**Severity:** P1

**Confidence:** High

---

### [P1] Resize Event Listener Updates State Without Debouncing

**Location:** `client/src/pages/ChatRoomPage.tsx:180-186` and `client/src/pages/SecureChatPage.tsx:180-186`

**Problem:**

```typescript
useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth < 1024);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

Every resize event (firing at ~60fps during window resize) calls `setIsMobile()`, triggering a full re-render of the 1,755-line component.

**Why it is expensive:**

During window resize, this fires dozens of times per second. Each state update triggers full component reconciliation. The `isMobile` value is used for wallpaper rendering decisions.

**Trigger:** Window resize, device orientation change.

**Impact:** Jank during resize. Unnecessary re-renders.

**Frequency:** ~60fps during resize operations.

**Affected area:** Both chat pages.

**Severity:** P1

**Confidence:** Medium (resize is infrequent in normal usage, but severe when it happens)

---

### [P2] `formatTime()` Creates New `Intl.DateTimeFormat` Per Call

**Location:** `client/src/pages/ChatRoomPage.tsx:81-85`

**Problem:**

```typescript
const formatTime = (dateValue: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));
```

This function is called for every message during every render. Each call creates a new `Intl.DateTimeFormat` instance and a new `Date` object.

**Why it is expensive:**

`Intl.DateTimeFormat` constructor has non-trivial initialization cost (locale resolution, pattern compilation). With 200 messages and the monolithic re-render problem, this creates 200 formatters per render, potentially 200 x 15 = 3,000 formatters per second during placeholder animation.

**Trigger:** Every component render.

**Impact:** Measurable CPU overhead during rendering. Contributes to overall render time.

**Frequency:** Per message, per render.

**Affected area:** Both chat pages.

**Severity:** P2

**Confidence:** High

---

### [P2] `isSingleEmoji()` Runs Complex Regex Per Message Per Render

**Location:** `client/src/pages/ChatRoomPage.tsx:93-98`

**Problem:**

```typescript
const isSingleEmoji = (str: string): boolean => {
  const flagRegex = /^[\u{1F1E6}-\u{1F1FF}]{2}$/u;
  const emojiRegex = /^(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})...)$/u;
  const trimmed = str.trim();
  return flagRegex.test(trimmed) || emojiRegex.test(trimmed);
};
```

This is called in the message rendering loop for every text message to determine if it should use the "emoji only" bubble style. The Unicode property escape regex is computationally expensive.

**Why it is expensive:**

Two regex instances are created per call (no caching). Unicode property escapes require Unicode table lookups. With 200 messages and the placeholder animation causing 15 renders/second, this runs 3,000 times per second.

**Trigger:** Every render of the message list.

**Impact:** Contributes to overall render time. More impactful with large message counts.

**Frequency:** Per text message, per render.

**Affected area:** Both chat pages.

**Severity:** P2

**Confidence:** Medium

---

### [P2] `isImageMessage()` Runs Multiple Regex Checks Per Message Per Render

**Location:** `client/src/pages/ChatRoomPage.tsx:292-305`

**Problem:**

While wrapped in `useCallback`, `isImageMessage()` is called **multiple times** per message in the render loop:
1. Line 1256: for CSS class determination
2. Line 1344: for content rendering conditional
3. Line 1408: for media meta rendering
4. Line 1504: in reply preview

**Trigger:** Every render of the message list.

**Impact:** Redundant regex execution per message. Multiplied by render frequency.

**Frequency:** 2-4 times per message, per render.

**Affected area:** Both chat pages.

**Severity:** P2

**Confidence:** Medium

---

### [P2] Emoji Picker Loaded Eagerly in Bundle

**Location:** `client/src/pages/ChatRoomPage.tsx:33`

**Problem:**

```typescript
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
```

The `emoji-picker-react` library is a large dependency (~200KB+ minified). It's statically imported in both `ChatRoomPage` and `SecureChatPage`, meaning it's included in the main bundle even though it's only shown when the user clicks the emoji button.

**Why it is expensive:**

Adds significant weight to the JavaScript bundle. Increases parse time on initial load. Most users may never open the emoji picker in a given session.

**Trigger:** Initial application load.

**Impact:** Slower initial page load and time to interactive.

**Frequency:** Every page load.

**Affected area:** Bundle size and initial load.

**Severity:** P2

**Confidence:** High

---

### [P2] Visual Viewport Resize Handler Calls `scrollToBottom` Aggressively

**Location:** `client/src/pages/ChatRoomPage.tsx:578-612`

**Problem:**

The handler sets a CSS custom property, calls `window.scrollTo(0, 0)` twice, sets `document.body.scrollTop = 0`, and schedules another `window.scrollTo` + `scrollToBottom` after 100ms. This fires on both `resize` and `scroll` events of `visualViewport`.

**Why it is expensive:**

Multiple forced scrolls can cause layout thrashing. The `scrollToBottom` call triggers 2 state updates. On mobile, keyboard open/close fires this rapidly.

**Trigger:** Mobile keyboard open/close, viewport resize.

**Impact:** Possible jank during keyboard animation on mobile.

**Frequency:** Every visual viewport change.

**Affected area:** Mobile usage of both chat pages.

**Severity:** P2

**Confidence:** Medium

---

### [P2] VideoCallPanel Registers Global Mouse/Touch Listeners Unconditionally

**Location:** `client/src/features/video-call/VideoCallPanel.tsx:184-207`

**Problem:**

4 global event listeners (`mousemove`, `mouseup`, `touchmove`, `touchend`) are registered as soon as `VideoCallPanel` mounts (which is always, since it's in the ChatRoomPage header). They fire on every mouse move and touch move across the page, even when no video call is active.

**Why it is expensive:**

`onMouseMove` fires at ~60fps during any mouse movement. While the handler returns early if `!isDragging.current`, it still runs the function entry, ref check, and exits. These listeners are not passive.

**Trigger:** Any mouse or touch movement on the page.

**Impact:** Minor but unnecessary main thread work during all mouse interactions.

**Frequency:** ~60fps during any mouse/touch movement.

**Affected area:** ChatRoomPage (where VideoCallPanel is rendered).

**Severity:** P2

**Confidence:** Medium

---

### [P2] ThemeContext Value Recreates Closures on Any Theme Change

**Location:** `client/src/context/ThemeContext.tsx:71-87`

**Problem:**

While the value is memoized with `useMemo`, the `setAccent` and `toggleGlassTheme` functions are inline arrow functions that are recreated whenever `theme`, `accent`, or `glassTheme` changes. When any of these values changes, ALL consumers of `useTheme()` re-render, even if they only use `theme`.

**Why it is expensive:**

`ThemeToggle`, `GlassThemeToggle`, `ThemeSelector`, `ChatRoomPage`, and `SecureChatPage` all consume this context. An accent change triggers re-renders in all of them. Since both chat pages are monolithic, this means accent change -> full chat re-render.

**Trigger:** Any theme, accent, or glass theme change.

**Impact:** All context consumers re-render, including the monolithic chat components.

**Frequency:** Infrequent (user-initiated theme changes). But the structural issue amplifies impact of each change.

**Affected area:** All components using `useTheme()`.

**Severity:** P2

**Confidence:** Medium

---

### [P2] Wallpaper Thumbnails All Load Eagerly in Sidebar

**Location:** `client/src/pages/ChatRoomPage.tsx:1119-1146` (wallpaper grid)

**Problem:**

The wallpaper selector renders all 15 wallpaper images as `<img>` tags without `loading="lazy"`. The wallpaper files total **5.83 MB** across 15 images (some over 800KB each).

**Why it is expensive:**

When the sidebar is opened and the wallpaper picker is shown, all 15 images start loading simultaneously. This can saturate the network connection and compete with chat message loading. The images are full-size wallpapers rendered as tiny thumbnails.

**Trigger:** Opening the sidebar wallpaper picker.

**Impact:** Network bandwidth competition. Possible stutter as browser decodes large images.

**Frequency:** Each time wallpaper picker is opened.

**Affected area:** Both chat pages (mobile sidebar).

**Severity:** P2

**Confidence:** High

---

### [P3] `scrollToMessage` Uses Direct DOM Manipulation with Class Toggling

**Location:** `client/src/pages/ChatRoomPage.tsx:307-322`

**Problem:**

Directly manipulates DOM classes outside React's control. Creates a `setTimeout` that persists even if the component unmounts.

**Trigger:** Clicking on a reply preview to scroll to the original message.

**Impact:** Minor. Possible stale timeout if user navigates away.

**Frequency:** Infrequent (user-initiated).

**Affected area:** Both chat pages.

**Severity:** P3

**Confidence:** Low

---

### [P3] CSS `backdrop-filter: blur()` Used on Multiple Overlays

**Location:** `client/src/index.css` — lines 430, 469, 484, 494, 703, and various Tailwind classes

**Problem:**

Multiple elements use `backdrop-filter: blur(...)`:
- `.chat-bg-gradient` uses `filter: blur(40px)`
- `.glass-card` uses `backdrop-filter: blur(12px)`
- `.glass-header` uses `backdrop-filter: blur(12px)`
- Adaptive glass uses `backdrop-filter: blur(40px) saturate(170%) brightness(1.1)`
- Sidebar overlay uses `backdrop-blur-sm`
- Media meta uses `backdrop-filter: blur(8px)`

**Why it is expensive:**

`backdrop-filter: blur()` is one of the most GPU-expensive CSS properties. Each blurred element requires the browser to render everything behind it to an offscreen buffer, apply the blur, then composite. Multiple overlapping blur layers compound the cost.

**Trigger:** Always (glass themes), or when overlays are visible.

**Impact:** Higher GPU usage, possible frame drops on lower-end devices, especially mobile.

**Frequency:** Constant when adaptive glass theme is active. Per overlay visibility otherwise.

**Affected area:** All pages with glass styling.

**Severity:** P3

**Confidence:** Medium

---

### [P3] Chat Background Image Loaded via CSS on Every Mobile Chat View

**Location:** `client/src/index.css:446-464`

**Problem:**

The light mode background is 230KB — a large image for a chat background that's partially hidden behind messages.

**Trigger:** Opening any chat on mobile.

**Impact:** Additional 230KB download on mobile (where bandwidth is most constrained).

**Frequency:** First chat load (then cached).

**Affected area:** Mobile chat views.

**Severity:** P3

**Confidence:** Medium

---

## 4. Top 10 Performance Problems

| Rank | Problem | Location | Why It Matters | Estimated Impact | User Experience |
|---|---|---|---|---|---|
| 1 | **Monolithic 1,755-line component** | `ChatRoomPage.tsx` | Every state change re-renders everything | High — 28 state hooks, entire message list re-evaluates | Sluggish interactions, input lag, jank on message receipt |
| 2 | **Continuous placeholder animation** | `ChatRoomPage.tsx:225-249` | 10-20 re-renders/sec when idle | High — constant CPU work, competes with real interactions | Background CPU drain, reduced responsiveness |
| 3 | **IntersectionObserver recreated per message change** | `ChatRoomPage.tsx:498-537` | O(n) DOM queries + observer setup per update | High — scales with message count | Lag spike on receiving messages in long conversations |
| 4 | **No message list virtualization** | `ChatRoomPage.tsx:1233` | All messages in DOM simultaneously | Medium-High — degrades with conversation length | Progressively slower chat, heavy memory usage |
| 5 | **No code splitting** | `App.tsx` | All 150KB+ source loaded on initial load | Medium — slower TTI, wasted bandwidth | Slow initial page load, especially on mobile |
| 6 | **Scroll handler triggers state updates at 60fps** | `ChatRoomPage.tsx:269-284` | State update per scroll frame | Medium — full component re-render during scrolling | Janky scrolling on lower-end devices |
| 7 | **New AudioContext per notification** | `sound.ts:5-30` | OS audio resource allocation per sound | Medium — resource exhaustion in busy chats | Audio glitches, console warnings |
| 8 | **typingUsers triggers scroll-to-bottom effect** | `ChatRoomPage.tsx:286-290` | Typing indicators cause unnecessary scrolls | Medium — cascading state updates | Unexpected scrolls during typing activity |
| 9 | **File uploads as 2MB+ base64 in state** | `file.ts:3-10` | Multi-MB strings in React state | Medium — memory spikes, large payloads | Momentary freeze during image upload |
| 10 | **Emoji picker eagerly bundled** | `ChatRoomPage.tsx:33` | ~200KB+ in main bundle | Low-Medium — affects initial load only | Slower first load |

---

## 5. Performance Hotspots

```text
ChatRoomPage (1,755 lines, 28 useState hooks)  ← HOTSPOT: entire component re-renders
│
├── useEffect [placeholder animation]  ← HOTSPOT: 10-20 re-renders/sec
│   └── setPlaceholder / setIsDeleting / setPlaceholderIndex
│
├── useEffect [seen detection]  ← HOTSPOT: O(n) per message change
│   ├── messages.filter() x 2
│   ├── document.getElementById() x n
│   └── new IntersectionObserver()
│
├── useEffect [auto-scroll]  ← Triggered by messages + typingUsers
│   └── scrollToBottom → setUnreadCount + setShowScrollButton
│
├── handleScroll  ← HOTSPOT: fires at 60fps
│   └── setShowScrollButton + setUnreadCount
│
├── [render] messages.map()  ← HOTSPOT: all messages re-render
│   ├── formatTime() x n  ← new Intl.DateTimeFormat per call
│   ├── isSingleEmoji() x n  ← complex regex per call
│   ├── isImageMessage() x n  ← regex per call, called 2-4 times
│   └── SwipeableMessage x n
│       └── useSwipeReply() hook x n  ← refs + callbacks per message
│
├── EmojiPicker (imported eagerly)  ← ~200KB in bundle
│
└── VideoCallPanel
    └── useEffect [drag listeners]  ← 4 global listeners always active
```

---

## 6. Critical User Flows

### Flow 1 — App Startup

| Step | What Happens | Issue |
|---|---|---|
| Bundle download | Single chunk with all pages + emoji picker + video call | No code splitting |
| Parse/Execute | All module-level code runs | Wallpaper arrays, regex constructors |
| AuthContext mount | `refreshUser()` API call | OK — standard pattern |
| ThemeContext mount | 3 localStorage reads + 3 `useEffect` for DOM updates | Minimal — OK |
| Route resolution | Redirect to login or dashboard | OK |
| **Verdict** | **Slow initial load due to bundle size** | |

### Flow 2 — Open Chat

| Step | What Happens | Issue |
|---|---|---|
| Navigate to `/rooms/:id` | ChatRoomPage mounts with 28 `useState` | Heavy initialization |
| `loadRoom` effect | 2 API calls (joinRoom + getMessages) | Sequential, not parallel |
| Socket connection | Connect + join room + register 8 listeners | OK |
| Initial render | All messages rendered to DOM | No virtualization |
| Placeholder animation starts | 50-100ms timer loop begins | Continuous re-renders |
| IntersectionObserver setup | O(n) DOM queries for unread messages | Scales with history |
| Resize listener registered | `setIsMobile` on resize | Always active |
| Visual viewport handler | Registered + initial call | OK |
| **Verdict** | **Heavy — many effects, all messages render, animation starts** | |

### Flow 3 — Send Message

| Step | What Happens | Issue |
|---|---|---|
| User presses Enter | `sendMessage()` called | OK |
| Optimistic message created | `setMessages(prev => [...prev, msg])` | Full re-render |
| `setMessageText('')` | Another state update | Batched with above in React 18+ |
| `setReplyingTo(null)` | Another state update | Batched |
| `setTimeout(scrollToBottom, 50)` | Delayed scroll | OK but triggers more state updates |
| Socket emit | Async socket call | OK |
| Callback updates message | `setMessages(prev => prev.map(...))` | Full re-render |
| IntersectionObserver rebuilds | Due to messages change | O(n) work |
| **Verdict** | **3-4 re-renders for one sent message** | |

### Flow 4 — Receive Message

| Step | What Happens | Issue |
|---|---|---|
| Socket `message:new` fires | `handleNewMessage` callback | OK |
| `setMessages(prev => [...prev, msg])` | Full re-render | Monolithic issue |
| `message:delivered` emitted | Socket call | OK |
| `playNotificationSound()` | New AudioContext | Resource allocation |
| If not at bottom: `setUnreadCount(prev + 1)` | Another state update | Full re-render |
| Auto-scroll effect fires | Due to messages dependency | scrollToBottom -> 2 more state updates |
| IntersectionObserver rebuilds | Due to messages change | O(n) DOM queries |
| **Verdict** | **Heavy — 2-4 state updates + observer rebuild per message** | |

### Flow 5 — Typing

| Step | What Happens | Issue |
|---|---|---|
| Keystroke | `handleMessageChange(value)` | OK |
| `setMessageText(value)` | Full re-render | Monolithic issue |
| Placeholder animation continues | Checks `messageText.length > 0` | Still enters effect |
| `typing:start` socket emit | Per keystroke (with 900ms timeout) | OK — throttled |
| **Verdict** | **Each keystroke triggers full re-render of 1,755 lines** | |

### Flow 6 — Scrolling

| Step | What Happens | Issue |
|---|---|---|
| Scroll event fires | `handleScroll` at ~60fps | No debounce |
| `setShowScrollButton(!isBottom)` | State update per frame | Full re-render potential |
| All messages re-evaluated | Due to component re-render | Monolithic issue |
| If at bottom: `setUnreadCount(0)` | Additional state update | More re-renders |
| **Verdict** | **State updates at scroll frequency, cascading re-renders** | |

### Flow 7 — Switch Conversation

| Step | What Happens | Issue |
|---|---|---|
| Navigate away | Cleanup: stopTyping, disconnect socket, remove 8 listeners | OK — proper cleanup |
| Navigate to new room | Full ChatRoomPage remount | All 28 states reset |
| New `loadRoom` effect | 2 API calls | Sequential |
| All effects re-run | Observer, listeners, animation | Heavy initialization |
| **Verdict** | **Full component destroy + recreate — no state preservation** | |

### Flow 8 — Loading Older Messages

| Step | What Happens | Issue |
|---|---|---|
| N/A | **No pagination implemented** | Messages loaded once via API |
| **Verdict** | **No infinite scroll or lazy loading of message history** | |

---

## 7. Root-Cause Categories

| Category | Contribution | Explanation |
|---|---|---|
| **React Rendering** | Very High (40%) | Monolithic component is the root cause of most issues. Every state change re-renders everything. |
| **State Management** | High (20%) | 28 state hooks in one component with no isolation. Derived values computed during render instead of cached. |
| **Effects/Hooks** | Medium (15%) | Placeholder animation effect, IntersectionObserver recreation, scroll/resize effects without debouncing. |
| **JavaScript** | Low-Medium (5%) | Regex and `Intl.DateTimeFormat` per message per render. AudioContext creation per notification. |
| **DOM** | Medium (8%) | No virtualization. All messages in DOM. Deep nesting per message. |
| **CSS** | Low (3%) | Multiple `backdrop-filter: blur()` layers. Otherwise reasonable. |
| **Images/Media** | Low (3%) | Wallpaper thumbnails loaded eagerly. Base64 data URLs for uploads. Chat images use `loading="lazy"`. |
| **Bundle/Startup** | Medium (4%) | No code splitting. Emoji picker eagerly bundled. All routes loaded upfront. |
| **Memory** | Low (2%) | Unbounded message array. AudioContext allocation. Otherwise proper cleanup. |
| **Real-time UI Updates** | Medium (included in Rendering) | Each socket event triggers full component re-render. Typing indicators affect entire chat. |
| **Perceived Responsiveness** | Good | Optimistic message sending implemented well. Loading states present. Smooth animations defined in CSS. |

---

## Recommended Fix Order

> These are ordered by **impact x effort** ratio. Fix the highest-impact, most-foundational problems first, as later fixes depend on earlier ones.

1. **Extract message list into a separate component** — Break `ChatRoomPage` into `<ChatHeader>`, `<MessageList>`, `<MessageBubble>`, `<ChatInput>`, `<ChatSidebar>`. Use `React.memo` on `MessageBubble`. This is the foundational fix that reduces the blast radius of all other issues.

2. **Remove or isolate the placeholder typing animation** — Replace with a CSS-only animation, or move to a separate `<AnimatedPlaceholder>` component that doesn't trigger parent re-renders.

3. **Optimize the IntersectionObserver "seen detection" effect** — Only observe *newly added* unread messages instead of rebuilding on every messages change. Use a ref to track already-observed messages.

4. **Add message list virtualization** — Use `react-virtuoso` or `@tanstack/react-virtual` for the message list. This eliminates DOM overhead for long conversations.

5. **Add route-based code splitting** — Use `React.lazy()` + `Suspense` for `ChatRoomPage`, `SecureChatPage`, `DashboardPage`, and auth pages.

6. **Debounce/throttle scroll and resize handlers** — Use `requestAnimationFrame` or a throttle utility to limit state updates during scrolling.

7. **Reuse a single AudioContext** — Create one `AudioContext` at module level and reuse it for all notification sounds.

8. **Remove `typingUsers` from auto-scroll effect dependency** — Typing indicators should not trigger scroll-to-bottom.

9. **Lazy-load emoji picker** — Use `React.lazy()` to load `emoji-picker-react` only when the emoji button is clicked.

10. **Cache `Intl.DateTimeFormat` instance** — Create one formatter at module level and reuse it for all `formatTime` calls.

11. **Cache `isSingleEmoji` and `isImageMessage` results** — Compute these once when message arrives, store on the message object or in a Map, don't recompute per render.

12. **Add lazy loading to wallpaper thumbnails** — Use `loading="lazy"` on wallpaper images and consider generating smaller thumbnail versions.

13. **Split ThemeContext** — Separate frequently-changing values (if any) from stable callbacks to prevent unnecessary consumer re-renders.

14. **Use `URL.createObjectURL` instead of base64 data URLs** — For file previews, use object URLs which are just string references rather than encoding entire files as base64 strings in memory.

---

> **No source files were modified during this audit.**
