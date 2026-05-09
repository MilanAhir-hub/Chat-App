# Temporary Room Chat

MERN + TypeScript chat app with HTTP-only cookie authentication, protected rooms, Socket.IO realtime messaging, and permanent cleanup of temporary room messages.

## Quick Start

1. Copy environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

2. Make sure MongoDB is running locally or update `server/.env`.

3. Start both apps:

```bash
npm run dev
```

4. Open the client at `http://localhost:5173`.

## Verification

```bash
npm run build
npm run lint --prefix client
```

## Full Guide

See [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) for the folder structure, API flow, Socket.IO diagram, cleanup rules, and security notes.
