import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import { db } from "../config/db.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";

const router = Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
);

const resend = new Resend(
  process.env.RESEND_API_KEY,
);

function createToken(user: {
  id: number;
  role: string;
  email: string;
  barangay_id?: number | null;
  purok_id?: number | null;
}) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      barangay_id:
        user.barangay_id ?? null,
      purok_id:
        user.purok_id ?? null,
    },
    process.env.JWT_SECRET ||
      "change-me",
    {
      expiresIn: "12h",
    },
  );
}

/**
 * PUBLIC: Load real barangays and puroks for registration.
 */
router.get(
  "/registration-locations",
  async (_req, res) => {
    try {
      const [barangays] =
        await db.query<any[]>(
          `
          SELECT
            id,
            name
          FROM barangays
          WHERE is_active = 1
          ORDER BY name ASC
          `,
        );

      const [puroks] =
        await db.query<any[]>(
          `
          SELECT
            p.id,
            p.barangay_id,
            p.name,
            b.name AS barangay_name
          FROM puroks p
          INNER JOIN barangays b
            ON b.id = p.barangay_id
          WHERE b.is_active = 1
          ORDER BY
            b.name ASC,
            p.name ASC
          `,
        );

      return res.json({
        success: true,
        barangays,
        puroks,
      });
    } catch (error) {
      console.error(
        "Registration locations error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load registration locations.",
      });
    }
  },
);

