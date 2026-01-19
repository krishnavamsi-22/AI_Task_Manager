# 🏗️ System Architecture Documentation

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Manager    │  │   Employee   │  │    Login     │     │
│  │  Dashboard   │  │  Dashboard   │  │     Page     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│              React 18 + Vite + React Router                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                       │
│                                                              │
│                    Express.js Server                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authentication Middleware                │  │
│  │         (Firebase ID Token Verification)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Authorization Middleware                 │  │
│  │            (Role-Based Access Control)               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │     Task     │  │   Employee   │     │
│  │  Controller  │  │  Controller  │  │  Controller  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐                                           │
│  │ Performance  │                                           │
│  │  Controller  │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │      AI      │  │ Performance  │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Business Logic & Data Access Abstraction                   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    FIREBASE PLATFORM     │  │      AI PLATFORM         │
│                          │  │                          │
│  ┌────────────────────┐ │  │  ┌────────────────────┐ │
│  │   Authentication   │ │  │  │    Groq API        │ │
│  │   (User Management)│ │  │  │  LLaMA 3.3 70B     │ │
│  └────────────────────┘ │  │  └────────────────────┘ │
│                          │  │                          │
│  ┌────────────────────┐ │  │                          │
│  │    Firestore DB    │ │  │                          │
│  │  ┌──────────────┐  │ │  │                          │
│  │  │    users     │  │ │  │                          │
│  │  ├──────────────┤  │ │  │                          │
│  │  │    tasks     │  │ │  │                          │
│  │  ├──────────────┤  │ │  │                          │
│  │  │ performance  │  │ │  │                          │
│  │  │   Metrics    │  │ │  │                          │
│  │  └──────────────┘  │ │  │                          │
│  └────────────────────┘ │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter credentials
     ▼
┌─────────────────┐
│  Login Page     │
└────┬────────────┘
     │ 2. signInWithEmailAndPassword()
     ▼
┌─────────────────┐
│ Firebase Auth   │
└────┬────────────┘
     │ 3. Return ID Token
     ▼
┌─────────────────┐
│  Frontend       │
└────┬────────────┘
     │ 4. POST /api/auth/login { idToken }
     ▼
┌─────────────────┐
│  Backend API    │
└────┬────────────┘
     │ 5. Verify ID Token
     ▼
┌─────────────────┐
│ Firebase Admin  │
└────┬────────────┘
     │ 6. Get user from Firestore
     ▼
┌─────────────────┐
│   Firestore     │
└────┬────────────┘
     │ 7. Return user data
     ▼
┌─────────────────┐
│  Frontend       │
│ (Authenticated) │
└─────────────────┘
```

---

### 2. Task Creation with AI Assignment Flow

```
┌─────────┐
│ Manager │
└────┬────┘
     │ 1. Create task form
     ▼
┌──────────────────┐
│ Manager Dashboard│
└────┬─────────────┘
     │ 2. POST /api/tasks
     ▼
┌──────────────────┐
│ Task Controller  │
└────┬─────────────┘
     │ 3. Get employees
     ▼
┌──────────────────┐
│ Firebase Service │
└────┬─────────────┘
     │ 4. Query employees
     ▼
┌──────────────────┐
│   Firestore      │
└────┬─────────────┘
     │ 5. Return employees
     ▼
┌──────────────────┐
│  AI Service      │
└────┬─────────────┘
     │ 6. Analyze & recommend
     ▼
┌──────────────────┐
│   Groq API       │
└────┬─────────────┘
     │ 7. Return assignment
     ▼
┌──────────────────┐
│ Task Controller  │
└────┬─────────────┘
     │ 8. Create task
     ▼
┌──────────────────┐
│ Firebase Service │
└────┬─────────────┘
     │ 9. Save to Firestore
     ▼
┌──────────────────┐
│   Firestore      │
└────┬─────────────┘
     │ 10. Update employee activeTasks
     ▼
┌──────────────────┐
│ Manager Dashboard│
│ (Task created)   │
└──────────────────┘
```

---

### 3. Task Completion & Performance Tracking Flow

```
┌──────────┐
│ Employee │
└────┬─────┘
     │ 1. Complete task + actual hours
     ▼
┌────────────────────┐
│ Employee Dashboard │
└────┬───────────────┘
     │ 2. PATCH /api/tasks/:id/complete
     ▼
┌────────────────────┐
│  Task Controller   │
└────┬───────────────┘
     │ 3. Get task details
     ▼
┌────────────────────┐
│  Firebase Service  │
└────┬───────────────┘
     │ 4. Calculate performance score
     ▼
┌────────────────────┐
│ Performance Service│
└────┬───────────────┘
     │ 5. Score = f(estimated, actual, deadline)
     │
     │ 6. Update task status
     ▼
┌────────────────────┐
│  Firebase Service  │
└────┬───────────────┘
     │ 7. Save to Firestore
     ▼
┌────────────────────┐
│    Firestore       │
└────┬───────────────┘
     │ 8. Create performance metric
     ▼
┌────────────────────┐
│ Performance Service│
└────┬───────────────┘
     │ 9. Update employee performance
     ▼
┌────────────────────┐
│  Firebase Service  │
└────┬───────────────┘
     │ 10. Calculate rolling average
     │ 11. Update user document
     ▼
┌────────────────────┐
│    Firestore       │
└────┬───────────────┘
     │ 12. Decrement activeTasks
     ▼
