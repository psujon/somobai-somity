import mysqldumpPkg from "mysqldump";
import path from "path";
import fs from "fs";
import { sendBackupEmail } from "./email.js";
const mysqldump = mysqldumpPkg.default || mysqldumpPkg;
// Helper to parse MySQL connection parameters from DATABASE_URL
export function parseDatabaseUrl(url) {
    try {
        // Expected format: mysql://user:password@host:port/database
        const regex = /^mysql:\/\/([^:]+):?([^@]*)(?:@([^:/]+):?(\d*))?\/([^?]+)/;
        const match = url.match(regex);
        if (match) {
            return {
                user: match[1],
                password: match[2] || "",
                host: match[3] || "localhost",
                port: match[4] ? parseInt(match[4]) : 3306,
                database: match[5],
            };
        }
    }
    catch (error) {
        console.error("[Backup Scheduler] Error parsing DATABASE_URL:", error);
    }
    // Fallback to default credentials
    return {
        host: "localhost",
        user: "root",
        password: "",
        database: "coop_db",
    };
}
export async function performBackupAndEmail() {
    const backupDir = path.join(process.cwd(), "backups");
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_coop_db_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);
    const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL || "");
    console.log(`[Backup Scheduler] Starting backup database '${dbConfig.database}' on '${dbConfig.host}'...`);
    await mysqldump({
        connection: {
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.database,
        },
        dumpToFile: filepath,
    });
    console.log(`[Backup Scheduler] Database backup file created: ${filename}`);
    // Send the email with the backup file attachment
    try {
        await sendBackupEmail(filepath, filename);
    }
    catch (error) {
        console.error("[Backup Scheduler] Error sending backup email:", error);
        // Do not throw so that backup generation itself is still considered successful
    }
    try {
        pruneOldBackups();
    }
    catch (pruneErr) {
        console.error("[Backup Scheduler] Error pruning old backups:", pruneErr);
    }
    return { filepath, filename };
}
export function pruneOldBackups() {
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir))
        return;
    const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            path: filePath,
            time: stats.mtime.getTime()
        };
    })
        .sort((a, b) => b.time - a.time); // newest first
    if (files.length > 3) {
        const filesToDelete = files.slice(3);
        for (const file of filesToDelete) {
            try {
                fs.unlinkSync(file.path);
                console.log(`[Backup Pruner] Deleted old backup: ${file.name}`);
            }
            catch (err) {
                console.error(`[Backup Pruner] Failed to delete old backup ${file.name}:`, err);
            }
        }
    }
}
export function startBackupScheduler() {
    const targetHour = 17; // 17:00 (05:00 PM)
    const targetMinute = 0;
    function runScheduler() {
        const now = new Date();
        const nextRun = new Date();
        nextRun.setHours(targetHour, targetMinute, 0, 0);
        // If 5:00 PM has already passed today, schedule for tomorrow
        if (now.getTime() >= nextRun.getTime()) {
            nextRun.setDate(nextRun.getDate() + 1);
        }
        const timeUntilNextRun = nextRun.getTime() - now.getTime();
        console.log(`[Backup Scheduler] Next automatic database backup scheduled at: ${nextRun.toLocaleString()}. Time remaining: ${Math.round(timeUntilNextRun / 1000 / 60)} minutes.`);
        setTimeout(async () => {
            try {
                console.log(`[Backup Scheduler] Starting scheduled daily database backup...`);
                await performBackupAndEmail();
            }
            catch (err) {
                console.error(`[Backup Scheduler] Scheduled backup failed:`, err);
            }
            finally {
                // Recursively schedule the next day's backup
                runScheduler();
            }
        }, timeUntilNextRun);
    }
    runScheduler();
}
