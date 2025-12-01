import express from "express";
import { listBahanKeluar, createBahanKeluar } from "../controllers/bahanKeluarController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, listBahanKeluar);
router.post("/", authenticate, createBahanKeluar);

export default router;
