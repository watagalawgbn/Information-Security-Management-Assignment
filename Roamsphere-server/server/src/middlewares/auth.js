import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

/**
 * Authentication middleware
 * Validates JWT token and sets user data in request
 */
export async function Auth(req, res, next) {
  try {
    // Check if authorization header exists
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "No authorization header provided" });
    }

    // Extract token from "Bearer <token>" format
    const authHeader = req.headers.authorization;
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Invalid authorization format. Use 'Bearer <token>'" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optional: Verify user still exists in database
    const [userRows] = await pool.query(
      'SELECT user_id, email, role_name FROM SystemUser WHERE user_id = ?',
      [decodedToken.userId || decodedToken.user_id]
    );

    if (userRows.length === 0) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    // Set user data in request for use in routes
    req.user = {
      userId: decodedToken.userId || decodedToken.user_id,
      email: decodedToken.email || userRows[0].email,
      role: decodedToken.role || userRows[0].role_name,
      ...decodedToken
    };

    console.log("Authenticated user:", req.user);
    next();

  } catch (error) {
    console.error("Authentication error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    } else {
      return res.status(401).json({ error: "Authentication Failed!" });
    }
  }
}

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // If no roles specified, just require authentication
      if (allowedRoles.length === 0) {
        return next();
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: "Access denied. Insufficient permissions.",
          required: allowedRoles,
          current: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(403).json({ error: "Authorization failed" });
    }
  };
}

export default Auth;
