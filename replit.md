# Workspace

## Overview

**دليل التوبة النصوح** - A comprehensive Arabic Islamic app guiding users through sincere repentance (Tawbah). Available as both a web app and mobile app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Web frontend**: React + Vite, Tailwind CSS, Framer Motion
- **Mobile**: Expo React Native, Expo Router

## App Features

1. **عهد التوبة (Covenant)** - User selects sin category and signs a repentance covenant
2. **مهام اليوم الأول (First Day Tasks)** - Mandatory checklist of 4 immediate actions
3. **خطة الـ 40 يوماً (40-Day Plan)** - Daily habit tracker with 5 recurring habits
4. **عداد الذكر (Dhikr Counter)** - Three counters (Istighfar/100, Tasbih/33, Sayyid al-Istighfar)
5. **زر الطوارئ SOS** - Emergency button with Quran verses, action items, covenant reminder
6. **علامات قبول التوبة (Signs of Accepted Repentance)** - 5 spiritual signs
7. **التعامل مع الانتكاسات (Handling Relapse)** - Guidance and encouragement

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/       # Express 5 API server (port 8080, /api)
│   ├── tawbah-web/       # React+Vite web app (port 20251, /)
│   └── tawbah-mobile/    # Expo React Native mobile app (port 24800, /mobile/)
├── lib/
│   ├── api-spec/         # OpenAPI spec + Orval codegen config
│   ├── api-client-react/ # Generated React Query hooks
│   ├── api-zod/          # Generated Zod schemas from OpenAPI
│   └── db/               # Drizzle ORM schema + DB connection
│       └── schema/tawbah.ts  # user_progress, habits, dhikr_count tables
└── ...
```

## DB Schema

- `user_progress` - Tracks each session's repentance journey
- `habits` - Daily habit completion tracking
- `dhikr_count` - Daily dhikr counters per session

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes:
- `GET /api/healthz` - Health check
- `GET /api/user/progress` - Get user progress by sessionId
- `PUT /api/user/progress` - Update progress
- `POST /api/user/covenant` - Sign repentance covenant
- `GET /api/habits` - Get today's habits
- `POST /api/habits` - Toggle habit completion
- `GET /api/dhikr/count` - Get dhikr counts
- `POST /api/dhikr/increment` - Increment a dhikr counter

### `artifacts/tawbah-web` (`@workspace/tawbah-web`)

React+Vite web app with Arabic RTL layout, Islamic green/gold theme.
Pages: home, covenant, day-one, plan, dhikr, sos, signs, relapse

### `artifacts/tawbah-mobile` (`@workspace/tawbah-mobile`)

Expo React Native app with 4 tabs + 4 modal/stack screens.
Tabs: الرئيسية, المهام, الذكر, التقدم
Screens: covenant (modal), sos (modal), signs, relapse
Uses AsyncStorage for local persistence (no API calls needed).
