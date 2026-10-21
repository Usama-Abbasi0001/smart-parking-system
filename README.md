# ParkPulse — Smart Parking Management System
### Final Year Project (FYP) — Software-Only Full-Stack Web Application

---

## 1. Abstract & Project Overview

**ParkPulse** is a responsive full-stack Smart Parking Management System designed and developed as a university Final Year Project (FYP). The application replaces traditional, physical paper ticketing and congested parking search routines with an intelligent, database-backed reservation and scheduling engine.

Drivers can discover vacant parking spaces across multiple commercial decks, select precise reservation windows, obtain dynamic price estimates, simulate instant payments, and generate digital QR check-in passes. System administrators receive a high-level command console featuring real-time occupancy metrics, automated double-booking prevention, Recharts analytics, user directory control, slot maintenance toggles, and live CSV export capabilities.

> **Note on Scope**: This project is **100% software-based**. It requires no physical microcontrollers (ESP32/Arduino), infrared hardware sensors, or barrier cameras. Physical occupancy and vehicle presence are simulated through active database reservation schedules and time-interval calculations. Financial payments are simulated in a realistic sandbox environment with zero real-currency processing.

---

## 2. Problem Statement & Objectives

### Problem Statement
Urban commercial centers and airport terminals lose thousands of productivity hours annually due to parking search traffic ("cruising"). Drivers arrive without certainty of slot availability, leading to congestion, elevated carbon emissions, double-parking conflicts, and inefficient manual cash collection.

### Project Objectives
1. **Real-Time Database Availability Engine**: Compute slot availability dynamically based on requested time intervals rather than static flags or client-side mock data.
2. **Zero Overbooking Guarantee**: Enforce backend validation and concurrency locks so two drivers can never reserve overlapping intervals in the same parking bay.
3. **Simulated Payment Lifecycle**: Provide a complete checkout simulation with both success and failure states, automated simulated refunds on cancellation, and digital receipts.
4. **Digital QR Code Validation**: Equip drivers with contactless QR check-in credentials and attendants with an instant verification endpoint.
5. **Administrative Intelligence**: Deliver actionable analytics via interactive Recharts (daily booking trends, revenue distribution, and area popularity).
6. **Robust Software Engineering Standards**: Implement role-based access control (RBAC), Helmet security headers, rate limiting, and centralized error handling.

---

## 3. Technology Stack

### Frontend Architecture
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS (Tailwind v3.4 with custom navy/royal/status tokens)
- **Routing**: React Router DOM v6 (Protected User & Admin routes)
- **API Client**: Axios with global request/response interceptors & token injection
- **Icons**: Lucide React
- **Analytics & Charts**: Recharts
- **Toast Notifications**: React Hot Toast
- **Celebration Animations**: Canvas Confetti

### Backend Architecture
- **Runtime**: Node.js (v20+ / v24+)
- **Framework**: Express.js REST API
- **Database ODM**: Mongoose v8
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs password hashing
- **Security**: Helmet, CORS origin control, Express Rate Limit (Auth endpoint brute-force protection)
- **Input Validation**: Express-Validator with custom datetime & interval validators
- **QR Code Engine**: QRCode DataURL generation
- **Logging**: Morgan

### Database Engine
- **Production**: MongoDB Atlas / Local MongoDB
- **Development Fallback**: Embedded `mongodb-memory-server` automatic fallback (enables immediate testing without pre-installing a local MongoDB service)

---

## 4. System Architecture

```
                          ┌───────────────────────────┐
                          │   React 18 + Vite Client   │
                          │   (Tailwind CSS + Lucide) │
                          └─────────────┬─────────────┘
                                        │ HTTP / JSON (Axios)
                                        ▼
                          ┌───────────────────────────┐
                          │  Express.js REST Engine   │
                          │   Helmet • CORS • Auth    │
                          └──────┬─────────────┬──────┘
                                 │             │
                    ┌────────────▼─────┐ ┌─────▼────────────┐
                    │ Services & Logic │ │ Security & Rules │
                    │ • Overlap Check  │ │ • Rate Limiter   │
                    │ • Expiry Sweeper │ │ • RBAC Guards    │
                    │ • QR Generator   │ │ • Input Validate │
                    └────────────┬─────┘ └──────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │     Mongoose ODM      │
                     │  Indexed Collections  │
                     └───────────┬───────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
┌───────────────────────┐                 ┌─────────────────────────┐
│     MongoDB Atlas     │   (or fallback) │  In-Memory Mongo Server │
│   (Production Cloud)  │                 │    (Zero-Setup Dev)     │
└───────────────────────┘                 └─────────────────────────┘
```

---

## 5. Database Schema & Data Models

