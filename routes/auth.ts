import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { db } from "../config/db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const roles = ["admin", "resident", "collector", "purok_leader"] as const;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function createToken(user: { id: number; role: string; email: string }) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || "change-me",
    { expiresIn: "12h" },
  );
}

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const [rows] = await db.query<any[]>(
      `SELECT id, purok_id, full_name, email, password_hash, role, status
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    const user = rows[0];

    if (
      !user ||
      user.status !== "active" ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res
        .status(401)
        .json({ message: "Incorrect email or password." });
    }

    const token = createToken(user);

    delete user.password_hash;

    return res.json({
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to login. Check the database connection.",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = roles.includes(req.body.role)
      ? req.body.role
      : "resident";
    const purokId = req.body.purokId || null;

    if (!fullName || !email || password.length < 8) {
      return res.status(400).json({
        message:
          "Full name, valid email, and password of at least 8 characters are required.",
      });
    }

    const hash = await bcrypt.hash(password, 12);

    const [result] = await db.execute<any>(
      `INSERT INTO users (purok_id, full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [purokId, fullName, email, hash, role],
    );

    return res.status(201).json({
      message: "Registration successful.",
      userId: result.insertId,
    });
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Email is already registered.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to register user.",
    });
  }
});

router.post("/google", async (req, res) => {
  try {
    const credential = String(req.body.credential || "").trim();
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      return res.status(500).json({
        message: "Google login is not configured on the server.",
      });
    }

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({
        message: "Google account email could not be verified.",
      });
    }

    const email = payload.email.trim().toLowerCase();
    const fullName =
      String(payload.name || "").trim() ||
      String(payload.given_name || "").trim() ||
      email.split("@")[0];

    const [existingRows] = await db.query<any[]>(
      `SELECT id, purok_id, full_name, email, role, status, phone, address, created_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    let user = existingRows[0];

    if (user) {
      if (user.status !== "active") {
        return res.status(403).json({
          message:
            "This account is currently inactive. Please contact the administrator.",
        });
      }
    } else {
      /*
       * The users table currently requires password_hash.
       * Google users do not use this password, so a secure random value is
       * generated and hashed before insertion.
       */
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      try {
        const [insertResult] = await db.execute<any>(
          `INSERT INTO users (
             purok_id,
             full_name,
             email,
             password_hash,
             role,
             status
           )
           VALUES (?, ?, ?, ?, ?, ?)`,
          [null, fullName, email, passwordHash, "resident", "active"],
        );

        const [newRows] = await db.query<any[]>(
          `SELECT id, purok_id, full_name, email, role, status, phone, address, created_at
           FROM users
           WHERE id = ?
           LIMIT 1`,
          [insertResult.insertId],
        );

        user = newRows[0];
      } catch (insertError: any) {
        /*
         * Handles two Google login requests arriving at nearly the same time.
         * If another request already created the account, read that account.
         */
        if (insertError?.code !== "ER_DUP_ENTRY") {
          throw insertError;
        }

        const [duplicateRows] = await db.query<any[]>(
          `SELECT id, purok_id, full_name, email, role, status, phone, address, created_at
           FROM users
           WHERE email = ?
           LIMIT 1`,
          [email],
        );

        user = duplicateRows[0];
      }
    }

    if (!user) {
      return res.status(500).json({
        message: "Unable to create or retrieve the Google account.",
      });
    }

    const token = createToken(user);

    return res.json({
      message: existingRows[0]
        ? "Google login successful."
        : "Google account registered successfully.",
      token,
      user,
    });
  } catch (error: any) {
    console.error("Google login error:", error);

    if (
      error?.message?.includes("Wrong recipient") ||
      error?.message?.includes("Invalid token signature") ||
      error?.message?.includes("Token used too late")
    ) {
      return res.status(401).json({
        message: "Invalid or expired Google credential.",
      });
    }

    return res.status(500).json({
      message: "Unable to complete Google login.",
    });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [rows] = await db.query<any[]>(
      `SELECT id, purok_id, full_name, email, role, phone, address, status, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user!.id],
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.json({
      user: rows[0],
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      message: "Unable to load user profile.",
    });
  }
});

export default router;