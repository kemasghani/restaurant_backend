import express from "express";
import { getAllBahan, addBahan, updateBahan, deleteBahan } from "../controllers/bahanController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getAllBahan);
router.post("/", authenticate, authorize("cabang"), addBahan);
router.put("/:id", authenticate, updateBahan);
router.delete("/:id", authenticate, deleteBahan);

export default router;
