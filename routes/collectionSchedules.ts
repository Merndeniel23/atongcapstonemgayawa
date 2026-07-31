import { Router } from "express";
import { db } from "../config/db.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

const router = Router();

/**
 * CREATE TABLE AUTOMATICALLY
 */
async function prepareScheduleTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS barangay_collection_schedules (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      barangay_id INT UNSIGNED NOT NULL,
      day_of_week ENUM(
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ) NOT NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      notes VARCHAR(255) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_by INT UNSIGNED NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

      UNIQUE KEY unique_barangay_day (
        barangay_id,
        day_of_week
      )
    )
  `);
}

/**
 * Prepare table before using routes.
 */
router.use(async (_req, res, next) => {
  try {
    await prepareScheduleTable();
    next();
  } catch (error) {
    console.error(
      "Collection schedule table error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to prepare collection schedule table.",
    });
  }
});

/**
 * GET ALL COLLECTION SCHEDULES
 */
router.get(
  "/",
  requireAuth,
  async (_req: AuthRequest, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          schedule.id,
          schedule.barangay_id,
          barangay.name AS barangay_name,
          schedule.day_of_week,
          schedule.start_time,
          schedule.end_time,
          schedule.notes,
          schedule.is_active

        FROM barangay_collection_schedules schedule

        INNER JOIN barangays barangay
          ON barangay.id = schedule.barangay_id

        ORDER BY
          FIELD(
            schedule.day_of_week,
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
          ),
          barangay.name ASC
      `);

      return res.json({
        success: true,
        schedules: rows,
      });
    } catch (error) {
      console.error(
        "Load collection schedules error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load collection schedules.",
      });
    }
  },
);

/**
 * ADD OR UPDATE COLLECTION SCHEDULE
 */
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Administrator access required.",
        });
      }

      const {
        barangay_id,
        day_of_week,
        start_time,
        end_time,
        notes,
      } = req.body;

      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      if (
        !barangay_id ||
        !validDays.includes(day_of_week)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Barangay and collection day are required.",
        });
      }

      await db.query(
        `
        INSERT INTO barangay_collection_schedules
        (
          barangay_id,
          day_of_week,
          start_time,
          end_time,
          notes,
          is_active,
          created_by
        )
        VALUES (?, ?, ?, ?, ?, 1, ?)

        ON DUPLICATE KEY UPDATE
          start_time = VALUES(start_time),
          end_time = VALUES(end_time),
          notes = VALUES(notes),
          is_active = 1,
          created_by = VALUES(created_by)
        `,
        [
          barangay_id,
          day_of_week,
          start_time || null,
          end_time || null,
          notes?.trim() || null,
          req.user.id,
        ],
      );

      return res.status(201).json({
        success: true,
        message:
          "Collection schedule saved successfully.",
      });
    } catch (error) {
      console.error(
        "Save collection schedule error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save collection schedule.",
      });
    }
  },
);

/**
 * DELETE COLLECTION SCHEDULE
 */
router.delete(
  "/:id",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Administrator access required.",
        });
      }

      const scheduleId = Number(
        req.params.id,
      );

      if (
        !Number.isInteger(scheduleId) ||
        scheduleId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid collection schedule ID.",
        });
      }

      const [result]: any =
        await db.query(
          `
          DELETE FROM barangay_collection_schedules
          WHERE id = ?
          `,
          [scheduleId],
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message:
            "Collection schedule not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Collection schedule deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete collection schedule error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete collection schedule.",
      });
    }
  },
);

export default router;