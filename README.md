# 🏛️ Monk Student — ระบบบันทึกข้อมูลนักศึกษา (สถานะพระ)
### มหาวิทยาลัยรามคำแหง · Staff Information System

> ระบบสารสนเทศสำหรับเจ้าหน้าที่ เพื่อบันทึกและตรวจสอบข้อมูลสถานะพระของนักศึกษา มหาวิทยาลัยรามคำแหง

---

## 📋 สารบัญ

- [ภาพรวมระบบ](#-ภาพรวมระบบ)
- [Tech Stack](#-tech-stack)
- [โครงสร้างโปรเจกต์](#-โครงสร้างโปรเจกต์)
- [API Endpoints](#-api-endpoints)
- [การติดตั้งและรันระบบ](#-การติดตั้งและรันระบบ)
- [Environment Variables](#-environment-variables)
- [Authentication Flow](#-authentication-flow)
- [หน้าต่างๆ ในระบบ](#-หน้าต่างๆ-ในระบบ)

---

## 🌐 ภาพรวมระบบ

ระบบนี้ประกอบด้วย 2 ส่วนหลัก:

| ส่วน | Technology | Port |
|---|---|---|
| **Frontend** | Angular 20 | `4200` |
| **Backend** | Node.js + Express | `4000` |
| **ฐานข้อมูล** | MySQL | `3306` |

**Authentication** ใช้ระบบ Authen365 (Microsoft Azure AD) ผ่าน JWT Token  
เฉพาะ **เจ้าหน้าที่มหาวิทยาลัย** เท่านั้นที่เข้าใช้งานได้

---

## 🛠️ Tech Stack

### Frontend
| Package | Version |
|---|---|
| Angular | `^20.3.0` |
| RxJS | `~7.8.0` |
| TypeScript | `~5.9.2` |

### Backend
| Package | Version | ใช้ทำอะไร |
|---|---|---|
| Express | `^4.18.2` | Web Framework |
| mysql2 | `^3.24.6` | MySQL Driver |
| jsonwebtoken | `^9.0.2` | JWT Auth |
| helmet | `^4.5.0` | Security Headers |
| cors | `^2.8.5` | CORS Policy |
| dotenv | `^16.3.1` | Environment Config |
| ws | `^8.16.0` | WebSocket |
| axios | `^1.5.0` | HTTP Client |
| nodemailer | `^6.9.7` | Email |

---

## 📁 โครงสร้างโปรเจกต์

```
Monk-Student/
├── 📂 src/                          # Angular Frontend
│   └── app/
│       ├── components/
│       │   ├── login/               # หน้า Login พร้อม Show/Hide Password
│       │   ├── student-record/      # หน้าบันทึกข้อมูลนักศึกษา
│       │   ├── student-detail/      # หน้ารายละเอียดนักศึกษา
│       │   ├── record-list/         # หน้ารายการบันทึกทั้งหมด
│       │   └── shared/
│       │       └── user-profile/    # Component โปรไฟล์ผู้ใช้
│       ├── guards/
│       │   └── auth.guard.ts        # Route Guard (เฉพาะผู้ล็อกอิน)
│       ├── interceptors/
│       │   └── auth.interceptor.ts  # แนบ JWT Token ทุก HTTP Request
│       └── services/
│           ├── auth.service.ts      # Authentication Service
│           └── student-registration.service.ts
│
├── 📂 backend/                      # Node.js Backend
│   ├── app.js                       # Entry Point
│   ├── .env.example                 # ตัวอย่าง Environment Variables
│   ├── add_f_rev_columns.sql        # SQL Migration Script
│   ├── config/db/                   # Database Config (MySQL, Pool)
│   ├── controllers/
│   │   ├── auth/                    # Authentication Controllers
│   │   │   ├── auth.js
│   │   │   ├── auth_sign.js
│   │   │   └── microsoft/login.js   # Authen365 Login
│   │   ├── student-registration.controller.js
│   │   └── personnel/               # Personnel Controllers
│   ├── middleware/
│   │   └── require-staff-token.js   # JWT Middleware
│   ├── models/db/                   # Database Models (CRUD)
│   ├── routers/
│   │   ├── routes.js                # Auth + General Routes
│   │   ├── student-registration-route.js
│   │   ├── frontend-route.js
│   │   └── routesControl.js
│   ├── services/
│   │   └── student-registration.service.js
│   ├── utils/                       # Utility Functions
│   ├── Dockerfile                   # Docker Support
│   └── compose.yaml                 # Docker Compose
│
├── 📂 public/images/                # Static Assets
│   └── ramkhamhaeng-logo.svg
└── 📂 src/assets/images/            # Angular Assets
    ├── ramkhamhaeng-logo.svg
    └── ru-favicon.ico
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:4000`

### 🔓 Public (ไม่ต้องการ Token)
| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/` | Health Check |
| `POST` | `/api/service/login` | Login ด้วย Authen365 |

### 🔒 Protected (ต้องการ JWT Token)
| Method | Path | คำอธิบาย |
|---|---|---|
| `GET` | `/api/service/verifytoken` | ตรวจสอบความถูกต้องของ Token |
| `GET` | `/api/students/monk-status` | ดึงรายการบันทึกสถานะพระทั้งหมด |
| `POST` | `/api/students/monk-status` | บันทึกสถานะพระใหม่ |
| `DELETE` | `/api/students/monk-status/:recordId` | ลบบันทึกสถานะพระ |
| `GET` | `/api/students/terms` | ดึงรายการภาคการศึกษา |
| `GET` | `/api/students/:studentId/registration` | ดึงข้อมูลการลงทะเบียนนักศึกษา |
| `GET` | `/api/students/:studentId/registration-history` | ดึงประวัติการลงทะเบียน |

---

## ⚙️ การติดตั้งและรันระบบ

### ข้อกำหนดเบื้องต้น

- **Node.js** v18+ 
- **MySQL** 8.0+
- **Angular CLI** v20

---

### 1. Clone Repository

```bash
git clone https://github.com/icedolrawee/Monk-Student.git
cd Monk-Student
```

---

### 2. ติดตั้ง Backend

```bash
cd backend
npm install
```

สร้างไฟล์ `.env` จาก template:

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` ให้ตรงกับค่าของคุณ (ดูหัวข้อ [Environment Variables](#-environment-variables))

รัน Backend:

```bash
node app.js
# หรือใช้ nodemon สำหรับ development
npx nodemon app.js
```

Backend จะรันที่ `http://localhost:4000`

---

### 3. ติดตั้ง Frontend

```bash
# กลับไปที่ root ของโปรเจกต์
cd ..
npm install
```

รัน Frontend:

```bash
ng serve
# หรือ
npm start
```

Frontend จะรันที่ `http://localhost:4200`

---

### 4. รัน ด้วย Docker (ทางเลือก)

```bash
cd backend
docker compose up --build
```

---

## 🔑 Environment Variables

สร้างไฟล์ `backend/.env` โดยอ้างอิงจาก `.env.example`:

```env
PORT=4000

# MySQL Connection
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password

# JWT Secret — สร้างด้วยคำสั่งนี้:
# node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
TOKEN_SECRET=replace_with_a_unique_random_secret_at_least_32_characters
```

> ⚠️ **อย่า commit ไฟล์ `.env` จริงขึ้น GitHub เด็ดขาด**  
> ไฟล์นี้ถูก ignore ไว้แล้วใน `.gitignore`

---

## 🔐 Authentication Flow

```
เจ้าหน้าที่กรอก Email + Password
        ↓
Angular → POST /api/service/login
        ↓
Backend → Authen365 (Microsoft Azure AD)
        ↓
ตรวจสอบสิทธิ์ MONK_USER_LOGIN
        ↓
ออก JWT Token → ส่งกลับ Angular
        ↓
Angular เก็บ Token → GET /api/service/verifytoken
        ↓
เข้าใช้งานระบบได้
```

- Token จะถูกแนบอัตโนมัติทุก Request ผ่าน `auth.interceptor.ts`
- Route ที่ต้องการ Login จะถูกป้องกันด้วย `auth.guard.ts`
- เมื่อ Token หมดอายุ ระบบจะ Redirect ไปหน้า Login พร้อมแจ้งเตือน

---

## 🖥️ หน้าต่างๆ ในระบบ

| Route | Component | คำอธิบาย |
|---|---|---|
| `/login` | `LoginComponent` | หน้าเข้าสู่ระบบ (มี Show/Hide Password) |
| `/student-record` | `StudentRecordComponent` | หน้าหลัก — บันทึกข้อมูลสถานะพระ |
| `/record-list` | `RecordListComponent` | รายการบันทึกทั้งหมด |
| `/student-detail/:studentId` | `StudentDetailComponent` | รายละเอียดข้อมูลนักศึกษา |

> 🔒 ทุก Route ยกเว้น `/login` ต้องผ่านการ Login ก่อน

---

## 🗄️ SQL Migration

ไฟล์ `backend/add_f_rev_columns.sql` — Migration สำหรับตาราง `PERSON_PAYROLL_OUT`  
เพิ่มคอลัมน์สถานะการรับเงิน:

| Column | ค่า | ความหมาย |
|---|---|---|
| `F_REV_SALARY` | Y / N / NULL | สถานะรับเงินเดือน |
| `F_REV_POS_MONEY` | Y / N / NULL | สถานะรับเงินประจำตำแหน่ง |
| `F_REV_PAY_EX` | Y / N / NULL | สถานะรับเงินประจำตำแหน่งผู้บริหาร |
| `F_TOTAL_INCOME` | Y / N / NULL | สถานะรับเงินรายได้ทั้งหมด |

รัน Migration:

```sql
-- เชื่อมต่อ MySQL แล้วรัน:
SOURCE backend/add_f_rev_columns.sql;
```

---

## 👤 Author

**icedolrawee**  
🔗 [github.com/icedolrawee](https://github.com/icedolrawee)

---

*Ramkhamhaeng University · Staff Information System*