| Collection | Key Fields | Constraints & Indexes |
| :--- | :--- | :--- |
| **Users** | `name`, `email`, `passwordHash`, `role`, `vehicleNumber`, `accountStatus` | `email` unique index, select: false on `passwordHash` |
| **ParkingSlots** | `slotNumber`, `area`, `floorOrZone`, `hourlyRate`, `slotType`, `active`, `maintenanceStatus` | Compound unique index: `{ area: 1, slotNumber: 1 }` |
| **Bookings** | `bookingReference`, `userId`, `slotId`, `startTime`, `endTime`, `durationMinutes`, `amount`, `bookingStatus`, `paymentStatus`, `qrCodeDataUrl` | Compound index: `{ slotId: 1, startTime: 1, endTime: 1, bookingStatus: 1 }` |
| **Payments** | `bookingId`, `userId`, `amount`, `method`, `transactionReference`, `status`, `simulated` | `transactionReference` unique index, `{ createdAt: -1 }` |
| **Notifications** | `userId`, `title`, `message`, `type`, `read`, `bookingId` | `{ userId: 1, createdAt: -1 }` |

### Booking Status Lifecycle
1. `pending_payment`: Slot held for 15 minutes awaiting simulated payment.
2. `confirmed`: Simulated payment succeeded; slot is officially locked.
3. `cancelled`: Cancelled by driver or admin; triggers simulated refund entry.
4. `completed`: Reservation end time has elapsed.
5. `expired`: 15-minute payment window elapsed without checkout.

---

## 6. Project Directory Structure

```
Smart Parking System/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── assets/              # Static media assets
│   │   ├── components/common/   # Reusable UI (StatCard, Badge, Modal, Skeletons, Pagination)
│   │   ├── context/             # AuthContext, NotificationContext
│   │   ├── layouts/             # Navbar, Sidebar, AppLayout
│   │   ├── pages/
│   │   │   ├── public/          # LandingPage, LoginPage, RegisterPage, VerifyBookingPage, NotFound
│   │   │   ├── user/            # UserDashboard, FindParkingPage, BookingCheckoutPage, MyBookings, Profile
│   │   │   └── admin/           # AdminDashboard, AdminSlotsPage, AdminUsersPage, AdminBookings, AdminReports
│   │   ├── routes/              # ProtectedRoute guard
│   │   ├── services/            # Axios instance with interceptors (api.js)
│   │   ├── App.jsx              # Application router
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind directives & design system
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── server/                      # Express.js REST API Backend
│   ├── config/                  # Database connection & memory fallback (db.js)
│   ├── controllers/             # authController, slotController, bookingController, adminController, etc.
│   ├── middleware/              # JWT auth, admin authorization, errorHandler, validator middleware
│   ├── models/                  # User, ParkingSlot, Booking, Payment, Notification
│   ├── routes/                  # authRoutes, slotRoutes, bookingRoutes, userRoutes, adminRoutes
│   ├── scripts/                 # seed.js (database initialization)
│   ├── services/                # availabilityService, qrService
│   ├── tests/                   # Automated unit & E2E integration test suite
│   ├── validators/              # express-validator schemas
│   ├── .env.example             # Environment template
│   ├── server.js                # Server entry point
│   └── package.json
├── package.json                 # Monorepo root scripts
├── README.md                    # Comprehensive documentation
└── .gitignore
```

---

## 7. Installation & Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- Optional: MongoDB Atlas connection string (if omitted, in-memory MongoDB is used automatically)

### Step 1: Install Dependencies
Run the install command from the root directory:
```bash
# Install backend and frontend dependencies
npm --prefix server install
npm --prefix client install
```

### Step 2: Configure Environment Variables
Copy `.env.example` in `server/`:
```bash
cp server/.env.example server/.env
```
Default development `.env` settings:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=
JWT_SECRET=dev_jwt_secret_smart_parking_fyp_key_2026_secure
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@smartpark.com
ADMIN_PASSWORD=Admin1234!
ADMIN_NAME=System Administrator
ADMIN_VEHICLE=ADMIN-001
```

### Step 3: Seed the Database
Populate initial admin account, test drivers, 20 parking bays, and demo analytics:
```bash
npm run seed
```

### Step 4: Run the Full Application
Start both the backend API and the Vite frontend:
```bash
# Terminal 1 - Backend Server (Port 5000)
npm run server

# Terminal 2 - Frontend Client (Port 5173)
npm run client
```

Now open your browser at **`http://localhost:5173`**.

---

## 8. Demo Credentials & Quick Test Access

The login interface includes **1-Click Quick Demo Login** buttons for examiner convenience:

