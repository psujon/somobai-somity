import nodemailer from "nodemailer";
export async function sendBackupEmail(filepath, filename) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587");
    const secure = process.env.SMTP_SECURE === "true"; // true for port 465, false for other ports
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const recipient = process.env.BACKUP_EMAIL_RECIPIENT;
    if (!user || !pass) {
        console.warn("[Backup Email] SMTP credentials are not configured in .env. Skipping email dispatch.");
        return;
    }
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });
    const mailOptions = {
        from: `"Database Backup" <${user}>`,
        to: recipient,
        subject: `Database Auto-Backup - ${new Date().toLocaleDateString("en-US", { dateStyle: "medium" })}`,
        text: `Hello,\n\nPlease find the attached database SQL backup file for Future Value Properties.\n\nBackup Time: ${new Date().toLocaleString()}\nFile Name: ${filename}\n\nBest regards,\nAutomated Backup System`,
        attachments: [
            {
                filename: filename,
                path: filepath,
            },
        ],
    };
    console.log(`[Backup Email] Sending database backup file to ${recipient}...`);
    await transporter.sendMail(mailOptions);
    console.log(`[Backup Email] Backup email successfully sent to ${recipient}.`);
}