router.post(
  "/login",
  async (req, res) => {
    try {
      const email = String(
        req.body.email || "",
      )
        .trim()
        .toLowerCase();

      const password = String(
        req.body.password || "",
      );

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required.",
        });
      }

      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            u.id,
            u.barangay_id,
            u.purok_id,
            u.full_name,
            u.email,
            u.password_hash,
            u.role,
            u.phone,
            u.address,
            u.status,
            u.must_change_password,
            b.name AS barangay_name,
            p.name AS purok_name
          FROM users u
          LEFT JOIN barangays b
            ON b.id = u.barangay_id
          LEFT JOIN puroks p
            ON p.id = u.purok_id
          WHERE u.email = ?
          LIMIT 1
          `,
          [email],
        );

      const user = rows[0];

      if (
        !user ||
        !(await bcrypt.compare(
          password,
          user.password_hash,
        ))
      ) {
        return res.status(401).json({
          message:
            "Incorrect email or password.",
        });
      }

      if (user.status === "pending") {
        return res.status(403).json({
          message:
            "Your account is waiting for Barangay Captain approval.",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          message:
            "This account is inactive. Please contact the Barangay Captain.",
        });
      }

      const token =
        createToken(user);

      delete user.password_hash;

      return res.json({
        message:
          "Login successful.",
        token,
        user,
        mustChangePassword:
          Number(user.must_change_password) === 1,
      });
    } catch (error) {
      console.error(
        "Login error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to login. Check the database connection.",
      });
    }
  },
);

/**
 * PUBLIC REGISTRATION
 *
 * Every new public account is automatically a Civilian:
 * role = resident
 *
 * The real barangay_id is taken from the selected purok.
 */
router.post(
  "/register",
  async (req, res) => {
    try {
      const fullName = String(
        req.body.fullName || "",
      ).trim();

      const email = String(
        req.body.email || "",
      )
        .trim()
        .toLowerCase();

      const password = String(
        req.body.password || "",
      );

      const phone = String(
        req.body.phone || "",
      ).trim();

      const address = String(
        req.body.address || "",
      ).trim();

      const purokId = Number(
        req.body.purokId,
      );

      if (
        !fullName ||
        !email ||
        password.length < 8
      ) {
        return res.status(400).json({
          message:
            "Full name, valid email, and password of at least 8 characters are required.",
        });
      }

      if (!phone || !address) {
        return res.status(400).json({
          message:
            "Phone number and complete address are required.",
        });
      }

      if (
        !Number.isInteger(purokId) ||
        purokId <= 0
      ) {
        return res.status(400).json({
          message:
            "Please select a valid barangay and purok.",
        });
      }

      const [purokRows] =
        await db.query<any[]>(
          `
          SELECT
            p.id,
            p.barangay_id,
            p.name AS purok_name,
            b.name AS barangay_name
          FROM puroks p
          INNER JOIN barangays b
            ON b.id = p.barangay_id
          WHERE p.id = ?
            AND b.is_active = 1
          LIMIT 1
          `,
          [purokId],
        );

      const selectedPurok =
        purokRows[0];

      if (!selectedPurok) {
        return res.status(404).json({
          message:
            "The selected barangay or purok was not found.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12,
        );

      const [result] =
        await db.execute<any>(
          `
          INSERT INTO users
          (
            barangay_id,
            purok_id,
            full_name,
            email,
            password_hash,
            role,
            phone,
            address,
            status
          )
          VALUES
          (
            ?,
            ?,
            ?,
            ?,
            ?,
            'resident',
            ?,
            ?,
            'active'
          )
          `,
          [
            selectedPurok.barangay_id,
            selectedPurok.id,
            fullName,
            email,
            passwordHash,
            phone,
            address,
          ],
        );

      return res.status(201).json({
        message:
          "Civilian account registered successfully.",
        userId: result.insertId,
        assignment: {
          barangay_id:
            selectedPurok.barangay_id,
          barangay_name:
            selectedPurok.barangay_name,
          purok_id:
            selectedPurok.id,
          purok_name:
            selectedPurok.purok_name,
        },
      });
    } catch (error: any) {
      if (
        error?.code ===
        "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({
          message:
            "Email is already registered.",
        });
      }

      console.error(
        "Registration error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to register user.",
      });
    }
  },
);

router.post(
  "/google",
  async (req, res) => {
    try {
      const credential = String(
        req.body.credential || "",
      ).trim();

      const googleClientId =
        process.env.GOOGLE_CLIENT_ID;

      if (!googleClientId) {
        return res.status(500).json({
          message:
            "Google login is not configured on the server.",
        });
      }

      if (!credential) {
        return res.status(400).json({
          message:
            "Google credential is required.",
        });
      }

      const ticket =
        await googleClient.verifyIdToken(
          {
            idToken: credential,
            audience:
              googleClientId,
          },
        );

      const payload =
        ticket.getPayload();

      if (
        !payload?.email ||
        !payload.email_verified
      ) {
        return res.status(401).json({
          message:
            "Google account email could not be verified.",
        });
      }

      const email =
        payload.email
          .trim()
          .toLowerCase();

      const fullName =
        String(
          payload.name || "",
        ).trim() ||
        String(
          payload.given_name || "",
        ).trim() ||
        email.split("@")[0];

      const [existingRows] =
        await db.query<any[]>(
          `
          SELECT
            u.id,
            u.barangay_id,
            u.purok_id,
            u.full_name,
            u.email,
            u.role,
            u.status,
            u.phone,
            u.address,
            u.must_change_password,
            u.created_at,
            b.name AS barangay_name,
            p.name AS purok_name
          FROM users u
          LEFT JOIN barangays b
            ON b.id = u.barangay_id
          LEFT JOIN puroks p
            ON p.id = u.purok_id
          WHERE u.email = ?
          LIMIT 1
          `,
          [email],
        );

      let user =
        existingRows[0];

      if (user) {
        if (
          user.status !== "active"
        ) {
          return res
            .status(403)
            .json({
              message:
                "This account is currently inactive. Please contact the Barangay Captain.",
            });
        }
      } else {
        /*
         * Google-created Civilian accounts have no location yet.
         * The frontend should ask the user to complete barangay,
         * purok, phone, and address before using location-based features.
         */
        const randomPassword =
          crypto
            .randomBytes(32)
            .toString("hex");

        const passwordHash =
          await bcrypt.hash(
            randomPassword,
            12,
          );

        try {
          const [insertResult] =
            await db.execute<any>(
              `
              INSERT INTO users
              (
                barangay_id,
                purok_id,
                full_name,
                email,
                password_hash,
                role,
                status
              )
              VALUES
              (
                NULL,
                NULL,
                ?,
                ?,
                ?,
                'resident',
                'active'
              )
              `,
              [
                fullName,
                email,
                passwordHash,
              ],
            );

          const [newRows] =
            await db.query<any[]>(
              `
              SELECT
                id,
                barangay_id,
                purok_id,
                full_name,
                email,
                role,
                status,
                phone,
                address,
                must_change_password,
                created_at
              FROM users
              WHERE id = ?
              LIMIT 1
              `,
              [
                insertResult.insertId,
              ],
            );

          user = newRows[0];
        } catch (
          insertError: any
        ) {
          if (
            insertError?.code !==
            "ER_DUP_ENTRY"
          ) {
            throw insertError;
          }

          const [duplicateRows] =
            await db.query<any[]>(
              `
              SELECT
                id,
                barangay_id,
                purok_id,
                full_name,
                email,
                role,
                status,
                phone,
                address,
                must_change_password,
                created_at
              FROM users
              WHERE email = ?
              LIMIT 1
              `,
              [email],
            );

          user =
            duplicateRows[0];
        }
      }

      if (!user) {
        return res.status(500).json({
          message:
            "Unable to create or retrieve the Google account.",
        });
      }

      const token =
        createToken(user);

      return res.json({
        message: existingRows[0]
          ? "Google login successful."
          : "Google Civilian account created. Complete your barangay and purok assignment before using location-based features.",
        token,
        user,
        needsLocationSetup:
          !user.barangay_id ||
          !user.purok_id,
        mustChangePassword:
          Number(user.must_change_password) === 1,
      });
    } catch (error: any) {
      console.error(
        "Google login error:",
        error,
      );

      if (
        error?.message?.includes(
          "Wrong recipient",
        ) ||
        error?.message?.includes(
          "Invalid token signature",
        ) ||
        error?.message?.includes(
          "Token used too late",
        )
      ) {
        return res.status(401).json({
          message:
            "Invalid or expired Google credential.",
        });
      }

      return res.status(500).json({
        message:
          "Unable to complete Google login.",
      });
    }
  },
);

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthRequest,
    res,
  ) => {
    try {
      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            u.id,
            u.barangay_id,
            b.name AS barangay_name,
            u.purok_id,
            p.name AS purok_name,
            u.full_name,
            u.email,
            u.role,
            u.phone,
            u.address,
            u.status,
            u.must_change_password,
            u.created_at
          FROM users u
          LEFT JOIN barangays b
            ON b.id = u.barangay_id
          LEFT JOIN puroks p
            ON p.id = u.purok_id
          WHERE u.id = ?
          LIMIT 1
          `,
          [req.user!.id],
        );

      if (!rows[0]) {
        return res.status(404).json({
          message:
            "User not found.",
        });
      }

      return res.json({
        success: true,
        user: rows[0],
      });
    } catch (error) {
      console.error(
        "Profile error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to load user profile.",
      });
    }
  },
);

