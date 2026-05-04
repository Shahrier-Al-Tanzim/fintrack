# Sentry Full-Stack Integration Walkthrough

This document outlines the implementation of **Sentry** for seamless error handling and performance monitoring across the **FinTrack** mobile and backend systems.

## 1. Overview
Sentry was integrated to provide real-time crash reporting and performance insights. It allows the development team to see exactly where an error occurred, including the TypeScript source code line, even in production.

---

## 2. Mobile App Implementation (`fintrack-mobile`)

### Packages Installed
- `@sentry/react-native`: The core SDK for React Native and Expo.

### Key Modifications
#### `app.json`
Added the Sentry Expo plugin. This is critical for **Source Map** uploads. When you build the app for production, Expo will automatically send the "map" to Sentry so that errors show your actual code instead of minified gibberish.
```json
"plugins": [
  [
    "@sentry/react-native/expo",
    {
      "organization": "shahrier",
      "project": "react-native"
    }
  ]
]
```

#### `App.tsx`
- **Initialization**: `Sentry.init()` was called at the top level with your unique DSN.
- **Tracing**: Enabled `tracesSampleRate: 1.0` to track performance (how long screens take to load).
- **Wrapping**: The entire `App` component was wrapped with `Sentry.wrap(App)`. This automatically captures errors in the component tree and tracks navigation changes.

#### `DashboardScreen.tsx`
Added a temporary **Test Crash Button** (Bug icon 🐞) in the header.
- **Logic**: It throws a manual `new Error()` when pressed, which is instantly intercepted by the Sentry SDK and sent to the cloud.

---

## 3. Backend Implementation (`fintrack-backend`)

### Packages Installed
- `@sentry/node`: SDK for Node.js server environments.
- `@sentry/profiling-node`: Adds deep CPU profiling to see which functions are slow.

### Key Modifications
#### `index.ts`
- **Initialization**: Sentry is initialized at the very first line of the server to ensure it catches startup errors.
- **Middleware Integration**: 
    - `Sentry.setupExpressErrorHandler(app)` was added at the bottom. This is an Express-specific helper that catches any error thrown in your routes and reports it before the server returns a 500 status.
- **Debug Route**: Created `/debug-sentry` which uses `Sentry.captureException(err)` to manually verify that the server can talk to the Sentry API.

---

## 4. How It Works
1.  **Capture**: When a crash or `captureException` occurs, the SDK gathers:
    - The Stack Trace (File and line number).
    - Device/Server Info (OS version, Node version, memory usage).
    - **Breadcrumbs**: A timeline of what happened *before* the crash (e.g., "User clicked Button A", "Request to /api/auth started").
2.  **Transport**: The SDK sends this data as an "Envelope" via an asynchronous HTTP request to Sentry's ingest servers.
3.  **Symbolication**: Sentry uses the source maps we configured to turn the minified production code back into readable TypeScript.
4.  **Notification**: You receive an alert (email/Slack) that a new issue has been detected.

---

## 5. Next Steps
- [ ] **Remove Test Code**: Once you are satisfied, delete the 🐞 button in `DashboardScreen.tsx` and the `/debug-sentry` route in `index.ts`.
- [ ] **Environment Variables**: Move the DSN string to your `.env` files for better security.
- [ ] **Release Tracking**: Link your Git commits to Sentry so it can tell you which specific commit caused a new bug.
