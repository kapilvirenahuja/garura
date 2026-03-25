# Flutter

Google's cross-platform UI toolkit — one codebase for mobile, web, and desktop with custom rendering engine.

**Search patterns:** Flutter, Dart, cross-platform, material, cupertino, widget, mobile, desktop, Skia, Impeller, Google

## When to Choose

Flutter excels at custom, pixel-perfect UI across platforms. Its rendering engine (Skia/Impeller) draws every pixel — no platform UI bridges. Choose when the product needs visually rich, custom UI that looks identical on iOS and Android (branded experiences, custom animations, non-standard components). The Dart language is fast to learn for developers coming from Java, C#, or TypeScript. Strong choice for products that also need web and desktop from the same codebase. Performance is near-native because Dart compiles ahead-of-time. Products with strong brand identity where UI consistency across platforms matters more than platform-native feel benefit most.

## When to Avoid

Avoid when the team knows React — React Native is a shorter path. Avoid when the app should feel platform-native (Material on Android, Cupertino on iOS with different behaviors) — Flutter renders its own widgets, which can feel subtly non-native. Avoid for text-heavy apps with complex text rendering requirements (Flutter's text engine has edge cases). The Dart developer pool is smaller than JavaScript/TypeScript. Web support exists but is not production-grade for content-heavy sites (SEO limitations, bundle size).

## Scale Profile

| Dimension | Sweet Spot | Stretch | Break Point |
|-----------|-----------|---------|-------------|
| Team size | 2-30 | 30-100 | > 100 (modularization critical) |
| Platforms | iOS + Android | + Web, Desktop | Web for content-heavy (use Next.js instead) |
| UI complexity | Custom, branded, animated | Standard platform UI | Deeply native platform integration |

## Key Components

| Component | Options | Selection Guidance |
|-----------|---------|-------------------|
| State | Riverpod, Bloc, Provider, GetX | Riverpod for modern; Bloc for enterprise; avoid GetX for large apps |
| Navigation | GoRouter, auto_route, Navigator 2.0 | GoRouter for declarative; auto_route for code generation |
| UI | Material 3, Cupertino, custom widgets | Material 3 for default; custom for branded |
| Backend | REST, GraphQL, Firebase, Supabase, gRPC | Firebase for rapid; gRPC for performance-critical |
| Testing | Widget tests, integration tests, golden tests | Golden tests for visual regression — Flutter's strength |

## Reference Architecture

```
lib/
├── app/                      # App config, routing, theme
├── features/                 # Feature-first organization
│   ├── auth/
│   │   ├── data/            # Repositories, data sources
│   │   ├── domain/          # Entities, use cases
│   │   └── presentation/   # Screens, widgets, controllers
│   └── commerce/
│       └── ...
├── core/                     # Shared utilities, constants, extensions
├── design_system/           # Custom widgets, theme, tokens
└── main.dart
```

## Evolution Paths

| From | To | Trigger | Approach |
|------|----|---------|----------|
| Native iOS/Android | Flutter | Consolidate codebases | Rewrite with Flutter; share 90%+ code |
| Flutter mobile | Flutter web + desktop | Expand platforms | Same codebase with platform-adaptive layouts |
| Flutter | Native for specific features | Performance-critical feature | Platform channel to native code for hot path |

## Tradeoffs

| Aspect | Gain | Cost |
|--------|------|------|
| Visual consistency | Pixel-perfect across platforms | Doesn't feel "platform-native" |
| Performance | AOT compilation, near-native speed | Larger app size than native (~5-15MB overhead) |
| Custom rendering | Complete control over every pixel | No access to platform UI components |
| Multi-platform | Mobile + web + desktop from one codebase | Web and desktop are less mature than mobile |
| Hot reload | Fastest iteration cycle of any mobile framework | Dart ecosystem smaller than JS/TS |

## Anti-Patterns

| Anti-Pattern | Description | Risk |
|-------------|-------------|------|
| Widget tree spaghetti | Deeply nested widgets without extraction | Unmaintainable, unreadable code |
| setState everywhere | Managing complex state with setState instead of proper state management | Rebuilds entire widget tree, performance degradation |
| Ignoring platform differences | Same UX on iOS and Android when platform conventions differ | Users feel something is "off" |
| Huge monolithic features | No separation between data, domain, and presentation layers | Untestable, tightly coupled |