router.put(
  "/update-profile",
  requireAuth,
  async (
    req: AuthRequest,
    res,
  ) => {
    try {
      const fullName = String(
        req.body.fullName || "",
      ).trim();

      const phone = String(
        req.body.phone || "",
      ).trim();

      const submittedAddress =
        String(
          req.body.address || "",
        ).trim();

      if (!fullName) {
        return res.status(400).json({
          message:
            "Full name is required.",
        });
      }

      const [currentRows] =
        await db.query<any[]>(
          `
          SELECT
            role,
            address
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [req.user!.id],
        );

      const currentUser =
        currentRows[0];

      if (!currentUser) {
        return res.status(404).json({
          message:
            "User not found.",
        });
      }

      /*
       * Civilian location/address is locked after registration.
       * It should be changed through an approved correction request.
       */
      const finalAddress =
        currentUser.role ===
        "resident"
          ? currentUser.address
          : submittedAddress ||
            currentUser.address;

      await db.execute(
        `
        UPDATE users
        SET
          full_name = ?,
          phone = ?,
          address = ?
        WHERE id = ?
        `,
        [
          fullName,
          phone || null,
          finalAddress || null,
          req.user!.id,
        ],
      );

      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            u.id,
            u.barangay_id,
            b.name AS barangay_name,
            u.purok_id,
            p.name AS purok_name,
            u.full_name,
            u.email,
            u.role,
            u.phone,
            u.address,
            u.status,
            u.created_at
          FROM users u
          LEFT JOIN barangays b
            ON b.id = u.barangay_id
          LEFT JOIN puroks p
            ON p.id = u.purok_id
          WHERE u.id = ?
          LIMIT 1
          `,
          [req.user!.id],
        );

      return res.json({
        message:
          "Profile updated successfully.",
        user: rows[0],
      });
    } catch (error) {
      console.error(
        "Update profile error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to update profile.",
      });
    }
  },
);

