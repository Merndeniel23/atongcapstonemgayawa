import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_garbage_manual_db",
  waitForConnections: true,
  connectionLimit: 10,
});

export async function testDatabaseConnection() {
  const connection = await db.getConnection();

  try {
    await connection.query("SELECT 1");
    console.log("MySQL connected successfully.");
  } finally {
    connection.release();
  }
}
