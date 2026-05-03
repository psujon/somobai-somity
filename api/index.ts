import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import memberRoutes from "./routes/members.js";
import savingsRoutes from "./routes/savings.js";
import loanRoutes from "./routes/loans.js";
import accountRoutes from "./routes/accounts.js";
import backupRoutes from "./routes/backup.js";
import userRoutes from "./routes/users.js";
import positionRoutes from "./routes/positions.js";
import memberTypeRoutes from "./routes/memberTypes.js";
import companyProfileRoutes from "./routes/companyProfile.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/savings", savingsRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/users", userRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/member-types", memberTypeRoutes);
app.use("/api/company-profile", companyProfileRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Cooperative API is running" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

export default app;
