import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.use(authenticateToken);

// Get all members
router.get("/", async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      orderBy: { joinDate: "desc" },
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching members" });
  }
});

// Create a new member
router.post("/", upload.single("photo"), async (req, res) => {
  const { name, phone, email, nid, address, type, position, joinDate } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Generate member ID dynamically from CompanyProfile shortCode
    const count = await prisma.member.count();
    const profiles: any[] = await prisma.$queryRaw`SELECT shortCode FROM CompanyProfile LIMIT 1`;
    const shortCode = profiles.length > 0 && profiles[0].shortCode ? profiles[0].shortCode : "SSM";
    const memberId = `${shortCode}${String(count + 1).padStart(3, '0')}`;

    const member = await prisma.member.create({
      data: {
        memberId,
        name,
        phone,
        email: email && email.trim() !== '' ? email.trim() : null,
        nid: nid && nid.trim() !== '' ? nid.trim() : null,
        address: address || null,
        photo,
        type,
        position,
        joinDate: joinDate ? new Date(joinDate) : undefined,
      } as any, 
    });

    res.status(201).json(member);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Phone or NID already exists" });
    }
    res.status(500).json({ message: "Server error while creating member" });
  }
});

// Update  member
router.put("/:id", upload.single("photo"), async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, nid, address, type, position, joinDate } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const updateData: any = {
      name,
      phone,
      email: email && email.trim() !== '' ? email.trim() : null,
      nid: nid && nid.trim() !== '' ? nid.trim() : null,
      address: address || null,
      type,
      position,
      joinDate: joinDate ? new Date(joinDate) : undefined,
    };

    if (photo) {
      updateData.photo = photo;
    }

    const member = await prisma.member.update({
      where: { id },
      data: updateData,
    });
    res.json(member);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "Phone or NID already exists" });
    }
    console.error("Update error:", error);
    res.status(500).json({ message: "Error updating member" });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const member = await prisma.member.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    res.json({ message: "Member cancelled successfully", member });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling member" });
  }
});

export default router;
