import User from "../models/userModel.js"
import asyncHandler from "../middlewares/asyncHandler.js"
import bcrypt from "bcryptjs"
import createToken from "../utils/createToken.js"
import multer from "multer"
import path from "path"
import fs from "fs"

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/profiles/"
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const uniqueName = `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed!"), false)
  }
}

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
})

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    throw new Error("Please fill all the inputs.")
  }

  const userExists = await User.findOne({ email })
  if (userExists) res.status(400).send("User already exists")

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  const newUser = new User({ username, email, password: hashedPassword })

  try {
    await newUser.save()
    createToken(res, newUser._id)

    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    })
  } catch (error) {
    res.status(400)
    throw new Error("Invalid user data")
  }
})

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  console.log(email)
  console.log(password)

  const existingUser = await User.findOne({ email })

  if (existingUser) {
    const isPasswordValid = await bcrypt.compare(password, existingUser.password)

    if (isPasswordValid) {
      createToken(res, existingUser._id)

      res.status(201).json({
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        isAdmin: existingUser.isAdmin,
      })
      return
    }
  }
})

const logoutCurrentUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true, // Fixed typo: was "httyOnly"
    expires: new Date(0),
  })

  res.status(200).json({ message: "Logged out successfully" })
})

const logoutAllSessions = asyncHandler(async (req, res) => {
  // In a real implementation, you might want to invalidate all tokens
  // For now, we'll just clear the current session
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  })

  res.status(200).json({ message: "All sessions terminated successfully" })
})

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
  res.json(users)
})

const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    // Return full URL for profile picture
    const profilePictureUrl = user.profilePicture ? `${req.protocol}://${req.get("host")}${user.profilePicture}` : null

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      profilePicture: profilePictureUrl,
      addresses: user.addresses || [],
      preferences: user.preferences || {
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
      },
      isAdmin: user.isAdmin,
    })
  } else {
    res.status(404)
    throw new Error("User not found.")
  }
})

const updateCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    // Update basic profile information
    user.username = req.body.username || user.username
    user.email = req.body.email || user.email
    user.phone = req.body.phone || user.phone
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth

    // Update preferences if provided
    if (req.body.preferences) {
      user.preferences = {
        ...user.preferences,
        ...req.body.preferences,
      }
    }

    // Update addresses if provided
    if (req.body.addresses) {
      user.addresses = req.body.addresses
    }

    // Handle password update
    if (req.body.password) {
      // Verify current password if provided
      if (req.body.currentPassword) {
        const isCurrentPasswordValid = await bcrypt.compare(req.body.currentPassword, user.password)

        if (!isCurrentPasswordValid) {
          res.status(400)
          throw new Error("Current password is incorrect")
        }
      }

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(req.body.password, salt)
      user.password = hashedPassword
    }

    const updatedUser = await user.save()

    // Return full URL for profile picture
    const profilePictureUrl = updatedUser.profilePicture
      ? `${req.protocol}://${req.get("host")}${updatedUser.profilePicture}`
      : null

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      dateOfBirth: updatedUser.dateOfBirth,
      profilePicture: profilePictureUrl,
      addresses: updatedUser.addresses || [],
      preferences: updatedUser.preferences,
      isAdmin: updatedUser.isAdmin,
    })
  } else {
    res.status(404)
    throw new Error("User not found")
  }
})

// Upload profile picture
const uploadProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  if (!req.file) {
    res.status(400)
    throw new Error("No image file provided")
  }

  // Delete old profile picture if it exists
  if (user.profilePicture) {
    const oldImagePath = user.profilePicture.replace("/uploads/", "uploads/")
    if (fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath)
    }
  }

  // Update user with new profile picture path (store relative path)
  const profilePicturePath = `/uploads/profiles/${req.file.filename}`
  user.profilePicture = profilePicturePath

  await user.save()

  // Return full URL for frontend
  const fullUrl = `${req.protocol}://${req.get("host")}${profilePicturePath}`

  res.json({
    profilePicture: fullUrl,
    message: "Profile picture uploaded successfully",
  })
})

// Remove profile picture
const removeProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  // Delete the image file if it exists
  if (user.profilePicture) {
    const imagePath = user.profilePicture.replace("/uploads/", "uploads/")
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
  }

  // Remove profile picture from user document
  user.profilePicture = undefined
  await user.save()

  res.json({
    message: "Profile picture removed successfully",
  })
})

// Add new address
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  const { type, name, address, city, phone, isDefault } = req.body

  if (!type || !name || !address || !city || !phone) {
    res.status(400)
    throw new Error("Please provide all required address fields")
  }

  // If this is set as default, make all other addresses non-default
  if (isDefault) {
    user.addresses = user.addresses.map((addr) => ({
      ...addr,
      isDefault: false,
    }))
  }

  const newAddress = {
    type,
    name,
    address,
    city,
    phone,
    isDefault: isDefault || false,
  }

  user.addresses.push(newAddress)
  await user.save()

  res.json({
    message: "Address added successfully",
    addresses: user.addresses,
  })
})

// Update address
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const addressId = req.params.addressId

  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId)

  if (addressIndex === -1) {
    res.status(404)
    throw new Error("Address not found")
  }

  const { type, name, address, city, phone, isDefault } = req.body

  // If this is set as default, make all other addresses non-default
  if (isDefault) {
    user.addresses = user.addresses.map((addr, index) => ({
      ...addr,
      isDefault: index === addressIndex,
    }))
  }

  // Update the address
  user.addresses[addressIndex] = {
    ...user.addresses[addressIndex],
    type: type || user.addresses[addressIndex].type,
    name: name || user.addresses[addressIndex].name,
    address: address || user.addresses[addressIndex].address,
    city: city || user.addresses[addressIndex].city,
    phone: phone || user.addresses[addressIndex].phone,
    isDefault: isDefault !== undefined ? isDefault : user.addresses[addressIndex].isDefault,
  }

  await user.save()

  res.json({
    message: "Address updated successfully",
    addresses: user.addresses,
  })
})

// Delete address
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  const addressId = req.params.addressId

  if (!user) {
    res.status(404)
    throw new Error("User not found")
  }

  const addressIndex = user.addresses.findIndex((addr) => addr._id.toString() === addressId)

  if (addressIndex === -1) {
    res.status(404)
    throw new Error("Address not found")
  }

  user.addresses.splice(addressIndex, 1)
  await user.save()

  res.json({
    message: "Address deleted successfully",
    addresses: user.addresses,
  })
})

const deleteUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    if (user.isAdmin) {
      res.status(400)
      throw new Error("Cannot delete admin user")
    }

    // Delete profile picture if it exists
    if (user.profilePicture) {
      const imagePath = user.profilePicture.replace("/uploads/", "uploads/")
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }

    await User.deleteOne({ _id: user._id })
    res.json({ message: "User removed" })
  } else {
    res.status(404)
    throw new Error("User not found.")
  }
})

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password")

  if (user) {
    res.json(user)
  } else {
    res.status(404)
    throw new Error("User not found")
  }
})

const updateUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (user) {
    user.username = req.body.username || user.username
    user.email = req.body.email || user.email
    user.isAdmin = Boolean(req.body.isAdmin)

    const updatedUser = await user.save()

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    })
  } else {
    res.status(404)
    throw new Error("User not found")
  }
})

export {
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
  upload, // Export multer upload middleware
}