| Role | Email | Password | Assigned Vehicle |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartpark.com` | `Admin1234!` | `ADMIN-001` |
| **Driver (User 1)** | `john.doe@example.com` | `User1234!` | `ABC-1234` |
| **Driver (User 2)** | `sarah.connor@example.com` | `User1234!` | `CYBER-2026` |
| **Driver (User 3)** | `michael.knight@example.com` | `User1234!` | `KITT-3000` |

---

## 9. API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a driver account (always assigns role `user`)
- `POST /api/auth/login` — Sign in and receive JWT token
- `POST /api/auth/logout` — Revoke active session
- `GET /api/auth/me` — Retrieve authenticated user profile

### Parking Slots (`/api/slots`)
- `GET /api/slots` — Live parking bay availability across selected time intervals
- `GET /api/slots/areas` — Distinct list of active parking decks/zones
- `GET /api/slots/:id` — Details of a specific slot & 48-hour schedule
- `GET /api/slots/:id/availability` — Slot availability query for a specific window

### Bookings & Simulated Checkout (`/api/bookings`)
- `POST /api/bookings` — Create a slot reservation with conflict detection
- `GET /api/bookings/my` — Driver's personal reservation history (paginated, tabbed)
- `GET /api/bookings/:id` — Detailed booking summary & payment transactions
- `PATCH /api/bookings/:id/cancel` — Cancel eligible booking & trigger simulated refund
- `POST /api/bookings/:id/demo-payment` — Simulate payment outcome (`success` / `failure`)
- `GET /api/bookings/verify/:reference` — Public digital QR code check-in validation

### Administrator Management (`/api/admin`)
- `GET /api/admin/stats` — High-level KPI counts, 7-day trends, and deck distributions
- `GET /api/admin/reports` — Comprehensive financial summary & cancellation rates
- `GET /api/admin/slots` — Admin slot table with status filters
- `POST /api/admin/slots` — Create a new parking bay
- `PATCH /api/admin/slots/:id` — Update slot properties or hourly rate
- `PATCH /api/admin/slots/:id/status` — Toggle slot active or maintenance states
- `GET /api/admin/users` — Driver directory with booking frequency
- `PATCH /api/admin/users/:id/status` — Deactivate / reactivate a user account
- `GET /api/admin/bookings` — Complete platform booking audit table
- `GET /api/admin/bookings/export-csv` — Direct live CSV file download
- `PATCH /api/admin/bookings/:id/cancel` — Administrative cancellation override

---

## 10. Verification & Automated Testing

The project includes both Node.js unit tests and a live end-to-end integration test suite:

### 1. Run Unit Tests (Database isolation, password hashing, overlap checks)
```bash
npm --prefix server test
```
*Tests verified: User hashing, Compound slot uniqueness, Concurrency conflict detection, and QR code data URL generation.*

### 2. Run Live E2E Integration Suite (Against running server)
```bash
node server/tests/e2e_integration.js
```
*Exercises all 11 user & admin journeys: Health, Auth, Dashboard, Availability, Reservation, HTTP 409 Conflict Rejection, Demo Payment, Admin Overview, RBAC 403 Blocking, and QR Verification.*

### 3. Validate Production Frontend Bundle
```bash
npm --prefix client run build
```

---

## 11. Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Push project to GitHub.
2. Link the repository to Vercel/Netlify.
3. Configure the **Root Directory** as `client`.
4. Set Build Command: `npm run build`, Output Directory: `dist`.
5. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://parkpulse-api.onrender.com/api`).

### Backend Deployment (Render / Railway)
1. Deploy from the `server` directory.
2. Build Command: `npm install`.
3. Start Command: `node server.js`.
4. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: Your MongoDB Atlas URI (`mongodb+srv://<user>:<password>@cluster.mongodb.net/smart-parking`)
   - `JWT_SECRET`: High-entropy 32+ character string
   - `CLIENT_ORIGIN`: Deployed frontend URL (e.g. `https://parkpulse.vercel.app`)

---

## 12. Project Limitations & Future Scope

### Limitations
- Physical presence of cars is calculated logically via software schedules rather than ultrasonic/infrared hardware.
- Payment processing is executed in a demo simulation sandbox; no real debit/credit cards are charged.
- In development mode without a remote database, an in-memory database instance is utilized, meaning restarts reinitialize demo data.

### Future Scope
- Integration with license plate recognition (ALPR) cameras at boom barriers.
- Real-time IoT sensor telemetry using MQTT or WebSockets (Socket.IO).
- Dynamic pricing algorithms adjusting hourly rates based on peak demand and weather conditions.
- Mobile application using React Native sharing the existing REST API.

---

## 13. License & Authorship
Developed for Final Year Project (FYP) demonstration.  
All rights reserved © 2026.
