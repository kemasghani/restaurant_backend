// routes/orderRoutes.js
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
    createOrder, listOrders, getOrder,
    acceptOrder, rejectOrder, deliverOrder
} from "../controllers/bahanMasukController.js";

const router = express.Router();

router.use(authenticate);

// cabang buat order
router.post("/", authorize("cabang"), createOrder);

// list (supplier see his orders, cabang see their orders)
router.get("/", listOrders);
router.get("/:id", getOrder);

// supplier actions
router.post("/:id/accept", authorize("supplier"), acceptOrder);
router.post("/:id/reject", authorize("supplier"), rejectOrder);
router.post("/:id/deliver", authorize("supplier"), deliverOrder);

export default router;
