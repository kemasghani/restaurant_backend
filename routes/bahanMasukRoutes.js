// routes/orderRoutes.js
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    createOrder, listOrders, getOrder,
    acceptOrder, rejectOrder, deliverOrder
} from "../controllers/bahanMasukController.js";

const router = express.Router();

router.use(authenticate);

// cabang buat order
router.post("/", createOrder);

// list (supplier see his orders, cabang see their orders)
router.get("/", listOrders);
router.get("/:id", getOrder);

// supplier actions
router.post("/:id/accept", acceptOrder);
router.post("/:id/reject", rejectOrder);
router.post("/:id/deliver", deliverOrder);

export default router;
