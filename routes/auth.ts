import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();
const roles = ["admin", "resident", "collector", "purok_leader"];

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const [rows] = await db.query<any[]>(
      `SELECT id, purok_id, full_name, email, password_hash, role, status
       FROM users WHERE email = ? LIMIT 1`, [email]
    );
    const user = rows[0];
    if (!user || user.status !== "active" || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "change-me",
      { expiresIn: "12h" }
    );
    delete user.password_hash;
    res.json({ message: "Login successful.", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to login. Check the database connection." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = roles.includes(req.body.role) ? req.body.role : "resident";
    const purokId = req.body.purokId || null;
    if (!fullName || !email || password.length < 8) {
      return res.status(400).json({ message: "Full name, valid email, and password of at least 8 characters are required." });
    }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute<any>(
      `INSERT INTO users (purok_id, full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`, [purokId, fullName, email, hash, role]
    );
    res.status(201).json({ message: "Registration successful.", userId: result.insertId });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Email is already registered." });
    console.error(error);
    res.status(500).json({ message: "Unable to register user." });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [rows] = await db.query<any[]>(
    `SELECT id, purok_id, full_name, email, role, phone, address, status, created_at
     FROM users WHERE id = ? LIMIT 1`, [req.user!.id]
  );
  if (!rows[0]) return res.status(404).json({ message: "User not found." });
  res.json({ user: rows[0] });
});

export default router;
