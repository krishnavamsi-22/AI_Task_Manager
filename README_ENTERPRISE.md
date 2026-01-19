# AI Task Management for Enterprises

## 🎯 Enterprise-Grade Task Management System

A production-ready AI-powered task management application with intelligent task assignment, performance tracking, and role-based access control.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **AI**: Groq LLaMA 3.3 70B

### System Design
```
Frontend (React + Vite)
    ↓ REST API
Backend (Express.js)
    ↓ Firebase Admin SDK
Firebase (Firestore + Auth)
    ↓ AI Service
Groq API (LLM)
```

## 📋 Features

### Manager Role
- ✅ Create and assign tasks with AI recommendations
- ✅ Add/manage employees
- ✅ View team performance analytics
- ✅ Track task completion metrics
- ✅ Delete tasks and employees
- ✅ Real-time dashboard statistics

### Employee Role
- ✅ View assigned tasks
- ✅ Update task status (pending → in-progress → completed)
- ✅ Log actual hours worked
- ✅ View personal performance score
- ✅ AI-powered task prioritization
- ✅ Performance tracking

### AI Capabilities
- 🤖 Intelligent task assignment based on:
  - Employee skills and workload
  - Task priority and complexity
  - Historical performance
- 🤖 Automatic priority recommendations
- 🤖 Completion time estimates
- 🤖 Workload balancing

### Performance Tracking
- 📊 Automatic score calculation based on:
  - Time efficiency (estimated vs actual)
  - Deadline adherence
  - Task completion quality
- 📊 Rolling average performance scores
- 📊 Team performance analytics

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+
- Firebase project
- Groq API key

### Backend Setup

1. **Navigate to backend:**
```bash
cd "Task Manager/backend"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Firebase Admin:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Update `backend/.env`:
```env
PORT=5000
NODE_ENV=development

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key\n-----END PRIVATE KEY-----\n"

GROQ_API_KEY=your_groq_api_key
AI_MODEL=llama-3.3-70b-versatile
```

4. **Start backend:**
```bash
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd "Task Manager/frontend-vite"
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Firebase Client:**
   - Go to Firebase Console → Project Settings → General
   - Copy your web app config
   - Update `frontend-vite/.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Start frontend:**
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### Firebase Setup

1. **Enable Authentication:**
   - Go to Firebase Console → Authentication
   - Enable Email/Password provider

2. **Create Firestore Database:**
   - Go to Firebase Console → Firestore Database
   - Create database in production mode
   - Add security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
    }
    
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
      allow update, delete: if request.auth != null && 
                              (resource.data.createdBy == request.auth.uid || 
                               resource.data.assignedTo == request.auth.uid);
    }
    
    match /performanceMetrics/{metricId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. **Create Indexes:**
   - Go to Firestore → Indexes
   - Create composite indexes:
     - Collection: `users`, Fields: `managerId` (Ascending), `role` (Ascending)
     - Collection: `tasks`, Fields: `createdBy` (Ascending), `createdAt` (Descending)
     - Collection: `tasks`, Fields: `assignedTo` (Ascending), `priority` (Descending)

### Groq API Setup

1. Sign up at https://console.groq.com
2. Generate API key
3. Add to backend `.env`

## 📁 Project Structure

```
Task Manager/
├── backend/
│   ├── config/
│   │   └── firebase.js          # Firebase Admin initialization
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── taskController.js    # Task management
│   │   ├── employeeController.js # Employee operations
│   │   └── performanceController.js # Performance metrics
│   ├── services/
│   │   ├── firebaseService.js   # Firestore operations
│   │   ├── aiService.js         # AI/LLM integration
│   │   └── performanceService.js # Performance calculations
│   ├── middlewares/
│   │   └── errorHandler.js      # Error handling
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── employeeRoutes.js
│   │   └── performanceRoutes.js
│   ├── .env
│   ├── package.json
│   └── server.js                # Entry point
│
└── frontend-vite/
    ├── src/
    │   ├── config/
    │   │   └── firebase.js      # Firebase client config
    │   ├── services/
    │   │   └── api.js           # API client
    │   ├── context/
    │   │   └── AuthContext.jsx  # Auth state management
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── ManagerDashboard.jsx
    │   │   └── EmployeeDashboard.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    ├── package.json
    ├── vite.config.js
    └── index.html
```

## 🔐 Security Features

- Firebase Authentication with ID tokens
- Role-based access control (RBAC)
- Firestore security rules
- API authorization middleware
- Environment variable protection
- Input validation

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with Firebase token
- `GET /api/auth/profile` - Get user profile

### Tasks (Manager)
- `POST /api/tasks` - Create task with AI assignment
- `GET /api/tasks/manager` - Get all manager's tasks
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Tasks (Employee)
- `GET /api/tasks/employee` - Get assigned tasks
- `PATCH /api/tasks/:id/status` - Update task status
- `PATCH /api/tasks/:id/complete` - Complete task

### Employees (Manager)
- `POST /api/employees` - Add employee
- `GET /api/employees` - Get all employees
- `GET /api/employees/stats` - Get statistics
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Performance
- `GET /api/performance/my-performance` - Employee's performance
- `GET /api/performance/team` - Team performance (Manager)
- `GET /api/performance/employee/:id` - Specific employee performance

## 🎨 UI/UX Features

- Modern gradient design
- Responsive layout
- Real-time updates
- Modal dialogs
- Status indicators
- Performance visualizations
- Priority-based color coding
- Loading states

## 🧪 Testing

Create test users:

**Manager:**
```javascript
{
  email: "manager@company.com",
  password: "manager123",
  name: "John Manager",
  role: "manager"
}
```

**Employee:**
```javascript
{
  email: "employee@company.com",
  password: "employee123",
  name: "Jane Employee",
  role: "employee",
  skills: ["React", "Node.js", "Python"],
  managerId: "manager_uid"
}
```

## 🚀 Production Deployment

### Backend
```bash
cd backend
npm install --production
npm start
```

### Frontend
```bash
cd frontend-vite
npm run build
# Deploy dist/ folder to hosting service
```

## 📈 Performance Optimization

- Firestore query optimization with indexes
- API response caching
- Lazy loading components
- Debounced user inputs
- Optimized re-renders

## 🔧 Configuration

### AI Model Configuration
Change AI model in `backend/.env`:
```env
AI_MODEL=llama-3.3-70b-versatile
# or
AI_MODEL=mixtral-8x7b-32768
```

### Performance Scoring
Modify scoring logic in `backend/services/performanceService.js`

## 📝 License

MIT License

## 🤝 Support

For issues or questions, refer to:
- Firebase Documentation: https://firebase.google.com/docs
- Groq API Documentation: https://console.groq.com/docs
- Express.js Documentation: https://expressjs.com

---

**Built with enterprise-grade architecture and best practices**
