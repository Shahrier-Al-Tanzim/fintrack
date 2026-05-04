# FinTrack Backend API: Architecture & Context

## 1. Overview
This directory contains the `fintrack-backend` service. It is a RESTful API built to support the FinTrack mobile and web applications. It handles user authentication, session security, and all CRUD (Create, Read, Update, Delete) operations for financial transactions.

The API is strictly separated from the frontend and communicates exclusively via JSON payloads.

---

## 2. Tech Stack & Environment
*   **Runtime:** Node.js (v24+)
*   **Language:** TypeScript
*   **Web Framework:** Express.js
*   **Database:** PostgreSQL (Hosted externally on Supabase)
*   **ORM:** Prisma
*   **Authentication:** JWT (JSON Web Tokens)
*   **Password Hashing:** Bcrypt / Bcryptjs
*   **Deployment Hosting:** Render (Web Service)
*   **Live Production URL:** `https://fintrack-v6l3.onrender.com`

**Critical Environment Variables (`.env`):**
*   `DATABASE_URL`: The Supabase connection string used by Prisma.
*   `JWT_SECRET`: The secret key used to sign and verify authentication tokens.
*   `PORT`: The port the server binds to (defaulting to 5000 locally, dynamically assigned by Render in production).

---

## 3. Core Directory Structure & File Responsibilities

### Root Configuration
*   **`package.json`**: Manages dependencies and scripts.
    *   *Critical Scripts:* `npm install && npx prisma generate && npm run build` (Required for Render deployment to compile TS to JS and generate the Prisma client).
*   **`tsconfig.json`**: TypeScript compiler configuration, outputting compiled JavaScript to the `dist/` folder.
*   **`index.ts` (or `app.ts`)**: The server entry point.
    *   Initializes the Express application.
    *   Applies global middleware: `express.json()` for payload parsing and `cors()` to allow cross-origin requests from the deployed frontend.
    *   Mounts the API routers (e.g., `/api/auth`, `/api/transactions`).

### Database Layer (`/prisma`)
*   **`schema.prisma`**: The single source of truth for the data layer.
*   **Models:**
    *   `User`: Contains `id` (UUID/Cuid), `email` (Unique), `password` (Hashed), `name`, `createdAt`, `updatedAt`. Has a one-to-many relationship with `Transaction`.
    *   `Transaction`: Contains `id`, `amount` (Float), `category` (String), `description` (String, Optional), `type` (Enum: `INCOME` | `EXPENSE`), `date`, and `userId` (Foreign Key linking to the User).

### Middleware Layer (`/src/middleware`)
*   **`authMiddleware.ts`**: The security gatekeeper for protected routes.
    *   *Logic:* Intercepts incoming requests to check for an `Authorization` header.
    *   Extracts the Bearer token.
    *   Uses `jwt.verify()` with the `JWT_SECRET`.
    *   If valid, attaches the decoded payload (typically the `userId`) to the `req` object (e.g., `req.user = decoded`) and calls `next()`.
    *   If invalid or missing, rejects the request with a `401 Unauthorized` status.

### Routing Layer (`/src/routes`)
*   **`auth.routes.ts`**: Public endpoints.
    *   `POST /register` -> Maps to `register` controller.
    *   `POST /login` -> Maps to `login` controller.
*   **`transaction.routes.ts`**: Protected endpoints (all routes here run through `authMiddleware` first).
    *   `GET /` -> Maps to `getTransactions` controller.
    *   `POST /` -> Maps to `createTransaction` controller.
    *   `PUT /:id` -> Maps to `updateTransaction` controller.
    *   `DELETE /:id` -> Maps to `deleteTransaction` controller.

### Controller Layer (`/src/controllers`)
*   **`auth.controller.ts`**:
    *   *Registration:* Validates input, checks if the email exists, hashes the password using `bcrypt`, creates the User in Prisma, generates a JWT, and returns the token and user data.
    *   *Login:* Finds the user by email, compares the plaintext password to the hashed database password using `bcrypt.compare`, generates a JWT, and returns it.
*   **`transaction.controller.ts`**:
    *   *getTransactions:* Uses `prisma.transaction.findMany({ where: { userId: req.user.id } })` to fetch only the data belonging to the requester.
    *   *createTransaction:* Takes `amount`, `category`, `type`, and `description` from `req.body`. Associates the new record with `req.user.id`.
    *   *updateTransaction:* Takes the transaction `id` from `req.params`. Verifies the transaction belongs to the requesting user before updating fields via `prisma.transaction.update`.
    *   *deleteTransaction:* Verifies ownership and removes the record via `prisma.transaction.delete`.

---

## 4. Expected Request/Response Flow
1.  **Frontend Request:** The React Native app sends a JSON payload to a specific endpoint, attaching the JWT in the headers if required.
2.  **Express Router:** Routes the request to the appropriate controller.
3.  **Middleware (If Protected):** Validates the JWT and identifies the user.
4.  **Controller Logic:** Parses the payload, handles business logic, and interacts with the database.
5.  **Prisma Client:** Executes the SQL query safely against the Supabase PostgreSQL database.
6.  **Response:** The server returns standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `500 Server Error`) along with a JSON response body.