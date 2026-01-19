# ✅ Setup Checklist

Use this checklist to set up your Enterprise AI Task Manager.

---

## 📋 Pre-Setup Requirements

- [ ] Node.js 16+ installed
- [ ] npm or yarn installed
- [ ] Code editor (VS Code recommended)
- [ ] Terminal/Command Prompt access
- [ ] Internet connection

---

## 🔥 Firebase Setup

### Create Firebase Project
- [ ] Go to https://console.firebase.google.com
- [ ] Click "Add project"
- [ ] Enter project name
- [ ] Disable Google Analytics (optional)
- [ ] Click "Create project"

### Enable Authentication
- [ ] Go to "Authentication" in sidebar
- [ ] Click "Get started"
- [ ] Click "Email/Password" provider
- [ ] Enable "Email/Password"
- [ ] Click "Save"

### Create Firestore Database
- [ ] Go to "Firestore Database" in sidebar
- [ ] Click "Create database"
- [ ] Select "Start in production mode"
- [ ] Choose location (closest to you)
- [ ] Click "Enable"

### Get Service Account Key (Backend)
- [ ] Go to "Project Settings" (gear icon)
- [ ] Click "Service accounts" tab
- [ ] Click "Generate new private key"
- [ ] Click "Generate key"
- [ ] Save the JSON file securely
- [ ] Copy projectId, client_email, and private_key

### Get Web App Config (Frontend)
- [ ] Go to "Project Settings" (gear icon)
- [ ] Scroll to "Your apps"
- [ ] Click web icon (</>)
- [ ] Register app with nickname
- [ ] Copy the firebaseConfig object

### Set Firestore Security Rules
- [ ] Go to "Firestore Database"
- [ ] Click "Rules" tab
- [ ] Copy rules from README_ENTERPRISE.md
- [ ] Click "Publish"

### Create Firestore Indexes
- [ ] Go to "Firestore Database"
- [ ] Click "Indexes" tab
- [ ] Create composite index:
  - Collection: users
  - Fields: managerId (Ascending), role (Ascending)
- [ ] Create composite index:
  - Collection: tasks
  - Fields: createdBy (Ascending), createdAt (Descending)
- [ ] Create composite index:
  - Collection: tasks
  - Fields: assignedTo (Ascending), priority (Descending)

---

## 🤖 Groq API Setup

- [ ] Go to https://console.groq.com
- [ ] Sign up / Log in
- [ ] Go to API Keys section
- [ ] Click "Create API Key"
- [ ] Copy the API key
- [ ] Save it securely

---

## 💻 Backend Setup

### Navigate to Backend
```bash
cd "Task Manager/backend"
```
- [ ] Executed command

### Install Dependencies
```bash
npm install
```
- [ ] Dependencies installed successfully
- [ ] No errors in installation

### Configure Environment Variables
- [ ] Open `backend/.env` file
- [ ] Update `FIREBASE_PROJECT_ID` with your project ID
- [ ] Update `FIREBASE_CLIENT_EMAIL` with service account email
- [ ] Update `FIREBASE_PRIVATE_KEY` with private key (keep quotes)
- [ ] Update `GROQ_API_KEY` with your Groq API key
- [ ] Save the file

### Test Backend
```bash
npm run dev
```
- [ ] Server starts without errors
- [ ] See "✅ Server running on port 5000"
- [ ] See "🔥 Firebase Admin initialized"
- [ ] See "🤖 AI Service ready"

---

## 🎨 Frontend Setup

### Navigate to Frontend
```bash
cd "Task Manager/frontend-vite"
```
- [ ] Executed command

### Install Dependencies
```bash
npm install
```
- [ ] Dependencies installed successfully
- [ ] No errors in installation

