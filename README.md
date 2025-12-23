# 🚗 Parking Spot Finder App

A **full-stack Parking Spot Finder & Booking system** built with **FastAPI (backend)** and **React Native (Expo) (frontend)**.  
The app supports **Admin** and **Driver** roles with parking zone, slot, and booking management.

---

## 📱 Features

### 👨‍💼 Admin
- Create & manage parking zones
- Add and manage parking slots (Car / Bike / Truck)
- Slot availability grid (color-based)
- Manual slot availability update
- Analytics (slots, bookings, revenue)
- Admin profile & settings
- Light / Dark / System theme

### 🚗 Driver
- View nearby parking zones
- Search parking zones
- Book parking by duration
- View active & booking history
- Extend / cancel / complete booking
- Driver profile summary
- Light / Dark / System theme

---

## 🧱 Tech Stack

### Frontend
- React Native (Expo)
- Expo Router
- TypeScript
- AsyncStorage
- Ionicons
- Expo Go

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- JWT Authentication
- Uvicorn│

## ⚙️ Backend Setup (FastAPI)

### 1️⃣ Create virtual environment
```bash
cd parking-backend
python -m venv venv
2️⃣ Activate virtual environment
Windows

bash
Copy code
venv\Scripts\activate
Mac / Linux

bash
Copy code
source venv/bin/activate
3️⃣ Install dependencies
bash
Copy code
pip install -r requirements.txt
4️⃣ Run backend server
bash
Copy code
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
5️⃣ API Documentation
arduino
Copy code
http://127.0.0.1:8000/docs
📱 Frontend Setup (Expo)
1️⃣ Install dependencies
bash
Copy code
cd parking-frontend
npm install
2️⃣ Start Expo
bash
Copy code
npx expo start
3️⃣ Run App
Scan QR using Expo Go

Or press a for Android emulator

Or press w for Web

🔐 Authentication Flow
Role	Redirect
Admin	(admin)
Driver	(driver)

JWT token and user data are stored using AsyncStorage.

🌗 Theme Support
Light mode

Dark mode

System default

Toggle available in Profile pages

📌 Booking Flow (Driver)
Select parking zone

Choose duration

Confirm booking

View booking in My Bookings

Extend / Cancel / Complete booking

📊 Admin Analytics
Total slots

Available slots

Occupied slots

Booking statistics

Revenue tracking
