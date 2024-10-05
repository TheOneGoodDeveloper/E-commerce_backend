import mongoose from "mongoose";

// Define the schema for the contact form
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone_number: { type: String },
    role: {
      type: String,
      enum: ["customer", "admin", "vendor"],
      default: "customer",
    },
    address: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Create the model from the schema and export it
export const userModel = mongoose.model("users", userSchema);