### Configure Environment Variables
- [ ] Open `frontend-vite/.env` file
- [ ] Update `VITE_FIREBASE_API_KEY`
- [ ] Update `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] Update `VITE_FIREBASE_PROJECT_ID`
- [ ] Update `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] Update `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] Update `VITE_FIREBASE_APP_ID`
- [ ] Save the file

### Test Frontend
```bash
npm run dev
```
- [ ] Dev server starts without errors
- [ ] See "Local: http://localhost:3000"
- [ ] Browser opens automatically
- [ ] Login page displays

---

## 🧪 Testing

### Create Manager Account
- [ ] Open Firebase Console → Authentication
- [ ] Click "Add user"
- [ ] Email: manager@test.com
- [ ] Password: manager123
- [ ] Click "Add user"
- [ ] Copy the User UID

### Create Manager in Firestore
- [ ] Go to Firestore Database
- [ ] Click "Start collection"
- [ ] Collection ID: users
- [ ] Document ID: (paste Manager UID)
- [ ] Add fields:
  - email: "manager@test.com"
  - name: "Test Manager"
  - role: "manager"
  - skills: [] (array)
  - managerId: null
  - performance: 80 (number)
  - activeTasks: 0 (number)
  - createdAt: (current timestamp)
  - updatedAt: (current timestamp)
- [ ] Click "Save"

### Test Manager Login
- [ ] Go to http://localhost:3000
- [ ] Enter manager@test.com
- [ ] Enter manager123
- [ ] Click "Login"
- [ ] Should redirect to Manager Dashboard
- [ ] See statistics cards
- [ ] See "Create Task" button
- [ ] See "Add Employee" button

### Create Employee via Manager Dashboard
- [ ] Click "Add Employee"
- [ ] Fill in form:
  - Name: Test Employee
  - Email: employee@test.com
  - Password: employee123
  - Skills: React, Node.js
- [ ] Click "Add"
- [ ] Should see success message
- [ ] Employee should appear in team list

### Test Employee Login
- [ ] Logout from manager account
- [ ] Login with employee@test.com / employee123
- [ ] Should redirect to Employee Dashboard
- [ ] See performance statistics
- [ ] See "My Tasks" section

### Test Task Creation
- [ ] Login as manager
- [ ] Click "Create Task"
- [ ] Fill in form:
  - Title: Test Task
  - Description: This is a test task
  - Priority: High
  - Estimated Hours: 8
  - Deadline: (tomorrow's date)
- [ ] Click "Create"
- [ ] Should see AI assignment reasoning
- [ ] Task should appear in task list

### Test Task Completion
- [ ] Login as employee
- [ ] Find the assigned task
- [ ] Click "Start Task"
- [ ] Status should change to "in-progress"
- [ ] Click "Complete Task"
- [ ] Enter actual hours: 7
- [ ] Click "Complete"
- [ ] Performance score should update
- [ ] Active tasks should decrease

---

## 🎯 Feature Testing

### Manager Features
- [ ] Create task with AI assignment
- [ ] View all tasks
- [ ] Edit task
- [ ] Delete task
- [ ] Add employee
- [ ] View employee list
- [ ] View team performance
- [ ] View statistics

### Employee Features
- [ ] View assigned tasks
- [ ] Start task (pending → in-progress)
- [ ] Complete task
- [ ] Log actual hours
- [ ] View personal performance
- [ ] View performance history

### AI Features
- [ ] Task assignment recommendation
- [ ] Workload balancing
- [ ] Priority suggestion
- [ ] Reasoning display

### Performance Features
- [ ] Score calculation on completion
- [ ] Performance history tracking
- [ ] Rolling average update
- [ ] Team performance analytics

---

## 🚀 Deployment Checklist

### Backend Deployment
- [ ] Choose hosting platform (Heroku, Railway, AWS)
- [ ] Set environment variables on platform
- [ ] Deploy backend code
- [ ] Test API endpoints
- [ ] Verify Firebase connection

### Frontend Deployment
- [ ] Run `npm run build`
- [ ] Choose hosting (Vercel, Netlify, Firebase)
- [ ] Set environment variables
- [ ] Deploy dist/ folder
- [ ] Update API base URL if needed
- [ ] Test production build

### Post-Deployment
- [ ] Test login functionality
- [ ] Test task creation
- [ ] Test employee management
- [ ] Test performance tracking
- [ ] Verify AI integration
- [ ] Check error handling

---

## 📊 Monitoring Setup

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure Firebase Analytics
- [ ] Set up uptime monitoring
- [ ] Configure alerts
- [ ] Set up logging

---

## 🔒 Security Checklist

- [ ] Environment variables not committed
- [ ] Firebase security rules active
- [ ] API authentication working
- [ ] Role-based access enforced
- [ ] HTTPS enabled in production
- [ ] CORS configured properly
- [ ] Input validation active

---

## 📚 Documentation Review

- [ ] Read README_ENTERPRISE.md
- [ ] Read QUICKSTART.md
- [ ] Read ARCHITECTURE.md
- [ ] Understand API endpoints
- [ ] Review security rules
- [ ] Understand data flow

---

## ✅ Final Verification

- [ ] Backend running without errors
- [ ] Frontend running without errors
- [ ] Firebase connected
- [ ] Authentication working
- [ ] Manager can create tasks
- [ ] AI assignment working
- [ ] Employee can complete tasks
- [ ] Performance tracking working
- [ ] All features tested
- [ ] Ready for production

---

## 🎉 Completion

Once all items are checked:
- ✅ Your system is fully operational
- ✅ Ready for production use
- ✅ Ready for deployment
- ✅ Ready to scale

---

## 📞 Troubleshooting

### Backend won't start
- Check .env file configuration
- Verify Firebase credentials
- Check port 5000 is available
- Review console errors

### Frontend won't start
- Check .env file configuration
- Verify all dependencies installed
- Check port 3000 is available
- Clear node_modules and reinstall

### Firebase connection fails
- Verify project ID is correct
- Check service account key
- Verify Firestore is enabled
- Check security rules

### AI assignment fails
- Verify Groq API key
- Check internet connection
- Review AI service logs
- Fallback should still work

### Authentication fails
- Verify Firebase Auth enabled
- Check email/password provider
- Verify user exists in Firestore
- Check token verification

---

**Need help? Review the documentation files!**
