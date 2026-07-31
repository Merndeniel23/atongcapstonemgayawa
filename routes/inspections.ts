import express from "express";
import { db } from "../config/db.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";

const router = express.Router();

function normalizeStatus(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function needsCollection(status: string): boolean {
  return ["full", "overflowing", "overflow"].includes(status);
}

// GET all inspections
router.get(
  "/",
  requireAuth,
  async (_req: AuthRequest, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          bi.id,
          bi.bin_id,
          gb.bin_code,
          gb.location_name,
          gb.latitude,
          gb.longitude,
          gb.purok_id,
          u.full_name AS inspector,
          bi.status,
          bi.estimated_fill_level,
          bi.remarks,
          bi.photo_path,
          bi.inspected_at
        FROM bin_inspections bi
        LEFT JOIN garbage_bins gb
          ON bi.bin_id = gb.id
        LEFT JOIN users u
          ON bi.purok_leader_id = u.id
        ORDER BY bi.inspected_at DESC
      `);

      return res.json(rows);
    } catch (error) {
      console.error("Load inspections error:", error);

      return res.status(500).json({
        message: "Failed to load inspections.",
      });
    }
  },
);

// ADD inspection
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    const connection = await db.getConnection();

    try {
      const binId = Number(req.body.bin_id);
      const status = normalizeStatus(req.body.status);
      const estimatedFillLevel = Number(
        req.body.estimated_fill_level ?? 0,
      );
      const remarks = String(req.body.remarks || "").trim();
      const photoPath = req.body.photo_path || null;
      const leaderId = req.user?.id;

      if (!Number.isInteger(binId) || binId <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid garbage bin is required.",
        });
      }

      if (!leaderId) {
        return res.status(401).json({
          success: false,
          message: "Authenticated Purok Leader is required.",
        });
      }

      const [binRows] = await connection.query<any[]>(
        `
        SELECT id, purok_id, bin_code, location_name
        FROM garbage_bins
        WHERE id = ?
          AND is_active = 1
        LIMIT 1
        `,
        [binId],
      );

      const bin = binRows[0];

      if (!bin) {
        return res.status(404).json({
          success: false,
          message: "Garbage bin was not found.",
        });
      }

      if (
        (req.user?.role === "purok_leader" ||
          req.user?.role === "leader") &&
        Number(req.user.purok_id) !== Number(bin.purok_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can inspect only bins in your assigned purok.",
        });
      }

      await connection.beginTransaction();

      const [inspectionResult]: any =
        await connection.execute(
          `
          INSERT INTO bin_inspections (
            bin_id,
            purok_leader_id,
            status,
            estimated_fill_level,
            remarks,
            photo_path
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            binId,
            leaderId,
            status,
            estimatedFillLevel,
            remarks || null,
            photoPath,
          ],
        );

      await connection.execute(
        `
        UPDATE garbage_bins
        SET
          current_status = ?,
          last_inspected_at = NOW()
        WHERE id = ?
        `,
        [status, binId],
      );

      let collectionRequestCreated = false;

      if (needsCollection(status)) {
        const [existingRows] =
          await connection.query<any[]>(
            `
            SELECT id
            FROM collection_requests
            WHERE bin_id = ?
              AND status IN (
                'pending',
                'approved',
                'assigned',
                'in_progress'
              )
            LIMIT 1
            `,
            [binId],
          );

        if (!existingRows[0]) {
          const priority =
            status === "overflowing" || status === "overflow"
              ? "urgent"
              : "high";

          await connection.execute(
            `
            INSERT INTO collection_requests (
              bin_id,
              inspection_id,
              requested_by,
              priority,
              status,
              reason,
              requested_at
            )
            VALUES (?, ?, ?, ?, 'pending', ?, NOW())
            `,
            [
              binId,
              inspectionResult.insertId,
              leaderId,
              priority,
              remarks ||
                `Automatic request: ${status.replaceAll(
                  "_",
                  " ",
                )} garbage bin.`,
            ],
          );

          collectionRequestCreated = true;
        }
      }

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: collectionRequestCreated
          ? "Inspection saved and collection request created automatically."
          : "Inspection saved successfully.",
        inspectionId: inspectionResult.insertId,
        collectionRequestCreated,
      });
    } catch (error) {
      await connection.rollback();

      console.error("Save inspection error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to save inspection.",
      });
    } finally {
      connection.release();
    }
  },
);

export default router;