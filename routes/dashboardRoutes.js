import express from "express";
import { 
  getLowStockAlerts, 
  getBranchOrderStats 
} from "../controllers/dashboardController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET: Mengambil daftar bahan baku yang stoknya di bawah batas minimum
// Endpoint: /api/dashboard/low-stock
router.get("/low-stock", verifyToken, getLowStockAlerts);

// GET: Mengambil laporan total order per cabang
// Endpoint: /api/dashboard/branch-reports
router.get("/branch-reports", verifyToken, getBranchOrderStats);

export default router;