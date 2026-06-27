# Feature Request: Add Secure Persistent Chat Without Breaking Existing Functionality

## IMPORTANT

This is the highest priority requirement.

**DO NOT MODIFY, BREAK, OR REFACTOR the existing room-based temporary chat functionality.**

The current room-based chat is working perfectly and must remain exactly as it is.

Do not change any existing APIs, Socket.IO events, room creation logic, room joining logic, or temporary room behavior unless absolutely necessary for integration.

The new feature must be built alongside the existing system, not replace it.

---

# Existing Functionality (Must Remain Unchanged)

The application currently has a room-based chat system.

Current behavior:

- User creates a room.
- A unique room code is generated.
- Other users join using that room code.
- Messages are exchanged in real time using Socket.IO.
- Messages are NOT stored in the database.
- When every participant leaves the room, all messages disappear.
- The room is deleted automatically.

This feature is complete.

Do NOT change its behavior.

---

# New Feature: Secure Persistent Chat

Create a completely separate chat system called **Secure Chat**.

This feature is independent from the temporary room feature.

Unlike temporary rooms, Secure Chat stores messages permanently in MongoDB.

Messages should still be exchanged in real time using Socket.IO.

When users reopen the chat later, all previous messages must be loaded from the database.

---

# Chat Password

Every Secure Chat must be protected by a password.

Purpose:

If someone else gets access to the user's phone, they should NOT be able to open the conversation without entering the correct password.

The password protects access to the conversation.

It is NOT a room password.

It is NOT used for joining.

It is only used for unlocking the chat.

---

# Password Rules

When creating a Secure Chat:

Ask for:

- Password
- Confirm Password

Store ONLY the hashed password using bcrypt.

Never store plain-text passwords.

---

# Unlock Flow

Whenever someone opens a locked Secure Chat:

Display:

🔒 Secure Chat

Enter Password

[ Unlock ]

If the password is correct:

- Open the conversation.
- Load previous messages.
- Start Socket.IO real-time communication.

If incorrect:

- Show an error message.
- Do not reveal any chat messages.

---

# Chat Storage

Persist all messages in MongoDB.

Each message should include:

- chatId
- senderId
- message
- timestamp
- delivery status

When opening a Secure Chat:

1. Verify password.
2. Load previous messages.
3. Connect Socket.IO.
4. Continue chatting normally.

---

# Temporary Room Shortcut

Inside every Secure Chat, provide a button:

"Go to Temporary Room"

When clicked:

- Create a new temporary room.
- Generate a room code.
- Redirect both users into that temporary room.

The temporary room must behave exactly like the existing implementation.

Requirements:

- Messages are NOT stored.
- Messages disappear when everyone leaves.
- Temporary room is automatically deleted.
- Users can leave and return to the Secure Chat at any time.

---

# Navigation Flow

Secure Chat

↓

Go to Temporary Room

↓

Temporary Room

↓

Leave Temporary Room

↓

Back to Secure Chat

The Secure Chat history must remain unchanged.

---

# Database

Create separate collections/models for the Secure Chat system.

Suggested structure:

Users

SecureChats

Messages

Participants

Do NOT reuse temporary room storage for persistent chats.

---

# Security

- Hash passwords using bcrypt.
- Never expose password hashes.
- Validate all inputs.
- Protect all APIs.
- Prevent unauthorized access to Secure Chats.
- Follow security best practices.

---

# Socket.IO

Secure Chat should support:

- Real-time messaging
- Typing indicator
- Online/offline status
- Message delivery

Temporary Room should continue using the existing Socket.IO implementation without changes.

---

# UI

Secure Chat List

- Show all Secure Chats.
- Locked chats should display a lock icon.

Locked Chat Screen

🔒 Secure Chat

Enter Password

[ Password Input ]

[ Unlock ]

Inside Secure Chat

Messages...

Message Input

Send Button

Go to Temporary Room Button

---

# Code Quality

Build this feature with production-ready architecture.

Requirements:

- Clean folder structure.
- Modular code.
- Reusable services.
- Proper controllers.
- Proper Socket.IO separation.
- Good error handling.
- Optimized MongoDB queries.
- Scalable architecture.
- No duplicate code.
- Maintainable codebase.

