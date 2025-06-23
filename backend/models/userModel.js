import mongoose from "mongoose"

const addressSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    profilePicture: {
      type: String, // Store the file path
    },
    addresses: [addressSchema],
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      marketingEmails: {
        type: Boolean,
        default: true,
      },
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema)

export default User
