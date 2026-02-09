import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

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
    
    // Store user data in request for use in routes
    req.data = decodedToken;
    req.user = decodedToken; // For compatibility
    
    console.log("Authenticated user:", decodedToken);
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

export async function IsSuperAdmin(req, res, next) {
  try {
    const { id } = req.data;
    const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
    
    if (!rows.length) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    if (rows[0].role_name !== "super-admin") {
      return res.status(403).json({ 
        msg: "Access denied. Super admin privileges required.",
        required: "super-admin",
        current: rows[0].role_name
      });
    }
    
    next();
  } catch (error) {
    console.error("Super admin check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function IsAdmin(req, res, next) {
  try {
    const { id } = req.data;
    const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
    
    if (!rows.length) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const userRole = rows[0].role_name;
    if (userRole !== "admin" && userRole !== "super-admin") {
      return res.status(403).json({ 
        msg: "Access denied. Admin privileges required.",
        required: ["admin", "super-admin"],
        current: userRole
      });
    }
    
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function IsTouroperator(req, res, next) {
  try {
    const { id } = req.data;
    const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
    
    if (!rows.length) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const userRole = rows[0].role_name;
    if (userRole !== "tour-operator" && userRole !== "admin" && userRole !== "super-admin") {
      return res.status(403).json({ 
        msg: "Access denied. Tour operator privileges required.",
        required: ["tour-operator", "admin", "super-admin"],
        current: userRole
      });
    }
    
    next();
  } catch (error) {
    console.error("Tour operator check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function IsDriver(req, res, next) {
  try {
    const { id } = req.data;
    const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
    
    if (!rows.length) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const userRole = rows[0].role_name;
    if (userRole !== "driver" && userRole !== "admin" && userRole !== "super-admin") {
      return res.status(403).json({ 
        msg: "Access denied. Driver privileges required.",
        required: ["driver", "admin", "super-admin"],
        current: userRole
      });
    }
    
    next();
  } catch (error) {
    console.error("Driver check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function IsAdminOrTourOperator(req, res, next) {
  try {
    const { id } = req.data;
    const [rows] = await pool.query('SELECT role_name FROM SystemUser WHERE user_id = ?', [id]);
    
    if (!rows.length) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const userRole = rows[0].role_name;
    if (userRole !== "admin" && userRole !== "tour-operator" && userRole !== "super-admin") {
      return res.status(403).json({ 
        msg: "Access denied. Admin or Tour Operator privileges required.",
        required: ["admin", "tour-operator", "super-admin"],
        current: userRole
      });
    }
    
    next();
  } catch (error) {
    console.error("Admin or Tour Operator check error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}