---

# MOST IMPORTANT REQUIREMENT

⚠️ DO NOT BREAK THE EXISTING TEMPORARY ROOM SYSTEM.

⚠️ DO NOT CHANGE ITS BEHAVIOR.

⚠️ DO NOT REMOVE ANY EXISTING FUNCTIONALITY.

Implement the Secure Persistent Chat as a completely separate feature that integrates cleanly with the existing application while keeping all current functionality fully operational.

# DEVELOPMENT WORKFLOW (MANDATORY)

## IMPORTANT

Before writing or modifying ANY code, create a detailed TODO checklist inside the project.

Create a file named:

```
IMPLEMENTATION_TODO.md
```

at the project root.

This file will act as the single source of truth for implementation progress.

---

# TODO Format

Use Markdown checkboxes.

Example:

```md
# Secure Persistent Chat Implementation

## Phase 1 - Analysis

- [ ] Analyze existing room-based chat architecture
- [ ] Identify all Socket.IO events
- [ ] Identify current room lifecycle
- [ ] Verify current functionality remains untouched

## Phase 2 - Database

- [ ] Create SecureChat model
- [ ] Create SecureMessage model
- [ ] Create Participant model
- [ ] Add indexes
- [ ] Validate schemas

## Phase 3 - Backend APIs

- [ ] Create Secure Chat APIs
- [ ] Create Password APIs
- [ ] Create Message APIs
- [ ] Add Validation
- [ ] Add Authorization

...
```

---

# Progress Tracking

Whenever you complete a task,

change

```md
- [ ]
```

into

```md
- [x]
```

Example

Before

```md
- [ ] Create SecureChat schema
```

After completion

```md
- [x] Create SecureChat schema
```

---

# Granularity

Do NOT create large generic tasks.

Bad

```md
- [ ] Backend
```

Good

```md
- [ ] Create SecureChat schema
- [ ] Create SecureMessage schema
- [ ] Create Participant schema
- [ ] Add Mongo indexes
- [ ] Create Socket namespace
- [ ] Implement password hashing
- [ ] Implement password verification
- [ ] Create unlock middleware
- [ ] Create history API
- [ ] Create typing indicator
- [ ] Create online status
- [ ] Create delivery status
```

Every task should take approximately 10–30 minutes.

---

# Phases

Organize the TODO file into phases.

Example:

- Phase 1 — Existing System Analysis
- Phase 2 — Database Design
- Phase 3 — Backend APIs
- Phase 4 — Socket.IO
- Phase 5 — Password Protection
- Phase 6 — Frontend UI
- Phase 7 — Temporary Room Integration
- Phase 8 — Testing
- Phase 9 — Bug Fixes
- Phase 10 — Production Cleanup

---

# Existing Functionality Protection

The FIRST phase must verify the existing room-based temporary chat.

Include tasks like:

- [ ] Understand current temporary room architecture
- [ ] Identify all Socket.IO events
- [ ] Verify current room creation
- [ ] Verify room join flow
- [ ] Verify room cleanup flow
- [ ] Ensure new feature does not modify existing functionality

Do NOT begin implementation until this analysis is complete.

---

# Documentation

Every completed major phase must include short implementation notes inside the TODO file.

Example

```md
## Phase 3 Notes

Implemented:

- SecureChat model
- Message model
- Password hashing

No existing temporary room logic was modified.
```

---

# If Context Window Is Reached

This project may require multiple AI sessions.

The TODO file must allow another AI agent to continue immediately.

For every unfinished task include enough detail that another developer can resume work without reading the entire codebase.

Document:

- current progress
- completed files
- pending files
- remaining work
- known issues
- design decisions
- assumptions

---

# Completion Rule

Never mark a task as completed unless it has actually been fully implemented and verified.

Only change:

```
[ ]
```

to

```
[x]
```

after successful completion.

---

# Final Requirement

The TODO file must always reflect the current state of the project.

If implementation stops unexpectedly because of context limits, another AI agent should be able to open **IMPLEMENTATION_TODO.md** and continue development immediately without asking any additional questions.