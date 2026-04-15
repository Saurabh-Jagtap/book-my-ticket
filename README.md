# 🎬 Book My Ticket (Backend-Focused Hackathon Project)

<img width="1823" height="905" alt="book_my_ticket_ss" src="https://github.com/user-attachments/assets/cbd6cb39-8087-416f-bf5d-087987f7af0f" />

## 🚀 Overview
This project is a simplified **Book My Ticket platform** built by extending an existing codebase.  
The focus is on implementing **authentication, protected routes, and safe booking logic** using PostgreSQL.

---

## ✨ Features

- 🔐 User Registration & Login (JWT-based authentication)
- 🛡️ Protected Booking Endpoints
- 🎟️ Seat Booking System
- ❌ Prevent Duplicate Seat Booking
- 👤 Booking Associated with Logged-in User
- ⚡ Transaction-safe operations using PostgreSQL

---

## 🧠 Key Concepts Implemented

- JWT Authentication (Access Token)
- Middleware-based Route Protection
- PostgreSQL Transactions (`BEGIN`, `COMMIT`, `ROLLBACK`)
- Row-level locking using `FOR UPDATE`
- Input validation (without external libraries)

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **Frontend:** Basic HTML (for testing)

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone <your-repo-link>
cd <project-folder>
```
### 2. Install dependencies
```bash
pnpm install
```
3. Create .env file
```bash
JWT_SECRET=your_secret_key
DATABASE_URL=your_database_url
```
4. Run the server
```bash
pnpm dev
```

## 🗄️ Database Setup

Run the following SQL:
```bash
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  user_id INT,
  isbooked INT DEFAULT 0
);

INSERT INTO seats (isbooked)
SELECT 0 FROM generate_series(1, 64);
```

## 🔐 API Endpoints
### Auth
POST `/api/register`  
POST `/api/login`
### Seats
`GET /seats`
### Booking (Protected)
`PUT /:id/:name`

---

## 🌐 Live Demo

👉 https://book-my-ticket-production-aefa.up.railway.app

## 🧪 How It Works
User registers and logs in
JWT token is issued
Token is stored in frontend (localStorage)
Protected booking route verifies token
Seat booking uses DB transaction + locking to avoid conflicts

---

## 🔥 Important Note

Frontend is intentionally minimal as the focus of this project is backend architecture and logic.

##  📌 Learnings
How to extend an existing codebase
Implementing secure authentication
Handling concurrency in databases
Designing protected APIs

---

## 🙌 Acknowledgment
Built as part of the Chai Aur SQL Hackathon Assignment
