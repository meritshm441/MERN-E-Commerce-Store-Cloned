import express from "express"
import {
  createUser,
  loginUser,
  logoutCurrentUser,
  logoutAllSessions,
  getAllUsers,
  getCurrentUserProfile,
  updateCurrentUserProfile,
  uploadProfilePicture,
  removeProfilePicture,
  addAddress,
  updateAddress,
  deleteAddress,
  deleteUserById,
  getUserById,
  updateUserById,
  upload,
} from "../controllers/userController.js"

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js"

const router = express.Router()

// Public routes
router.route("/").post(createUser).get(authenticate, authorizeAdmin, getAllUsers)
router.post("/auth", loginUser)
router.post("/logout", logoutCurrentUser)
router.post("/logout-all", authenticate, logoutAllSessions)

// Profile routes
router.route("/profile").get(authenticate, getCurrentUserProfile).put(authenticate, updateCurrentUserProfile)

// Profile picture routes
router.post("/profile/picture", authenticate, upload.single("profilePicture"), uploadProfilePicture)
router.delete("/profile/picture", authenticate, removeProfilePicture)

// Address routes
router.post("/addresses", authenticate, addAddress)
router.put("/addresses/:addressId", authenticate, updateAddress)
router.delete("/addresses/:addressId", authenticate, deleteAddress)

// Admin routes
router
  .route("/:id")
  .delete(authenticate, authorizeAdmin, deleteUserById)
  .get(authenticate, authorizeAdmin, getUserById)
  .put(authenticate, authorizeAdmin, updateUserById)

export default router
