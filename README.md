# <p align="center">🚲 CampusRide – Premium Bike Rental Platform</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
</p>

<p align="center">
  <strong>A full-stack, enterprise-grade bike rental ecosystem designed for campuses. Features modern glassmorphic UI, real-time booking, and advanced administrative controls.</strong>
</p>

---

## 🌟 Project Overview

**CampusRide** is a comprehensive MERN stack application that streamlines the process of renting bicycles and motorcycles within a university or city campus. It bridges the gap between asset management and customer convenience through a highly polished, responsive interface.

### ✨ Key Features

-   🔐 **Secure Authentication**: JWT-based login and Google OAuth integration.
-   🗺️ **Dynamic Fleet View**: Real-time availability of bikes with category-based filtering.
-   📅 **Advanced Booking Flow**: Multi-step booking with document verification.
-   💎 **Premium Membership**: Subscription tiers with exclusive benefits and pricing.
-   🛡️ **Admin Command Center**: Complete oversight of bookings, users, and asset health.
-   📄 **Automated Invoicing**: Professional PDF generation with brand consistency.
-   🌓 **Adaptive UI**: Seamless transition between sophisticated Light and Dark modes.
-   📸 **Selfie Verification**: Live document and selfie verification for enhanced security.

---

## 🛠️ Tech Stack

### **Frontend**
- **Core**: React 18, Vite
- **Styling**: Tailwind CSS (Premium Glassmorphic Design)
- **Routing**: TanStack Router
- **State Management**: React Context API
- **Icons**: Lucide React

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Passport.js, JWT, Google OAuth 2.0
- **Storage**: Local/Cloudinary for document uploads

---

## 📂 Repository Structure

```bash
CampusRide/
├── backend/                # Express API for static uploads & legacy health endpoints
│   ├── src/
│   │   ├── controllers/    # Business Logic
│   │   ├── models/         # DB Schemas
│   │   ├── routes/         # API Endpoints
│   │   └── middleware/     # Auth & Error Handling
│   └── uploads/            # Local Asset Storage
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── routes/         # Page Views
│   │   └── context/        # Global State
└── screenshots/            # Project Visualization
```

---



---

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js (v16+)
- Supabase Account
- Google Cloud Console Project (for Auth)

### **1. Clone the Repository**
```bash
git clone https://github.com/harshkhatry1994/CampusRide.git
cd CampusRide
```

### **2. Backend Configuration**
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

### **3. Frontend Configuration**
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
```

### **4. Run Application**
```bash
# Terminal 1 (Backend)
cd backend
npm run dev

# Terminal 2 (Frontend)
cd frontend
npm run dev
```

---

## 📡 API Endpoints (Quick Reference)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create new user account |
| `GET` | `/api/bikes/all` | Fetch all available fleet assets |
| `POST` | `/api/bookings/create` | Initiate a new rental record |
| `PATCH` | `/api/admin/bookings/:id` | Update status (Admin Only) |
| `GET` | `/api/invoices/:id` | Generate & Download PDF Invoice |

---

## 🌍 Deployment Guide

### **Frontend (Vercel)**
1. Connect GitHub repo.
2. Set root directory to `frontend`.
3. Add `VITE_API_URL` environment variable.

### **Backend (Render)**
1. Create a new Web Service.
2. Set root directory to `backend`.
3. Add all `.env` variables in the dashboard.
4. Set build command: `npm install` and start command: `node src/index.js`.

---

## 🔮 Future Improvements
- [ ] **Razorpay Integration**: Real-time payment gateway processing.
- [ ] **Email Automation**: Automated booking confirmations via Nodemailer.
- [ ] **AI Assistant**: Enhanced recommendation engine for bike selection.
- [ ] **PWA Support**: Offline access and mobile home-screen installation.

---

## 👤 Author

**Harsh Khatry**
- GitHub: [@harshkhatry1994](https://github.com/harshkhatry1994)
- LinkedIn: [Your Profile](https://linkedin.com/in/harsh-khatry)

---

<p align="center">Made with ❤️ for Campus Explorers</p>
