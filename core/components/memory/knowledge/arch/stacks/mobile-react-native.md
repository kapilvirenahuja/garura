# React Native + Expo

Cross-platform mobile development using React — one codebase for iOS and Android with native performance.

**Search patterns:** React Native, Expo, mobile, cross-platform, iOS, Android, mobile app, native, JavaScript mobile

## When to Choose

React Native is the dominant cross-platform mobile framework. Choose when the team knows React and needs to ship on both iOS and Android without maintaining two native codebases. Expo simplifies the developer experience dramatically — push updates without app store review (OTA), managed build service, and a rich standard library. The product needs mobile (consumer apps, field apps, companion apps to web products), the team is JavaScript/TypeScript-oriented, and budget doesn't support separate iOS and Android teams. Consumer-facing products where mobile is the primary channel benefit most. Products already built with React on web get significant code sharing (shared business logic, shared types, shared API clients).

## When to Avoid

Avoid when the app requires deep native integration that React Native doesn't support well — heavy GPU rendering (games), complex native animations, ARKit/ARCore-heavy experiences, or Bluetooth/hardware peripherals at the protocol level. Avoid when the team has strong native iOS/Android skills and the budget supports separate teams. Avoid for apps where performance is indistinguishable from native (NFR-3 = 5 ultra-low-latency) — the JavaScript bridge adds milliseconds. Flutter may be better for complex custom UI with pixel-perfect rendering across platforms.

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 2-20 mobile developers | 20-50 | > 50 (consider native teams) |
| App complexity | Standard mobile apps (feeds, forms, navigation, maps) | Complex custom UI | Heavy GPU/3D, hardware peripherals |
| Platform parity | 90%+ shared code between iOS/Android | 70-90% | < 70% (native may be cheaper) |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| Framework | Expo (managed), React Native CLI (bare) | Expo for 90% of apps; bare RN only for custom native modules |
| Navigation | React Navigation, Expo Router | Expo Router for file-based; React Navigation for programmatic |
| State | Zustand, Redux Toolkit, React Query, Jotai | Zustand for simplicity; React Query for server state |
| UI library | NativeWind (Tailwind), Tamagui, React Native Paper, Gluestack | NativeWind for Tailwind familiarity; Tamagui for performance |
| Backend integration | REST, GraphQL, tRPC, Supabase | Match web stack; tRPC for end-to-end type safety |

## Reference Architecture

```
apps/
├── mobile/                    # Expo app
│   ├── app/                   # Expo Router (file-based routing)
│   │   ├── (tabs)/           # Tab navigation
│   │   ├── (auth)/           # Auth screens
│   │   └── _layout.tsx       # Root layout
│   ├── components/           # Mobile-specific components
│   ├── hooks/                # Mobile-specific hooks
│   └── app.json              # Expo config
├── web/                      # Next.js (if also web)
└── packages/
    ├── shared/               # Shared business logic, types, API client
    └── ui/                   # Shared UI components (if using Tamagui/universal)
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Web only | React Native | Mobile needed, team knows React | Expo app with shared business logic from web |
| React Native | React Native + web (universal) | Web version needed from mobile-first | Expo with web target, or separate Next.js with shared packages |
| React Native | Native (Swift/Kotlin) | Performance-critical features need native | Extract specific screens/features to native modules; keep shell in RN |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Cross-platform | One codebase, two platforms | Platform-specific edge cases still exist |
| Team leverage | React developers become mobile developers | React Native != React — learning curve for mobile paradigms |
| Code sharing | Share logic, types, API clients with web | UI components rarely share (mobile ≠ web UX) |
| OTA updates | Push fixes without app store review (Expo) | Bundle size limits, can't change native code via OTA |
| Ecosystem | Largest cross-platform ecosystem | Some native libraries need wrapper/bridging |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Ignoring Expo | Using bare React Native CLI when Expo suffices | Unnecessary complexity, missed DX improvements |
| Web patterns on mobile | Using web-style layouts, modals, navigation on mobile | Feels wrong to users, poor mobile UX |
| Too many bridges | Excessive native module usage | Negates cross-platform benefits |
| Ignoring platform conventions | Same UX on iOS and Android ignoring platform guidelines | Users expect platform-native behavior |