┌────────────────────┐
│ Employee Dashboard │
│ (Updated metrics)  │
└────────────────────┘
```

---

## Component Architecture

### Frontend Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── AuthContext
│       ├── user state
│       ├── login()
│       ├── logout()
│       └── register()
│
└── BrowserRouter
    └── Routes
        ├── /login
        │   └── Login
        │       ├── LoginForm
        │       └── ErrorMessage
        │
        ├── /manager
        │   └── ManagerDashboard
        │       ├── Header
        │       ├── StatsGrid
        │       │   └── StatCard × 4
        │       ├── ActionButtons
        │       ├── TaskSection
        │       │   └── TaskCard × n
        │       ├── TeamSection
        │       │   └── EmployeeCard × n
        │       ├── TaskModal
        │       └── EmployeeModal
        │
        └── /employee
            └── EmployeeDashboard
                ├── Header
                ├── StatsGrid
                │   └── StatCard × 4
                ├── TaskSection
                │   └── TaskCard × n
                └── CompleteTaskModal
```

---

## API Architecture

### RESTful Endpoint Structure

```
/api
├── /auth
│   ├── POST   /register      → authController.register
│   ├── POST   /login          → authController.login
│   └── GET    /profile        → authController.getProfile
│
├── /tasks
│   ├── POST   /               → taskController.createTask       [Manager]
│   ├── GET    /manager        → taskController.getManagerTasks  [Manager]
│   ├── GET    /employee       → taskController.getEmployeeTasks [Employee]
│   ├── PUT    /:id            → taskController.updateTask       [Manager]
│   ├── DELETE /:id            → taskController.deleteTask       [Manager]
│   ├── PATCH  /:id/complete   → taskController.completeTask     [Employee]
│   └── PATCH  /:id/status     → taskController.updateStatus     [Employee]
│
├── /employees
│   ├── POST   /               → employeeController.addEmployee  [Manager]
│   ├── GET    /               → employeeController.getEmployees [Manager]
│   ├── GET    /stats          → employeeController.getStats     [Manager]
│   ├── GET    /:id            → employeeController.getDetails   [Manager]
│   ├── PUT    /:id            → employeeController.update       [Manager]
│   └── DELETE /:id            → employeeController.delete       [Manager]
│
└── /performance
    ├── GET    /my-performance → performanceController.getMy      [Employee]
    ├── GET    /team           → performanceController.getTeam    [Manager]
    └── GET    /employee/:id   → performanceController.getEmployee
```

---

## Database Schema

### Firestore Collections

#### users Collection
```javascript
{
  uid: "firebase_uid",           // Document ID
  email: "user@example.com",
  name: "John Doe",
  role: "manager" | "employee",
  skills: ["React", "Node.js"],
  managerId: "manager_uid",      // null for managers
  performance: 85,               // 0-100 score
  activeTasks: 3,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

#### tasks Collection
```javascript
{
  id: "auto_generated_id",       // Document ID
  title: "Build API endpoint",
  description: "Create REST API...",
  priority: "high" | "medium" | "low",
  estimatedHours: 8,
  actualHours: 7,                // null until completed
  deadline: "2024-01-15T00:00:00Z",
  status: "pending" | "in-progress" | "completed",
  assignedTo: "employee_uid",
  createdBy: "manager_uid",
  aiReasoning: "Best fit based on...",
  completedAt: "2024-01-14T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-14T00:00:00Z"
}
```

#### performanceMetrics Collection
```javascript
{
  id: "auto_generated_id",       // Document ID
  taskId: "task_id",
  employeeId: "employee_uid",
  score: 92,                     // 0-100
  details: {
    estimatedHours: 8,
    actualHours: 7,
    completedAt: "2024-01-14T00:00:00Z"
  },
  timestamp: "2024-01-14T00:00:00Z",
  createdAt: "2024-01-14T00:00:00Z"
}
```

---

## Security Architecture

### Authentication Flow
```
1. User logs in → Firebase Auth
2. Firebase returns ID Token
3. Frontend stores token
4. Every API request includes: Authorization: Bearer <token>
5. Backend verifies token with Firebase Admin SDK
6. Backend checks user role from Firestore
7. Middleware enforces role-based access
```

### Firestore Security Rules
```javascript
// Users: Read by all authenticated, write by self or manager
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId || isManager();
}

// Tasks: Read by all, create by manager, update by creator or assignee
match /tasks/{taskId} {
  allow read: if request.auth != null;
  allow create: if isManager();
  allow update, delete: if isCreatorOrAssignee(taskId);
}

// Performance: Read by all authenticated, write by system
match /performanceMetrics/{metricId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## Performance Optimization

### Backend
- Service layer caching
- Firestore query optimization with indexes
- Batch operations for multiple updates
- Error handling with fallbacks

### Frontend
- React Context for state management
- Lazy loading of components
- Optimized re-renders
- API response caching

### Database
- Composite indexes for common queries
- Denormalization for read performance
- Batch writes for atomic operations

---

## Scalability Considerations

### Horizontal Scaling
- Stateless Express server (can run multiple instances)
- Firebase handles database scaling automatically
- Load balancer ready

### Vertical Scaling
- Service layer abstraction allows easy optimization
- AI service can be moved to separate microservice
- Performance service can be background job

### Future Enhancements
- Redis caching layer
- Message queue for async tasks
- Microservices architecture
- GraphQL API option

---

## Monitoring & Logging

### Application Logs
- Request/response logging
- Error tracking
- Performance metrics

### Firebase Monitoring
- Authentication metrics
- Firestore usage
- Security rule violations

### AI Service Monitoring
- API call success rate
- Response times
- Fallback usage

---

This architecture provides a solid foundation for an enterprise-grade application with room for growth and optimization.
