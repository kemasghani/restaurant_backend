import express from "express";
import { getAllKategori, addKategori, updateKategori, deleteKategori } from "../controllers/kategoriController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getAllKategori);
router.post("/", authenticate, addKategori);
router.put("/:id", authenticate, updateKategori);
router.delete("/:id", authenticate, deleteKategori);

export default router;