router.post(
  "/change-initial-password",
  requireAuth,
  async (
    req: AuthRequest,
    res,
  ) => {
    try {
      const currentPassword = String(
        req.body.currentPassword ||
          req.body.temporaryPassword ||
          "",
      );

      const newPassword = String(
        req.body.newPassword || "",
      );

      const confirmPassword = String(
        req.body.confirmPassword ||
          req.body.passwordConfirmation ||
          "",
      );

      if (!currentPassword) {
        return res.status(400).json({
          message:
            "The temporary password is required.",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          message:
            "The new password must contain at least 8 characters.",
        });
      }

      if (
        confirmPassword &&
        newPassword !== confirmPassword
      ) {
        return res.status(400).json({
          message:
            "The new passwords do not match.",
        });
      }

      if (
        currentPassword === newPassword
      ) {
        return res.status(400).json({
          message:
            "Choose a password different from the temporary password.",
        });
      }

      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            id,
            password_hash,
            must_change_password,
            status
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [req.user!.id],
        );

      const user = rows[0];

      if (!user) {
        return res.status(404).json({
          message:
            "User account was not found.",
        });
      }

      if (user.status !== "active") {
        return res.status(403).json({
          message:
            "This account is inactive.",
        });
      }

      if (
        Number(
          user.must_change_password,
        ) !== 1
      ) {
        return res.status(409).json({
          message:
            "This account no longer requires an initial password change.",
        });
      }

      const passwordMatches =
        await bcrypt.compare(
          currentPassword,
          user.password_hash,
        );

      if (!passwordMatches) {
        return res.status(401).json({
          message:
            "The temporary password is incorrect.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12,
        );

      await db.execute(
        `
        UPDATE users
        SET
          password_hash = ?,
          must_change_password = 0
        WHERE id = ?
        `,
        [
          passwordHash,
          req.user!.id,
        ],
      );

      return res.json({
        success: true,
        message:
          "Password changed successfully. You can now continue to your dashboard.",
        mustChangePassword: false,
      });
    } catch (error) {
      console.error(
        "Initial password change error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to change the temporary password.",
      });
    }
  },
);

