# Smart Attendance System

A comprehensive attendance management system with biometric authentication using React Native (mobile app), MERN stack (backend), and React (supervisor dashboard).

## Features

- **User Authentication**: Register and login for users and supervisors.
- **Biometric Attendance**: Submit attendance via fingerprint, face recognition, or voice verification.
- **User Records**: View personal attendance history.
- **Supervisor Dashboard**: Monitor all attendance records with statistics.

## Project Structure

```
/Final-Project/New folder
├── mobile/                 # React Native (Expo) Android app
├── backend/                # MERN backend (Node.js, Express, MongoDB)
├── supervisor-dashboard/   # React web app for supervisors
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB (local or MongoDB Atlas)
- Expo CLI (for mobile app)
- Android Studio (for Android emulator)

### Backend Setup

1. Navigate to `backend/` directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables: Create a `.env` file with:
   ```
   MONGO_URI=mongodb://localhost:27017/smart-attendance
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the server:
   ```
   npm start
   ```

### Mobile App Setup

1. Navigate to `mobile/` directory:
   ```
   cd mobile
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the Expo server:
   ```
   npx expo start
   ```

4. Run on Android emulator or device:
   ```
   npm run android
   ```

### Supervisor Dashboard Setup

1. Navigate to `supervisor-dashboard/` directory:
   ```
   cd supervisor-dashboard
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Attendance
- `POST /api/attendance/submit` - Submit attendance (requires auth)
- `GET /api/attendance/user/:id` - Get user attendance records (requires auth)
- `GET /api/attendance/all` - Get all attendance records (supervisor only)

## Usage

1. Register/Login as a user or supervisor.
2. For users: Submit attendance using biometric methods.
3. View personal attendance records.
4. Supervisors can access the dashboard to view all records.

## Notes

- Biometric matching is basic (string comparison for demo).
- Use MongoDB Atlas for production.
- Ensure Android permissions for camera, microphone, and biometrics.

## Technologies Used

- **Frontend**: React Native (Expo), React
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT
- **Biometrics**: react-native-biometrics, expo-camera, expo-speech
