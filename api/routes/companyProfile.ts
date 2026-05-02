import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `logo-${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.use(authenticateToken);

// Get company profile
router.get("/", async (req, res) => {
  try {
    const profiles: any[] = await prisma.$queryRaw`SELECT * FROM CompanyProfile LIMIT 1`;
    if (profiles.length > 0) {
      res.json(profiles[0]);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching company profile" });
  }
});

// Upsert company profile
router.post("/", upload.single("logo"), async (req, res) => {
  const {
    name, shortCode, establishedYear, registrationNo, tinNo,
    vatNo, tradeLicenseNo, hotline, website, socialMediaLinks,
    bankAccountNo, bankName, bankBranch, address
  } = req.body;
  
  const logoPath = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const profiles: any[] = await prisma.$queryRaw`SELECT * FROM CompanyProfile LIMIT 1`;
    
    if (profiles.length > 0) {
      // Update existing
      const existingId = profiles[0].id;
      const logoToSave = logoPath ? logoPath : profiles[0].logo;
      
      await prisma.$executeRaw`
        UPDATE CompanyProfile SET 
          name = ${name || null},
          shortCode = ${shortCode || null},
          logo = ${logoToSave || null},
          establishedYear = ${establishedYear || null},
          registrationNo = ${registrationNo || null},
          tinNo = ${tinNo || null},
          vatNo = ${vatNo || null},
          tradeLicenseNo = ${tradeLicenseNo || null},
          hotline = ${hotline || null},
          website = ${website || null},
          socialMediaLinks = ${socialMediaLinks || null},
          bankAccountNo = ${bankAccountNo || null},
          bankName = ${bankName || null},
          bankBranch = ${bankBranch || null},
          address = ${address || null},
          updatedAt = NOW()
        WHERE id = ${existingId}
      `;
    } else {
      // Insert new
      await prisma.$executeRaw`
        INSERT INTO CompanyProfile (
          id, name, shortCode, logo, establishedYear, registrationNo, tinNo,
          vatNo, tradeLicenseNo, hotline, website, socialMediaLinks,
          bankAccountNo, bankName, bankBranch, address, createdAt, updatedAt
        ) VALUES (
          '1', ${name || null}, ${shortCode || null}, ${logoPath || null}, ${establishedYear || null}, ${registrationNo || null}, ${tinNo || null},
          ${vatNo || null}, ${tradeLicenseNo || null}, ${hotline || null}, ${website || null}, ${socialMediaLinks || null},
          ${bankAccountNo || null}, ${bankName || null}, ${bankBranch || null}, ${address || null}, NOW(), NOW()
        )
      `;
    }

    const updatedProfile: any[] = await prisma.$queryRaw`SELECT * FROM CompanyProfile LIMIT 1`;
    res.json(updatedProfile[0]);
  } catch (error) {
    console.error("Error saving company profile:", error);
    res.status(500).json({ message: "Error saving company profile" });
  }
});

export default router;
