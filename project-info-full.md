# FinTrack Full-Stack Architecture & Project Context

## 1. Project Overview
FinTrack is a full-stack, cross-platform personal finance tracking application. The system allows users to register, securely log in, and manage their finances through CRUD operations on Income and Expense transactions. 

The project is split into two primary directories:
1.  **`fintrack-mobile`**: The frontend React Native (Expo) application, deployed to Web and Android.
2.  **`fintrack-backend`**: The Node.js/Express REST API, deployed to Render, connecting to a Supabase PostgreSQL database.

---

## 2. Global Tech Stack
### Frontend (`fintrack-mobile`)
*   **Framework:** React Native / Expo (Managed Workflow)
*   **Language:** TypeScript
*   **State Management:** Redux Toolkit (`react-redux`, `@reduxjs/toolkit`)
*   **Navigation:** React Navigation (Native Stack with Web deep linking)
*   **Network:** Axios
*   **Deployment:** Render Static Site (Web), Expo EAS (Android APK)

### Backend (`fintrack-backend`)
*   **Runtime:** Node.js (v24+)
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **Database:** PostgreSQL (Hosted on Supabase)
*   **ORM:** Prisma
*   **Security:** JWT (JSON Web Tokens), Bcryptjs, CORS enabled
*   **Deployment:** Render Web Service (`https://fintrack-v6l3.onrender.com/api`)

---

## 3. Frontend Architecture (`fintrack-mobile`)

### Core Setup & Navigation
*   **`App.tsx`**: Wraps the app in the Redux `<Provider>`.
*   **`src/navigation/AppNavigator.tsx`**: Contains the `<NavigationContainer>` configured with a `linking` object.
    *   *Web Linking:* Maps screens to URLs (`/login`, `/register`, `/` for Dashboard, `/add-transaction`) so the browser's back button and manual URL entry work correctly.

### State Management (`src/stores`)
*   **`store.ts`**: Configures Redux, combining `authSlice` and `transactionSlice`.
*   **`authSlice.ts`**: Manages `user`, `token`, and `isAuthenticated`. Handles login, registration, and logout (including clearing async storage).
*   **`transactionSlice.ts`**: The core data engine containing async thunks (`fetchTransactions`, `addTransaction`, `updateTransaction`, `deleteTransaction`). Automatically updates the `transactions` array in memory upon API success.

### Network Services
*   **`src/services/api.ts`**: Axios instance configured with the live backend `baseURL`. Automatically attaches the JWT token to the `Authorization` header of outgoing requests.

### Screens (`src/screens`)
*   **`DashboardScreen.tsx`**: 
    *   Dispatches `fetchTransactions` on mount. 
    *   Calculates total balance, income, and expenses via array reduction.
    *   Renders a `FlatList` of transactions. 
    *   Handles cross-platform delete confirmations (`window.confirm` for web, `Alert.alert` for mobile).
*   **`AddTransactionScreen.tsx`**: A dual-purpose form.
    *   Uses `useRoute` to check for incoming `transactionToEdit` parameters to determine if it is in "Edit Mode" or "Add Mode".
    *   Pre-fills state if editing.
    *   Dispatches `updateTransaction` or `addTransaction`, forces a Redux data refresh, and calls `navigation.goBack()`.
*   **`LoginScreen.tsx` & `RegisterScreen.tsx`**: Standard forms capturing credentials and dispatching auth thunks.

---

## 4. Backend Architecture (`fintrack-backend`)

### Core Setup
*   **`index.ts` / `app.ts`**: Express server entry point. Applies `express.json()` and `cors()`. Mounts the API routers.
*   **Environment Variables**: `DATABASE_URL` (Supabase), `JWT_SECRET`, and `PORT`.

### Database Layer (`prisma/schema.prisma`)
*   **`User` Model:** `id` (UUID), `email` (Unique), `password` (Hashed), `name`, `createdAt`. Has a 1-to-Many relation with `Transaction`.
*   **`Transaction` Model:** `id`, `amount` (Float), `category` (String), `description` (String, Optional), `type` (Enum: `INCOME` | `EXPENSE`), `date`, and `userId` (Foreign Key).

### Middleware Layer
*   **`src/middleware/authMiddleware.ts`**: Intercepts protected requests, verifies the Bearer JWT using `JWT_SECRET`, and attaches the decoded payload (`userId`) to the `req` object. Rejects with `401 Unauthorized` if invalid.

### Controller Layer (`src/controllers`)
*   **`auth.controller.ts`**:
    *   *Register:* Hashes password with `bcrypt`, creates User in Prisma, returns JWT.
    *   *Login:* Finds user by email, compares password hash, returns JWT.
*   **`transaction.controller.ts`**:
    *   *Get:* `prisma.transaction.findMany({ where: { userId: req.user.id } })`
    *   *Create:* Associates new transaction data from `req.body` with `req.user.id`.
    *   *Update:* Verifies ownership via ID in `req.params`, updates specific fields.
    *   *Delete:* Verifies ownership, removes record.

### Routing Layer (`src/routes`)
*   **`auth.routes.ts`**: Public (`/register`, `/login`).
*   **`transaction.routes.ts`**: Protected by `authMiddleware` (`GET /`, `POST /`, `PUT /:id`, `DELETE /:id`).

---

## 5. Full-Stack Data Flow Example (Adding a Transaction)
1.  **User Input:** User fills out `AddTransactionScreen` on mobile/web and hits Save.
2.  **Redux Thunk:** Frontend dispatches `addTransaction({ amount: 50, type: 'EXPENSE'... })`.
3.  **Axios Interceptor:** `api.ts` attaches the user's JWT to the `Authorization` header.
4.  **Backend Express:** Request hits `POST /api/transactions`.
5.  **Middleware:** `authMiddleware.ts` validates the JWT and adds the user's ID to the request.
6.  **Controller:** `transaction.controller.ts` tells Prisma to create the record in Supabase.
7.  **Database:** Supabase confirms the row creation.
8.  **Frontend Resolution:** Backend returns `201 Created`. Redux thunk fulfills, triggers `fetchTransactions` to pull the updated list, and navigates the user back to the Dashboard.