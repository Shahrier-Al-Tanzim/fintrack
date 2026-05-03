import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Extend Express Request to include our custom user payload
export interface AuthRequest extends Request {
  user?: { userId: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  // 1. Check if the header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  // 2. Extract the token
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verify the token using the secret
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // 4. Attach the decoded user ID to the request object
    req.user = decoded; 
    
    // 5. Pass control to the next function (the controller)
    next(); 
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};