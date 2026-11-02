# Project Rules: MindVault (Capstone Project)

## 1. Strict 3-Layer Clean Architecture
- Organize all source code strictly inside three directories: src/domain, src/data, and src/presentation.
- CRITICAL RULE: Never import React, React Native, UI components, or external SDKs inside src/domain.
- src/domain: Pure TypeScript Entities (Note, Task), Repository Interfaces, and Use Cases only.
- src/data: WatermelonDB models/schemas, MMKV cache, Supabase BaaS sync, ML Kit OCR service, and Streaming LLM SSE client.
- src/presentation: Expo Router screens, Zustand stores, TanStack Query hooks, and Material 3 UI components.

## 2. Mandatory Tech Stack & Performance
- Core: React Native (TypeScript + Expo Router + Zustand / TanStack Query).
- Offline-First: Local persistence via WatermelonDB synced with Supabase PostgreSQL (RLS).
- Ergonomics & Speed: Follow Material 3 and Apple HIG, support Dark Mode, and use FlashList + Reanimated to guarantee 60fps.