import { Router } from "express";
import { db } from "../config/db.js";
import {
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";

const router = Router();

const allowedStatuses = [
  "pending",
  "approved",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

type CollectionStatus =
  (typeof allowedStatuses)[number];

function canViewRequests(role?: string): boolean {
  return (
    role === "admin" ||
    role === "collector" ||
    role === "purok_leader" ||
    role === "leader"
  );
}

/**
 * GET /api/collection-requests
 *
 * Admin:
 * - sees all requests
 *
 * Collector:
 * - sees unassigned requests and requests assigned to them
 *
 * Purok Leader:
 * - sees requests from bins inside their assigned purok
 */
router.get(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      if (!canViewRequests(req.user?.role)) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to view collection requests.",
        });
      }

      let sql = `
        SELECT
          cr.id,
          cr.bin_id,
          cr.inspection_id,
          cr.requested_by,
          cr.priority,
          cr.status,
          cr.reason,
          cr.assigned_collector_id,
          cr.requested_at,
          cr.completed_at,
          cr.created_at,

          gb.bin_code,
          gb.location_name,
          gb.latitude,
          gb.longitude,
          gb.current_status,
          gb.condition_status,
          gb.purok_id,

          p.name AS purok_name,
          b.name AS barangay_name,

          requester.full_name AS requested_by_name,
          collector.full_name AS assigned_collector_name

        FROM collection_requests cr

        INNER JOIN garbage_bins gb
          ON gb.id = cr.bin_id

        LEFT JOIN puroks p
          ON p.id = gb.purok_id

        LEFT JOIN barangays b
          ON b.id = p.barangay_id

        LEFT JOIN users requester
          ON requester.id = cr.requested_by

        LEFT JOIN users collector
          ON collector.id = cr.assigned_collector_id
      `;

      const params: number[] = [];

      if (req.user?.role === "collector") {
        sql += `
          WHERE
            cr.assigned_collector_id IS NULL
            OR cr.assigned_collector_id = ?
        `;
        params.push(req.user.id);
      } else if (
        req.user?.role === "purok_leader" ||
        req.user?.role === "leader"
      ) {
        if (!req.user.purok_id) {
          return res.status(400).json({
            success: false,
            message:
              "Your Purok Leader account has no assigned purok.",
          });
        }

        sql += `
          WHERE gb.purok_id = ?
        `;
        params.push(req.user.purok_id);
      }

      sql += `
        ORDER BY
          FIELD(
            cr.priority,
            'urgent',
            'high',
            'normal',
            'low'
          ),
          cr.requested_at DESC,
          cr.id DESC
      `;

      const [rows] = await db.query<any[]>(
        sql,
        params,
      );

      return res.json({
        success: true,
        requests: rows,
      });
    } catch (error) {
      console.error(
        "Load collection requests error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load collection requests.",
      });
    }
  },
);

/**
 * POST /api/collection-requests
 *
 * Used by a Purok Leader or resident to create a request.
 * Body:
 * {
 *   bin_id,
 *   inspection_id?,
 *   priority?,
 *   reason?
 * }
 */
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const binId = Number(req.body.bin_id);
      const inspectionId =
        req.body.inspection_id === null ||
        req.body.inspection_id === undefined ||
        req.body.inspection_id === ""
          ? null
          : Number(req.body.inspection_id);

      const priority = String(
        req.body.priority || "normal",
      ).toLowerCase();

      const reason = String(
        req.body.reason || "",
      ).trim();

      if (
        !Number.isInteger(binId) ||
        binId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid garbage bin is required.",
        });
      }

      if (
        !["low", "normal", "high", "urgent"].includes(
          priority,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Priority must be low, normal, high, or urgent.",
        });
      }

      const [binRows] = await db.query<any[]>(
        `
        SELECT id, purok_id
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
          message:
            "Garbage bin was not found.",
        });
      }

      if (
        (req.user?.role === "purok_leader" ||
          req.user?.role === "leader") &&
        Number(req.user.purok_id) !==
          Number(bin.purok_id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can request collection only for bins in your assigned purok.",
        });
      }

      const [result]: any =
        await db.execute(
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
            inspectionId,
            req.user!.id,
            priority,
            reason || null,
          ],
        );

      return res.status(201).json({
        success: true,
        message:
          "Collection request created successfully.",
        requestId: result.insertId,
      });
    } catch (error) {
      console.error(
        "Create collection request error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to create collection request.",
      });
    }
  },
);

/**
 * PATCH /api/collection-requests/:id/status
 *
 * Collector:
 * - assigned
 * - in_progress
 * - completed
 *
 * Admin:
 * - any allowed status
 */
router.patch(
  "/:id/status",
  requireAuth,
  async (req: AuthRequest, res) => {
    try {
      const requestId = Number(req.params.id);
      const nextStatus = String(
        req.body.status || "",
      ).toLowerCase() as CollectionStatus;

      if (
        !Number.isInteger(requestId) ||
        requestId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "A valid collection request ID is required.",
        });
      }

      if (
        !allowedStatuses.includes(nextStatus)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid collection request status.",
        });
      }

      if (
        req.user?.role !== "admin" &&
        req.user?.role !== "collector"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only collectors and administrators can update request status.",
        });
      }

      const [requestRows] =
        await db.query<any[]>(
          `
          SELECT
            id,
            status,
            assigned_collector_id
          FROM collection_requests
          WHERE id = ?
          LIMIT 1
          `,
          [requestId],
        );

      const request = requestRows[0];

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "Collection request was not found.",
        });
      }

      if (
        req.user.role === "collector" &&
        request.assigned_collector_id &&
        Number(request.assigned_collector_id) !==
          Number(req.user.id)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This collection request is assigned to another collector.",
        });
      }

      const assignedCollectorId =
        req.user.role === "collector"
          ? req.user.id
          : request.assigned_collector_id;

      const completedAt =
        nextStatus === "completed"
          ? new Date()
          : null;

      await db.execute(
        `
        UPDATE collection_requests
        SET
          status = ?,
          assigned_collector_id = ?,
          completed_at = ?
        WHERE id = ?
        `,
        [
          nextStatus,
          assignedCollectorId || null,
          completedAt,
          requestId,
        ],
      );

      return res.json({
        success: true,
        message:
          nextStatus === "completed"
            ? "Collection completed successfully."
            : "Collection request status updated.",
      });
    } catch (error) {
      console.error(
        "Update collection request status error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update collection request status.",
      });
    }
  },
);

export default router;