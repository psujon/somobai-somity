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
    await transporter.sendMail(mailOptions);
}
export async function sendOtpEmail(toEmail, otp, memberName) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "465");
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) {
        console.warn("[OTP Email] SMTP credentials are not configured in .env. Skipping email dispatch.");
        return false;
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
        from: `"ফিউচার ভ্যালু প্রোপারটিজ লিমিটেড" <${user}>`,
        to: toEmail,
        subject: `লগইন ওটিপি কোড: ${otp}`,
        html: `
      <div style="font-family: Arial, 'Segoe UI', Tahoma, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 15px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">সদস্য পোর্টাল লগইন</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 5px;">নিরাপদ সদস্য অ্যাক্সেস ওটিপি ভেরিফিকেশন</p>
        </div>
        <div style="padding: 20px; background-color: #f8fafc; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <p style="color: #334155; font-size: 15px; margin-bottom: 10px;">${memberName ? `সম্মানিত সদস্য <strong>${memberName}</strong>,` : 'সম্মানিত সদস্য,'}</p>
          <p style="color: #475569; font-size: 14px; margin-bottom: 18px;">আপনার সদস্য ড্যাশবোর্ডে লগইন করার জন্য ৪ ডিজিটের ওটিপি কোড:</p>
          <div style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8; background: #ffffff; padding: 12px 30px; border-radius: 8px; border: 2px dashed #93c5fd;">
            ${otp}
          </div>
          <p style="color: #dc2626; font-size: 12px; margin-top: 18px; font-weight: 500;">⚠️ এই কোডটির মেয়াদ ৫ মিনিট। কোডটি অন্য কারো সাথে শেয়ার করবেন না।</p>
        </div>
        <div style="text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          এটি একটি স্বয়ংক্রিয় ইমেইল। দয়া করে এই ইমেইলে সরাসরি উত্তর দেবেন না।
        </div>
      </div>
    `,
        text: `সম্মানিত সদস্য,\n\nআপনার সদস্য ড্যাশবোর্ডে লগইন করার ওটিপি কোড হলো: ${otp}\n\nএই কোডটির মেয়াদ ৫ মিনিট।\n\nধন্যবাদ।`
    };
    try {
        await transporter.sendMail(mailOptions);
        return true;
    }
    catch (err) {
        console.error("[OTP Email] Failed to send email:", err);
        return false;
    }
}
