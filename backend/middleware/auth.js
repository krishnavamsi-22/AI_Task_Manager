const { auth, db } = require('../config/firebase');
const { AppError } = require('../middlewares/errorHandler');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      throw new AppError('User not found', 401);
    }

    req.user = { uid: decodedToken.uid, ...userDoc.data() };
    next();
  } catch (error) {
    next(new AppError('Invalid or expired token', 401));
  }
};

const isManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return next(new AppError('Manager access required', 403));
  }
  next();
};

const isEmployee = (req, res, next) => {
  if (req.user.role !== 'employee') {
    return next(new AppError('Employee access required', 403));
  }
  next();
};

module.exports = { authMiddleware, isManager, isEmployee };
