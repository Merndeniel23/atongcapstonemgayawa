import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import { db } from "../config/db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

const roles = ["admin", "resident", "collector", "purok_leader"] as const;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const resend = new Resend(process.env.RESEND_API_KEY);

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
router.put("/update-profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const fullName = String(req.body.fullName || "").trim();
    const phone = String(req.body.phone || "").trim();
    const address = String(req.body.address || "").trim();

    if (!fullName) {
      return res.status(400).json({
        message: "Full name is required.",
      });
    }

    await db.execute(
      `UPDATE users
       SET full_name = ?, phone = ?, address = ?
       WHERE id = ?`,
      [fullName, phone || null, address || null, req.user!.id],
    );

    const [rows] = await db.query<any[]>(
      `SELECT id, purok_id, full_name, email, role, phone, address, status, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user!.id],
    );

    return res.json({
      message: "Profile updated successfully.",
      user: rows[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
});


router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const [rows] = await db.query<any[]>(
      `SELECT id, full_name, email
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({
        message: "No account was found using that email.",
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.execute(
      `DELETE FROM password_resets
       WHERE email = ?`,
      [email],
    );

    await db.execute(
      `INSERT INTO password_resets (email, otp, expires_at)
       VALUES (?, ?, ?)`,
      [email, otp, expiresAt],
    );

    const recipientEmail = email.trim().toLowerCase();

console.log("Sending OTP to:", JSON.stringify(recipientEmail));

const { error } = await resend.emails.send({
  from: "Smart Garbage <onboarding@resend.dev>",
  to: recipientEmail,
  subject: "Smart Garbage Password Reset OTP",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
      <h2>Smart Garbage Password Reset</h2>
      <p>Hello ${user.full_name},</p>
      <p>Your 6-digit password reset OTP is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
        ${otp}
      </div>
      <p>This OTP will expire after 10 minutes.</p>
      <p>If you did not request this reset, ignore this email.</p>
    </div>
  `,
});
    if (error) {
      console.error("Resend email error:", error);

      await db.execute(
        `DELETE FROM password_resets
         WHERE email = ?`,
        [email],
      );

      return res.status(500).json({
        message: "Unable to send the OTP email.",
      });
    }

    return res.json({
      message: "OTP sent successfully. Check your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to process the password reset request.",
    });
  }
});


router.post("/verify-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "A valid email and 6-digit OTP are required.",
      });
    }

    const [rows] = await db.query<any[]>(
      `SELECT id, email, otp, expires_at
       FROM password_resets
       WHERE email = ? AND otp = ?
       ORDER BY id DESC
       LIMIT 1`,
      [email, otp],
    );

    const resetRequest = rows[0];

    if (!resetRequest) {
      return res.status(400).json({
        message: "Incorrect OTP.",
      });
    }

    if (new Date(resetRequest.expires_at).getTime() <= Date.now()) {
      await db.execute(
        `DELETE FROM password_resets
         WHERE email = ?`,
        [email],
      );

      return res.status(400).json({
        message: "The OTP has expired. Request a new one.",
      });
    }

    return res.json({
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      message: "Unable to verify the OTP.",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "");

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "A valid email and 6-digit OTP are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "The new password must contain at least 8 characters.",
      });
    }

    const [resetRows] = await db.query<any[]>(
      `SELECT id, expires_at
       FROM password_resets
       WHERE email = ? AND otp = ?
       ORDER BY id DESC
       LIMIT 1`,
      [email, otp],
    );

    const resetRequest = resetRows[0];

    if (!resetRequest) {
      return res.status(400).json({
        message: "Incorrect OTP.",
      });
    }

    if (new Date(resetRequest.expires_at).getTime() <= Date.now()) {
      await db.execute(
        `DELETE FROM password_resets
         WHERE email = ?`,
        [email],
      );

      return res.status(400).json({
        message: "The OTP has expired. Request a new one.",
      });
    }

    const [userRows] = await db.query<any[]>(
      `SELECT id
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email],
    );

    if (!userRows[0]) {
      return res.status(404).json({
        message: "User account was not found.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.execute(
      `UPDATE users
       SET password_hash = ?
       WHERE email = ?`,
      [passwordHash, email],
    );

    await db.execute(
      `DELETE FROM password_resets
       WHERE email = ?`,
      [email],
    );

    return res.json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset the password.",
    });
  }
});

export default router;