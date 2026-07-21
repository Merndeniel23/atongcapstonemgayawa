import express from "express";
import { db } from "../config/db";

const router = express.Router();

// GET all inspections
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        bi.id,
        gb.bin_code,
        u.full_name AS inspector,
        bi.status,
        bi.estimated_fill_level,
        bi.remarks,
        bi.photo_path,
        bi.inspected_at
      FROM bin_inspections bi
      LEFT JOIN garbage_bins gb ON bi.bin_id = gb.id
      LEFT JOIN users u ON bi.purok_leader_id = u.id
      ORDER BY bi.inspected_at DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load inspections." });
  }
});

// ADD inspection
router.post("/", async (req, res) => {
  try {
    const {
      bin_id,
      purok_leader_id,
      status,
      estimated_fill_level,
      remarks,
      photo_path,
    } = req.body;

    await db.query(
      `INSERT INTO bin_inspections
      (bin_id,purok_leader_id,status,estimated_fill_level,remarks,photo_path)
      VALUES (?,?,?,?,?,?)`,
      [
        bin_id,
        purok_leader_id,
        status,
        estimated_fill_level,
        remarks,
        photo_path,
      ]
    );

    res.json({
      success: true,
      message: "Inspection saved successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to save inspection.",
    });
  }
});

export default router;