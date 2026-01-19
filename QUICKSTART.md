# 🚀 Quick Start Guide

## Step 1: Install Dependencies

### Backend
```bash
cd "Task Manager/backend"
npm install
```

### Frontend
```bash
cd "Task Manager/frontend-vite"
npm install
```

## Step 2: Configure Firebase

1. Create Firebase project at https://console.firebase.google.com
2. Enable Email/Password authentication
3. Create Firestore database
4. Get service account key (Project Settings → Service Accounts)
5. Get web app config (Project Settings → General)

## Step 3: Update Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"

GROQ_API_KEY=your_groq_key
AI_MODEL=llama-3.3-70b-versatile
```

### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Step 4: Run the Application

### Terminal 1 - Backend
```bash
cd "Task Manager/backend"
npm run dev
```

### Terminal 2 - Frontend
```bash
cd "Task Manager/frontend-vite"
npm run dev
```

## Step 5: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Step 6: Create Test Users

Use Firebase Console to create test users or use the registration endpoint.

**Manager Account:**
- Email: manager@test.com
- Password: manager123
- Role: manager

**Employee Account:**
- Email: employee@test.com
- Password: employee123
- Role: employee
- Manager ID: (manager's UID)

## 🎉 You're Ready!

Login with manager account to:
- Add employees
- Create tasks
- View analytics

Login with employee account to:
- View assigned tasks
- Update task status
- Track performance

## 📚 Next Steps

- Read full documentation in README_ENTERPRISE.md
- Configure Firestore security rules
- Set up Firestore indexes
- Customize AI prompts in aiService.js
- Adjust performance scoring in performanceService.js
