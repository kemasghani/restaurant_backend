import express from "express";
import {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getAllUsers);
router.post("/", authenticate, addUser);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

export default router;
