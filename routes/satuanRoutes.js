// routes/satuanRoutes.js
import express from "express";
import { getAllSatuan, addSatuan, updateSatuan, deleteSatuan } from "../controllers/satuanController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getAllSatuan);
router.post("/", authenticate, addSatuan);
router.put("/:id", authenticate, updateSatuan);
router.delete("/:id", authenticate, deleteSatuan);

export default router;
