import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const dbName = process.env.DB_NAME || "smart_garbage_manual_db";
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
await connection.query(`USE \`${dbName}\``);
await connection.query(`
CREATE TABLE IF NOT EXISTS puroks (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL UNIQUE,
 description VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 purok_id INT UNSIGNED NULL,
 full_name VARCHAR(150) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('admin','resident','collector','purok_leader') NOT NULL,
 phone VARCHAR(30), address VARCHAR(255),
 status ENUM('active','inactive','pending') DEFAULT 'active',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (purok_id) REFERENCES puroks(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS garbage_bins (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 purok_id INT UNSIGNED NOT NULL,
 bin_code VARCHAR(50) NOT NULL UNIQUE,
 location_name VARCHAR(180) NOT NULL,
 current_status ENUM('empty','half_full','full','overflowing','damaged') DEFAULT 'empty',
 condition_status ENUM('good','needs_repair','out_of_service') DEFAULT 'good',
 last_inspected_at DATETIME NULL,
 is_active TINYINT(1) DEFAULT 1,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (purok_id) REFERENCES puroks(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bin_inspections (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 bin_id INT UNSIGNED NOT NULL,
 purok_leader_id INT UNSIGNED NOT NULL,
 status ENUM('empty','half_full','full','overflowing','damaged') NOT NULL,
 estimated_fill_level TINYINT UNSIGNED NULL,
 remarks TEXT, photo_path VARCHAR(255),
 inspected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (bin_id) REFERENCES garbage_bins(id) ON DELETE CASCADE,
 FOREIGN KEY (purok_leader_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collection_requests (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 bin_id INT UNSIGNED NOT NULL,
 inspection_id BIGINT UNSIGNED NULL,
 requested_by INT UNSIGNED NOT NULL,
 priority ENUM('low','normal','high','urgent') DEFAULT 'normal',
 status ENUM('pending','approved','assigned','in_progress','completed','cancelled') DEFAULT 'pending',
 reason VARCHAR(255), assigned_collector_id INT UNSIGNED NULL,
 requested_at DATETIME DEFAULT CURRENT_TIMESTAMP, completed_at DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (bin_id) REFERENCES garbage_bins(id) ON DELETE CASCADE,
 FOREIGN KEY (inspection_id) REFERENCES bin_inspections(id) ON DELETE SET NULL,
 FOREIGN KEY (requested_by) REFERENCES users(id),
 FOREIGN KEY (assigned_collector_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS collection_schedules (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 purok_id INT UNSIGNED NOT NULL, collector_id INT UNSIGNED NULL,
 schedule_date DATE NOT NULL, start_time TIME NULL, end_time TIME NULL,
 route_notes TEXT,
 status ENUM('scheduled','ongoing','completed','cancelled') DEFAULT 'scheduled',
 created_by INT UNSIGNED NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (purok_id) REFERENCES puroks(id),
 FOREIGN KEY (collector_id) REFERENCES users(id) ON DELETE SET NULL,
 FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 reporter_id INT UNSIGNED NOT NULL, bin_id INT UNSIGNED NULL,
 category ENUM('overflowing','missed_collection','damaged_bin','illegal_dumping','other') NOT NULL,
 title VARCHAR(180) NOT NULL, description TEXT NOT NULL, photo_path VARCHAR(255),
 status ENUM('submitted','under_review','resolved','rejected') DEFAULT 'submitted',
 admin_response TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (reporter_id) REFERENCES users(id),
 FOREIGN KEY (bin_id) REFERENCES garbage_bins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 resident_id INT UNSIGNED NOT NULL, reference_number VARCHAR(100) NOT NULL UNIQUE,
 amount DECIMAL(10,2) NOT NULL,
 payment_method ENUM('cash','gcash','bank_transfer','other') NOT NULL,
 payment_status ENUM('pending','verified','rejected') DEFAULT 'pending',
 payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
 verified_by INT UNSIGNED NULL, verified_at DATETIME NULL, notes VARCHAR(255),
 FOREIGN KEY (resident_id) REFERENCES users(id),
 FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL, title VARCHAR(180) NOT NULL, message TEXT NOT NULL,
 type ENUM('inspection','collection','report','payment','system') DEFAULT 'system',
 is_read TINYINT(1) DEFAULT 0, related_id BIGINT UNSIGNED NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, read_at DATETIME NULL,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
`);

for (let i = 1; i <= 9; i++) {
  await connection.execute(`INSERT IGNORE INTO puroks (id,name,description) VALUES (?,?,?)`, [i, `Purok ${i}`, `Assigned collection zone ${i}`]);
}

const passwordHash = await bcrypt.hash("password123", 12);
const users = [
  [null, "System Administrator", "admin@barangay.gov", passwordHash, "admin"],
  [1, "Purok One Leader", "leader@barangay.gov", passwordHash, "purok_leader"],
  [null, "Garbage Collector", "collector@barangay.gov", passwordHash, "collector"],
  [1, "Sample Resident", "resident@example.com", passwordHash, "resident"],
];
for (const user of users) {
  await connection.execute(`INSERT INTO users (purok_id,full_name,email,password_hash,role)
    VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash), role=VALUES(role)`, user);
}

const bins = [
  [1,"BIN-P1-001","Near Purok 1 Covered Court"], [1,"BIN-P1-002","Purok 1 Main Road"],
  [2,"BIN-P2-001","Near Purok 2 Chapel"], [3,"BIN-P3-001","Purok 3 Waiting Shed"],
  [4,"BIN-P4-001","Purok 4 Basketball Court"]
];
for (const bin of bins) await connection.execute(`INSERT IGNORE INTO garbage_bins (purok_id,bin_code,location_name) VALUES (?,?,?)`, bin);

console.log(`Database '${dbName}' and demo accounts are ready.`);
await connection.end();
