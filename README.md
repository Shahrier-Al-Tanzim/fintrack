# 💰 FinTrack: Modern Personal Finance Tracker

FinTrack is a comprehensive, full-stack, cross-platform personal finance management application. It empowers users to take control of their financial life through intuitive income and expense tracking, real-time balance calculations, and robust data security. Built with a focus on performance, observability, and seamless user experience across Web and Mobile.

---

## 🚀 How it Works

FinTrack operates as a synchronized ecosystem between a high-performance **Node.js backend** and a responsive **React Native (Expo) frontend**.

1.  **Authentication:** Users register and log in via a secure JWT-based system.
2.  **Transaction Management:** Users can add, edit, or delete income and expense records.
3.  **Real-time Insights:** The app automatically calculates total balance, total income, and total expenses, providing instant feedback on financial health.
4.  **Cross-Platform Sync:** Data is persisted in a PostgreSQL database (Supabase), ensuring that transactions added on the web are immediately available on mobile.
5.  **Observability:** Integrated with Sentry to track errors and performance metrics across the entire stack, including a custom backend tunneling solution to bypass ad-blockers.

---

## ✨ Core Features

### 👤 User Experience
*   **Secure Authentication:** JWT-based login and registration with hashed passwords.
*   **Intuitive Dashboard:** At-a-glance view of Balance, Income, and Expenses.
*   **Categorized Transactions:** Group your spending and earning for better clarity.
*   **Dual-Platform Design:** Fully responsive layout for both mobile screens and web browsers.

### 🛠 Management & Logic
*   **Full CRUD:** Add, Read, Update, and Delete transactions with ease.
*   **Smart Validation:** Instant feedback on form inputs to ensure data integrity.
*   **Auto-Calculations:** Dynamic math logic that updates your totals the moment a transaction is changed.
*   **Persistent Storage:** Your data stays safe in a PostgreSQL cloud database.

### 🛡 Technical Excellence
*   **Observability:** Sentry integration for real-time error tracking and performance profiling.
*   **Ad-Blocker Resilience:** Backend Sentry tunneling to ensure no telemetry is lost.
*   **Type Safety:** End-to-end TypeScript implementation to minimize runtime errors.
*   **Clean Architecture:** Separated concerns between Controllers, Services, and State Slices.

---

## 🛠 Tech Stack

### Frontend (`fintrack-mobile`)
*   **Framework:** React Native / Expo (Managed Workflow)
*   **Platform Support:** Web, Android, and iOS.
*   **State Management:** Redux Toolkit (Thunks for async logic).
*   **Navigation:** React Navigation (Native Stack with URL Deep Linking for Web).
*   **Networking:** Axios with interceptors for automatic JWT handling.
*   **UI Components:** Lucide Icons, React Native Chart Kit (for future visualization).
*   **Monitoring:** Sentry React Native SDK.

### Backend (`fintrack-backend`)
*   **Runtime:** Node.js (v24+)
*   **Framework:** Express.js
*   **Database:** PostgreSQL (Hosted on Supabase).
*   **ORM:** Prisma (Type-safe database access).
*   **Security:** JWT (JSON Web Tokens), Bcryptjs (password hashing), Zod (input validation).
*   **Observability:** Sentry Node SDK with a dedicated Tunneling endpoint.
*   **Deployment:** Ready for Render / Railway.

---

## 📁 Project Structure

```text
fintrack/
├── fintrack-backend/      # Express API, Prisma Schema, Auth & Transaction Controllers
├── fintrack-mobile/       # Expo App, Redux Slices, Navigation & Screens
├── job-requirements.md    # Developer-specific tasks and milestones
└── requirements.md        # Initial project requirements
```

---

## 📊 Database Schema (Prisma)

FinTrack utilizes a relational schema to manage users and their financial data efficiently.

### `User` Model
*   `id`: Unique identifier (UUID).
*   `email`: User's email (Unique).
*   `password`: Hashed password string (Bcrypt).
*   `name`: User's display name.
*   `transactions`: One-to-Many relationship with the Transaction model.

### `Transaction` Model
*   `id`: Unique identifier (UUID).
*   `amount`: Numerical value of the transaction.
*   `category`: Category name (e.g., "Food", "Salary").
*   `description`: Optional notes for the transaction.
*   `type`: Enum (`INCOME` | `EXPENSE`).
*   `date`: Timestamp of the transaction.
*   `userId`: Foreign key linking to the User.

---

## 🔄 Full-Stack Data Flow

Understanding how a single action (like adding a transaction) moves through the system:

1.  **Frontend:** User submits the form in `AddTransactionScreen`.
2.  **State:** Redux Thunk `addTransaction` is dispatched with the form data.
3.  **Network:** Axios interceptor attaches the JWT from local storage to the `Authorization` header.
4.  **Backend:** Express receives the `POST` request.
5.  **Middleware:** `authMiddleware` validates the token and extracts the `userId`.
6.  **Controller:** `transactionController` uses Prisma to save the record in PostgreSQL.
7.  **Database:** Supabase confirms the save.
8.  **Sync:** Backend returns the new transaction; Redux updates the local state, and the UI reflects the change immediately.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   Node.js (v24 or higher recommended)
*   npm or yarn
*   A Supabase (or any PostgreSQL) database instance
*   Expo Go app on your mobile device (for mobile testing)

### 2. Backend Setup (`fintrack-backend`)
1.  **Navigate to directory:**
    ```bash
    cd fintrack-backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file in the `fintrack-backend` root:
    ```env
    PORT=5000
    DATABASE_URL="your_postgresql_connection_string"
    JWT_SECRET="your_super_secret_key"
    SENTRY_DSN="your_sentry_dsn"
    ```
4.  **Database Migration:**
    ```bash
    npx prisma migrate dev --name init
    npx prisma generate
    ```
5.  **Start Development Server:**
    ```bash
    npm run dev
    ```

### 3. Frontend Setup (`fintrack-mobile`)
1.  **Navigate to directory:**
    ```bash
    cd ../fintrack-mobile
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file in the `fintrack-mobile` root:
    ```env
    EXPO_PUBLIC_SENTRY_DSN="your_sentry_dsn"
    ```
4.  **Configure API URL:**
    Update the `baseURL` in `src/services/api.ts` to point to your local backend (e.g., `http://192.168.x.x:5000/api`) or your deployed API.
5.  **Start Expo:**
    ```bash
    npm start
    ```
    *   Press `w` for Web.
    *   Scan the QR code with Expo Go for Android/iOS.

---

## 🔒 Security & Performance
*   **Validation:** All incoming data is validated using **Zod** schemas to prevent malformed requests.
*   **Protection:** Protected routes require a valid JWT. The frontend automatically handles token persistence and cleanup.
*   **Error Handling:** Global error handling middleware on the backend ensures consistent API responses.
*   **Observability:** **Sentry Tunneling** is implemented to ensure that even users with strict ad-blockers have their errors reported, allowing for 100% crash visibility.

---

## 👨‍💻 Author
**Shahrier Al Tanzim**

---

*Happy Budgeting!* 📈