router.post(
  "/forgot-password",
  async (req, res) => {
    try {
      const email = String(
        req.body.email || "",
      )
        .trim()
        .toLowerCase();

      if (!email) {
        return res.status(400).json({
          message:
            "Email is required.",
        });
      }

      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            id,
            full_name,
            email
          FROM users
          WHERE email = ?
          LIMIT 1
          `,
          [email],
        );

      const user = rows[0];

      if (!user) {
        return res.status(404).json({
          message:
            "No account was found using that email.",
        });
      }

      const otp = String(
        crypto.randomInt(
          100000,
          1000000,
        ),
      );

      const expiresAt =
        new Date(
          Date.now() +
            10 * 60 * 1000,
        );

      await db.execute(
        `
        DELETE FROM password_resets
        WHERE email = ?
        `,
        [email],
      );

      await db.execute(
        `
        INSERT INTO password_resets
        (
          email,
          otp,
          expires_at
        )
        VALUES (?, ?, ?)
        `,
        [
          email,
          otp,
          expiresAt,
        ],
      );

      const recipientEmail =
        email
          .trim()
          .toLowerCase();

      console.log(
        "Sending OTP to:",
        JSON.stringify(
          recipientEmail,
        ),
      );

      const { error } =
        await resend.emails.send(
          {
            from:
              "Smart Garbage <onboarding@resend.dev>",
            to: recipientEmail,
            subject:
              "Smart Garbage Password Reset OTP",
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
          },
        );

      if (error) {
        console.error(
          "Resend email error:",
          error,
        );

        await db.execute(
          `
          DELETE FROM password_resets
          WHERE email = ?
          `,
          [email],
        );

        return res.status(500).json({
          message:
            "Unable to send the OTP email.",
        });
      }

      return res.json({
        message:
          "OTP sent successfully. Check your email.",
      });
    } catch (error) {
      console.error(
        "Forgot password error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to process the password reset request.",
      });
    }
  },
);

router.post(
  "/verify-otp",
  async (req, res) => {
    try {
      const email = String(
        req.body.email || "",
      )
        .trim()
        .toLowerCase();

      const otp = String(
        req.body.otp || "",
      ).trim();

      if (
        !email ||
        !/^\d{6}$/.test(otp)
      ) {
        return res.status(400).json({
          message:
            "A valid email and 6-digit OTP are required.",
        });
      }

      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            id,
            email,
            otp,
            expires_at
          FROM password_resets
          WHERE email = ?
            AND otp = ?
          ORDER BY id DESC
          LIMIT 1
          `,
          [email, otp],
        );

      const resetRequest =
        rows[0];

      if (!resetRequest) {
        return res.status(400).json({
          message:
            "Incorrect OTP.",
        });
      }

      if (
        new Date(
          resetRequest.expires_at,
        ).getTime() <= Date.now()
      ) {
        await db.execute(
          `
          DELETE FROM password_resets
          WHERE email = ?
          `,
          [email],
        );

        return res.status(400).json({
          message:
            "The OTP has expired. Request a new one.",
        });
      }

      return res.json({
        message:
          "OTP verified successfully.",
      });
    } catch (error) {
      console.error(
        "Verify OTP error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to verify the OTP.",
      });
    }
  },
);

router.post(
  "/reset-password",
  async (req, res) => {
    try {
      const email = String(
        req.body.email || "",
      )
        .trim()
        .toLowerCase();

      const otp = String(
        req.body.otp || "",
      ).trim();

      const newPassword =
        String(
          req.body.newPassword ||
            "",
        );

      if (
        !email ||
        !/^\d{6}$/.test(otp)
      ) {
        return res.status(400).json({
          message:
            "A valid email and 6-digit OTP are required.",
        });
      }

      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          message:
            "The new password must contain at least 8 characters.",
        });
      }

      const [resetRows] =
        await db.query<any[]>(
          `
          SELECT
            id,
            expires_at
          FROM password_resets
          WHERE email = ?
            AND otp = ?
          ORDER BY id DESC
          LIMIT 1
          `,
          [email, otp],
        );

      const resetRequest =
        resetRows[0];

      if (!resetRequest) {
        return res.status(400).json({
          message:
            "Incorrect OTP.",
        });
      }

      if (
        new Date(
          resetRequest.expires_at,
        ).getTime() <= Date.now()
      ) {
        await db.execute(
          `
          DELETE FROM password_resets
          WHERE email = ?
          `,
          [email],
        );

        return res.status(400).json({
          message:
            "The OTP has expired. Request a new one.",
        });
      }

      const [userRows] =
        await db.query<any[]>(
          `
          SELECT id
          FROM users
          WHERE email = ?
          LIMIT 1
          `,
          [email],
        );

      if (!userRows[0]) {
        return res.status(404).json({
          message:
            "User account was not found.",
        });
      }

      const passwordHash =
        await bcrypt.hash(
          newPassword,
          12,
        );

      await db.execute(
        `
        UPDATE users
        SET
          password_hash = ?,
          must_change_password = 0
        WHERE email = ?
        `,
        [
          passwordHash,
          email,
        ],
      );

      await db.execute(
        `
        DELETE FROM password_resets
        WHERE email = ?
        `,
        [email],
      );

      return res.json({
        message:
          "Password reset successfully. You can now log in.",
      });
    } catch (error) {
      console.error(
        "Reset password error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to reset the password.",
      });
    }
  },
);

