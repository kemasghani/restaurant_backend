import express from "express";
import { 
  getLowStockAlerts, 
  getBranchOrderStats 
} from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET: Mengambil daftar bahan baku yang stoknya di bawah batas minimum
// Endpoint: /api/dashboard/low-stock
router.get("/low-stock", authenticate, getLowStockAlerts);

// GET: Mengambil laporan total order per cabang
// Endpoint: /api/dashboard/branch-reports
router.get("/branch-reports", authenticate, getBranchOrderStats);

export default router;