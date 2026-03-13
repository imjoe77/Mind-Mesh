import express from "express";
import { createGroup, joinGroup } from "../controllers/groupController.js";
import { protect } from "../middleware/authMiddleware.js"; // Assuming you have auth

const router = express.Router();

router.post("/create", protect, createGroup);
router.post("/join/:groupId", protect, joinGroup);

export default router;