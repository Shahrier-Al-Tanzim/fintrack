import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Extend Express Request to include our custom user payload
export interface AuthRequest extends Request {
  user?: { userId: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token = '';

  // 1. Check Authorization header first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } 
  // 2. Check query parameter as a fallback (for downloads)
  else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

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