# 💳 M-Pesa Payment Gateway Service

A robust Node.js & TypeScript backend service for handling M-Pesa STK Push (Lipa na M-Pesa Online) transactions. This API acts as middleware between your client application and Safaricom's Daraja API, managing payment initiation, status queries, and asynchronous callback processing with database persistence via Prisma.

---

## 🚀 Key Features

- **STK Push Initiation:** Trigger M-Pesa prompts on user phones automatically.
- **Secure Callback Handling:** Verifies Safaricom callbacks using a secret security key.
- **Transaction Query:** Programmatically check the status of pending transactions.
- **Database Persistence:** Track transaction lifecycle (pending → complete/failed) using Prisma.
- **Custom IP Whitelisting:** CORS configured for specific Safaricom IP ranges.
- **Robust Error Handling:** Centralized error management and validation.

---

## 🔌 API Endpoints

### 1. Initiate Payment (STK Push)

**Endpoint:** `POST /v1/pay/checkout`  
**Description:** Validates phone number and amount, generates a unique internal reference, and requests Safaricom to push the STK prompt.

**Request Body:**

```json
{
  "phone": "0712345678", // Accepts 07xx or 2547xx formats
  "amount": 100
}
```

**Success Response (200 OK):**

```json
{
  "message": "STK push initiated",
  "checkoutRequestId": "ws_CO_14122025..."
}
```

---

### 2. Query Transaction Status

**Endpoint:** `POST /v1/pay/status`  
**Description:** Queries the Daraja API to check if a specific `checkoutRequestId` was paid, cancelled, or failed.

**Request Body:**

```json
{
  "checkoutRequestId": "ws_CO_14122025..."
}
```

**Success Response (200 OK):**

```json
{
  "message": "The service request is processed successfully.",
  "code": "0"
}
```

---

### 3. Payment Callback (Webhook)

> **Note:** This endpoint is called by Safaricom, not your client application.

**Endpoint:** `POST /v1/pay/callback/:securityKey`  
**Description:** Receives the final status of the payment (Success/Fail) from Safaricom.

**Security:** Validates the `:securityKey` param against the `MPESA_CALLBACK_SECRET_KEY` environment variable to prevent spoofing.

**Logic:**

- Verifies Security Key.
- Finds the transaction by `CheckoutRequestID`.
- Updates status to complete (if successful) or failed in the database.

---

### 4. System Health

**Endpoint:** `GET /health`  
**Description:** Checks database connectivity and server status.

---

## 🛠️ Project Structure

```
src/
├── bin/          # Server entry point
├── config/       # Database (Prisma) configuration
├── controllers/  # Logic for STK Push, Query, and Callback
├── middleware/   # M-Pesa Token generation & Error handling
├── routes/       # API route definitions
└── utils/        # Logger, Ref generator, Helpers
```

---

## ⚙️ Local Setup & Installation

### 1. Clone and Install

```bash
git clone <repository-url>
cd <project-folder>
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=dev
APP_URL=http://localhost:3000

# Database
DATABASE_URL="mysql://user:password@localhost:3306/mpesaCheckout"
DATABASE_HOST="localhost"
DATABASE_USER="user"
DATABASE_PASSWORD="password"
DATABASE_NAME="mpesaCheckout"

# M-Pesa Daraja Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=your_shortcode
MPESA_CALLBACK_URL=https://your-domain.com/v1/pay/callback
MPESA_CALLBACK_SECRET_KEY=your_random_secret_string
```

### 3. Run the Application

**Development Mode:**

```bash
npx prisma migrate dev
npx prisma generate
npm run build
npm run dev
```

**Production Build:**

```bash
npx prisma migrate deploy
npm run build
npm start
```

---

## 🔒 Security Highlights

- **Input Validation:** Checks phone number formats (regex) and amount validity before processing.
- **Token Management:** Middleware automatically handles OAuth token generation for M-Pesa.
- **CORS Whitelist:** Restricted to specific Safaricom IP addresses and local development environments.