/*
 * These older collector-verification endpoints are kept for compatibility.
 * New public registrations are Civilian accounts, while the Barangay Captain
 * promotes users through /api/admin/users/:id/role.
 */
router.get(
  "/admin/pending-collectors",
  requireAuth,
  async (
    req: AuthRequest,
    res,
  ) => {
    try {
      if (
        req.user?.role !== "admin"
      ) {
        return res.status(403).json({
          message:
            "Barangay Captain access is required.",
        });
      }

      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            id,
            barangay_id,
            purok_id,
            full_name,
            email,
            phone,
            address,
            status,
            created_at
          FROM users
          WHERE role = 'collector'
            AND status = 'pending'
          ORDER BY
            created_at DESC,
            id DESC
          `,
        );

      return res.json({
        collectors: rows,
      });
    } catch (error) {
      console.error(
        "Pending collectors error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to load pending collector registrations.",
      });
    }
  },
);

router.patch(
  "/admin/collectors/:id/verification",
  requireAuth,
  async (
    req: AuthRequest,
    res,
  ) => {
    try {
      if (
        req.user?.role !== "admin"
      ) {
        return res.status(403).json({
          message:
            "Barangay Captain access is required.",
        });
      }

      const collectorId =
        Number(req.params.id);

      const action = String(
        req.body.action || "",
      )
        .trim()
        .toLowerCase();

      if (
        !Number.isInteger(
          collectorId,
        ) ||
        collectorId <= 0
      ) {
        return res.status(400).json({
          message:
            "A valid collector ID is required.",
        });
      }

      if (
        action !== "approve" &&
        action !== "reject"
      ) {
        return res.status(400).json({
          message:
            "Action must be approve or reject.",
        });
      }

      const [rows] =
        await db.query<any[]>(
          `
          SELECT
            id,
            full_name,
            email,
            role,
            status
          FROM users
          WHERE id = ?
            AND role = 'collector'
          LIMIT 1
          `,
          [collectorId],
        );

      const collector =
        rows[0];

      if (!collector) {
        return res.status(404).json({
          message:
            "Collector account was not found.",
        });
      }

      if (
        collector.status !==
        "pending"
      ) {
        return res.status(409).json({
          message:
            "This collector account has already been reviewed.",
        });
      }

      const nextStatus =
        action === "approve"
          ? "active"
          : "inactive";

      await db.execute(
        `
        UPDATE users
        SET status = ?
        WHERE id = ?
          AND role = 'collector'
        `,
        [
          nextStatus,
          collectorId,
        ],
      );

      return res.json({
        message:
          action === "approve"
            ? "Garbage Collector account approved successfully."
            : "Garbage Collector account rejected successfully.",
        collector: {
          ...collector,
          status: nextStatus,
        },
      });
    } catch (error) {
      console.error(
        "Collector verification error:",
        error,
      );

      return res.status(500).json({
        message:
          "Unable to review the Garbage Collector account.",
      });
    }
  },
);

export default router;