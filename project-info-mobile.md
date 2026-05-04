# FinTrack Frontend (Mobile/Web): Architecture & Context

## 1. Overview
This directory (`fintrack-mobile`) contains the frontend application for FinTrack. It is a cross-platform client built with React Native and Expo, capable of compiling into a native Android app (`.apk`) and a static React web application.

The app interacts with an external Node.js/Express backend via REST API to manage user authentication and personal finance transactions.

---

## 2. Tech Stack & Environment
*   **Framework:** React Native (managed by Expo)
*   **Language:** TypeScript
*   **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
*   **Navigation:** React Navigation (`@react-navigation/native`, `@react-navigation/native-stack`)
*   **Network Requests:** Axios
*   **Styling:** React Native `StyleSheet` (Custom Dark Mode UI)
*   **Deployment (Web):** Render Static Site (`npx expo export`)
*   **Deployment (Android):** Expo Application Services / EAS (`eas build`)
*   **Live Backend URL:** `https://fintrack-v6l3.onrender.com/api`

---

## 3. Core Directory Structure & File Responsibilities

### Root Configuration
*   **`App.tsx`**: The root component of the application. It wraps the entire application tree in the Redux `<Provider>` (injecting the `store`) and renders the `AppNavigator`.
*   **`app.json` / `eas.json`**: Expo and EAS configuration files defining app metadata, icons, and cloud build profiles.

### Navigation Layer (`/src/navigation`)
*   **`AppNavigator.tsx`**: Manages the screen hierarchy.
    *   *Logic:* Contains the `<NavigationContainer>`.
    *   *Web Support:* Implements a `linking` configuration object that maps internal screens to URL paths (e.g., `Dashboard: ''`, `AddTransaction: 'add-transaction'`). This ensures browser URL bars and back buttons function correctly on the web build.
    *   *State Sync:* Subscribes to the Redux `authSlice` to determine whether to show the Auth Stack (Login/Register) or the Main Stack (Dashboard/AddTransaction).

### State Management Layer (`/src/stores`)
*   **`store.ts`**: The centralized Redux store combining `auth` and `transactions` reducers. Exports strict TypeScript types (`RootState`, `AppDispatch`).
*   **`authSlice.ts`**: 
    *   Manages `user`, `token`, and `isAuthenticated`.
    *   Contains async thunks for `login` and `register`.
    *   Handles secure token storage (likely via `AsyncStorage` or similar local storage).
*   **`transactionSlice.ts`**: 
    *   Manages the `transactions` array, `loading`, and `error` states.
    *   Contains async thunks: `fetchTransactions`, `addTransaction`, `updateTransaction`, `deleteTransaction`.
    *   Automatically updates the UI state upon successful API resolution.

### API & Network Layer (`/src/services`)
*   **`api.ts`**: The central Axios instance.
    *   Configured with the production `baseURL`.
    *   Implements an interceptor to automatically attach the JWT (Bearer Token) to the `Authorization` header of all outgoing requests if the user is logged in.

### UI & Screens Layer (`/src/screens`)
*   **`DashboardScreen.tsx`**: The primary user interface.
    *   *Lifecycle:* Dispatches `fetchTransactions` on mount using `useEffect`.
    *   *Logic:* Reduces the `transactions` array to calculate and display the Total Balance, Total Income, and Total Expense.
    *   *Components:* Renders a `FlatList` mapping over the transactions. 
    *   *Actions:* Contains a delete handler with cross-platform confirmation (`window.confirm` for web, `Alert.alert` for mobile). Tapping a transaction routes to the Edit screen, passing the item via route parameters.
*   **`AddTransactionScreen.tsx`**: A dual-purpose form for Creating and Updating.
    *   *Edit Mode Logic:* Uses `useRoute` to check for incoming `transactionToEdit` parameters. If data exists, `isEditing` becomes true, and `useEffect` pre-fills the state variables (`amount`, `category`, `description`, `type`).
    *   *Submission:* Validates inputs (e.g., amount must be > 0). If `isEditing` is true, dispatches `updateTransaction`; otherwise, dispatches `addTransaction`.
    *   *Sync:* Forces a data refresh by dispatching `fetchTransactions()` after saving, then calls `navigation.goBack()`.
*   **`LoginScreen.tsx` & `RegisterScreen.tsx`**: 
    *   Captures user credentials via `TextInput`.
    *   Dispatches Redux auth thunks.
    *   Handles API rejection errors gracefully via alerts.

---

## 4. Platform-Specific Considerations
*   **Cross-Platform UI:** Uses generic React Native components (`View`, `Text`, `TextInput`, `TouchableOpacity`) to ensure UI consistency across Android and Web browsers.
*   **Web Routing:** Relies on a Render rewrite rule (`/* -> /index.html`) to prevent 404 errors when users manually refresh deep links (like `/add-transaction`) in their browser.
*   **Web Alerts:** Avoids calling native-only APIs without checking `Platform.OS === 'web'` to prevent silent browser crashes.

---

## 5. Build & Export Commands
*   **Local Development:** `npx expo start`
*   **Web Production Export:** `npm install && npx expo export` (Outputs static files to `/dist`).
*   **Android Standalone Build:** `eas build -p android --profile preview` (Outputs a downloadable `.apk`).