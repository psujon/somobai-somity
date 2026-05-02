import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import mysqldump from "mysqldump";
import path from "path";
import fs from "fs";

const router = express.Router();
router.use(authenticateToken);

router.post("/", (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_coop_db_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Using mysqldump npm package
    mysqldump({
      connection: {
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'coop_db',
      },
      dumpToFile: filepath,
    }).then(() => {
      res.json({ message: "Backup successful", filename, path: filepath });
    }).catch(error => {
      console.error("Backup error:", error);
      res.status(500).json({ message: "Backup failed." });
    });
  } catch (error) {
    console.error("Error initiating backup:", error);
    res.status(500).json({ message: "Server error during backup process" });
  }
});

// Optional: Get list of backups
router.get("/", (req, res) => {
  try {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const stats = fs.statSync(path.join(backupDir, file));
        return {
          filename: file,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          date: stats.mtime
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
      
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Error fetching backups list" });
  }
});

export default router;
